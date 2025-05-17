import os
import cv2
import base64
import numpy as np
import insightface
from insightface.app import FaceAnalysis
from insightface.data import get_image as ins_get_image
from typing import List, Dict, Tuple, Optional, Any
import time
from .database import Database

# Initialize face recognition
app = FaceAnalysis(name='buffalo_l')
app.prepare(ctx_id=0, det_size=(640, 640))

class FaceRecognitionService:
    """Service for face recognition using InsightFace"""
    
    def __init__(self):
        self.database = Database()
        self.recognition_threshold = 0.5  # Similarity threshold for recognition
    
    def _decode_image(self, base64_image: str) -> np.ndarray:
        """Decode base64 image to OpenCV format"""
        try:
            # Remove 'data:image/jpeg;base64,' prefix if present
            if ',' in base64_image:
                base64_image = base64_image.split(',')[1]
            
            # Decode base64 string to image
            img_data = base64.b64decode(base64_image)
            np_arr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            print(f"Error decoding image: {e}")
            return None
    
    def _get_face_embedding(self, image: np.ndarray) -> Optional[np.ndarray]:
        """Extract face embedding from an image"""
        if image is None:
            return None
        
        try:
            # Detect faces
            faces = app.get(image)
            
            if not faces or len(faces) == 0:
                return None
            
            # Only use the first face (largest or most prominent)
            if len(faces) > 1:
                # Sort by face size (area of bounding box)
                faces = sorted(faces, key=lambda x: (x.bbox[2] - x.bbox[0]) * (x.bbox[3] - x.bbox[1]), reverse=True)
            
            # Get embedding from the first face
            embedding = faces[0].embedding
            return embedding
        except Exception as e:
            print(f"Error extracting face embedding: {e}")
            return None
    
    def register_face(self, user_id: str, base64_image: str) -> Dict[str, Any]:
        """Register a face for a user"""
        # Decode image
        image = self._decode_image(base64_image)
        if image is None:
            return {"success": False, "message": "Invalid image data"}
        
        # Get face embedding
        embedding = self._get_face_embedding(image)
        if embedding is None:
            return {"success": False, "message": "No face detected in the image"}
        
        # Check if this is a duplicate of another user (to prevent spoofing)
        embeddings = self.database.get_all_embeddings()
        for stored_embedding in embeddings:
            if stored_embedding["user_id"] != user_id:
                similarity = self._calculate_similarity(embedding, np.array(stored_embedding["embedding"]))
                if similarity > self.recognition_threshold:
                    return {
                        "success": False, 
                        "message": f"This face is already registered to another user"
                    }
        
        # Save embedding to database
        if self.database.save_embedding(user_id, embedding.tolist()):
            return {"success": True, "message": "Face registered successfully"}
        else:
            return {"success": False, "message": "Failed to save face data"}
    
    def recognize_face(self, base64_image: str) -> Dict[str, Any]:
        """Recognize a face from an image"""
        # Decode image
        image = self._decode_image(base64_image)
        if image is None:
            return {"success": False, "message": "Invalid image data"}
        
        # Get face embedding
        embedding = self._get_face_embedding(image)
        if embedding is None:
            return {"success": False, "message": "No face detected in the image"}
        
        # Get all stored embeddings
        stored_embeddings = self.database.get_all_embeddings()
        if not stored_embeddings:
            return {"success": False, "message": "No registered faces found"}
        
        # Find the best match
        best_match = None
        best_similarity = -1
        
        for stored_embedding in stored_embeddings:
            similarity = self._calculate_similarity(embedding, np.array(stored_embedding["embedding"]))
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = stored_embedding["user_id"]
        
        # Check if the similarity is above the threshold
        if best_similarity > self.recognition_threshold:
            return {
                "success": True,
                "user_id": best_match,
                "confidence": float(best_similarity),
                "message": "Face recognized successfully"
            }
        else:
            return {
                "success": False,
                "confidence": float(best_similarity) if best_similarity > 0 else 0,
                "message": "Face not recognized"
            }
    
    def _calculate_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """Calculate cosine similarity between two embeddings"""
        embedding1 = embedding1.flatten()
        embedding2 = embedding2.flatten()
        
        # Normalize the vectors
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)
        
        if norm1 == 0 or norm2 == 0:
            return 0
        
        # Calculate cosine similarity
        return np.dot(embedding1, embedding2) / (norm1 * norm2)
    
    def delete_face(self, user_id: str) -> Dict[str, Any]:
        """Delete a face from the database"""
        if self.database.delete_embedding(user_id):
            return {"success": True, "message": "Face deleted successfully"}
        else:
            return {"success": False, "message": "Failed to delete face or user not found"} 