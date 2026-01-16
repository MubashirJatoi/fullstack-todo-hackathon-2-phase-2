from sqlmodel import create_engine, Session
from sqlalchemy import event
from sqlalchemy.engine import Engine
import os
from typing import Generator
from urllib.parse import urlparse
import ssl
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get database URL from environment, with a default for development
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/todo_app")

# Handle Neon SSL requirements
def setup_ssl_verification(url: str):
    parsed = urlparse(url)
    # Skip SSL setup for SQLite databases
    if parsed.scheme == 'sqlite':
        return url

    if parsed.hostname and "neon.tech" in parsed.hostname:
        # For Neon, we need to handle SSL properly
        # Check if sslmode is already specified
        if 'sslmode=' not in url:
            # Check if URL already has query parameters
            if '?' in url:
                # If there are already query parameters, append with &
                return f"{url}&sslmode=require"
            else:
                # If no query parameters, append with ?
                return f"{url}?sslmode=require"
    return url

DATABASE_URL = setup_ssl_verification(DATABASE_URL)

# Create engine with connection pooling settings appropriate for async applications
try:
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,  # Base number of connections
        max_overflow=10,  # Additional connections beyond pool_size
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=300,  # Recycle connections after 5 minutes
        echo=True  # Enable SQL logging for debugging
    )
    print(f"Database engine created with URL: {DATABASE_URL}")
except Exception as e:
    print(f"Error creating database engine: {e}")
    raise


def get_session() -> Generator[Session, None, None]:
    """Yield a database session for use with FastAPI dependency injection."""
    with Session(engine) as session:
        yield session


# Create tables if they don't exist
def create_db_and_tables():
    """Create database tables if they don't exist."""
    try:
        from models import User, Task
        from sqlmodel import SQLModel

        print("Creating database tables...")
        SQLModel.metadata.create_all(engine)
        print("Database tables created successfully!")
    except Exception as e:
        print(f"Error creating database tables: {e}")
        raise


# Handle different database types
@event.listens_for(Engine, "connect")
def set_database_defaults(dbapi_connection, connection_record):
    """Set database-specific defaults based on database type."""
    import sqlite3

    # Check if it's SQLite
    if isinstance(dbapi_connection, sqlite3.Connection):
        # SQLite-specific setup
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")  # Enable foreign key constraints
        cursor.close()
    else:
        # PostgreSQL-specific setup
        existing_autocommit = dbapi_connection.autocommit
        dbapi_connection.autocommit = True
        cursor = dbapi_connection.cursor()
        cursor.execute("SET SESSION search_path TO public")
        cursor.close()
        dbapi_connection.autocommit = existing_autocommit