from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.client import Client
from bson.objectid import ObjectId

client_bp = Blueprint('clients', __name__)

@client_bp.route('/', methods=['GET'])
@jwt_required()
def get_clients():
    """Get all clients for the current therapist"""
    try:
        current_user_id = get_jwt_identity()
        client_model = Client(current_app.db)
        
        status = request.args.get('status')
        clients = client_model.find_by_therapist(current_user_id, status)
        
        return jsonify({
            'clients': [client_model.to_dict(client) for client in clients]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@client_bp.route('/<client_id>', methods=['GET'])
@jwt_required()
def get_client(client_id):
    """Get a specific client"""
    try:
        current_user_id = get_jwt_identity()
        client_model = Client(current_app.db)
        
        client = client_model.find_by_id(client_id)
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        # Verify the client belongs to the current therapist
        if str(client['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({
            'client': client_model.to_dict(client)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@client_bp.route('/', methods=['POST'])
@jwt_required()
def create_client():
    """Create a new client"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        client_model = Client(current_app.db)
        
        # Create client
        client_id = client_model.create_client(
            therapist_id=current_user_id,
            name=data['name'],
            email=data['email'],
            phone=data.get('phone'),
            date_of_birth=data.get('date_of_birth'),
            emergency_contact=data.get('emergency_contact'),
            notes=data.get('notes')
        )
        
        client = client_model.find_by_id(client_id)
        
        return jsonify({
            'message': 'Client created successfully',
            'client': client_model.to_dict(client)
        }), 201
        
    except Exception as e:
        if 'duplicate key' in str(e).lower():
            return jsonify({'error': 'Client with this email already exists'}), 409
        return jsonify({'error': str(e)}), 500

@client_bp.route('/<client_id>', methods=['PUT'])
@jwt_required()
def update_client(client_id):
    """Update a client"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        client_model = Client(current_app.db)
        client = client_model.find_by_id(client_id)
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        # Verify the client belongs to the current therapist
        if str(client['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Fields that can be updated
        allowed_fields = ['name', 'email', 'phone', 'date_of_birth', 'emergency_contact', 'notes', 'status']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        if client_model.update_client(client_id, update_data):
            updated_client = client_model.find_by_id(client_id)
            return jsonify({
                'message': 'Client updated successfully',
                'client': client_model.to_dict(updated_client)
            }), 200
        else:
            return jsonify({'error': 'Failed to update client'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@client_bp.route('/<client_id>', methods=['DELETE'])
@jwt_required()
def delete_client(client_id):
    """Delete (deactivate) a client"""
    try:
        current_user_id = get_jwt_identity()
        client_model = Client(current_app.db)
        
        client = client_model.find_by_id(client_id)
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        # Verify the client belongs to the current therapist
        if str(client['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if client_model.delete_client(client_id):
            return jsonify({
                'message': 'Client deleted successfully'
            }), 200
        else:
            return jsonify({'error': 'Failed to delete client'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@client_bp.route('/<client_id>/status', methods=['PATCH'])
@jwt_required()
def update_client_status(client_id):
    """Update client status (active/inactive)"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({'error': 'Status field is required'}), 400
        
        if data['status'] not in ['active', 'inactive']:
            return jsonify({'error': 'Status must be either "active" or "inactive"'}), 400
        
        client_model = Client(current_app.db)
        client = client_model.find_by_id(client_id)
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        # Verify the client belongs to the current therapist
        if str(client['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # If setting to inactive, delete all future scheduled sessions
        deleted_sessions_count = 0
        if data['status'] == 'inactive':
            from models.session import Session
            from datetime import datetime
            
            session_model = Session(current_app.db)
            
            # Find all future scheduled sessions for this client
            future_sessions = list(current_app.db.sessions.find({
                'client_id': ObjectId(client_id),
                'status': 'scheduled',
                'scheduled_date': {'$gte': datetime.utcnow()}
            }))
            
            # Delete each future session
            for session in future_sessions:
                try:
                    session_model.delete_session(str(session['_id']))
                    deleted_sessions_count += 1
                except Exception as e:
                    print(f"Error deleting session {session['_id']}: {e}")
        
        if client_model.update_client(client_id, {'status': data['status']}):
            updated_client = client_model.find_by_id(client_id)
            
            response_message = f'Client status updated to {data["status"]}'
            if deleted_sessions_count > 0:
                response_message += f'. {deleted_sessions_count} future session(s) cancelled'
            
            return jsonify({
                'message': response_message,
                'deleted_sessions': deleted_sessions_count,
                'client': client_model.to_dict(updated_client)
            }), 200
        else:
            return jsonify({'error': 'Failed to update status'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@client_bp.route('/<client_id>/details', methods=['GET'])
@jwt_required()
def get_client_details(client_id):
    """Get client with session information"""
    try:
        current_user_id = get_jwt_identity()
        client_model = Client(current_app.db)
        
        client = client_model.get_client_with_sessions(client_id)
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        # Verify the client belongs to the current therapist
        if str(client['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Convert ObjectIds to strings
        client['_id'] = str(client['_id'])
        client['therapist_id'] = str(client['therapist_id'])
        if 'sessions' in client:
            for session in client['sessions']:
                session['_id'] = str(session['_id'])
                session['client_id'] = str(session['client_id'])
                session['therapist_id'] = str(session['therapist_id'])
        
        return jsonify({
            'client': client
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
