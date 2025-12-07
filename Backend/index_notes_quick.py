"""
Quick script to index session notes into RAG
Run this after logging in to get your therapist_id
"""
import os
import sys
from dotenv import load_dotenv
load_dotenv()

from pymongo import MongoClient
from services.rag_assistant import RAGAssistant

# Get therapist_id from command line
if len(sys.argv) < 2:
    print("Usage: python index_notes_quick.py <therapist_id>")
    print("\nTo get your therapist_id:")
    print("1. Log in to the frontend")
    print("2. Open browser console (F12)")
    print("3. Run: localStorage.getItem('user_id')")
    sys.exit(1)

therapist_id = sys.argv[1]

# Connect to MongoDB
mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(mongo_uri)
db = client['therapy_assistant']

print(f"Indexing notes for therapist: {therapist_id}")

# Initialize RAG
docs_folder = os.path.join(os.path.dirname(__file__), 'docs')
rag = RAGAssistant(docs_folder=docs_folder, db=db)

# Index notes
print("\n=== Indexing Session Notes ===")
notes_result = rag.index_notes(therapist_id)
print(f"Result: {notes_result.get('message')}")
print(f"Notes indexed: {notes_result.get('notes_indexed', 0)}")

# Index clients  
print("\n=== Indexing Clients ===")
clients_result = rag.index_clients(therapist_id)
print(f"Result: {clients_result.get('message')}")
print(f"Clients indexed: {clients_result.get('clients_indexed', 0)}")

# Get stats
stats = rag.get_stats()
print(f"\n✅ Total documents in database: {stats.get('total_documents', 0)}")
print("\nNow your RAG assistant can answer questions about:")
print("  - Session notes for specific clients")
print("  - Client information and history")
print("  - Therapy resources from PDFs")
