"""Quick script to check database users"""
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

mongo_uri = os.getenv('MONGO_URI')
client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
db = client.get_database()

print("Checking users in database...")
users = list(db.users.find())
print(f"\nTotal users: {len(users)}\n")

if users:
    for u in users:
        print(f"Username: {u.get('username')}")
        print(f"Email: {u.get('email')}")
        print(f"Has password_hash: {'password_hash' in u}")
        print("-" * 40)
else:
    print("No users found! You need to register first.")
    print("\nTo create a user, send POST request to:")
    print("http://localhost:5000/api/auth/register")
    print("\nWith JSON body:")
    print('''{
  "email": "test@therapy.com",
  "username": "therapist",
  "password": "password123",
  "full_name": "Test Therapist",
  "specialization": "General Therapy"
}''')
