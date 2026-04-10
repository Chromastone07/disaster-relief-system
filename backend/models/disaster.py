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