from __future__ import annotations

import random
import uuid

from prisma import Prisma


def _pick(seq):
    return random.choice(seq)


FIRST_NAMES = [
    "Aarav",
    "Ananya",
    "Vihaan",
    "Diya",
    "Arjun",
    "Ishita",
    "Kabir",
    "Saanvi",
    "Advait",
    "Meera",
    "Rohan",
    "Priya",
    "Kunal",
    "Neha",
    "Siddharth",
    "Pooja",
    "Rahul",
    "Sneha",
    "Vivek",
    "Shreya",
]

LAST_NAMES = [
    "Sharma",
    "Gupta",
    "Singh",
    "Verma",
    "Patel",
    "Iyer",
    "Mehta",
    "Rao",
    "Nair",
    "Kapoor",
    "Chatterjee",
    "Reddy",
    "Jain",
    "Bansal",
    "Joshi",
    "Kulkarni",
    "Malhotra",
    "Das",
    "Yadav",
    "Mishra",
]

CITIES = [
    "Mumbai",
    "Delhi",
    "Bengaluru",
    "Hyderabad",
    "Chennai",
    "Pune",
    "Kolkata",
    "Ahmedabad",
    "Jaipur",
    "Lucknow",
]

STATE_ROWS = [
    {"Stt_ID": str(uuid.uuid4()), "Stt_Name": "Maharashtra", "Stt_Code": "MH"},
    {"Stt_ID": str(uuid.uuid4()), "Stt_Name": "Karnataka", "Stt_Code": "KA"},
    {"Stt_ID": str(uuid.uuid4()), "Stt_Name": "Tamil Nadu", "Stt_Code": "TN"},
    {"Stt_ID": str(uuid.uuid4()), "Stt_Name": "Uttar Pradesh", "Stt_Code": "UP"},
    {"Stt_ID": str(uuid.uuid4()), "Stt_Name": "Delhi", "Stt_Code": "DL"},
    {"Stt_ID": str(uuid.uuid4()), "Stt_Name": "West Bengal", "Stt_Code": "WB"},
    {"Stt_ID": str(uuid.uuid4()), "Stt_Name": "Gujarat", "Stt_Code": "GJ"},
    {"Stt_ID": str(uuid.uuid4()), "Stt_Name": "Rajasthan", "Stt_Code": "RJ"},
]


async def seed_sample_data(db: Prisma, *, clients: int = 12) -> dict:
    existing = await db.opt_party.count()
    if existing and existing > 0:
        return {"seeded": 0, "skipped": True}

    for s in STATE_ROWS:
        await db.sys_state.upsert(where={"Stt_ID": s["Stt_ID"]}, data={"create": s, "update": s})

    created = 0
    for _ in range(clients):
        first = _pick(FIRST_NAMES)
        last = _pick(LAST_NAMES)
        phone = f"+91{random.randint(6000000000, 9999999999)}"
        ssn = f"{random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(1000, 9999)}"

        party_id = str(uuid.uuid4())
        c = await db.opt_party.create(
            data={
                "PTY_ID": party_id,
                "PTY_FirstName": first,
                "PTY_LastName": last,
                "PTY_Phone": phone,
                "PTY_SSN": ssn,
            }
        )

        for _ in range(random.randint(1, 2)):
            await db.opt_address.create(
                data={
                    "Add_ID": str(uuid.uuid4()),
                    "Add_PartyID": c.PTY_ID,
                    "Add_Line1": f"{random.randint(10, 220)} {_pick(['MG Road', 'Ring Road', 'Main Road', 'Station Road', 'Lake View'])}",
                    "Add_Line2": _pick(["Near Metro", "Opp. Park", "Behind Mall", "Near Hospital", None]),
                    "Add_City": _pick(CITIES),
                    "Add_State": _pick([r["Stt_ID"] for r in STATE_ROWS]),
                    "Add_Zip": str(random.randint(100000, 999999)),
                }
            )

        created += 1

    return {"seeded": created, "skipped": False}
