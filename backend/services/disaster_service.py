from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.disaster import DisasterReport, HelpRequest


VALID_STATUSES = {"reported", "in_progress", "resolved"}
VALID_HELP_TYPES = {"food", "medical", "shelter"}


# ── DISASTER REPORTS ──

def report_disaster(user_id: int, title: str, description: str, location: str, db: Session):
    """Creates a new disaster report linked to the reporting user."""
    report = DisasterReport(
        user_id=user_id,
        title=title,
        description=description,
        location=location,
        status="reported"
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_all_disasters(db: Session):
    """Returns all disaster reports, newest first."""
    return db.query(DisasterReport).order_by(DisasterReport.created_at.desc()).all()


def update_disaster_status(report_id: int, new_status: str, db: Session):
    """Updates the status of a disaster report. Admin only."""
    if new_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {VALID_STATUSES}"
        )

    report = db.query(DisasterReport).filter(DisasterReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Disaster report not found.")

    report.status = new_status
    db.commit()
    db.refresh(report)
    return report


# ── HELP REQUESTS ──

def request_help(user_id: int, type: str, description: str, db: Session):
    """Creates a new help request."""
    if type not in VALID_HELP_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid help type. Must be one of: {VALID_HELP_TYPES}"
        )

    req = HelpRequest(
        user_id=user_id,
        type=type,
        description=description,
        status="reported"
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


def get_all_requests(db: Session):
    """Returns all help requests, newest first."""
    return db.query(HelpRequest).order_by(HelpRequest.created_at.desc()).all()


def update_request_status(request_id: int, new_status: str, db: Session):
    """Updates the status of a help request. Admin only."""
    if new_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {VALID_STATUSES}"
        )

    req = db.query(HelpRequest).filter(HelpRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Help request not found.")

    req.status = new_status
    db.commit()
    db.refresh(req)
    return req