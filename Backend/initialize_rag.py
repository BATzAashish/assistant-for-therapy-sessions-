"""
Initialize RAG Assistant with notes and clients
Run this script to index all data without needing JWT authentication
"""
import os
import sys
from dotenv import load_dotenv
from pymongo import MongoClient
from services.rag_assistant import RAGAssistant
from config import Config

# Load environment variables
load_dotenv()

def main():
    print("Initializing RAG Assistant...")
    
    # Connect to MongoDB
    try:
        mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
        client = MongoClient(mongo_uri)
        db = client['therapy_assistant']
        print(f"Connected to MongoDB: therapy_assistant")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return
    
    # Initialize RAG Assistant
    docs_folder = os.path.join(os.path.dirname(__file__), 'docs')
    rag = RAGAssistant(docs_folder=docs_folder, db=db)
    
    # Get stats before
    stats_before = rag.get_stats()
    print(f"\nBefore indexing:")
    print(f"  Documents: {stats_before.get('total_documents', 0)}")
    
    # Index everything
    print("\n=== Indexing PDFs ===")
    pdf_result = rag.initialize_from_pdfs()
    print(f"PDFs: {pdf_result.get('message')}")
    print(f"Chunks: {pdf_result.get('chunks_processed', 0)}")
    
    print("\n=== Indexing Session Notes ===")
    # Get first therapist ID from database
    therapist = db.users.find_one({"role": "therapist"})
    if therapist:
        therapist_id = str(therapist['_id'])
        notes_result = rag.index_notes(therapist_id)
        print(f"Notes: {notes_result.get('message')}")
        print(f"Documents: {notes_result.get('notes_indexed', 0)}")
    else:
        print("No therapist found in database")
    
    print("\n=== Indexing Clients ===")
    if therapist:
        clients_result = rag.index_clients(therapist_id)
        print(f"Clients: {clients_result.get('message')}")
        print(f"Documents: {clients_result.get('clients_indexed', 0)}")
    else:
        print("No therapist found in database")
    
    # Get stats after
    stats_after = rag.get_stats()
    print(f"\nAfter indexing:")
    print(f"  Documents: {stats_after.get('total_documents', 0)}")
    
    print("\n✅ Initialization complete!")
    print("\nYou can now query the assistant with questions like:")
    print("  - 'What are the recent session notes for [client name]?'")
    print("  - 'Give me a summary of my last session with [client name]'")
    print("  - 'What clients am I currently working with?'")

if __name__ == "__main__":
    main()
