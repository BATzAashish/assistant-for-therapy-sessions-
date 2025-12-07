from pymongo import MongoClient
import os
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()

client = MongoClient(os.getenv('MONGO_URI'))
db = client.get_database()

# Get the session
session_id = '69353fa95bcc2e31aceaa1f7'
session = db['sessions'].find_one({'_id': ObjectId(session_id)})

print(f"\n📋 Session Details (ID: {session_id}):")
print(f"   Therapist ID: {session.get('therapist_id')}")
print(f"   Client ID: {session.get('client_id')}")

# Get all users
print("\n👥 All Users:")
users = list(db['users'].find())
for u in users:
    print(f"   {str(u['_id'])} - {u.get('username'):20s} - {u.get('full_name')}")

# Check if therapist matches
therapist_id = str(session.get('therapist_id'))
print(f"\n✅ Session therapist is: {therapist_id}")
therapist = db['users'].find_one({'_id': ObjectId(therapist_id)})
if therapist:
    print(f"   Name: {therapist.get('full_name')} ({therapist.get('username')})")

client.close()
