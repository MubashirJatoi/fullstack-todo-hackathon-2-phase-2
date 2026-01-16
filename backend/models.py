from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import datetime, date
import uuid

if TYPE_CHECKING:
    from models import Task


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, nullable=False, max_length=255)
    name: Optional[str] = Field(default=None, max_length=100)
    password: str = Field(nullable=False)  # hashed password
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationship to tasks
    tasks: list["Task"] = Relationship(back_populates="user")


class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    priority: str = Field(default="medium", max_length=20)  # low, medium, high
    category: Optional[str] = Field(default=None, max_length=100)
    due_date: Optional[date] = Field(default=None)
    recurrence_pattern: Optional[str] = Field(default=None, max_length=50)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationship to user
    user: User = Relationship(back_populates="tasks")