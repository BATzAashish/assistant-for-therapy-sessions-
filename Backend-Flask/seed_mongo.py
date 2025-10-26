"""
Seed script to populate the MongoDB database with sample data for development
"""
from app import app, mongo
from models.user import User
from models.client import Client
from models.session import Session
from models.note import Note
from models.ai_insight import AIInsight
from datetime import datetime, timedelta
import random

def seed_database():
    with app.app_context():
        # Clear existing data
        print("Clearing existing data...")
        mongo.db.ai_insights.delete_many({})
        mongo.db.notes.delete_many({})
        mongo.db.sessions.delete_many({})
        mongo.db.clients.delete_many({})
        mongo.db.users.delete_many({})
        
        # Create therapist user
        print("Creating therapist user...")
        therapist = User.create(
            email='therapist@example.com',
            password='password123',
            full_name='Dr. Sarah Johnson',
            role='therapist'
        )
        therapist_id = str(therapist['_id'])
        print(f"Created therapist: {therapist['email']}")
        
        # Create clients
        print("\nCreating clients...")
        clients_data = [
            {
                'name': 'Emma Thompson',
                'email': 'emma.t@email.com',
                'phone': '+1-555-0101',
                'notes': 'Works in tech industry. Dealing with work-life balance issues.'
            },
            {
                'name': 'James Wilson',
                'email': 'james.w@email.com',
                'phone': '+1-555-0102',
                'notes': 'Recent career change. Anxiety management.'
            },
            {
                'name': 'Sofia Rodriguez',
                'email': 'sofia.r@email.com',
                'phone': '+1-555-0103',
                'notes': 'College student. Stress and academic pressure.'
            },
            {
                'name': 'Michael Chen',
                'email': 'michael.c@email.com',
                'phone': '+1-555-0104',
                'notes': 'Family relationships. Communication issues.'
            }
        ]
        
        clients = []
        for client_data in clients_data:
            client = Client.create(
                name=client_data['name'],
                therapist_id=therapist_id,
                email=client_data['email'],
                phone=client_data['phone'],
                notes=client_data['notes']
            )
            clients.append(client)
        
        print(f"Created {len(clients)} clients")
        
        # Create sessions
        print("\nCreating sessions...")
        session_types = ['initial', 'regular', 'follow-up']
        
        sessions = []
        for i, client in enumerate(clients):
            client_id = str(client['_id'])
            
            # Create past sessions
            for j in range(2):
                session_date = datetime.utcnow() - timedelta(days=random.randint(7, 30))
                session = Session.create(
                    client_id=client_id,
                    therapist_id=therapist_id,
                    session_date=session_date,
                    duration=random.choice([45, 50, 60]),
                    status='completed',
                    session_type=random.choice(session_types)
                )
                sessions.append(session)
            
            # Create upcoming session
            if i < 2:  # Only first 2 clients have upcoming sessions
                future_date = datetime.utcnow() + timedelta(days=random.randint(1, 7))
                session = Session.create(
                    client_id=client_id,
                    therapist_id=therapist_id,
                    session_date=future_date,
                    status='scheduled',
                    session_type='regular'
                )
                sessions.append(session)
        
        print(f"Created {len(sessions)} sessions")
        
        # Create notes for completed sessions
        print("\nCreating notes...")
        note_templates = [
            "Client presented with increased awareness of stressors. Discussed coping mechanisms.",
            "Good progress on anxiety management techniques. Client practicing mindfulness regularly.",
            "Explored past experiences related to current challenges. Client showing insight.",
            "Reviewed homework from last session. Client making consistent efforts.",
            "Discussed relationship dynamics. Client identifying patterns and triggers."
        ]
        
        notes_count = 0
        for session in sessions:
            if session['status'] == 'completed':
                note_content = random.choice(note_templates)
                note = Note.create(
                    session_id=str(session['_id']),
                    content=note_content,
                    note_type=random.choice(['general', 'observation', 'treatment_plan'])
                )
                notes_count += 1
        
        print(f"Created {notes_count} notes")
        
        # Create AI insights for some sessions
        print("\nCreating AI insights...")
        emotions = ['Calm', 'Anxious', 'Happy', 'Sad', 'Neutral']
        stress_levels = ['Low', 'Medium', 'High']
        engagement_levels = ['High', 'Medium', 'Low']
        
        insights_count = 0
        for session in sessions[:5]:  # Add insights to first 5 sessions
            if session['status'] == 'completed':
                session_id = str(session['_id'])
                
                # Emotion insight
                AIInsight.create(
                    session_id=session_id,
                    insight_type='emotion',
                    label='Emotional State',
                    value=random.choice(emotions),
                    confidence=random.uniform(0.7, 0.95)
                )
                
                # Stress insight
                AIInsight.create(
                    session_id=session_id,
                    insight_type='stress',
                    label='Stress Level',
                    value=random.choice(stress_levels),
                    confidence=random.uniform(0.65, 0.90)
                )
                
                # Engagement insight
                AIInsight.create(
                    session_id=session_id,
                    insight_type='engagement',
                    label='Engagement',
                    value=random.choice(engagement_levels),
                    confidence=random.uniform(0.75, 0.95)
                )
                
                insights_count += 3
        
        print(f"Created {insights_count} AI insights")
        
        print("\n✅ Database seeded successfully!")
        print(f"\nLogin credentials:")
        print(f"Email: therapist@example.com")
        print(f"Password: password123")
        print(f"\nMake sure MongoDB is running on: mongodb://localhost:27017")

if __name__ == '__main__':
    seed_database()
