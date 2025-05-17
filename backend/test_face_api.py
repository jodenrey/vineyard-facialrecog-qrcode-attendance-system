import requests
import json
import base64

# Backend API URL
BACKEND_URL = "http://localhost:8000"

def test_face_recognize():
    """Test the face recognition API endpoint"""
    try:
        # Create a dummy image (a small white square)
        dummy_image = base64.b64encode(bytes([0xFF] * 100)).decode('utf-8')
        
        # Send a request to the recognize endpoint
        response = requests.post(
            f"{BACKEND_URL}/api/face/recognize",
            json={"image": dummy_image}
        )
        
        print(f"Status code: {response.status_code}")
        print(f"Response JSON: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing face recognize API: {e}")
        return False

if __name__ == "__main__":
    print("Testing face recognition API...")
    success = test_face_recognize()
    print(f"Test {'succeeded' if success else 'failed'}") 