"""
Quick API Test - Test login endpoint
"""
import requests
import json

API_URL = "http://localhost:5000/api"

def test_login():
    """Test the login endpoint"""
    print("=" * 60)
    print("Testing Login API")
    print("=" * 60)
    
    url = f"{API_URL}/auth/login"
    payload = {
        "email": "therapist@example.com",
        "password": "password123"
    }
    
    print(f"\nPOST {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"\nResponse Body:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 200:
            print("\n✅ Login successful!")
            return True
        else:
            print("\n❌ Login failed!")
            return False
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_login()
