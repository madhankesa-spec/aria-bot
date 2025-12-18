from __future__ import annotations

import os
from functools import lru_cache

from prisma import Prisma


@lru_cache(maxsize=1)
def get_db() -> Prisma:
    return Prisma()


def db_enabled() -> bool:
    return bool(os.getenv("DATABASE_URL"))
