from datetime import datetime
from bson.objectid import ObjectId

class Session:
    """Session model for therapy sessions"""
    
    def __init__(self, db):
        self.collection = db.sessions
        self._create_indexes()
    
    def _create_indexes(self):
        """Create indexes for better query performance"""
        self.collection.create_index('therapist_id')
        self.collection.create_index('client_id')
        self.collection.create_index([('client_id', 1), ('date', -1)])
    
    def create_session(self, therapist_id, client_id, scheduled_date, duration=60, 
                      session_type='individual', status='scheduled'):
        """Create a new session"""
        session_data = {
            'therapist_id': ObjectId(therapist_id),
            'client_id': ObjectId(client_id),
            'scheduled_date': scheduled_date,
            'start_time': None,
            'end_time': None,
            'duration': duration,  # in minutes
            'session_type': session_type,  # individual, group, family, etc.
            'status': status,  # scheduled, in-progress, completed, cancelled
            'recording_url': None,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = self.collection.insert_one(session_data)
        return str(result.inserted_id)
    
    def find_by_id(self, session_id):
        """Find session by ID"""
        try:
            return self.collection.find_one({'_id': ObjectId(session_id)})
        except:
            return None
    
    def find_by_client(self, client_id, limit=None):
        """Find sessions for a client"""
        query = {'client_id': ObjectId(client_id)}
        cursor = self.collection.find(query).sort('scheduled_date', -1)
        
        if limit:
            cursor = cursor.limit(limit)
        
        return list(cursor)
    
    def find_by_therapist(self, therapist_id, status=None, start_date=None, end_date=None):
        """Find sessions for a therapist"""
        query = {'therapist_id': ObjectId(therapist_id)}
        
        if status:
            query['status'] = status
        
        if start_date or end_date:
            query['scheduled_date'] = {}
            if start_date:
                query['scheduled_date']['$gte'] = start_date
            if end_date:
                query['scheduled_date']['$lte'] = end_date
        
        return list(self.collection.find(query).sort('scheduled_date', -1))
    
    def start_session(self, session_id):
        """Start a session"""
        update_data = {
            'status': 'in-progress',
            'start_time': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = self.collection.update_one(
            {'_id': ObjectId(session_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def end_session(self, session_id):
        """End a session"""
        update_data = {
            'status': 'completed',
            'end_time': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = self.collection.update_one(
            {'_id': ObjectId(session_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def update_session(self, session_id, update_data):
        """Update session information"""
        update_data['updated_at'] = datetime.utcnow()
        
        result = self.collection.update_one(
            {'_id': ObjectId(session_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def cancel_session(self, session_id, reason=None):
        """Cancel a session"""
        update_data = {
            'status': 'cancelled',
            'cancellation_reason': reason,
            'updated_at': datetime.utcnow()
        }
        
        return self.update_session(session_id, update_data)
    
    def to_dict(self, session):
        """Convert session document to dictionary"""
        if not session:
            return None
        
        return {
            'id': str(session['_id']),
            'therapist_id': str(session['therapist_id']),
            'client_id': str(session['client_id']),
            'scheduled_date': session['scheduled_date'].isoformat() if session.get('scheduled_date') else None,
            'start_time': session['start_time'].isoformat() if session.get('start_time') else None,
            'end_time': session['end_time'].isoformat() if session.get('end_time') else None,
            'duration': session.get('duration'),
            'session_type': session.get('session_type'),
            'status': session.get('status'),
            'recording_url': session.get('recording_url'),
            'created_at': session['created_at'].isoformat() if session.get('created_at') else None,
            'updated_at': session['updated_at'].isoformat() if session.get('updated_at') else None
        }
