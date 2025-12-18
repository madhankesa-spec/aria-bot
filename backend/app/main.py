from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_BACKEND_ROOT / ".env", override=False)

from .db import db_enabled, get_db
from .models import ChatQueryIn, ChatQueryOut, TranslateIn, TranslateOut
from .nlp import classify
from .seed import seed_sample_data
from .translate import translation_enabled, translate_text


def _codepoints(s: str) -> list[str]:
    # Example: 'క' -> 'U+0C15'
    return [f"U+{ord(ch):04X}" for ch in s]


def _help_text(lang: str | None) -> str:
    l = (lang or "en").lower()
    if l.startswith("hi"):
        return (
            "इनमें से एक आज़माएँ: क्लाइंट सूची, क्लाइंट नाम: <नाम>, क्लाइंट आईडी: <आईडी>, "
            "क्लाइंट आईडी के लिए पता: <आईडी>, क्लाइंट नाम के लिए पता: <नाम>."
        )
    if l.startswith("te"):
        return (
            "ఇవ్వాటిలో ఒకటి ప్రయత్నించండి: క్లయింట్ల జాబితా / క్లయింట్ల జాబితా ఇవ్వండి, క్లయింట్ పేరు: <పేరు>, క్లయింట్ ఐడి: <ఐడి>, "
            "క్లయింట్ ఐడికి చిరునామా: <ఐడి>, క్లయింట్ పేరుకు చిరునామా: <పేరు>."
        )
    return (
        "Try one of: List clients, Show client name: <name>, Show client id: <id>, "
        "Get address for client id: <id>, Get address for client name: <name>."
    )


def _not_available_text(lang: str | None, value: str) -> str:
    l = (lang or "en").lower()
    if l.startswith("hi"):
        return f"'{value}' हमारे डेटा में उपलब्ध नहीं है।"
    if l.startswith("te"):
        return f"'{value}' మా డేటాలో అందుబాటులో లేదు."
    return f"'{value}' is not available in our data."


def _no_addresses_text(lang: str | None, value: str) -> str:
    l = (lang or "en").lower()
    if l.startswith("hi"):
        return f"'{value}' के लिए हमारे डेटा में कोई पता उपलब्ध नहीं है।"
    if l.startswith("te"):
        return f"'{value}' కోసం మా డేటాలో చిరునామాలు అందుబాటులో లేవు."
    return f"No addresses available in our data for '{value}'."

app = FastAPI(title="Aria API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN", "*")],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup() -> None:
    if db_enabled():
        db = get_db()
        await db.connect()


@app.on_event("shutdown")
async def _shutdown() -> None:
    if db_enabled():
        db = get_db()
        await db.disconnect()


@app.get("/clients")
async def clients(limit: int = 50, offset: int = 0):
    if not db_enabled():
        return []
    db = get_db()
    take = min(max(limit, 1), 200)
    skip = max(offset, 0)
    return await db.opt_party.find_many(take=take, skip=skip)


@app.get("/debug/db")
async def debug_db():
    """Basic diagnostics to verify DB connectivity and row counts.

    This is intentionally simple and safe: it doesn't return the DATABASE_URL.
    """

    enabled = db_enabled()
    if not enabled:
        return {"db_enabled": False}

    db = get_db()
    return {
        "db_enabled": True,
        "party_count": await db.opt_party.count(),
        "address_count": await db.opt_address.count(),
        "state_count": await db.sys_state.count(),
    }


@app.post("/seed")
async def seed(clients: int = 12):
    if not db_enabled():
        raise HTTPException(status_code=400, detail="DATABASE_URL not configured")
    db = get_db()
    return await seed_sample_data(db, clients=clients)


@app.get("/client/name/{name}")
async def client_by_name(name: str):
    if not db_enabled():
        return []
    db = get_db()
    return await db.opt_party.find_many(
        where={
            "OR": [
                {"PTY_FirstName": {"contains": name, "mode": "insensitive"}},
                {"PTY_LastName": {"contains": name, "mode": "insensitive"}},
            ]
        },
        take=50,
    )


@app.get("/client/{id}/address")
async def address_by_client_id(id: str):
    if not db_enabled():
        return []
    db = get_db()
    return await db.opt_address.find_many(where={"Add_PartyID": id}, include={"state": True})


@app.get("/client/address/name/{name}")
async def address_by_client_name(name: str):
    if not db_enabled():
        return []
    db = get_db()
    clients = await db.opt_party.find_many(
        where={
            "OR": [
                {"PTY_FirstName": {"contains": name, "mode": "insensitive"}},
                {"PTY_LastName": {"contains": name, "mode": "insensitive"}},
            ]
        },
        take=20,
    )
    if not clients:
        return []
    ids = [c.PTY_ID for c in clients]
    return await db.opt_address.find_many(where={"Add_PartyID": {"in": ids}}, include={"state": True})


@app.post("/chat/query", response_model=ChatQueryOut)
async def chat_query(body: ChatQueryIn):
    msg = (body.message or "").strip()
    if not msg:
        raise HTTPException(status_code=400, detail="empty message")

    # If the user is chatting in a non-English language, translate the query to English
    # first for intent classification. This makes intent matching resilient even when
    # users phrase things in many ways.
    msg_for_intent = msg
    if translation_enabled() and body.lang and body.lang != "en":
        try:
            msg_for_intent = await translate_text(text=msg, source=body.lang, target="en")
        except Exception:
            msg_for_intent = msg

    intent = classify(msg_for_intent)

    # Extra safety net: if we still can't classify and the user is not in English,
    # translate to English and retry. This helps when non-Latin text arrives in a
    # degraded form that regex rules can't match.
    if intent.name == "unknown" and translation_enabled() and body.lang and body.lang != "en":
        try:
            retry_en = await translate_text(text=msg, source=body.lang, target="en")
            intent = classify(retry_en)
        except Exception:
            pass

    if intent.name == "list_clients":
        # Deterministic localized reply (avoid MT flakiness for short phrases)
        if (body.lang or "").lower().startswith("te"):
            reply = "ఇవి తాజా క్లయింట్లు."
        elif (body.lang or "").lower().startswith("hi"):
            reply = "ये नवीनतम क्लाइंट हैं।"
        else:
            reply = "Here are the latest clients."
        rows = await clients(limit=50)
        return ChatQueryOut(reply=reply, type="grid", title="Clients", payload={"kind": "clients", "rows": rows})

    if intent.name == "client_by_name":
        if not intent.value:
            return ChatQueryOut(reply="Type the client name after ':'", type="empty")
        rows = await client_by_name(intent.value)
        if not rows:
            return ChatQueryOut(reply=_not_available_text(body.lang, intent.value), type="empty")

        reply = f"Results for '{intent.value}'."
        if translation_enabled() and body.lang and body.lang != "en":
            reply = await translate_text(text=reply, source="en", target=body.lang)
        return ChatQueryOut(reply=reply, type="grid", title="Clients", payload={"kind": "clients", "rows": rows})

    if intent.name == "client_by_id":
        if not intent.value:
            return ChatQueryOut(reply="Type a client id (UUID) after ':'.", type="empty")
        if not db_enabled():
            return ChatQueryOut(reply="Database not configured.", type="empty")
        db = get_db()
        c = await db.opt_party.find_unique(where={"PTY_ID": intent.value})
        if not c:
            return ChatQueryOut(reply="Client not found.", type="empty")
        reply = "Client details."
        if translation_enabled() and body.lang and body.lang != "en":
            reply = await translate_text(text=reply, source="en", target=body.lang)
        return ChatQueryOut(reply=reply, type="form", title="Client", payload={"client": c})

    if intent.name == "address_by_client_id":
        if not intent.value:
            return ChatQueryOut(reply="Type a client id (UUID) after ':'.", type="empty")
        rows = await address_by_client_id(intent.value)
        reply = "Addresses for client."
        if translation_enabled() and body.lang and body.lang != "en":
            reply = await translate_text(text=reply, source="en", target=body.lang)
        return ChatQueryOut(reply=reply, type="grid", title="Addresses", payload={"kind": "addresses", "rows": rows})

    if intent.name == "address_by_client_name":
        if not intent.value:
            return ChatQueryOut(reply="Type the client name after ':'", type="empty")
        rows = await address_by_client_name(intent.value)
        if not rows:
            return ChatQueryOut(reply=_no_addresses_text(body.lang, intent.value), type="empty")

        reply = f"Addresses for '{intent.value}'."
        if translation_enabled() and body.lang and body.lang != "en":
            reply = await translate_text(text=reply, source="en", target=body.lang)
        return ChatQueryOut(reply=reply, type="grid", title="Addresses", payload={"kind": "addresses", "rows": rows})

    return ChatQueryOut(reply=_help_text(body.lang), type="empty")


@app.post("/debug/echo")
async def debug_echo(body: ChatQueryIn):
    """Debug helper to diagnose input mangling from the UI.

    Returns the raw message, Unicode codepoints, and what the classifier sees
    both before and after optional translation-to-English.
    """

    msg = (body.message or "").strip()
    msg_for_intent = msg
    if translation_enabled() and body.lang and body.lang != "en" and msg:
        try:
            msg_for_intent = await translate_text(text=msg, source=body.lang, target="en")
        except Exception:
            msg_for_intent = msg

    intent_direct = classify(msg).name if msg else "empty"
    intent_via_translation = classify(msg_for_intent).name if msg_for_intent else "empty"

    return {
        "lang": body.lang,
        "message": msg,
        "message_codepoints": _codepoints(msg),
        "message_for_intent": msg_for_intent,
        "message_for_intent_codepoints": _codepoints(msg_for_intent),
        "intent_direct": intent_direct,
        "intent_via_translation": intent_via_translation,
    }


@app.post("/translate", response_model=TranslateOut)
async def translate_endpoint(body: TranslateIn):
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="empty text")
    out = await translate_text(text=text, source=body.from_, target=body.to)
    return TranslateOut(text=out)
