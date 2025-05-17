from fastapi import APIRouter, Depends, HTTPException, status
from .models import (
    FaceRecognitionRequest, 
    FaceRecognitionResponse, 
    FaceRegistrationRequest, 
    FaceRegistrationResponse
)
from .service import FaceRecognitionService
from typing import Dict, Any

# Create API router
router = APIRouter()

# Initialize face recognition service
face_service = FaceRecognitionService()

@router.post("/register", response_model=FaceRegistrationResponse)
async def register_face(request: FaceRegistrationRequest) -> Dict[str, Any]:
    """
    Register a face for a user.
    - One user can only have one face registered
    - Image should be a base64 encoded string
    """
    result = face_service.register_face(request.user_id, request.image)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    return result

@router.post("/recognize", response_model=FaceRecognitionResponse)
async def recognize_face(request: FaceRecognitionRequest) -> Dict[str, Any]:
    """
    Recognize a face from an image.
    - Returns user_id if a match is found
    - Image should be a base64 encoded string
    """
    result = face_service.recognize_face(request.image)
    
    # Still return the result even if recognition fails
    # Just with success=False and no user_id
    return result

@router.delete("/delete/{user_id}")
async def delete_face(user_id: str) -> Dict[str, Any]:
    """
    Delete a face for a user.
    """
    result = face_service.delete_face(user_id)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result["message"]
        )
    
    return result 