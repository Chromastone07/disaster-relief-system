from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# ── VOLUNTEER ──

class VolunteerCreate(BaseModel):
    skills: Optional[str] = None      # comma-separated e.g. "medical, driving"
    location: Optional[str] = None    # "lat,lng"
    availability: bool = True


class VolunteerAvailabilityUpdate(BaseModel):
    availability: bool


class VolunteerResponse(BaseModel):
    id:           int
    user_id:      int
    availability: bool
    skills:       Optional[str]
    location:     Optional[str]
    approval_status: str
    created_at:   datetime

    class Config:
        from_attributes = True


# ── ASSIGNMENT ──

class AssignmentCreate(BaseModel):
    volunteer_id: int
    request_id:   int


class AssignmentStatusUpdate(BaseModel):
    status: str    # "assigned" | "in_progress" | "completed"


class AssignmentResponse(BaseModel):
    id:           int
    volunteer_id: int
    request_id:   int
    status:       str
    created_at:   datetime

    class Config:
        from_attributes = True


# ── RESOURCE ──

class ResourceCreate(BaseModel):
    name:        str
    type:        str
    quantity:    int
    location_id: Optional[int] = None


class ResourceUpdate(BaseModel):
    quantity: int


class ResourceResponse(BaseModel):
    id:          int
    name:        str
    type:        str
    quantity:    int
    location_id: Optional[int]
    approval_status: str
    created_at:  datetime

    class Config:
        from_attributes = True