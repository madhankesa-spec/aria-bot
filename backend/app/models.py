from __future__ import annotations

from pydantic import BaseModel


class ChatQueryIn(BaseModel):
    message: str
    lang: str | None = "en"


class ChatQueryOut(BaseModel):
    reply: str
    type: str = "empty"  # empty | grid | form
    title: str | None = None
    payload: object | None = None

class TranslateIn(BaseModel):
    text: str
    from_: str = "en"
    to: str

    class Config:
        populate_by_name = True
        fields = {"from_": "from"}


class TranslateOut(BaseModel):
    text: str
