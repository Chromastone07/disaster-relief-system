from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base


class User(Base):
    """
    Central users table — used by ALL modules via ForeignKey.
    Every other table links back to this one.
    """
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)
    email      = Column(String, unique=True, index=True, nullable=False)
    password   = Column(String, nullable=False)          # bcrypt hashed — NEVER plain text
    role       = Column(String, default="user")          # "user" | "volunteer" | "admin"
    created_at = Column(DateTime(timezone=True), server_default=func.now())