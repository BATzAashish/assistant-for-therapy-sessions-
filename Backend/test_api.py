"""
Simple test script to verify API endpoints
"""
import requests
import json

BASE_URL = 'http://localhost:5000'

def print_response(response, title):
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")

def test_api():
    print("\n🧪 Testing Therapy Assistant API")
    print(f"Base URL: {BASE_URL}")
    
    # Test health endpoint
    response = requests.get(f"{BASE_URL}/health")
    print_response(response, "1. Health Check")
    
    # Test login
    login_data = {
        'email': 'therapist@example.com',
        'password': 'password123'
    }
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    print_response(response, "2. Login")
    
    if response.status_code != 200:
        print("\n❌ Login failed. Make sure to run seed.py first!")
        return
    
    token = response.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test get current user
    response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    print_response(response, "3. Get Current User")
    
    # Test get clients
    response = requests.get(f"{BASE_URL}/api/clients", headers=headers)
    print_response(response, "4. Get All Clients")
    
    if response.status_code == 200 and response.json():
        client_id = response.json()[0]['id']
        
        # Test get specific client
        response = requests.get(f"{BASE_URL}/api/clients/{client_id}", headers=headers)
        print_response(response, f"5. Get Client {client_id}")
        
        # Test get client sessions
        response = requests.get(f"{BASE_URL}/api/clients/{client_id}/sessions", headers=headers)
        print_response(response, f"6. Get Client {client_id} Sessions")
    
    # Test get all sessions
    response = requests.get(f"{BASE_URL}/api/sessions", headers=headers)
    print_response(response, "7. Get All Sessions")
    
    if response.status_code == 200 and response.json():
        session_id = response.json()[0]['id']
        
        # Test get specific session
        response = requests.get(
            f"{BASE_URL}/api/sessions/{session_id}?include_notes=true&include_insights=true",
            headers=headers
        )
        print_response(response, f"8. Get Session {session_id} (with notes and insights)")
    
    # Test get notes
    response = requests.get(f"{BASE_URL}/api/notes", headers=headers)
    print_response(response, "9. Get All Notes")
    
    # Test AI sentiment analysis
    sentiment_data = {
        'text': 'I have been feeling much better lately. The techniques we discussed are really helping me manage my stress.'
    }
    response = requests.post(f"{BASE_URL}/api/ai/analyze/sentiment", json=sentiment_data, headers=headers)
    print_response(response, "10. Sentiment Analysis")
    
    print("\n" + "="*60)
    print("✅ API Testing Complete!")
    print("="*60)

if __name__ == '__main__':
    try:
        test_api()
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Cannot connect to the server.")
        print("Make sure the Flask server is running:")
        print("  python app.py")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
