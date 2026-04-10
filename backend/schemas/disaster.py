from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# ── DISASTER REPORT ──

class DisasterCreate(BaseModel):
    title:       str
    description: str
    location:    str


class DisasterStatusUpdate(BaseModel):
    status: str    # "reported" | "in_progress" | "resolved"


class DisasterResponse(BaseModel):
    id:          int
    user_id:     int
    title:       str
    description: str
    location:    str
    status:      str
    created_at:  datetime

    class Config:
        from_attributes = True


# ── HELP REQUEST ──

class HelpRequestCreate(BaseModel):
    type:        str    # "food" | "medical" | "shelter"
    description: str


class HelpStatusUpdate(BaseModel):
    status: str    # "reported" | "in_progress" | "resolved"


class HelpRequestResponse(BaseModel):
    id:          int
    user_id:     int
    type:        str
    description: str
    status:      str
    created_at:  datetime

    class Config:
        from_attributes = True