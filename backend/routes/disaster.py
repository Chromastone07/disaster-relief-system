from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from schemas.disaster import (
    DisasterCreate, DisasterResponse, DisasterStatusUpdate,
    HelpRequestCreate, HelpRequestResponse, HelpStatusUpdate
)
from services.disaster_service import (
    report_disaster, get_all_disasters, update_disaster_status,
    request_help, get_all_requests, update_request_status
)
from services.auth_service import get_current_user

router = APIRouter(prefix="/disaster", tags=["Disaster & Help Requests"])


# ── DISASTER REPORTS ──

@router.post("/report", response_model=DisasterResponse, status_code=201)
def report(
    data: DisasterCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    POST /disaster/report
    Any logged-in user can report a disaster.

    Body: { title, description, location }
    """
    return report_disaster(
        user_id=current_user.id,
        title=data.title,
        description=data.description,
        location=data.location,
        db=db
    )


@router.get("/reports", response_model=List[DisasterResponse])
def get_disasters(db: Session = Depends(get_db)):
    """
    GET /disaster/reports
    Returns all disaster reports. Newest first.
    Requires: Valid JWT token.
    """
    return get_all_disasters(db)


@router.patch("/reports/{report_id}/status", response_model=DisasterResponse)
def update_disaster(
    report_id: int,
    data: DisasterStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    PATCH /disaster/reports/{id}/status
    Updates a disaster report's status.
    Requires: Admin role.

    Body: { status: "reported" | "in_progress" | "resolved" }
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return update_disaster_status(report_id, data.status, db)


# ── HELP REQUESTS ──

@router.post("/help", response_model=HelpRequestResponse, status_code=201)
def help_request(
    data: HelpRequestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    POST /disaster/help
    Any logged-in user can submit a help request.

    Body: { type: "food"|"medical"|"shelter", description }
    """
    return request_help(
        user_id=current_user.id,
        type=data.type,
        description=data.description,
        db=db
    )


@router.get("/help", response_model=List[HelpRequestResponse])
def get_requests(db: Session = Depends(get_db)):
    """
    GET /disaster/help
    Returns all help requests. Newest first.
    Requires: Valid JWT token.
    """
    return get_all_requests(db)


@router.patch("/help/{request_id}/status", response_model=HelpRequestResponse)
def update_help(
    request_id: int,
    data: HelpStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    PATCH /disaster/help/{id}/status
    Updates a help request's status.
    Requires: Admin role.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return update_request_status(request_id, data.status, db)