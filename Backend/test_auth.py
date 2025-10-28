"""
Quick test to check database and create a test user
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from pymongo import MongoClient
from models.user import User
from dotenv import load_dotenv

load_dotenv()

def test_database():
    print("=" * 60)
    print("DATABASE & AUTH TEST")
    print("=" * 60)
    
    # Connect to MongoDB
    mongo_uri = os.environ.get('MONGO_URI')
    print(f"\n1. Connecting to MongoDB...")
    
    try:
        client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000
        )
        db = client.get_database()
        db.command('ping')
        print("   ✓ MongoDB connected successfully!")
    except Exception as e:
        print(f"   ✗ MongoDB connection failed: {e}")
        return
    
    # Check users collection
    print(f"\n2. Checking users collection...")
    user_model = User(db)
    
    all_users = list(db.users.find())
    print(f"   Found {len(all_users)} users in database")
    
    if all_users:
        print(f"\n   Existing users:")
        for user in all_users:
            print(f"   - Username: {user.get('username')}, Email: {user.get('email')}")
    
    # Create test user if none exist
    if len(all_users) == 0:
        print(f"\n3. Creating test user...")
        try:
            user_id = user_model.create_user(
                email='test@therapy.com',
                username='therapist',
                password='password123',
                full_name='Test Therapist',
                specialization='General Therapy'
            )
            print(f"   ✓ Test user created!")
            print(f"   Username: therapist")
            print(f"   Password: password123")
            print(f"   Email: test@therapy.com")
        except Exception as e:
            print(f"   ✗ Failed to create user: {e}")
    else:
        print(f"\n3. Test user already exists - skipping creation")
    
    # Test login
    print(f"\n4. Testing login with first user...")
    first_user = all_users[0] if all_users else db.users.find_one()
    
    if first_user:
        username = first_user.get('username')
        print(f"   Testing with username: {username}")
        print(f"   Try logging in with password: password123")
        
        # Verify password hash exists
        if 'password_hash' in first_user:
            print(f"   ✓ Password hash exists")
        else:
            print(f"   ✗ No password hash found!")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
    print("\nTo login to your app:")
    if all_users:
        user = all_users[0]
        print(f"Username: {user.get('username')}")
        print(f"Email: {user.get('email')}")
        print(f"Password: (try 'password123' or check your records)")
    else:
        print(f"Username: therapist")
        print(f"Password: password123")
    print("=" * 60)

if __name__ == '__main__':
    test_database()
