from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class FaceEmbedding(BaseModel):
    """Model for storing face embedding data"""
    user_id: str
    embedding: List[float]
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

class FaceRecognitionRequest(BaseModel):
    """Model for face recognition request"""
    image: str  # Base64 encoded image

class FaceRecognitionResponse(BaseModel):
    """Model for face recognition response"""
    success: bool
    user_id: Optional[str] = None
    confidence: Optional[float] = None
    message: Optional[str] = None

class FaceRegistrationRequest(BaseModel):
    """Model for face registration request"""
    user_id: str
    image: str  # Base64 encoded image

class FaceRegistrationResponse(BaseModel):
    """Model for face registration response"""
    success: bool
    message: str 