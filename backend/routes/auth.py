from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlmodel import Session, select
from typing import Optional
from datetime import timedelta
from pydantic import BaseModel
import uuid
from ..auth import authenticate_user, create_access_token, get_password_hash
from models import User
from db import get_session
from datetime import datetime


router = APIRouter()

# Pydantic models for request/response
class UserCreate(BaseModel):
    email: str
    password: str
    name: Optional[str] = None


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    token: str
    user: UserResponse


class ErrorResponse(BaseModel):
    error: str
    details: Optional[list] = None


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, session: Session = Depends(get_session)):
    """Register a new user."""
    # Check if user already exists
    existing_user = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    # Validate email format (basic validation)
    if "@" not in user_data.email or "." not in user_data.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )

    # Validate password strength (basic validation)
    if len(user_data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password too weak"
        )

    # Check password length to comply with bcrypt limitation (72 bytes)
    if len(user_data.password.encode('utf-8')) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password too long (bcrypt limit is 72 bytes)"
        )

    # Hash the password
    hashed_password = get_password_hash(user_data.password)

    # Create new user
    db_user = User(
        email=user_data.email,
        password=hashed_password,
        name=user_data.name
    )

    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    return db_user


@router.post("/login", response_model=TokenResponse)
def login(user_data: UserLogin, session: Session = Depends(get_session)):
    """Authenticate user and return JWT token."""
    # Check password length to comply with bcrypt limitation (72 bytes)
    password = user_data.password
    if len(password.encode('utf-8')) > 72:
        # Truncate password to first 72 characters for comparison
        password = password[:72]

    user = authenticate_user(session, user_data.email, password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Create access token
    access_token_expires = timedelta(days=7)  # 7 days expiry as per spec
    access_token = create_access_token(
        data={"sub": str(user.id)},  # Use user ID as subject
        expires_delta=access_token_expires
    )

    # Prepare user response
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        created_at=user.created_at
    )

    return {
        "token": access_token,
        "user": user_response
    }