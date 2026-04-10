from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class Volunteer(Base):
    """
    Extends the users table — a user who registers as a volunteer.
    Maps to the 'volunteers' table.
    """
    __tablename__ = "volunteers"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    availability = Column(Boolean, default=True)      # True = available for assignment
    skills       = Column(String, nullable=True)      # e.g. "medical, driving, rescue"
    location     = Column(String, nullable=True)      # Active GPS coordinate storage
    approval_status = Column(String, default="pending") # "pending" | "approved" | "denied"
    created_at   = Column(DateTime(timezone=True), server_default=func.now())


class Assignment(Base):
    """
    Links a volunteer to a help request.
    Maps to the 'assignments' table.
    """
    __tablename__ = "assignments"

    id           = Column(Integer, primary_key=True, index=True)
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"), nullable=False)
    request_id   = Column(Integer, ForeignKey("help_requests.id"), nullable=False)
    status       = Column(String, default="assigned")  # assigned | in_progress | completed
    created_at   = Column(DateTime(timezone=True), server_default=func.now())


class Resource(Base):
    """
    Tracks physical resources available at relief centers.
    Maps to the 'resources' table.
    """
    __tablename__ = "resources"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)      # e.g. "Water Bottles"
    type        = Column(String, nullable=False)      # e.g. "food", "medical", "equipment"
    quantity    = Column(Integer, default=0)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    approval_status = Column(String, default="pending") # "pending" | "approved" | "denied"
    created_at  = Column(DateTime(timezone=True), server_default=func.now())