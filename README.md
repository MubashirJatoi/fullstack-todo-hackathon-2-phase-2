# Phase II Todo Full-Stack Web Application

A full-stack todo application with Next.js frontend, FastAPI backend, and Neon PostgreSQL database. The application includes user authentication with Better Auth, JWT token validation, and complete task management functionality with proper user isolation.

## Features

- User registration and authentication
- Secure JWT-based authentication
- Create, read, update, and delete tasks
- Task completion status toggle
- User isolation - each user sees only their own tasks
- Responsive design for mobile and desktop
- Clean, modern UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.11+, SQLModel, Pydantic
- **Database**: PostgreSQL (compatible with Neon Serverless)
- **Authentication**: JWT tokens with Better Auth integration
- **ORM**: SQLModel for database operations

## Setup Instructions

### Prerequisites

- Node.js 18+ (for frontend)
- Python 3.11+ (for backend)
- PostgreSQL-compatible database (Neon recommended)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file with the following content:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/todo_app
   BETTER_AUTH_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   ```

4. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with the following content:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate user and return JWT token

### Tasks

- `GET /api/tasks` - Get all tasks for the authenticated user
- `POST /api/tasks` - Create a new task for the authenticated user
- `GET /api/tasks/{id}` - Get a specific task by ID
- `PUT /api/tasks/{id}` - Update a specific task
- `DELETE /api/tasks/{id}` - Delete a specific task
- `PATCH /api/tasks/{id}/complete` - Toggle task completion status

## Architecture

### Frontend Structure
```
frontend/
├── app/
│   ├── auth/           # Login/signup pages
│   ├── tasks/          # Task management pages
│   └── layout.tsx      # Root layout with auth context
├── components/         # Reusable UI components
│   ├── TaskList.tsx
│   ├── TaskForm.tsx
│   └── TaskCard.tsx
├── lib/
│   ├── api.ts          # API client with JWT handling
│   └── auth.ts         # Authentication context
├── package.json
└── tsconfig.json
```

### Backend Structure
```
backend/
├── main.py             # FastAPI app, middleware setup
├── models.py           # SQLModel User and Task
├── db.py               # Database connection
├── auth.py             # JWT validation helpers
├── routes/
│   ├── auth.py         # Authentication endpoints
│   └── tasks.py        # Task endpoints
├── services/
│   └── task_service.py # Business logic for task operations
└── requirements.txt
```

## Security Features

- JWT token authentication on all API endpoints
- User data isolation - users can only access their own tasks
- Password hashing using bcrypt
- Input validation and sanitization
- SQL injection prevention through SQLModel ORM

## Development

The application follows a spec-driven development approach with complete separation of concerns between frontend and backend. All changes should maintain the user isolation requirements and follow the established patterns.

## Testing

To verify the user isolation works correctly:
1. Create two user accounts (User A and User B)
2. Create tasks for each user
3. Verify that User A can only see their own tasks and not User B's tasks, and vice versa"# fullstack-todo-hackathon-2-phase-2" 
