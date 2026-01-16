from sqlmodel import Session, select
from typing import List, Optional
import uuid
from models import Task, User
from datetime import datetime, date


def get_tasks_by_user(session: Session, user_id: uuid.UUID) -> List[Task]:
    """Get all tasks for a specific user."""
    tasks = session.exec(select(Task).where(Task.user_id == user_id)).all()
    return tasks


def create_task_for_user(session: Session, user_id: uuid.UUID, title: str, description: str = "", priority: str = "medium", category: str = "", due_date_str: str = None, recurrence_pattern: str = None) -> Task:
    """Create a new task for a specific user."""
    from datetime import datetime, date
    import uuid

    # Parse due_date if provided
    due_date = None
    if due_date_str:
        try:
            from dateutil.parser import parse
            parsed_date = parse(due_date_str)
            # Convert to date only (year-month-day)
            due_date = parsed_date.date()
        except:
            due_date = None  # If parsing fails, set to None

    task = Task(
        title=title,
        description=description,
        priority=priority,
        category=category if (category and category.strip()) else None,
        due_date=due_date,
        recurrence_pattern=recurrence_pattern,
        user_id=user_id,
        completed=False  # Default to not completed
    )

    session.add(task)
    session.commit()
    session.refresh(task)

    return task


def get_task_by_id_and_user(session: Session, task_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Task]:
    """Get a specific task by ID and user ID to ensure user isolation."""
    task = session.get(Task, task_id)
    if task and task.user_id == user_id:
        return task
    return None


def update_task_for_user(session: Session, task_id: uuid.UUID, user_id: uuid.UUID,
                        title: Optional[str] = None, description: Optional[str] = None,
                        completed: Optional[bool] = None, priority: Optional[str] = None,
                        category: Optional[str] = None, due_date: Optional[str] = None,
                        recurrence_pattern: Optional[str] = None) -> Optional[Task]:
    """Update a task for a specific user."""
    task = session.get(Task, task_id)
    if not task or task.user_id != user_id:
        return None

    # Update fields if provided
    if title is not None:
        task.title = title
    if description is not None:
        task.description = description
    if completed is not None:
        task.completed = completed
    if priority is not None:
        task.priority = priority
    if category is not None:
        task.category = category if (category and category.strip()) else None
    if due_date is not None:
        from dateutil.parser import parse
        try:
            parsed_date = parse(due_date)
            # Convert to date only (year-month-day)
            task.due_date = parsed_date.date()
        except:
            pass  # If parsing fails, don't update due_date
    if recurrence_pattern is not None:
        task.recurrence_pattern = recurrence_pattern

    # Update timestamp
    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    return task


def delete_task_for_user(session: Session, task_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """Delete a task for a specific user."""
    task = session.get(Task, task_id)
    if not task or task.user_id != user_id:
        return False

    session.delete(task)
    session.commit()

    return True


def toggle_task_completion(session: Session, task_id: uuid.UUID, user_id: uuid.UUID, completed: bool) -> Optional[Task]:
    """Toggle the completion status of a task for a specific user."""
    task = session.get(Task, task_id)
    if not task or task.user_id != user_id:
        return None

    task.completed = completed
    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    return task