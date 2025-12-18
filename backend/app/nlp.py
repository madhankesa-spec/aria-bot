from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass
class Intent:
    name: str
    value: str | None = None


@dataclass(frozen=True)
class IntentRule:
    name: str
    patterns: list[re.Pattern]
    extractor: callable | None = None


_RE_NUM_ID = re.compile(r"\b(\d{1,12})\b")
_RE_UUID = re.compile(
    r"\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b",
    re.IGNORECASE,
)


def _extract_id(m: str) -> str | None:
    """Extract a client id from a message.

    Supports UUIDs (preferred) and legacy numeric ids.
    """

    if ":" in m:
        candidate = m.split(":", 1)[1].strip()
        u = _RE_UUID.search(candidate)
        if u:
            return u.group(1)
        n = _RE_NUM_ID.search(candidate)
        if n:
            return n.group(1)

    u = _RE_UUID.search(m)
    if u:
        return u.group(1)
    n = _RE_NUM_ID.search(m)
    if n:
        return n.group(1)
    return None


def _norm(s: str) -> str:
    # Preserve original script/case; regex rules are compiled with IGNORECASE
    # for Latin text, but lowercasing can interfere with some non-Latin inputs.
    return re.sub(r"\s+", " ", (s or "").strip())


def _extract_name(m: str) -> str | None:
    """Extract a name from common separators.

    Supports:
      - "...: name"
      - "... - name"
      - "... name is <name>" (best-effort)
    """

    s = (m or "").strip()
    if ":" in s:
        v = s.split(":", 1)[1].strip()
        return v or None
    if " - " in s:
        v = s.split(" - ", 1)[1].strip()
        return v or None
    mm = re.search(r"\bname\s*(?:is|=)\s*([\w\s.'-]{2,80})\b", s, flags=re.IGNORECASE)
    if mm:
        v = mm.group(1).strip()
        return v or None
    return None


def _rx(*parts: str) -> list[re.Pattern]:
    """Compile regex patterns with sensible defaults."""
    return [re.compile(p, re.IGNORECASE | re.UNICODE) for p in parts]


# NOTE: We keep the rule order intentional (more specific first).
_INTENT_RULES: list[IntentRule] = [
    # Addresses by client id
    IntentRule(
        name="address_by_client_id",
        patterns=_rx(
            # English (10+ variants)
            r"\b(get|show|fetch|find|give|open|display)\b.*\b(address|addresses)\b.*\b(client|party)\b.*\b(id|uuid)\b",
            r"\baddress\b.*\bfor\b.*\bclient\b.*\b(id|uuid)\b",
            r"\bclient\b.*\b(id|uuid)\b.*\b(address|addresses)\b",
            r"\baddresses\b.*\bof\b.*\bclient\b.*\b(id|uuid)\b",
            r"\baddress\b.*\bdetails\b.*\bclient\b.*\b(id|uuid)\b",
            r"\bwhere\b.*\bdoes\b.*\bclient\b.*\blive\b.*\b(id|uuid)\b",
            r"\bclient\b.*\b(id|uuid)\b.*\blocation\b",
            r"\bshipping\b.*\baddress\b.*\bclient\b.*\b(id|uuid)\b",
            r"\bbilling\b.*\baddress\b.*\bclient\b.*\b(id|uuid)\b",
            r"\bclient\b.*\b(id|uuid)\b.*\baddress\b.*\blist\b",
            # Hindi (10+ variants)
            r"\b(पता|पते)\b.*\b(क्लाइंट|ग्राहक|पार्टी)\b.*\b(आईडी|id|यूयूआईडी|uuid)\b",
            r"\b(क्लाइंट|ग्राहक)\b.*\b(आईडी|id|यूयूआईडी|uuid)\b.*\b(पता|पते)\b",
            r"\b(पते|पता)\b.*\b(दिखाओ|दिखाइए|दिखा)\b.*\b(आईडी|id)\b",
            r"\b(पता)\b.*\b(निकालो|लाओ|ले आओ|खोजो|फेच)\b.*\b(क्लाइंट|ग्राहक)\b.*\b(आईडी|id)\b",
            r"\b(क्लाइंट|ग्राहक)\b.*\b(आईडी|id)\b.*\b(एड्रेस|address)\b",
            r"\b(क्लाइंट|ग्राहक)\b.*\b(रहता|रहती)\b.*\b(कहाँ|कहां)\b.*\b(आईडी|id)\b",
            r"\b(लोकेशन|स्थान)\b.*\b(क्लाइंट|ग्राहक)\b.*\b(आईडी|id)\b",
            r"\b(शिपिंग|बिलिंग)\b.*\b(पता|एड्रेस)\b.*\b(आईडी|id)\b",
            r"\b(क्लाइंट|ग्राहक)\b.*\b(आईडी|id)\b.*\b(पता\s*सूची|पते\s*लिस्ट)\b",
            r"\b(क्लाइंट|ग्राहक)\b.*\b(आईडी|id)\b.*\b(पते\s*बताओ|पता\s*बताओ)\b",
            # Hindi command template (copy/paste friendly)
            r"\bक्लाइंट\b\s*आईडी\s*के\s*लिए\s*(पता|एड्रेस)\s*[:：]\s*[0-9a-f\-]{8,}",
            # Telugu (10+ variants)
            r"\b(చిరునామా|చిరునామాలు)\b.*\b(క్లయింట్|గ్రాహకుడు|పార్టీ)\b.*\b(ఐడి|id|యూయూఐడి|uuid)\b",
            r"\b(క్లయింట్|గ్రాహకుడు)\b.*\b(ఐడి|id|యూయూఐడి|uuid)\b.*\b(చిరునామా|చిరునామాలు)\b",
            r"\b(చిరునామా|చిరునామాలు)\b.*\b(చూపించు|చూపండి)\b.*\b(ఐడి|id)\b",
            r"\b(క్లయింట్|గ్రాహకుడు)\b.*\b(ఐడి|id)\b.*\b(అడ్రెస్|address)\b",
            r"\b(చిరునామా)\b.*\b(తేనీ|తీసుకురా|తీసుకురండి|వెతుకు|ఫెచ్)\b.*\b(ఐడి|id)\b",
            r"\b(క్లయింట్|గ్రాహకుడు)\b.*\b(ఎక్కడ)\b.*\b(ఉంటాడు|ఉంటుంది)\b.*\b(ఐడి|id)\b",
            r"\b(లోకేషన్|స్థలం)\b.*\b(ఐడి|id)\b",
            r"\b(షిప్పింగ్|బిల్లింగ్)\b.*\b(చిరునామా|అడ్రెస్)\b.*\b(ఐడి|id)\b",
            r"\b(క్లయింట్|గ్రాహకుడు)\b.*\b(ఐడి|id)\b.*\b(చిరునామాల\s*జాబితా|అడ్రెస్\s*లిస్ట్)\b",
            r"\b(క్లయింట్|గ్రాహకుడు)\b.*\b(ఐడి|id)\b.*\b(చిరునామా\s*ఇవ్వు|చిరునామా\s*చెప్పు)\b",
            # Telugu command template (copy/paste friendly)
            r"\bక్లయింట్\b\s*ఐడికి\s*(చిరునామా|అడ్రెస్)\s*[:：]\s*[0-9a-f\-]{8,}",
            # Also accept 'చిరునామా: <uuid>' if user omits the word 'ఐడికి'
            r"\b(చిరునామా|అడ్రెస్)\s*[:：]\s*[0-9a-f\-]{8,}",
        ),
        extractor=_extract_id,
    ),

    # Addresses by client name
    IntentRule(
        name="address_by_client_name",
        patterns=_rx(
            # English
            r"\b(get|show|fetch|find|give|open|display)\b.*\b(address|addresses)\b.*\b(client|party)\b.*\bname\b",
            r"\baddress\b.*\bfor\b.*\bclient\b.*\bname\b",
            r"\bclient\b.*\bname\b.*\b(address|addresses)\b",
            r"\baddresses\b.*\bof\b.*\bclient\b.*\bname\b",
            r"\baddress\b.*\bdetails\b.*\bclient\b.*\bname\b",
            r"\bwhere\b.*\bdoes\b.*\bclient\b.*\blive\b.*\bname\b",
            r"\bclient\b.*\blocation\b.*\bname\b",
            r"\bshipping\b.*\baddress\b.*\bclient\b.*\bname\b",
            r"\bbilling\b.*\baddress\b.*\bclient\b.*\bname\b",
            r"\bclient\b.*\bname\b.*\baddress\b.*\blist\b",
            # Hindi
            r"\b(पता|पते)\b.*\b(क्लाइंट|ग्राहक|पार्टी)\b.*\b(नाम|नेम|name)\b",
            r"\b(क्लाइंट|ग्राहक)\b.*\b(नाम|नेम|name)\b.*\b(पता|पते)\b",
            r"\b(पते|पता)\b.*\b(दिखाओ|दिखाइए)\b.*\b(नाम|name)\b",
            r"\b(पता)\b.*\b(निकालो|लाओ|खोजो)\b.*\b(नाम|name)\b",
            r"\b(क्लाइंट|ग्राहक)\b.*\b(कहाँ|कहां)\b.*\b(रहता|रहती)\b.*\b(नाम|name)\b",
            r"\b(लोकेशन|स्थान)\b.*\b(नाम|name)\b",
            r"\b(शिपिंग|बिलिंग)\b.*\b(पता|एड्रेस)\b.*\b(नाम|name)\b",
            r"\b(नाम|name)\b.*\b(वाला|वाली)\b.*\b(क्लाइंट|ग्राहक)\b.*\b(पता|पते)\b",
            r"\b(नाम|name)\b.*\b(क्लाइंट)\b.*\b(एड्रेस|पता)\b",
            r"\b(ग्राहक)\b.*\b(नाम)\b.*\b(पते\s*लिस्ट|पता\s*सूची)\b",
            # Hindi command template (copy/paste friendly)
            r"\bक्लाइंट\b\s*नाम\s*के\s*लिए\s*(पता|एड्रेस)\s*[:：]\s*.+",
            # Telugu
            r"\b(చిరునామా|చిరునామాలు)\b.*\b(క్లయింట్|గ్రాహకుడు|పార్టీ)\b.*\b(పేరు|name|నేమ్)\b",
            r"\b(క్లయింట్|గ్రాహకుడు)\b.*\b(పేరు|name|నేమ్)\b.*\b(చిరునామా|చిరునామాలు)\b",
            r"\b(చిరునామా|చిరునామాలు)\b.*\b(చూపించు|చూపండి)\b.*\b(పేరు|name)\b",
            r"\b(చిరునామా)\b.*\b(తేనీ|తీసుకురా|వెతుకు|ఫెచ్)\b.*\b(పేరు|name)\b",
            r"\b(క్లయింట్|గ్రాహకుడు)\b.*\b(ఎక్కడ)\b.*\b(ఉంటాడు|ఉంటుంది)\b.*\b(పేరు|name)\b",
            r"\b(లోకేషన్|స్థలం)\b.*\b(పేరు|name)\b",
            r"\b(షిప్పింగ్|బిల్లింగ్)\b.*\b(చిరునామా|అడ్రెస్)\b.*\b(పేరు|name)\b",
            r"\b(పేరు|name)\b.*\b(క్లయింట్|గ్రాహకుడు)\b.*\b(చిరునామా|అడ్రెస్)\b",
            r"\b(క్లయింట్)\b.*\b(పేరు)\b.*\b(అడ్రెస్\s*లిస్ట్|చిరునామాల\s*జాబితా)\b",
            r"\b(పేరు|name)\b.*\b(చిరునామా\s*ఇవ్వు|చిరునామా\s*చెప్పు)\b",
            # Telugu command templates (copy/paste friendly)
            r"\bక్లయింట్\b\s*పేరుకు\s*(చిరునామా|అడ్రెస్)\s*[:：]\s*.+",
        ),
        extractor=_extract_name,
    ),

    # Client by id
    IntentRule(
        name="client_by_id",
        patterns=_rx(
            # English
            r"\b(show|get|fetch|find|open|display)\b.*\b(client|party)\b.*\b(id|uuid)\b(?!.*\baddress\b)",
            r"\bclient\b.*\b(id|uuid)\b(?!.*\baddress\b)",
            r"\bparty\b.*\b(id|uuid)\b(?!.*\baddress\b)",
            r"\bclient\b.*\bdetails\b.*\b(id|uuid)\b",
            r"\blookup\b.*\bclient\b.*\b(id|uuid)\b",
            r"\bfind\b.*\bclient\b.*\bby\b.*\b(id|uuid)\b",
            r"\bopen\b.*\bclient\b.*\bprofile\b.*\b(id|uuid)\b",
            r"\bshow\b.*\bparty\b.*\b(id|uuid)\b",
            r"\bget\b.*\bparty\b.*\bdetails\b.*\b(id|uuid)\b",
            r"\bclient\b.*\binfo\b.*\b(id|uuid)\b",
            # Hindi
            r"\b(क्लाइंट|ग्राहक|पार्टी)\b.*\b(आईडी|id|यूयूआईडी|uuid)\b",
            r"\b(क्लाइंट|ग्राहक)\b.*\b(डिटेल|विवरण|जानकारी|details|info)\b.*\b(आईडी|id)\b",
            r"\b(आईडी|id)\b.*\b(से)\b.*\b(क्लाइंट|ग्राहक)\b.*\b(खोजो|निकालो|ढूंढो|ढूँढो)\b",
            r"\b(क्लाइंट|ग्राहक)\b.*\b(प्रोफाइल)\b.*\b(आईडी|id)\b",
            r"\b(पार्टी)\b.*\b(आईडी|id)\b.*\b(दिखाओ|दिखाइए)\b",
            r"\b(क्लाइंट)\b.*\b(आईडी|id)\b.*\b(ओपन)\b",
            r"\b(क्लाइंट)\b.*\b(आईडी|id)\b.*\b(रिपोर्ट)\b",
            r"\b(क्लाइंट)\b.*\b(आईडी|id)\b.*\b(विवरण\s*दिखाओ)\b",
            r"\b(पार्टी)\b.*\b(यूयूआईडी|uuid)\b",
            r"\b(आईडी|id)\b.*\b(क्लाइंट)\b",
            # Hindi command template (copy/paste friendly)
            r"\bक्लाइंट\b\s*आईडी\s*[:：]\s*[0-9a-f\-]{8,}",
            # Telugu
            r"\b(క్లయింట్|గ్రాహకుడు|పార్టీ)\b.*\b(ఐడి|id|యూయూఐడి|uuid)\b(?!.*\b(చిరునామా|అడ్రెస్)\b)",
            r"\b(క్లయింట్|గ్రాహకుడు)\b.*\b(వివరాలు|డీటెయిల్స్|details|info)\b.*\b(ఐడి|id)\b",
            r"\b(ఐడి|id)\b.*\b(ద్వారా|తో)\b.*\b(క్లయింట్|గ్రాహకుడు)\b.*\b(వెతుకు|కనుగు|తెచ్చు)\b",
            r"\b(క్లయింట్)\b.*\b(ప్రొఫైల్|profile)\b.*\b(ఐడి|id)\b",
            r"\b(పార్టీ)\b.*\b(ఐడి|id)\b.*\b(చూపించు|చూపండి)\b",
            r"\b(క్లయింట్)\b.*\b(ఐడి|id)\b.*\b(ఓపెన్|open)\b",
            r"\b(క్లయింట్)\b.*\b(ఐడి|id)\b.*\b(రిపోర్ట్|report)\b",
            r"\b(క్లయింట్)\b.*\b(ఐడి|id)\b.*\b(వివరాలు\s*ఇవ్వు)\b",
            r"\b(పార్టీ)\b.*\b(యూయూఐడి|uuid)\b",
            r"\b(ఐడి|id)\b.*\b(క్లయింట్)\b(?!.*\b(చిరునామా|అడ్రెస్)\b)",
            # Telugu command template (copy/paste friendly)
            r"\bక్లయింట్\b\s*(ఐడి|id|యూయూఐడి|uuid)\s*[:：]\s*[0-9a-f\-]{8,}(?!.*\b(చిరునామా|అడ్రెస్)\b)",
        ),
        extractor=_extract_id,
    ),

    # Client by name
    IntentRule(
        name="client_by_name",
        patterns=_rx(
            # English
            r"\b(show|get|fetch|find|open|display)\b.*\b(client|party)\b.*\bname\b",
            r"\bclient\b.*\bname\b",
            r"\bshow\s+client\s+[\w\s.'-]{2,80}$",
            r"\bclient\b.*\bcalled\b",
            r"\bsearch\b.*\bclient\b.*\bname\b",
            r"\blookup\b.*\bclient\b.*\bname\b",
            r"\bfind\b.*\bclient\b.*\bnamed\b",
            r"\bclient\b.*\bdetails\b.*\bname\b",
            r"\bopen\b.*\bclient\b.*\bprofile\b.*\bname\b",
            r"\bparty\b.*\bname\b",
            r"\bget\b.*\bparty\b.*\bby\b.*\bname\b",
            # Hindi
            r"\b(क्लाइंट|ग्राहक|पार्टी)\b.*\b(नाम|नेम|name)\b",
            r"\bक्लाइंट\s+नाम\s*:\s*[\w\s.'-]{2,80}$",
            r"\b(नाम)\b.*\b(से)\b.*\b(क्लाइंट|ग्राहक)\b.*\b(खोजो|ढूंढो|ढूँढो)\b",
            r"\b(क्लाइंट)\b.*\b(नाम)\b.*\b(दिखाओ|दिखाइए)\b",
            r"\b(क्लाइंट)\b.*\b(नाम)\b.*\b(निकालो|लाओ)\b",
            r"\b(क्लाइंट)\b.*\b(कॉल्ड|called)\b",
            r"\b(क्लाइंट)\b.*\b(सर्च)\b.*\b(नाम|name)\b",
            r"\b(ग्राहक)\b.*\b(नाम)\b.*\b(प्रोफ़ाइल|प्रोफाइल)\b",
            r"\b(पार्टी)\b.*\b(नाम)\b",
            r"\b(नाम|name)\b.*\b(वाला|वाली)\b.*\b(क्लाइंट)\b",
            r"\b(क्लाइंट)\b.*\b(नाम)\b.*\b(जानकारी)\b",
            # Hindi command template (copy/paste friendly)
            r"\bक्लाइंट\b\s*नाम\s*[:：]\s*.+",
            # Telugu
            r"\b(క్లయింట్|గ్రాహకుడు|పార్టీ)\b.*\b(పేరు|name|నేమ్)\b",
            r"\bక్లయింట్\s*పేరు\s*[:：]\s*[\w\s.'-]{2,80}$",
            # Fallback when vowel signs/virama are lost
            r"\bకలయట\s*పర\s*[:：]\s*[\w\s.'-]{2,80}$",
            r"\b(పేరు)\b.*\b(తో)\b.*\b(క్లయింట్|గ్రాహకుడు)\b.*\b(వెతుకు|కనుగు)\b",
            r"\b(క్లయింట్)\b.*\b(పేరు)\b.*\b(చూపించు|చూపండి)\b",
            r"\b(క్లయింట్)\b.*\b(పేరు)\b.*\b(తెచ్చు|తేనీ)\b",
            r"\b(క్లయింట్)\b.*\b(called|కాల్డ్)\b",
            r"\b(క్లయింట్)\b.*\b(సెర్చ్|search)\b.*\b(పేరు|name)\b",
            r"\b(గ్రాహకుడు)\b.*\b(పేరు)\b.*\b(ప్రొఫైల్|profile)\b",
            r"\b(పార్టీ)\b.*\b(పేరు)\b",
            r"\b(పేరు|name)\b.*\b(ఉన్న)\b.*\b(క్లయింట్)\b",
            r"\b(క్లయింట్)\b.*\b(పేరు)\b.*\b(సమాచారం|వివరాలు)\b",
        ),
        extractor=_extract_name,
    ),

    # List clients
    IntentRule(
        name="list_clients",
        patterns=_rx(
            # English
            r"\b(list|show|display|get|fetch)\b.*\bclients\b",
            r"\bclients\b.*\b(list|show|display)\b",
            r"\bshow\b.*\b(all|latest|recent)\b.*\bclients\b",
            r"\bget\b.*\bclient\b.*\blist\b",
            r"\bclient\b.*\blist\b",
            r"\bclients\b$",
            r"\bview\b.*\bclients\b",
            r"\bopen\b.*\bclients\b",
            r"\bclients\b.*\bpage\b",
            r"\bshow\b.*\bcustomer\b.*\blist\b",
            # Hindi
            r"\b(ग्राहक|क्लाइंट)\b.*\b(सूची|लिस्ट|list)\b",
            r"\b(क्लाइंट)\b.*\b(दिखाओ|दिखाइए|show)\b",
            r"\b(सभी|लेटेस्ट|नए)\b.*\b(ग्राहक|क्लाइंट)\b.*\b(दिखाओ|लाओ)\b",
                r"ग्राहक(ों)?\s*की\s*सूची",
                r"ग्राहक\s*सूची\s*(दिखाओ|दिखाइए|दिखा\s*दो)",
                r"क्लाइंट\s*सूची\s*(दिखाओ|दिखाइए|दिखा\s*दो)",
            r"\b(ग्राहक|क्लाइंट)\b$",
            r"\b(क्लाइंट)\b.*\b(पेज|page)\b",
            r"\b(कस्टमर|customer)\b.*\b(लिस्ट)\b",
            r"\b(क्लाइंट)\b.*\b(व्यू|देखो|देखना)\b",
            r"\b(क्लाइंट)\b.*\b(ओपन|open)\b",
            r"\b(ग्राहक)\b.*\b(रिकॉर्ड)\b",
            r"\b(क्लाइंट)\b.*\b(रिकॉर्ड)\b",
            # Telugu
            r"\bక్లయింట్ల\s+జాబితా\s+ఇవ్వండి\b",
            r"\bక్లయింట్ల\s+జాబితా\b",
            # Fallback: some environments drop Telugu vowel signs/virama; accept the simplified rendering too.
            r"\bకలయటల\s+జబత\s+ఇవవడ\b",
            r"\b(క్లయింట్లు|క్లయింట్|గ్రాహకులు|గ్రాహకుడు)\b.*\b(జాబితా|లిస్ట్|list)\b",
            r"\b(క్లయింట్లు|గ్రాహకులు)\b.*\b(చూపించు|చూపండి|show)\b",
            r"\b(అన్ని|తాజా|కొత్త)\b.*\b(క్లయింట్లు|గ్రాహకులు)\b.*\b(చూపించు|తే)\b",
            r"\b(క్లయింట్లు|గ్రాహకులు)\b$",
            r"\b(క్లయింట్)\b.*\b(పేజీ|page)\b",
            r"\b(కస్టమర్|customer)\b.*\b(లిస్ట్)\b",
            r"\b(క్లయింట్లు)\b.*\b(వీక్షించు|చూడు|view)\b",
            r"\b(క్లయింట్లు)\b.*\b(ఓపెన్|open)\b",
            r"\b(గ్రాహక)\b.*\b(రికార్డ్స్|records)\b",
            r"\b(క్లయింట్)\b.*\b(రికార్డ్స్|records)\b",
        ),
        extractor=None,
    ),
]


def classify(message: str) -> Intent:
    raw = message or ""
    m = _norm(raw)

    for rule in _INTENT_RULES:
        for p in rule.patterns:
            if p.search(m):
                value = None
                if rule.extractor is not None:
                    try:
                        value = rule.extractor(raw)
                    except Exception:
                        value = None
                return Intent(rule.name, value)

    return Intent("unknown")
