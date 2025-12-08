"""
Index notes and clients into RAG
"""
from dotenv import load_dotenv
import os
from pymongo import MongoClient
from services.rag_assistant import RAGAssistant

load_dotenv()

# Connect to MongoDB
mongo_uri = os.getenv('MONGO_URI')
client = MongoClient(mongo_uri)
db = client.get_database()

# Initialize RAG
docs_folder = os.path.join(os.path.dirname(__file__), 'docs')
rag = RAGAssistant(docs_folder=docs_folder, db=db)

# Get first therapist
therapist = db.users.find_one({"role": "therapist"})
if therapist:
    therapist_id = str(therapist['_id'])
    print(f"Using therapist: {therapist.get('fullName', 'Unknown')} (ID: {therapist_id})")
    
    print("\n=== Indexing Session Notes ===")
    notes_result = rag.index_notes(therapist_id)
    print(f"Status: {notes_result.get('message')}")
    print(f"Notes indexed: {notes_result.get('notes_indexed', 0)}")
    
    print("\n=== Indexing Clients ===")
    clients_result = rag.index_clients(therapist_id)
    print(f"Status: {clients_result.get('message')}")
    print(f"Clients indexed: {clients_result.get('clients_indexed', 0)}")
    
    print("\n=== Final Stats ===")
    stats = rag.get_stats()
    print(f"Total documents: {stats.get('total_documents', 0)}")
    print(f"  - PDF documents: {stats.get('pdf_documents', 0)}")
    print(f"  - Note documents: {stats.get('note_documents', 0)}")
    print(f"  - Client documents: {stats.get('client_documents', 0)}")
else:
    print("No therapist found in database")
