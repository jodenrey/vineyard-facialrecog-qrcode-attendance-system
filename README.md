# Vineyard Academy Attendance System

A modern, full-stack school attendance management system with facial recognition capabilities for teachers, students, and administrators.

![Vineyard Academy Logo](https://via.placeholder.com/150)

## Features

- **Facial Recognition**: Secure authentication and attendance tracking using InsightFace
- **Role-Based Access Control**: Dedicated dashboards for administrators, teachers, and students
- **Real-time Attendance Tracking**: Track student attendance with status options (present, absent, late)
- **User Management**: Create, update, and delete users with different roles
- **Class Management**: Assign students to classes and teachers to sections
- **Attendance Reports**: Generate and visualize attendance data and statistics
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- **Next.js**: React framework for server-rendered applications
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn UI**: Modern component library
- **Prisma**: Database toolkit and ORM

### Backend
- **FastAPI**: Modern, high-performance web framework for building APIs with Python
- **PostgreSQL**: Advanced open-source relational database
- **InsightFace**: State-of-the-art facial recognition library
- **JWT**: JSON Web Tokens for secure authentication
- **OpenCV**: Computer vision library for image processing

## Installation

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- PostgreSQL
- Git

### Clone the Repository
```bash
git clone https://github.com/yourusername/VineyardAcademyAttendanceSystem.git
cd VineyardAcademyAttendanceSystem
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create a .env.local file with the following content:
# DATABASE_URL="postgresql://username:password@localhost:5432/vineyard_academy"
# NEXTAUTH_SECRET="your-nextauth-secret"
# NEXTAUTH_URL="http://localhost:3000"
# NEXT_PUBLIC_API_URL="http://localhost:8000"

# Set up the database
npx prisma migrate dev

# Start the development server
npm run dev
```

### Backend Setup
```bash
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file with the following content:
# DATABASE_URL="postgresql://username:password@localhost:5432/vineyard_academy"
# SECRET_KEY="your-secret-key-here"
# ALGORITHM="HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES=30
# RECOGNITION_THRESHOLD=0.5

# Start the development server
uvicorn main:app --reload
```

## Configuration

### Frontend Environment Variables (.env.local)
```
# Database connection for Prisma
DATABASE_URL="postgresql://username:password@localhost:5432/vineyard_academy"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Backend API
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

### Backend Environment Variables (.env)
```
# Database connection
DATABASE_URL="postgresql://username:password@localhost:5432/vineyard_academy"

# Authentication
SECRET_KEY="your-secret-key-here"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Facial Recognition
RECOGNITION_THRESHOLD=0.5
```

## Usage

After starting both frontend and backend servers:

1. Navigate to `http://localhost:3000` in your browser
2. Log in with the default admin account:
   - Email: admin@vineyard.edu
   - Password: password123
3. Start managing users, classes and attendance records

## Directory Structure

```
VineyardAcademyAttendanceSystem/
├── frontend/                # Next.js client application
│   ├── app/                 # App Router components
│   │   ├── api/             # API routes
│   │   ├── dashboard/       # Dashboard pages for different roles
│   │   └── page.tsx         # Landing page
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utility functions
│   ├── prisma/              # Database schema and migrations
│   └── public/              # Static assets
│
└── backend/                 # FastAPI server application
    ├── face_recognition/    # Facial recognition modules
    │   ├── database.py      # Face database operations
    │   ├── models.py        # Data models
    │   ├── router.py        # API endpoints
    │   └── service.py       # Face recognition logic
    ├── auth.py              # Authentication logic
    ├── database.py          # Database connection utilities
    ├── main.py              # Main application entry point
    └── requirements.txt     # Python dependencies
```

## API Endpoints

### Authentication
- POST `/api/auth/login`: User login with email/password
- POST `/api/face/recognize`: Facial recognition login

### Users
- GET `/api/users`: List all users
- GET `/api/users/:id`: Get user details
- POST `/api/users`: Create a new user
- PUT `/api/users/:id`: Update a user
- DELETE `/api/users/:id`: Delete a user

### Classes
- GET `/api/classes`: List all classes
- GET `/api/classes/:id`: Get class details
- GET `/api/classes/:id/students`: Get students in a class
- POST `/api/classes`: Create a new class
- PUT `/api/classes/:id`: Update a class
- DELETE `/api/classes/:id`: Delete a class

### Attendance
- GET `/api/attendance`: Get attendance records
- POST `/api/attendance`: Create attendance record
- PUT `/api/attendance/:id`: Update attendance record
- GET `/api/attendance/report`: Generate attendance report

### Facial Recognition
- POST `/api/face/register`: Register a user's face
- POST `/api/face/recognize`: Recognize a face
- DELETE `/api/face/delete/:userId`: Delete a user's face recognition data

## License

[MIT](LICENSE)

## Contact

For questions or support, please contact [your-email@example.com](mailto:your-email@example.com). 