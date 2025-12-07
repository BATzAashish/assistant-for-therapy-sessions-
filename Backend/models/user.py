from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId

class User:
    """User model for therapists"""
    
    def __init__(self, db):
        self.collection = db.users
        self._create_indexes()
    
    def _create_indexes(self):
        """Create indexes for better query performance"""
        self.collection.create_index('email', unique=True)
        self.collection.create_index('username', unique=True)
    
    def create_user(self, email, username, password, full_name, specialization=None):
        """Create a new user"""
        user_data = {
            'email': email.lower(),
            'username': username.lower(),
            'password_hash': generate_password_hash(password),
            'full_name': full_name,
            'specialization': specialization,
            'role': 'therapist',  # All users are therapists
            'is_active': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = self.collection.insert_one(user_data)
        return str(result.inserted_id)
    
    def find_by_email(self, email):
        """Find user by email"""
        return self.collection.find_one({'email': email.lower()})
    
    def find_by_username(self, username):
        """Find user by username"""
        return self.collection.find_one({'username': username.lower()})
    
    def find_by_id(self, user_id):
        """Find user by ID"""
        try:
            return self.collection.find_one({'_id': ObjectId(user_id)})
        except:
            return None
    
    def verify_password(self, user, password):
        """Verify user password"""
        if not user:
            return False
        return check_password_hash(user['password_hash'], password)
    
    def update_user(self, user_id, update_data):
        """Update user information"""
        update_data['updated_at'] = datetime.utcnow()
        
        result = self.collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def to_dict(self, user):
        """Convert user document to dictionary (excluding sensitive data)"""
        if not user:
            return None
        
        return {
            'id': str(user['_id']),
            'email': user['email'],
            'username': user['username'],
            'full_name': user['full_name'],
            'specialization': user.get('specialization'),
            'is_active': user.get('is_active', True),
            'created_at': user['created_at'].isoformat() if user.get('created_at') else None
        }
