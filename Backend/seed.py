"""
Database seeding script for development and testing
"""
from pymongo import MongoClient
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from bson.objectid import ObjectId
import random

# MongoDB connection
MONGO_URI = 'mongodb://localhost:27017/therapy_assistant'
client = MongoClient(MONGO_URI)
db = client.get_database()

def clear_database():
    """Clear all collections"""
    print("Clearing existing data...")
    db.users.delete_many({})
    db.clients.delete_many({})
    db.sessions.delete_many({})
    db.notes.delete_many({})
    db.ai_insights.delete_many({})
    print("✓ Database cleared")

def seed_users():
    """Seed therapist users"""
    print("\nSeeding users...")
    users = [
        {
            'email': 'therapist@example.com',
            'username': 'therapist',
            'password_hash': generate_password_hash('password123'),
            'full_name': 'Dr. Sarah Johnson',
            'specialization': 'Clinical Psychology',
            'is_active': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        },
        {
            'email': 'demo@therapyhub.com',
            'username': 'demo',
            'password_hash': generate_password_hash('demo123'),
            'full_name': 'Dr. Michael Chen',
            'specialization': 'Cognitive Behavioral Therapy',
            'is_active': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
    ]
    
    result = db.users.insert_many(users)
    print(f"✓ Created {len(result.inserted_ids)} users")
    return result.inserted_ids

def seed_clients(therapist_id):
    """Seed client data"""
    print("\nSeeding clients...")
    clients = [
        {
            'therapist_id': therapist_id,
            'name': 'Emma Thompson',
            'email': 'emma.thompson@example.com',
            'phone': '+1-555-0101',
            'date_of_birth': '1988-05-15',
            'emergency_contact': {'name': 'John Thompson', 'phone': '+1-555-0102'},
            'notes': 'Dealing with work-related stress and anxiety',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        },
        {
            'therapist_id': therapist_id,
            'name': 'James Wilson',
            'email': 'james.wilson@example.com',
            'phone': '+1-555-0201',
            'date_of_birth': '1992-08-22',
            'emergency_contact': {'name': 'Mary Wilson', 'phone': '+1-555-0202'},
            'notes': 'Working through relationship challenges',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        },
        {
            'therapist_id': therapist_id,
            'name': 'Sofia Rodriguez',
            'email': 'sofia.rodriguez@example.com',
            'phone': '+1-555-0301',
            'date_of_birth': '1985-12-10',
            'emergency_contact': {'name': 'Carlos Rodriguez', 'phone': '+1-555-0302'},
            'notes': 'Managing depression and developing coping strategies',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        },
        {
            'therapist_id': therapist_id,
            'name': 'Michael Chen',
            'email': 'michael.chen@example.com',
            'phone': '+1-555-0401',
            'date_of_birth': '1990-03-28',
            'emergency_contact': {'name': 'Linda Chen', 'phone': '+1-555-0402'},
            'notes': 'Career transition and identity exploration',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
    ]
    
    result = db.clients.insert_many(clients)
    print(f"✓ Created {len(result.inserted_ids)} clients")
    return result.inserted_ids

def seed_sessions(therapist_id, client_ids):
    """Seed session data"""
    print("\nSeeding sessions...")
    sessions = []
    
    statuses = ['completed', 'scheduled', 'in-progress']
    session_types = ['individual', 'family', 'group']
    
    now = datetime.utcnow()
    
    for client_id in client_ids:
        # Create past sessions
        for i in range(3):
            session_date = now - timedelta(days=random.randint(7, 60))
            sessions.append({
                'therapist_id': therapist_id,
                'client_id': client_id,
                'scheduled_date': session_date,
                'start_time': session_date,
                'end_time': session_date + timedelta(hours=1),
                'duration': 60,
                'session_type': random.choice(session_types),
                'status': 'completed',
                'recording_url': None,
                'created_at': session_date,
                'updated_at': session_date
            })
        
        # Create upcoming session
        upcoming_date = now + timedelta(days=random.randint(1, 14))
        sessions.append({
            'therapist_id': therapist_id,
            'client_id': client_id,
            'scheduled_date': upcoming_date,
            'start_time': None,
            'end_time': None,
            'duration': 60,
            'session_type': 'individual',
            'status': 'scheduled',
            'recording_url': None,
            'created_at': now,
            'updated_at': now
        })
    
    result = db.sessions.insert_many(sessions)
    print(f"✓ Created {len(result.inserted_ids)} sessions")
    return result.inserted_ids

def seed_notes(therapist_id, sessions):
    """Seed note data"""
    print("\nSeeding notes...")
    notes = []
    
    sample_notes = [
        "Client showed significant progress in managing anxiety symptoms. Discussed coping strategies.",
        "Explored childhood experiences related to current behavioral patterns. Client engaged well.",
        "Introduced cognitive restructuring techniques. Client receptive to homework assignments.",
        "Discussed work-life balance challenges. Set goals for next session.",
        "Client reported improvement in sleep patterns. Continue current treatment approach."
    ]
    
    # Get completed sessions
    completed_sessions = list(db.sessions.find({'status': 'completed'}))
    
    for session in completed_sessions[:10]:  # Add notes to first 10 completed sessions
        notes.append({
            'therapist_id': therapist_id,
            'client_id': session['client_id'],
            'session_id': session['_id'],
            'content': random.choice(sample_notes),
            'note_type': 'session',
            'is_private': True,
            'created_at': session['end_time'] if session.get('end_time') else datetime.utcnow(),
            'updated_at': session['end_time'] if session.get('end_time') else datetime.utcnow()
        })
    
    if notes:
        result = db.notes.insert_many(notes)
        print(f"✓ Created {len(result.inserted_ids)} notes")
    else:
        print("✓ No notes to create")

def seed_ai_insights(sessions):
    """Seed AI insight data"""
    print("\nSeeding AI insights...")
    insights = []
    
    emotions = ['Calm', 'Anxious', 'Happy', 'Stressed', 'Neutral']
    stress_levels = ['Low', 'Moderate', 'High']
    engagement_levels = ['Low', 'Medium', 'High']
    
    # Get completed sessions
    completed_sessions = list(db.sessions.find({'status': 'completed'}))
    
    for session in completed_sessions[:5]:  # Add insights to first 5 completed sessions
        session_time = session.get('start_time', datetime.utcnow())
        
        # Create insights for each type
        insights.extend([
            {
                'session_id': session['_id'],
                'client_id': session['client_id'],
                'insight_type': 'emotion',
                'data': {'value': random.choice(emotions)},
                'confidence': random.randint(70, 95),
                'timestamp': session_time + timedelta(minutes=15),
                'created_at': session_time + timedelta(minutes=15)
            },
            {
                'session_id': session['_id'],
                'client_id': session['client_id'],
                'insight_type': 'stress',
                'data': {'value': random.choice(stress_levels)},
                'confidence': random.randint(65, 90),
                'timestamp': session_time + timedelta(minutes=30),
                'created_at': session_time + timedelta(minutes=30)
            },
            {
                'session_id': session['_id'],
                'client_id': session['client_id'],
                'insight_type': 'engagement',
                'data': {'value': random.choice(engagement_levels)},
                'confidence': random.randint(75, 98),
                'timestamp': session_time + timedelta(minutes=45),
                'created_at': session_time + timedelta(minutes=45)
            }
        ])
    
    if insights:
        result = db.ai_insights.insert_many(insights)
        print(f"✓ Created {len(result.inserted_ids)} AI insights")
    else:
        print("✓ No insights to create")

def main():
    """Main seeding function"""
    print("=" * 50)
    print("Starting database seeding...")
    print("=" * 50)
    
    try:
        # Clear existing data
        clear_database()
        
        # Seed data in order
        user_ids = seed_users()
        therapist_id = user_ids[0]  # Use first user as main therapist
        
        client_ids = seed_clients(therapist_id)
        session_ids = seed_sessions(therapist_id, client_ids)
        seed_notes(therapist_id, session_ids)
        seed_ai_insights(session_ids)
        
        print("\n" + "=" * 50)
        print("✓ Database seeding completed successfully!")
        print("=" * 50)
        print("\nTest Credentials:")
        print("Email: therapist@example.com")
        print("Password: password123")
        print("\nAlternate Account:")
        print("Email: demo@therapyhub.com")
        print("Password: demo123")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n✗ Error during seeding: {e}")
        raise

if __name__ == '__main__':
    main()
