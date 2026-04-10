from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# ── INPUT ──

class UserRegister(BaseModel):
    name:     str
    email:    EmailStr
    password: str
    role:     Optional[str] = "user"   # default role is regular user


class UserLogin(BaseModel):
    email:    EmailStr
    password: str


# ── OUTPUT ──

class UserResponse(BaseModel):
    id:         int
    name:       str
    email:      str
    role:       str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserResponse