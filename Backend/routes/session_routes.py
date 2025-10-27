from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.session import Session
from models.client import Client
from datetime import datetime
from bson.objectid import ObjectId

session_bp = Blueprint('sessions', __name__)

@session_bp.route('/test', methods=['POST'])
def test_post():
    """Test POST endpoint"""
    print("🟢 TEST POST ROUTE HIT!")
    return jsonify({'message': 'Test successful'}), 200

@session_bp.route('/', methods=['GET'])
@jwt_required()
def get_sessions():
    """Get all sessions for the current therapist"""
    try:
        current_user_id = get_jwt_identity()
        session_model = Session(current_app.db)
        
        # Get query parameters
        status = request.args.get('status')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Convert date strings to datetime
        if start_date:
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if end_date:
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        sessions = session_model.find_by_therapist(current_user_id, status, start_date, end_date)
        
        return jsonify({
            'sessions': [session_model.to_dict(session, populate_client=True) for session in sessions]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@session_bp.route('/<session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    """Get a specific session"""
    try:
        current_user_id = get_jwt_identity()
        session_model = Session(current_app.db)
        
        session = session_model.find_by_id(session_id)
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Verify the session belongs to the current therapist
        if str(session['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({
            'session': session_model.to_dict(session, populate_client=True)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@session_bp.route('/client/<client_id>', methods=['GET'])
@jwt_required()
def get_client_sessions(client_id):
    """Get all sessions for a specific client"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify client belongs to therapist
        client_model = Client(current_app.db)
        client = client_model.find_by_id(client_id)
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        if str(client['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        session_model = Session(current_app.db)
        limit = request.args.get('limit', type=int)
        sessions = session_model.find_by_client(client_id, limit)
        
        return jsonify({
            'sessions': [session_model.to_dict(session, populate_client=True) for session in sessions]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@session_bp.route('/', methods=['POST'])
@jwt_required()
def create_session():
    """Create a new session"""
    print("🔵 create_session called!")
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        print(f"🔵 User: {current_user_id}, Data: {data}")
        print(f"🔵 client_id type: {type(data.get('client_id'))}, value: {repr(data.get('client_id'))}")
        
        # Validate required fields
        required_fields = ['client_id', 'scheduled_date']
        if not all(field in data for field in required_fields):
            print(f"🔴 Missing fields! Data keys: {data.keys() if data else 'None'}")
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Verify client belongs to therapist
        client_model = Client(current_app.db)
        
        # Try to find by ID first
        client = client_model.find_by_id(data['client_id'])
        print(f"🔵 Client found by ID: {client is not None}")
        
        # If not found, let's check all clients for this therapist
        if not client:
            all_clients = list(client_model.collection.find({'therapist_id': ObjectId(current_user_id)}))
            print(f"🔵 All clients for therapist: {[(str(c['_id']), c.get('name')) for c in all_clients]}")
            print(f"🔴 Client not found: {data['client_id']}")
            return jsonify({'error': 'Client not found'}), 404
        
        if str(client['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Parse scheduled date
        scheduled_date = datetime.fromisoformat(data['scheduled_date'].replace('Z', '+00:00'))
        
        session_model = Session(current_app.db)
        
        # Create session
        session_id = session_model.create_session(
            therapist_id=current_user_id,
            client_id=data['client_id'],
            scheduled_date=scheduled_date,
            duration=data.get('duration', 60),
            session_type=data.get('session_type', 'individual'),
            status=data.get('status', 'scheduled'),
            location=data.get('location'),
            meeting_link=data.get('meeting_link')
        )
        
        session = session_model.find_by_id(session_id)
        
        return jsonify({
            'message': 'Session created successfully',
            'session': session_model.to_dict(session, populate_client=True)
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@session_bp.route('/<session_id>/start', methods=['POST'])
@jwt_required()
def start_session(session_id):
    """Start a session"""
    try:
        current_user_id = get_jwt_identity()
        session_model = Session(current_app.db)
        
        session = session_model.find_by_id(session_id)
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Verify the session belongs to the current therapist
        if str(session['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if session_model.start_session(session_id):
            updated_session = session_model.find_by_id(session_id)
            return jsonify({
                'message': 'Session started successfully',
                'session': session_model.to_dict(updated_session)
            }), 200
        else:
            return jsonify({'error': 'Failed to start session'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@session_bp.route('/<session_id>/end', methods=['POST'])
@jwt_required()
def end_session(session_id):
    """End a session"""
    try:
        current_user_id = get_jwt_identity()
        session_model = Session(current_app.db)
        
        session = session_model.find_by_id(session_id)
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Verify the session belongs to the current therapist
        if str(session['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if session_model.end_session(session_id):
            updated_session = session_model.find_by_id(session_id)
            return jsonify({
                'message': 'Session ended successfully',
                'session': session_model.to_dict(updated_session)
            }), 200
        else:
            return jsonify({'error': 'Failed to end session'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@session_bp.route('/<session_id>', methods=['PUT'])
@jwt_required()
def update_session(session_id):
    """Update a session"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        session_model = Session(current_app.db)
        session = session_model.find_by_id(session_id)
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Verify the session belongs to the current therapist
        if str(session['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Fields that can be updated
        allowed_fields = ['scheduled_date', 'duration', 'session_type', 'status', 'recording_url']
        update_data = {}
        
        for field in allowed_fields:
            if field in data:
                if field == 'scheduled_date':
                    update_data[field] = datetime.fromisoformat(data[field].replace('Z', '+00:00'))
                else:
                    update_data[field] = data[field]
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        if session_model.update_session(session_id, update_data):
            updated_session = session_model.find_by_id(session_id)
            return jsonify({
                'message': 'Session updated successfully',
                'session': session_model.to_dict(updated_session)
            }), 200
        else:
            return jsonify({'error': 'Failed to update session'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@session_bp.route('/<session_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_session(session_id):
    """Cancel a session"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        session_model = Session(current_app.db)
        session = session_model.find_by_id(session_id)
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Verify the session belongs to the current therapist
        if str(session['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        reason = data.get('reason') if data else None
        
        if session_model.cancel_session(session_id, reason):
            updated_session = session_model.find_by_id(session_id)
            return jsonify({
                'message': 'Session cancelled successfully',
                'session': session_model.to_dict(updated_session, populate_client=True)
            }), 200
        else:
            return jsonify({'error': 'Failed to cancel session'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@session_bp.route('/<session_id>', methods=['DELETE'])
@jwt_required()
def delete_session(session_id):
    """Delete a session"""
    try:
        current_user_id = get_jwt_identity()
        session_model = Session(current_app.db)
        
        session = session_model.find_by_id(session_id)
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Verify the session belongs to the current therapist
        if str(session['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if session_model.delete_session(session_id):
            return jsonify({
                'message': 'Session deleted successfully'
            }), 200
        else:
            return jsonify({'error': 'Failed to delete session'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
