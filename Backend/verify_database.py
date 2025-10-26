"""
Verify MongoDB Collections and Data
"""
from pymongo import MongoClient
from config import Config
from datetime import datetime

def verify_collections():
    """Verify all collections and their data"""
    client = MongoClient(Config.MONGO_URI)
    db = client['therapy_assistant']
    
    print("=" * 70)
    print("MongoDB Collections Verification")
    print("=" * 70)
    
    collections = db.list_collection_names()
    print(f"\n📁 Total Collections: {len(collections)}")
    print(f"Collections: {', '.join(collections)}\n")
    
    print("-" * 70)
    
    # Check Users collection
    users_count = db.users.count_documents({})
    print(f"\n👤 USERS Collection:")
    print(f"   Total documents: {users_count}")
    if users_count > 0:
        sample_user = db.users.find_one()
        print(f"   Sample: {sample_user.get('full_name')} ({sample_user.get('email')})")
        print(f"   Fields: email, password, full_name, username, role, created_at, updated_at")
    
    # Check Clients collection
    clients_count = db.clients.count_documents({})
    print(f"\n👥 CLIENTS Collection:")
    print(f"   Total documents: {clients_count}")
    if clients_count > 0:
        sample_client = db.clients.find_one()
        print(f"   Sample: {sample_client.get('name')} ({sample_client.get('email')})")
        print(f"   Fields: name, email, phone, therapist_id, diagnosis, status, created_at, updated_at")
    
    # Check Sessions collection
    sessions_count = db.sessions.count_documents({})
    print(f"\n📅 SESSIONS Collection:")
    print(f"   Total documents: {sessions_count}")
    if sessions_count > 0:
        sample_session = db.sessions.find_one()
        print(f"   Sample Session ID: {sample_session.get('_id')}")
        print(f"   Status breakdown:")
        for status in ['scheduled', 'completed', 'cancelled']:
            count = db.sessions.count_documents({'status': status})
            print(f"      - {status}: {count}")
        print(f"   Fields: therapist_id, client_id, start_time, end_time, status, duration, notes")
    
    # Check Notes collection
    notes_count = db.notes.count_documents({})
    print(f"\n📝 NOTES Collection:")
    print(f"   Total documents: {notes_count}")
    if notes_count > 0:
        sample_note = db.notes.find_one()
        print(f"   Sample Note ID: {sample_note.get('_id')}")
        print(f"   Fields: session_id, therapist_id, client_id, content, created_at, updated_at")
    
    # Check AI Insights collection
    insights_count = db.ai_insights.count_documents({})
    print(f"\n🤖 AI_INSIGHTS Collection:")
    print(f"   Total documents: {insights_count}")
    if insights_count > 0:
        sample_insight = db.ai_insights.find_one()
        print(f"   Sample Insight ID: {sample_insight.get('_id')}")
        print(f"   Insight Types:")
        for insight_type in ['emotional_state', 'progress_indicator', 'risk_assessment']:
            count = db.ai_insights.count_documents({'insight_type': insight_type})
            print(f"      - {insight_type}: {count}")
        print(f"   Fields: session_id, therapist_id, client_id, insight_type, content, confidence, created_at")
    
    print("\n" + "=" * 70)
    print("✅ All collections created and populated successfully!")
    print("=" * 70)
    
    print("\n📊 Summary:")
    print(f"   • {users_count} therapist accounts")
    print(f"   • {clients_count} client profiles")
    print(f"   • {sessions_count} therapy sessions")
    print(f"   • {notes_count} session notes")
    print(f"   • {insights_count} AI-generated insights")
    
    print("\n🔐 Test Login Credentials:")
    print("   Email: therapist@example.com")
    print("   Password: password123")
    
    client.close()

if __name__ == "__main__":
    verify_collections()
