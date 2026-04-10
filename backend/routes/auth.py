from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import UserRegister, UserLogin, UserResponse, TokenResponse
from services.auth_service import register_user, login_user, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth & Users"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """
    POST /auth/register
    Creates a new user account.
    Open route — no token required.

    Body: { name, email, password, role? }
    """
    return register_user(
        name=data.name,
        email=data.email,
        password=data.password,
        role=data.role,
        db=db
    )


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """
    POST /auth/login
    Returns a JWT token on successful login.
    Open route — no token required.

    Body: { email, password }
    Response: { access_token, token_type, user }
    """
    result = login_user(email=data.email, password=data.password, db=db)
    return result


@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    """
    GET /auth/me
    Returns the currently logged-in user's profile.
    Requires: Valid JWT token.
    """
    return current_user


@router.get("/users", response_model=list[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    GET /auth/users
    Returns all registered users.
    Requires: Admin role.
    """
    from fastapi import HTTPException
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    from models.auth import User
    return db.query(User).all()