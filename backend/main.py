from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Union, Optional
import os
from dotenv import load_dotenv
from pydantic import BaseModel

# Import routers
from face_recognition.router import router as face_router
from auth import router as auth_router

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Vineyard Academy API")

# Configure CORS
origins = [
    "http://localhost",
    "http://localhost:3000",  # Frontend URL
    "http://127.0.0.1:3000",   # Alternative frontend URL
    "*",                      # Allow all origins (for development only)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],      # Allow all methods
    allow_headers=["*"],      # Allow all headers
)

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# User models
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    user_role: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    id: str
    email: str
    name: str
    role: str
    disabled: Optional[bool] = False

class UserInDB(User):
    hashed_password: str

# Function to verify password
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Function to get password hash
def get_password_hash(password):
    return pwd_context.hash(password)

# Function to create JWT token
def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Include routers
app.include_router(face_router, prefix="/api/face", tags=["face"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to Vineyard Academy API"}

# Run with: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 