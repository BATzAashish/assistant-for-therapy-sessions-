"""
Script to delete duplicate sessions from the database
"""
from pymongo import MongoClient
from datetime import datetime, timedelta
from collections import defaultdict
import os
from dotenv import load_dotenv

load_dotenv()

# Connect to MongoDB
mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/therapy_assistant')
client = MongoClient(mongo_uri)
db = client.get_database()

sessions_collection = db['sessions']

print("🔍 Finding duplicate sessions...")

# Get all sessions
all_sessions = list(sessions_collection.find().sort('created_at', 1))

print(f"📊 Total sessions: {len(all_sessions)}")

# Group sessions by client, therapist, and scheduled date (within 5 minute window)
duplicates_to_delete = []

# Track unique sessions (keep oldest)
seen_sessions = {}

for session in all_sessions:
    # Create a key based on client, therapist, and time (rounded to 5 min)
    client_id = str(session.get('client_id'))
    therapist_id = str(session.get('therapist_id'))
    scheduled_date = session.get('scheduled_date')
    
    if not all([client_id, therapist_id, scheduled_date]):
        continue
    
    # Round to nearest 5 minutes for grouping
    if isinstance(scheduled_date, datetime):
        rounded_time = scheduled_date.replace(second=0, microsecond=0)
        minutes = (rounded_time.minute // 5) * 5
        rounded_time = rounded_time.replace(minute=minutes)
    else:
        continue
    
    # Create unique key
    key = f"{client_id}_{therapist_id}_{rounded_time.isoformat()}"
    
    if key in seen_sessions:
        # This is a duplicate - mark for deletion
        duplicates_to_delete.append(session['_id'])
        print(f"🔴 Duplicate found: {session.get('client_id')} on {scheduled_date} - ID: {session['_id']}")
    else:
        # First occurrence - keep it
        seen_sessions[key] = session['_id']
        print(f"✅ Keeping: {session.get('client_id')} on {scheduled_date} - ID: {session['_id']}")

print(f"\n📈 Summary:")
print(f"   Total sessions: {len(all_sessions)}")
print(f"   Unique sessions: {len(seen_sessions)}")
print(f"   Duplicates to delete: {len(duplicates_to_delete)}")

if duplicates_to_delete:
    print(f"\n⚠️  About to delete {len(duplicates_to_delete)} duplicate sessions...")
    response = input("Continue? (yes/no): ")
    
    if response.lower() == 'yes':
        result = sessions_collection.delete_many({'_id': {'$in': duplicates_to_delete}})
        print(f"✅ Deleted {result.deleted_count} duplicate sessions")
    else:
        print("❌ Deletion cancelled")
else:
    print("\n✅ No duplicates found!")

client.close()
