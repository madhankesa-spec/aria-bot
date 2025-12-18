"""CLI helper to seed the database.

This avoids PowerShell quoting issues when trying to run async code via `python -c`.
"""

from __future__ import annotations

import argparse
import asyncio

from prisma import Prisma

from app.seed import seed_sample_data


async def _run(clients: int) -> dict:
    db = Prisma()
    await db.connect()
    try:
        return await seed_sample_data(db, clients=clients)
    finally:
        await db.disconnect()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed sample data into the database")
    parser.add_argument("--clients", type=int, default=12)
    args = parser.parse_args()
    result = asyncio.run(_run(args.clients))
    print(result)


if __name__ == "__main__":
    main()
