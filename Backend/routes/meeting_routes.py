from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import uuid

meeting_bp = Blueprint('meetings', __name__)

@meeting_bp.route('/create', methods=['POST'])
@jwt_required()
def create_meeting():
    """Generate a Google Meet-style link for a session"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('client_name') or not data.get('start_time'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Generate a unique meeting ID (Google Meet style: xxx-xxxx-xxx)
        meeting_id = f"{uuid.uuid4().hex[:3]}-{uuid.uuid4().hex[:4]}-{uuid.uuid4().hex[:3]}"
        
        # For now, we'll generate a placeholder link
        # In production, you would integrate with Google Meet API
        meeting_link = f"https://meet.google.com/{meeting_id}"
        
        # You can also generate alternative platforms
        # zoom_link = f"https://zoom.us/j/{uuid.uuid4().hex[:10]}"
        # teams_link = f"https://teams.microsoft.com/l/meetup-join/{uuid.uuid4().hex}"
        
        return jsonify({
            'meeting_link': meeting_link,
            'meeting_id': meeting_id,
            'platform': 'Google Meet',
            'created_at': datetime.utcnow().isoformat()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@meeting_bp.route('/validate', methods=['POST'])
@jwt_required()
def validate_meeting_link():
    """Validate if a meeting link is accessible"""
    try:
        data = request.get_json()
        meeting_link = data.get('meeting_link')
        
        if not meeting_link:
            return jsonify({'error': 'Meeting link is required'}), 400
        
        # Basic validation
        valid_domains = ['meet.google.com', 'zoom.us', 'teams.microsoft.com', 'whereby.com']
        is_valid = any(domain in meeting_link for domain in valid_domains)
        
        return jsonify({
            'valid': is_valid,
            'meeting_link': meeting_link
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
