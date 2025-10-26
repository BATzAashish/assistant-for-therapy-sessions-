"""
Test MongoDB Connection Script
"""
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure
import sys

def test_mongodb_connection(uri):
    """Test MongoDB connection with the provided URI"""
    print("=" * 60)
    print("MongoDB Connection Test")
    print("=" * 60)
    
    try:
        # Create a client instance
        print("\n1. Creating MongoDB client...")
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        
        # Test the connection
        print("2. Testing connection...")
        client.admin.command('ping')
        
        print("✓ Connection successful!")
        
        # Get server info
        print("\n3. Retrieving server information...")
        server_info = client.server_info()
        print(f"   - MongoDB Version: {server_info.get('version', 'Unknown')}")
        
        # List databases
        print("\n4. Listing databases...")
        databases = client.list_database_names()
        print(f"   - Available databases: {databases}")
        
        # Test database access
        print("\n5. Testing database operations...")
        db = client['therapy_assistant']
        collections = db.list_collection_names()
        print(f"   - Collections in 'therapy_assistant': {collections if collections else 'None (new database)'}")
        
        # Test write operation
        print("\n6. Testing write operation...")
        test_collection = db['connection_test']
        test_doc = {'test': 'connection', 'status': 'success'}
        result = test_collection.insert_one(test_doc)
        print(f"   - Write successful! Document ID: {result.inserted_id}")
        
        # Clean up test document
        test_collection.delete_one({'_id': result.inserted_id})
        print("   - Test document cleaned up")
        
        print("\n" + "=" * 60)
        print("✓ ALL TESTS PASSED - MongoDB connection is working!")
        print("=" * 60)
        
        client.close()
        return True
        
    except ConnectionFailure as e:
        print(f"\n✗ Connection failed: {e}")
        print("\nPossible issues:")
        print("  - Check if the password is correct")
        print("  - Verify network connectivity")
        print("  - Check if your IP is whitelisted in MongoDB Atlas")
        return False
        
    except OperationFailure as e:
        print(f"\n✗ Authentication failed: {e}")
        print("\nPossible issues:")
        print("  - Incorrect username or password")
        print("  - User doesn't have sufficient permissions")
        return False
        
    except Exception as e:
        print(f"\n✗ Unexpected error: {type(e).__name__}: {e}")
        return False

if __name__ == "__main__":
    # MongoDB connection string
    MONGO_URI = "mongodb+srv://aashishbhandari272:61oX7UFUTCoM5s9Y@cluster0.iirezry.mongodb.net/"
    
    print("\nTesting connection string:")
    print(f"URI: {MONGO_URI.replace('61oX7UFUTCoM5s9Y', '***PASSWORD***')}\n")
    
    success = test_mongodb_connection(MONGO_URI)
    sys.exit(0 if success else 1)
