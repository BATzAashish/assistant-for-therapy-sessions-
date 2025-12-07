"""
Check and update user role in database
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

print("📋 Current Users:\n")

users = list(users_collection.find())
for idx, user in enumerate(users, 1):
    print(f"{idx}. Username: {user.get('username', 'N/A')}")
    print(f"   Full Name: {user.get('full_name', 'N/A')}")
    print(f"   Role: {user.get('role', 'N/A')}")
    print(f"   ID: {user['_id']}")
    print()

if users:
    print("\n" + "="*50)
    print("To change a user's role to 'therapist':")
    choice = input("Enter user number (or 'q' to quit): ")
    
    if choice.lower() != 'q':
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(users):
                selected_user = users[idx]
                
                new_role = input("Enter new role (therapist/client): ").strip().lower()
                if new_role in ['therapist', 'client']:
                    users_collection.update_one(
                        {'_id': selected_user['_id']},
                        {'$set': {'role': new_role}}
                    )
                    print(f"\n✅ Updated {selected_user.get('username')} to role: {new_role}")
                else:
                    print("❌ Invalid role. Must be 'therapist' or 'client'")
            else:
                print("❌ Invalid selection")
        except ValueError:
            print("❌ Invalid input")

client.close()
