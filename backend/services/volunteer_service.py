from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.volunteer import Volunteer, Assignment, Resource

VALID_ASSIGNMENT_STATUSES = {"assigned", "in_progress", "completed"}


# ── VOLUNTEERS ──

def register_volunteer(user_id: int, skills: str, location: str, db: Session):
    """
    Registers a user as a volunteer and stores their coordinates.
    A user can only register once — raises 400 if already registered.
    """
    existing = db.query(Volunteer).filter(Volunteer.user_id == user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already registered as a volunteer.")

    vol = Volunteer(user_id=user_id, skills=skills, location=location, availability=True)
    db.add(vol)
    db.commit()
    db.refresh(vol)
    return vol


def get_all_volunteers(db: Session):
    """Returns all volunteers."""
    return db.query(Volunteer).order_by(Volunteer.created_at.desc()).all()


def update_volunteer_availability(volunteer_id: int, availability: bool, db: Session):
    """Volunteer updates their own availability status."""
    vol = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not vol:
        raise HTTPException(status_code=404, detail="Volunteer not found.")

    vol.availability = availability
    db.commit()
    db.refresh(vol)
    return vol


# ── ASSIGNMENTS ──

def assign_volunteer(volunteer_id: int, request_id: int, db: Session):
    """
    Admin assigns a volunteer to a help request.
    - Checks volunteer exists and is available
    - Checks the help request isn't already assigned to this volunteer
    - Marks volunteer as unavailable after assignment
    """
    vol = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not vol:
        raise HTTPException(status_code=404, detail="Volunteer not found.")

    if not vol.availability:
        raise HTTPException(status_code=400, detail="Volunteer is not available.")

    # Check duplicate assignment
    duplicate = db.query(Assignment).filter(
        Assignment.volunteer_id == volunteer_id,
        Assignment.request_id == request_id
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="Already assigned to this request.")

    assignment = Assignment(
        volunteer_id=volunteer_id,
        request_id=request_id,
        status="assigned"
    )
    db.add(assignment)

    # Mark volunteer as unavailable
    vol.availability = False
    db.commit()
    db.refresh(assignment)
    return assignment


def get_all_assignments(db: Session):
    """Returns all volunteer assignments."""
    return db.query(Assignment).order_by(Assignment.created_at.desc()).all()


def update_task_status(assignment_id: int, new_status: str, db: Session):
    """
    Updates the status of an assignment.
    If completed, marks the volunteer as available again.
    """
    if new_status not in VALID_ASSIGNMENT_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {VALID_ASSIGNMENT_STATUSES}"
        )

    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    assignment.status = new_status

    # When task is completed, make volunteer available again
    if new_status == "completed":
        vol = db.query(Volunteer).filter(
            Volunteer.id == assignment.volunteer_id
        ).first()
        if vol:
            vol.availability = True

    db.commit()
    db.refresh(assignment)
    return assignment


# ── RESOURCES ──

def manage_resources(action: str, db: Session, resource_data=None, resource_id=None, quantity=None):
    """
    Unified resource manager.
    action = "create" | "list" | "update" | "delete"
    """
    if action == "create":
        res = Resource(**resource_data)
        db.add(res)
        db.commit()
        db.refresh(res)
        return res

    elif action == "list":
        return db.query(Resource).order_by(Resource.created_at.desc()).all()

    elif action == "update":
        res = db.query(Resource).filter(Resource.id == resource_id).first()
        if not res:
            raise HTTPException(status_code=404, detail="Resource not found.")
        res.quantity = quantity
        db.commit()
        db.refresh(res)
        return res

    elif action == "delete":
        res = db.query(Resource).filter(Resource.id == resource_id).first()
        if not res:
            raise HTTPException(status_code=404, detail="Resource not found.")
        db.delete(res)
        db.commit()
        return {"message": "Resource deleted."}