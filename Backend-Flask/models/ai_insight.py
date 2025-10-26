from datetime import datetime
from bson.objectid import ObjectId

class AIInsight:
    """AI Insight model for storing AI-generated insights"""
    
    def __init__(self, db):
        self.collection = db.ai_insights
        self._create_indexes()
    
    def _create_indexes(self):
        """Create indexes for better query performance"""
        self.collection.create_index('session_id')
        self.collection.create_index('client_id')
        self.collection.create_index([('session_id', 1), ('timestamp', -1)])
    
    def create_insight(self, session_id, client_id, insight_type, data, confidence=None):
        """Create a new AI insight"""
        insight_data = {
            'session_id': ObjectId(session_id),
            'client_id': ObjectId(client_id),
            'insight_type': insight_type,  # emotion, stress, engagement, suggestion
            'data': data,  # JSON data containing insight details
            'confidence': confidence,  # confidence score 0-100
            'timestamp': datetime.utcnow(),
            'created_at': datetime.utcnow()
        }
        
        result = self.collection.insert_one(insight_data)
        return str(result.inserted_id)
    
    def find_by_session(self, session_id, insight_type=None):
        """Find insights for a session"""
        query = {'session_id': ObjectId(session_id)}
        if insight_type:
            query['insight_type'] = insight_type
        
        return list(self.collection.find(query).sort('timestamp', -1))
    
    def find_by_client(self, client_id, insight_type=None, limit=None):
        """Find insights for a client"""
        query = {'client_id': ObjectId(client_id)}
        if insight_type:
            query['insight_type'] = insight_type
        
        cursor = self.collection.find(query).sort('timestamp', -1)
        
        if limit:
            cursor = cursor.limit(limit)
        
        return list(cursor)
    
    def get_latest_insights(self, session_id):
        """Get the latest insights for each type for a session"""
        pipeline = [
            {'$match': {'session_id': ObjectId(session_id)}},
            {'$sort': {'timestamp': -1}},
            {
                '$group': {
                    '_id': '$insight_type',
                    'latest': {'$first': '$$ROOT'}
                }
            }
        ]
        
        results = list(self.collection.aggregate(pipeline))
        return [item['latest'] for item in results]
    
    def get_session_summary(self, session_id):
        """Get aggregated summary of insights for a session"""
        pipeline = [
            {'$match': {'session_id': ObjectId(session_id)}},
            {
                '$group': {
                    '_id': '$insight_type',
                    'count': {'$sum': 1},
                    'avg_confidence': {'$avg': '$confidence'},
                    'latest_timestamp': {'$max': '$timestamp'}
                }
            }
        ]
        
        return list(self.collection.aggregate(pipeline))
    
    def to_dict(self, insight):
        """Convert insight document to dictionary"""
        if not insight:
            return None
        
        return {
            'id': str(insight['_id']),
            'session_id': str(insight['session_id']),
            'client_id': str(insight['client_id']),
            'insight_type': insight['insight_type'],
            'data': insight['data'],
            'confidence': insight.get('confidence'),
            'timestamp': insight['timestamp'].isoformat() if insight.get('timestamp') else None,
            'created_at': insight['created_at'].isoformat() if insight.get('created_at') else None
        }
