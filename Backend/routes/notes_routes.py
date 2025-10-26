from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.note import Note
from models.client import Client
from models.session import Session

notes_bp = Blueprint('notes', __name__)

@notes_bp.route('/', methods=['GET'])
@jwt_required()
def get_notes():
    """Get all notes for the current therapist"""
    try:
        current_user_id = get_jwt_identity()
        note_model = Note(current_app.db)
        
        limit = request.args.get('limit', type=int)
        notes = note_model.find_by_therapist(current_user_id, limit)
        
        return jsonify({
            'notes': [note_model.to_dict(note) for note in notes]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notes_bp.route('/<note_id>', methods=['GET'])
@jwt_required()
def get_note(note_id):
    """Get a specific note"""
    try:
        current_user_id = get_jwt_identity()
        note_model = Note(current_app.db)
        
        note = note_model.find_by_id(note_id)
        
        if not note:
            return jsonify({'error': 'Note not found'}), 404
        
        # Verify the note belongs to the current therapist
        if str(note['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({
            'note': note_model.to_dict(note)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notes_bp.route('/session/<session_id>', methods=['GET'])
@jwt_required()
def get_session_notes(session_id):
    """Get all notes for a specific session"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify session belongs to therapist
        session_model = Session(current_app.db)
        session = session_model.find_by_id(session_id)
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        if str(session['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        note_model = Note(current_app.db)
        notes = note_model.find_by_session(session_id)
        
        return jsonify({
            'notes': [note_model.to_dict(note) for note in notes]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notes_bp.route('/client/<client_id>', methods=['GET'])
@jwt_required()
def get_client_notes(client_id):
    """Get all notes for a specific client"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify client belongs to therapist
        client_model = Client(current_app.db)
        client = client_model.find_by_id(client_id)
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        if str(client['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        note_model = Note(current_app.db)
        limit = request.args.get('limit', type=int)
        notes = note_model.find_by_client(client_id, limit)
        
        return jsonify({
            'notes': [note_model.to_dict(note) for note in notes]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notes_bp.route('/', methods=['POST'])
@jwt_required()
def create_note():
    """Create a new note"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['client_id', 'content']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Verify client belongs to therapist
        client_model = Client(current_app.db)
        client = client_model.find_by_id(data['client_id'])
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        if str(client['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # If session_id is provided, verify it belongs to the client
        if data.get('session_id'):
            session_model = Session(current_app.db)
            session = session_model.find_by_id(data['session_id'])
            
            if not session:
                return jsonify({'error': 'Session not found'}), 404
            
            if str(session['client_id']) != data['client_id']:
                return jsonify({'error': 'Session does not belong to this client'}), 400
        
        note_model = Note(current_app.db)
        
        # Create note
        note_id = note_model.create_note(
            therapist_id=current_user_id,
            client_id=data['client_id'],
            session_id=data.get('session_id'),
            content=data['content'],
            note_type=data.get('note_type', 'session')
        )
        
        note = note_model.find_by_id(note_id)
        
        return jsonify({
            'message': 'Note created successfully',
            'note': note_model.to_dict(note)
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notes_bp.route('/<note_id>', methods=['PUT'])
@jwt_required()
def update_note(note_id):
    """Update a note"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('content'):
            return jsonify({'error': 'Content is required'}), 400
        
        note_model = Note(current_app.db)
        note = note_model.find_by_id(note_id)
        
        if not note:
            return jsonify({'error': 'Note not found'}), 404
        
        # Verify the note belongs to the current therapist
        if str(note['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if note_model.update_note(note_id, data['content']):
            updated_note = note_model.find_by_id(note_id)
            return jsonify({
                'message': 'Note updated successfully',
                'note': note_model.to_dict(updated_note)
            }), 200
        else:
            return jsonify({'error': 'Failed to update note'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notes_bp.route('/<note_id>', methods=['DELETE'])
@jwt_required()
def delete_note(note_id):
    """Delete a note"""
    try:
        current_user_id = get_jwt_identity()
        note_model = Note(current_app.db)
        
        note = note_model.find_by_id(note_id)
        
        if not note:
            return jsonify({'error': 'Note not found'}), 404
        
        # Verify the note belongs to the current therapist
        if str(note['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if note_model.delete_note(note_id):
            return jsonify({
                'message': 'Note deleted successfully'
            }), 200
        else:
            return jsonify({'error': 'Failed to delete note'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
