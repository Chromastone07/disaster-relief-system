from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.volunteer import Volunteer, Assignment, Resource
from models.disaster import HelpRequest
from models.notification import Notification

VALID_ASSIGNMENT_STATUSES = {"assigned", "in_progress", "completed"}


# ── VOLUNTEERS ──

def register_volunteer(user_id: int, skills: str, location: str, db: Session, availability: bool = True):
    """
    Registers a user as a volunteer.
    - If they have never applied, creates a new record.
    - If their previous application was DENIED, resets it to PENDING (re-application).
    - If they are already PENDING or APPROVED, raises 400.
    """
    existing = db.query(Volunteer).filter(Volunteer.user_id == user_id).first()
    if existing:
        if existing.approval_status == "denied":
            # Allow re-application: reset the record
            existing.skills = skills
            existing.location = location
            existing.availability = availability
            existing.approval_status = "pending"
            db.commit()
            db.refresh(existing)
            return existing
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Already registered as a volunteer (status: {existing.approval_status})."
            )

    vol = Volunteer(user_id=user_id, skills=skills, location=location, availability=availability)
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

    # Need exact user ID to send notification
    vol_user_id = vol.user_id
    notification = Notification(
        user_id=vol_user_id,
        title="Field Deployment Assignment",
        message=f"You have been assigned to Help Request #{request_id}."
    )
    db.add(notification)

    # Mark volunteer as unavailable
    vol.availability = False
    db.commit()
    db.refresh(assignment)
    return assignment

def skill_based_assignment(request_id: int, db: Session):
    """
    Admin automatically assigns a volunteer to a help request by matching skill to type.
    """
    request = db.query(HelpRequest).filter(HelpRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found.")
        
    volunteer = db.query(Volunteer).filter(
        Volunteer.availability == True,
        Volunteer.approval_status == "approved",
        Volunteer.skills.ilike(f"%{request.type}%")
    ).first()
    
    if not volunteer:
        volunteer = db.query(Volunteer).filter(
            Volunteer.availability == True,
            Volunteer.approval_status == "approved"
        ).first()

    if not volunteer:
        raise HTTPException(status_code=404, detail="No available approved volunteers.")
        
    return assign_volunteer(volunteer.id, request.id, db)


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