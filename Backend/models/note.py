from datetime import datetime
from bson.objectid import ObjectId

class Note:
    """Note model for session notes"""
    
    def __init__(self, db):
        self.collection = db.notes
        self._create_indexes()
    
    def _create_indexes(self):
        """Create indexes for better query performance"""
        self.collection.create_index('session_id')
        self.collection.create_index('client_id')
        self.collection.create_index('therapist_id')
    
    def create_note(self, therapist_id, client_id, session_id, content, note_type='session'):
        """Create a new note"""
        note_data = {
            'therapist_id': ObjectId(therapist_id),
            'client_id': ObjectId(client_id),
            'session_id': ObjectId(session_id) if session_id else None,
            'content': content,
            'note_type': note_type,  # session, progress, general
            'is_private': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = self.collection.insert_one(note_data)
        return str(result.inserted_id)
    
    def find_by_id(self, note_id):
        """Find note by ID"""
        try:
            return self.collection.find_one({'_id': ObjectId(note_id)})
        except:
            return None
    
    def find_by_session(self, session_id):
        """Find notes for a session"""
        return list(self.collection.find({'session_id': ObjectId(session_id)}).sort('created_at', -1))
    
    def find_by_client(self, client_id, limit=None):
        """Find notes for a client"""
        cursor = self.collection.find({'client_id': ObjectId(client_id)}).sort('created_at', -1)
        
        if limit:
            cursor = cursor.limit(limit)
        
        return list(cursor)
    
    def find_by_therapist(self, therapist_id, limit=None):
        """Find notes for a therapist"""
        cursor = self.collection.find({'therapist_id': ObjectId(therapist_id)}).sort('created_at', -1)
        
        if limit:
            cursor = cursor.limit(limit)
        
        return list(cursor)
    
    def update_note(self, note_id, content):
        """Update note content"""
        update_data = {
            'content': content,
            'updated_at': datetime.utcnow()
        }
        
        result = self.collection.update_one(
            {'_id': ObjectId(note_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def delete_note(self, note_id):
        """Delete a note"""
        result = self.collection.delete_one({'_id': ObjectId(note_id)})
        return result.deleted_count > 0
    
    def to_dict(self, note):
        """Convert note document to dictionary"""
        if not note:
            return None
        
        return {
            'id': str(note['_id']),
            'therapist_id': str(note['therapist_id']),
            'client_id': str(note['client_id']),
            'session_id': str(note['session_id']) if note.get('session_id') else None,
            'content': note['content'],
            'note_type': note.get('note_type'),
            'is_private': note.get('is_private', True),
            'created_at': note['created_at'].isoformat() if note.get('created_at') else None,
            'updated_at': note['updated_at'].isoformat() if note.get('updated_at') else None
        }
