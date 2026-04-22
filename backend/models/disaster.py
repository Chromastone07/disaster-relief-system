from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from database import Base


class DisasterReport(Base):
    """
    A disaster event reported by any user.
    Maps to the 'disaster_reports' table.
    """
    __tablename__ = "disaster_reports"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    title       = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    location    = Column(String, nullable=False)
    status      = Column(String, default="reported")   # reported | in_progress | resolved
    created_at  = Column(DateTime(timezone=True), server_default=func.now())


class HelpRequest(Base):
    """
    A help request submitted by a user in need.
    Maps to the 'help_requests' table.
    """
    __tablename__ = "help_requests"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    type        = Column(String, nullable=False)        # food | medical | shelter
    description = Column(Text, nullable=False)
    status      = Column(String, default="reported")   # reported | in_progress | resolved
    created_at  = Column(DateTime(timezone=True), server_default=func.now())


class Inventory(Base):
    """
    Tracks inventory of relief materials.
    Maps to the 'inventory' table.
    """
    __tablename__ = "inventory"

    id          = Column(Integer, primary_key=True, index=True)
    item        = Column(String, nullable=False)
    quantity    = Column(Integer, default=0)
    category    = Column(String, nullable=False)
    location    = Column(String, nullable=False)
    approval_status = Column(String, default="pending") # "pending" | "approved" | "denied"
    created_at  = Column(DateTime(timezone=True), server_default=func.now())