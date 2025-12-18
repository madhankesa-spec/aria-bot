from __future__ import annotations

import os
import asyncio

from deep_translator import GoogleTranslator


def translation_enabled() -> bool:
    return os.getenv("TRANSLATION_API_ENABLE", "").lower() == "true"

def _norm_lang(code: str | None) -> str:
    c = (code or "").strip().lower()
    if not c:
        return "auto"
    # common aliases
    if c in {"en-us", "en-gb"}:
        return "en"
    if c in {"hi-in"}:
        return "hi"
    if c in {"te-in"}:
        return "te"
    return c


async def translate_text(*, text: str, source: str = "en", target: str) -> str:
    """Translate text using deep-translator (GoogleTranslator) if enabled, otherwise return original."""

    q = (text or "").strip()
    if not q or not target or target == source:
        return q

    if not translation_enabled():
        return q

    src = _norm_lang(source)
    dest = _norm_lang(target)

    def _clean(s: str) -> str:
        v = (s or "").strip()
        # Some translators return surrounding quotes sometimes.
        if len(v) >= 2 and ((v[0] == v[-1] == '"') or (v[0] == v[-1] == "'")):
            v = v[1:-1].strip()
        return v

    def _do_translate_once(payload: str) -> str | None:
        try:
            out = GoogleTranslator(source=src or "auto", target=dest).translate(payload)
            out = _clean(str(out or ""))
            return out or None
        except Exception:
            return None

    def _do_translate() -> str:
        # deep-translator supports source="auto" for auto-detection.
        out = _do_translate_once(q)
        if out and out != q:
            return out

        # Heuristic: short UI-like fragments sometimes come back unchanged.
        # Wrap them in a full sentence to encourage translation, then strip it back.
        wrapper_prefix = "Please respond in the requested language: "
        wrapped = wrapper_prefix + q
        out2 = _do_translate_once(wrapped)
        if out2 and out2 != wrapped:
            # remove translated prefix if it survived translation; otherwise just return full output.
            if out2.lower().endswith(_clean(q).lower()):
                return out2
            # Best-effort: drop everything before the first ':'
            if ':' in out2:
                tail = out2.split(':', 1)[1].strip()
                return tail or out2
            return out2

        return q

    try:
        return await asyncio.to_thread(_do_translate)
    except Exception:
        return q
