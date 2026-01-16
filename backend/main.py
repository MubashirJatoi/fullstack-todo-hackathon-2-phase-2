from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlmodel import Session
import os

from db import create_db_and_tables, get_session
from routes import auth, tasks
from models import User, Task


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables on startup
    create_db_and_tables()
    yield


# Create FastAPI app with lifespan
app = FastAPI(lifespan=lifespan, title="Todo API", version="1.0.0")

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

@app.get("/")
def read_root():
    return {"message": "Todo API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}