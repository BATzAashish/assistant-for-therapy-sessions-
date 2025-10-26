from datetime import datetime
from bson.objectid import ObjectId

class Client:
    """Client model for therapy clients"""
    
    def __init__(self, db):
        self.collection = db.clients
        self._create_indexes()
    
    def _create_indexes(self):
        """Create indexes for better query performance"""
        self.collection.create_index('therapist_id')
        self.collection.create_index([('therapist_id', 1), ('email', 1)], unique=True)
    
    def create_client(self, therapist_id, name, email, phone=None, date_of_birth=None, 
                     emergency_contact=None, notes=None):
        """Create a new client"""
        client_data = {
            'therapist_id': ObjectId(therapist_id),
            'name': name,
            'email': email.lower(),
            'phone': phone,
            'date_of_birth': date_of_birth,
            'emergency_contact': emergency_contact,
            'notes': notes,
            'status': 'active',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = self.collection.insert_one(client_data)
        return str(result.inserted_id)
    
    def find_by_id(self, client_id):
        """Find client by ID"""
        try:
            return self.collection.find_one({'_id': ObjectId(client_id)})
        except:
            return None
    
    def find_by_therapist(self, therapist_id, status=None):
        """Find all clients for a therapist"""
        query = {'therapist_id': ObjectId(therapist_id)}
        if status:
            query['status'] = status
        
        return list(self.collection.find(query).sort('name', 1))
    
    def update_client(self, client_id, update_data):
        """Update client information"""
        update_data['updated_at'] = datetime.utcnow()
        
        result = self.collection.update_one(
            {'_id': ObjectId(client_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def delete_client(self, client_id):
        """Soft delete client by setting status to inactive"""
        return self.update_client(client_id, {'status': 'inactive'})
    
    def get_client_with_sessions(self, client_id):
        """Get client with their session information"""
        pipeline = [
            {'$match': {'_id': ObjectId(client_id)}},
            {
                '$lookup': {
                    'from': 'sessions',
                    'localField': '_id',
                    'foreignField': 'client_id',
                    'as': 'sessions'
                }
            },
            {
                '$addFields': {
                    'total_sessions': {'$size': '$sessions'},
                    'last_session': {'$max': '$sessions.date'}
                }
            }
        ]
        
        result = list(self.collection.aggregate(pipeline))
        return result[0] if result else None
    
    def to_dict(self, client):
        """Convert client document to dictionary"""
        if not client:
            return None
        
        return {
            'id': str(client['_id']),
            'therapist_id': str(client['therapist_id']),
            'name': client['name'],
            'email': client['email'],
            'phone': client.get('phone'),
            'date_of_birth': client.get('date_of_birth'),
            'emergency_contact': client.get('emergency_contact'),
            'notes': client.get('notes'),
            'status': client.get('status', 'active'),
            'created_at': client['created_at'].isoformat() if client.get('created_at') else None,
            'updated_at': client['updated_at'].isoformat() if client.get('updated_at') else None
        }
