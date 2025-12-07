"""
Set all users as therapists (for therapy assistant app)
"""
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# Connect to MongoDB
mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/therapy_assistant')
client = MongoClient(mongo_uri)
db = client.get_database()

users_collection = db['users']

print("🔄 Updating all users to have 'therapist' role...\n")

result = users_collection.update_many(
    {},  # Match all users
    {'$set': {'role': 'therapist'}}
)

print(f"✅ Updated {result.modified_count} users")

print("\n📋 Current Users:\n")
users = list(users_collection.find())
for user in users:
    print(f"✓ {user.get('username', 'N/A'):20s} - {user.get('full_name', 'N/A'):20s} - Role: {user.get('role', 'N/A')}")

client.close()
