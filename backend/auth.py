from datetime import datetime, timedelta
from typing import Optional
from sqlmodel import Session
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import os
import uuid
import hashlib
import secrets
from models import User


# Configuration
SECRET_KEY = os.getenv("BETTER_AUTH_SECRET", "your-super-secret-jwt-key-here-make-it-long-and-random")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 7 * 24 * 60  # 7 days


# Password hashing using hashlib and secrets (simple but secure alternative to bcrypt)
def hash_password(password: str) -> str:
    """Hash a password with a random salt."""
    # Truncate password to 72 bytes to avoid potential issues
    if len(password.encode('utf-8')) > 72:
        password = password[:72]

    # Generate a random salt
    salt = secrets.token_hex(32)
    # Hash the password with the salt
    pwdhash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    # Combine salt and hash
    pwd_hash = salt + pwdhash.hex()
    return pwd_hash


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    # Extract salt (first 64 characters) and stored hash (remaining characters)
    salt = hashed_password[:64]
    stored_hash = hashed_password[64:]

    # Truncate password to 72 bytes to avoid potential issues
    if len(plain_password.encode('utf-8')) > 72:
        plain_password = plain_password[:72]

    # Hash the plain password with the extracted salt
    pwdhash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000)
    computed_hash = pwdhash.hex()

    # Compare the hashes
    return secrets.compare_digest(computed_hash, stored_hash)


# JWT token bearer scheme
security = HTTPBearer()


class TokenData(BaseModel):
    username: Optional[str] = None


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return hash_password(password)


def authenticate_user(session: Session, email: str, password: str) -> Optional[User]:
    """Authenticate a user by email and password."""
    user = session.query(User).filter(User.email == email).first()
    if not user:
        return None

    if not verify_password(password, user.password):
        return None

    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user_from_token(token: str) -> Optional[TokenData]:
    """Decode a token and return the username."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")  # Changed from username to user_id
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(username=user_id)
    except JWTError:
        raise credentials_exception
    return token_data


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Dependency to get the current user from the JWT token."""
    try:
        token = credentials.credentials
        token_data = get_current_user_from_token(token)
        if token_data is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return token_data.username
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> uuid.UUID:
    """Dependency to get the current user ID from the JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return uuid.UUID(user_id)
    except JWTError:
        raise credentials_exception