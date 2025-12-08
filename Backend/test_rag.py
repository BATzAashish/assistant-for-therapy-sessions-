"""
Quick test script to verify RAG Assistant is working
"""
import os
import sys
from dotenv import load_dotenv
from pymongo import MongoClient
from services.rag_assistant import RAGAssistant

# Load environment variables
load_dotenv()

def test_rag():
    print("=" * 60)
    print("Testing RAG Assistant")
    print("=" * 60)
    
    # Check environment variables
    print("\n1. Checking API Keys...")
    gemini_key = os.getenv('GEMINI_API_KEY')
    groq_key = os.getenv('GROQ_API_KEY')
    
    if gemini_key:
        print(f"   ✓ GEMINI_API_KEY: Found (length: {len(gemini_key)})")
    else:
        print("   ✗ GEMINI_API_KEY: Not found")
        
    if groq_key:
        print(f"   ✓ GROQ_API_KEY: Found (length: {len(groq_key)})")
    else:
        print("   ✗ GROQ_API_KEY: Not found")
    
    # Connect to MongoDB
    print("\n2. Connecting to MongoDB...")
    try:
        mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/therapy_assistant')
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        db = client.get_database()
        db.command('ping')
        print(f"   ✓ MongoDB connected: {mongo_uri}")
        
        # Check collections
        notes_count = db.notes.count_documents({})
        clients_count = db.clients.count_documents({})
        print(f"   ✓ Notes in database: {notes_count}")
        print(f"   ✓ Clients in database: {clients_count}")
    except Exception as e:
        print(f"   ✗ MongoDB connection failed: {e}")
        db = None
    
    # Initialize RAG Assistant
    print("\n3. Initializing RAG Assistant...")
    try:
        docs_folder = os.path.join(os.path.dirname(__file__), 'docs')
        rag = RAGAssistant(docs_folder=docs_folder, db=db)
        print(f"   ✓ RAG Assistant initialized")
        print(f"   ✓ Docs folder: {docs_folder}")
    except Exception as e:
        print(f"   ✗ Failed to initialize RAG: {e}")
        return
    
    # Check vector store
    print("\n4. Checking Vector Store...")
    try:
        collection_stats = rag.vector_store.get_collection_stats()
        print(f"   ✓ Vector store loaded")
        print(f"   ✓ Total documents: {collection_stats.get('total_documents', 0)}")
        
        # Show breakdown by type
        pdfs = collection_stats.get('pdf_documents', 0)
        notes = collection_stats.get('note_documents', 0)
        clients = collection_stats.get('client_documents', 0)
        print(f"     - PDF documents: {pdfs}")
        print(f"     - Note documents: {notes}")
        print(f"     - Client documents: {clients}")
    except Exception as e:
        print(f"   ✗ Failed to check vector store: {e}")
    
    # Test a query
    print("\n5. Testing RAG Query...")
    try:
        test_query = "What is cognitive behavioral therapy?"
        print(f"   Query: '{test_query}'")
        result = rag.query_assistant(test_query, n_results=3)
        
        if result.get('success'):
            print(f"   ✓ Query successful!")
            print(f"   ✓ Retrieved {len(result.get('retrieved_chunks', []))} relevant chunks")
            response = result.get('response', '')
            print(f"\n   Response preview (first 200 chars):")
            print(f"   {response[:200]}...")
        else:
            print(f"   ✗ Query failed: {result.get('error', 'Unknown error')}")
    except Exception as e:
        print(f"   ✗ Query test failed: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("RAG Test Complete!")
    print("=" * 60)

if __name__ == "__main__":
    test_rag()
