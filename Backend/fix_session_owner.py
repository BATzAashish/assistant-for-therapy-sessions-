"""
Fix session ownership - Make current user the therapist
"""
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()

client = MongoClient(os.getenv('MONGO_URI'))
db = client.get_database()

# The session you're currently in
session_id = '69353fa95bcc2e31aceaa1f7'

print("\n📋 Current Session Info:")
session = db['sessions'].find_one({'_id': ObjectId(session_id)})
print(f"   Session ID: {session_id}")
print(f"   Current Therapist ID: {session.get('therapist_id')}")
print(f"   Client ID: {session.get('client_id')}")

print("\n👥 All Users:")
users = list(db['users'].find())
for idx, u in enumerate(users, 1):
    print(f"{idx}. {str(u['_id'])} - {u.get('username'):20s} - {u.get('full_name')}")

print("\n" + "="*60)
choice = input("Enter the number of the user who should be the therapist: ")

try:
    idx = int(choice) - 1
    if 0 <= idx < len(users):
        selected_user = users[idx]
        new_therapist_id = selected_user['_id']
        
        # Update the session
        result = db['sessions'].update_one(
            {'_id': ObjectId(session_id)},
            {'$set': {'therapist_id': new_therapist_id}}
        )
        
        if result.modified_count > 0:
            print(f"\n✅ Updated session therapist to: {selected_user.get('full_name')} ({selected_user.get('username')})")
            print(f"   New Therapist ID: {new_therapist_id}")
            print("\n⚠️  IMPORTANT: Refresh your browser to apply changes!")
        else:
            print("\n⚠️  No changes made (already set to this user)")
    else:
        print("❌ Invalid selection")
except ValueError:
    print("❌ Invalid input")

client.close()
