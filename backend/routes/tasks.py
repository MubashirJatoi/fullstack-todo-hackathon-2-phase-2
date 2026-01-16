from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel
import uuid
from auth import get_current_user_id
from models import Task, User
from db import get_session
from datetime import datetime
from services.task_service import (
    get_tasks_by_user,
    create_task_for_user,
    get_task_by_id_and_user,
    update_task_for_user,
    delete_task_for_user,
    toggle_task_completion
)


router = APIRouter()


# Pydantic models for request/response
class TaskCreate(BaseModel):
    title: str
    description: str = ""
    priority: str = "medium"  # low, medium, high
    category: str = ""
    due_date: Optional[str] = None
    recurrence_pattern: Optional[str] = None


class TaskUpdate(BaseModel):
    title: str = None
    description: str = None
    completed: bool = None
    priority: str = None
    category: str = None
    due_date: Optional[str] = None
    recurrence_pattern: Optional[str] = None


class TaskComplete(BaseModel):
    completed: bool


class TaskResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    completed: bool
    priority: str
    category: str
    due_date: Optional[datetime] = None
    recurrence_pattern: Optional[str] = None
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    tasks: List[TaskResponse]


class ErrorResponse(BaseModel):
    error: str
    details: List[str] = None


@router.get("/", response_model=TaskListResponse)
def get_tasks(
    current_user_id: uuid.UUID = Depends(get_current_user_id),
    session: Session = Depends(get_session),
    search: Optional[str] = None,
    status: Optional[str] = None,  # all, pending, completed
    priority: Optional[str] = None,  # low, medium, high
    category: Optional[str] = None,
    sort: Optional[str] = None  # created, title, priority, due_date
):
    """Get all tasks for the authenticated user with search and filtering."""
    # Get tasks for this user only using the service layer
    tasks = get_tasks_by_user(session, current_user_id)

    # Apply search filter if provided
    if search:
        search_lower = search.lower()
        tasks = [
            task for task in tasks
            if search_lower in task.title.lower() or
            (task.description and search_lower in task.description.lower()) or
            (task.category and search_lower in task.category.lower())
        ]

    # Apply status filter if provided
    if status == "pending":
        tasks = [task for task in tasks if not task.completed]
    elif status == "completed":
        tasks = [task for task in tasks if task.completed]

    # Apply priority filter if provided
    if priority:
        tasks = [task for task in tasks if task.priority == priority]

    # Apply category filter if provided
    if category:
        tasks = [task for task in tasks if task.category and category.lower() in task.category.lower()]

    # Apply sorting if provided
    if sort == "title":
        tasks.sort(key=lambda t: t.title.lower())
    elif sort == "priority":
        priority_order = {"high": 0, "medium": 1, "low": 2}
        tasks.sort(key=lambda t: priority_order.get(t.priority, 3))
    elif sort == "due_date":
        tasks.sort(key=lambda t: (t.due_date is None, t.due_date))
    else:  # Default sort by created_at (most recent first)
        tasks.sort(key=lambda t: t.created_at, reverse=True)

    # Convert to response format
    task_responses = [TaskResponse.model_validate(task) for task in tasks]

    return TaskListResponse(tasks=task_responses)


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task_data: TaskCreate, current_user_id: uuid.UUID = Depends(get_current_user_id), session: Session = Depends(get_session)):
    """Create a new task for the authenticated user."""
    # Validate input
    if not task_data.title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title is required"
        )

    if len(task_data.title) > 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title too long"
        )

    if len(task_data.description) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description too long"
        )

    # Validate priority
    if task_data.priority not in ["low", "medium", "high"]:
        task_data.priority = "medium"  # Default to medium if invalid

    # Create new task using the service layer
    db_task = create_task_for_user(
        session,
        current_user_id,
        task_data.title,
        task_data.description,
        task_data.priority,
        task_data.category,
        task_data.due_date,
        task_data.recurrence_pattern
    )

    return db_task


@router.get("/{task_id}", response_model=TaskResponse)
def get_task_by_id(task_id: uuid.UUID, current_user_id: uuid.UUID = Depends(get_current_user_id), session: Session = Depends(get_session)):
    """Get a specific task by ID."""
    # Get the task using the service layer which ensures user isolation
    task = get_task_by_id_and_user(session, task_id, current_user_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: uuid.UUID, task_update: TaskUpdate, current_user_id: uuid.UUID = Depends(get_current_user_id), session: Session = Depends(get_session)):
    """Update a specific task."""
    # Validate input if title is being updated
    if task_update.title is not None:
        if not task_update.title.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Title is required"
            )

        if len(task_update.title) > 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Title too long"
            )

    if task_update.description is not None and len(task_update.description) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description too long"
        )

    # Validate priority if provided
    if task_update.priority is not None and task_update.priority not in ["low", "medium", "high"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Priority must be 'low', 'medium', or 'high'"
        )

    # Update the task using the service layer which ensures user isolation
    updated_task = update_task_for_user(
        session,
        task_id,
        current_user_id,
        title=task_update.title,
        description=task_update.description,
        completed=task_update.completed,
        priority=task_update.priority,
        category=task_update.category,
        due_date=task_update.due_date,
        recurrence_pattern=task_update.recurrence_pattern
    )

    if not updated_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return updated_task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: uuid.UUID, current_user_id: uuid.UUID = Depends(get_current_user_id), session: Session = Depends(get_session)):
    """Delete a specific task."""
    # Delete the task using the service layer which ensures user isolation
    success = delete_task_for_user(session, task_id, current_user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Return 204 No Content
    return


@router.patch("/{task_id}/complete", response_model=TaskResponse)
def patch_task_completion(task_id: uuid.UUID, task_complete: TaskComplete, current_user_id: uuid.UUID = Depends(get_current_user_id), session: Session = Depends(get_session)):
    """Toggle task completion status."""
    # Validate input - check if completed field is provided and is a boolean
    if task_complete.completed is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed field required"
        )

    # Toggle task completion using the service layer which ensures user isolation
    updated_task = toggle_task_completion(session, task_id, current_user_id, task_complete.completed)

    if not updated_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return updated_task