import sys
import os
# Add the current directory to the Python path to resolve imports properly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlmodel import Session

from db import create_db_and_tables, get_session
from routes import auth_routes as auth, tasks
from models import User, Task


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables on startup
    create_db_and_tables()
    yield


# Create FastAPI app with lifespan
app = FastAPI(
    lifespan=lifespan,
    title="Todo API",
    version="1.0.0",
    redoc_url="/redoc",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# Add CORS middleware for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://fullstack-todo-hackathon-2-phase-2.vercel.app",  # Deployed frontend
        "https://frontend-xi-five-90.vercel.app",  # Previous deployed frontend
        "http://localhost:3000",  # Local frontend development
        "http://localhost:8000",  # Local backend for testing
        "https://mubashirjatoi-todo-app-fullstack.hf.space"  # Hugging Face deployment
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])

# Handle both with and without trailing slash to avoid redirect issues for POST requests
from fastapi import Depends, HTTPException, status
import uuid
from routes import tasks as tasks_router_module
from auth import get_current_user_id
from db import get_session
from sqlmodel import Session

# Directly implement the endpoints without redirects to preserve POST data
@app.post("/api/tasks")
def create_task_no_redirect(task_data: tasks_router_module.TaskCreate, current_user_id: uuid.UUID = Depends(get_current_user_id), session: Session = Depends(get_session)):
    # Call the actual create_task function from the tasks router
    return tasks_router_module.create_task(task_data, current_user_id, session)

@app.get("/api/tasks")
def get_tasks_no_redirect(
    current_user_id: uuid.UUID = Depends(get_current_user_id),
    session: Session = Depends(get_session),
    search: str = None,
    status: str = None,  # Changed from status_filter to match original
    priority: str = None,
    category: str = None,
    sort: str = None
):
    # Call the actual get_tasks function from the tasks router
    # We need to call it with the same parameters as the original function
    from routes.tasks import get_tasks
    return get_tasks(current_user_id=current_user_id, session=session, search=search, status=status, priority=priority, category=category, sort=sort)

@app.get("/")
def read_root():
    return {"message": "Todo API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 7860))  # Hugging Face uses PORT environment variable, default to 7860
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)