from flask import Blueprint, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room, rooms
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson.objectid import ObjectId
import logging

logger = logging.getLogger(__name__)

webrtc_bp = Blueprint('webrtc', __name__)

# Store active sessions
active_sessions = {}
# Store room participants
room_participants = {}

def init_socketio(socketio: SocketIO, db):
    """Initialize SocketIO event handlers"""
    
    @socketio.on('connect')
    def handle_connect():
        """Handle client connection"""
        logger.info(f"Client connected: {request.sid}")
        emit('connected', {'sid': request.sid})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection"""
        logger.info(f"Client disconnected: {request.sid}")
        
        # Remove from all rooms
        for room_id, participants in list(room_participants.items()):
            if request.sid in participants:
                participants.remove(request.sid)
                emit('user_left', {'sid': request.sid}, room=room_id)
                
                # Clean up empty rooms
                if len(participants) == 0:
                    del room_participants[room_id]
                    if room_id in active_sessions:
                        del active_sessions[room_id]
    
    @socketio.on('join_session')
    def handle_join_session(data):
        """Handle user joining a therapy session"""
        session_id = data.get('session_id')
        user_type = data.get('user_type')  # 'therapist' or 'client'
        user_name = data.get('user_name', 'User')
        
        logger.info(f"User {user_name} ({user_type}) joining session: {session_id}")
        
        # Join the room
        join_room(session_id)
        
        # Track participants
        if session_id not in room_participants:
            room_participants[session_id] = []
        room_participants[session_id].append(request.sid)
        
        # Initialize session tracking
        if session_id not in active_sessions:
            active_sessions[session_id] = {
                'session_id': session_id,
                'start_time': datetime.utcnow().isoformat(),
                'participants': {},
                'emotions': [],
                'transcription': []
            }
        
        # Add participant info
        active_sessions[session_id]['participants'][request.sid] = {
            'user_type': user_type,
            'user_name': user_name,
            'joined_at': datetime.utcnow().isoformat()
        }
        
        # Notify others in the room
        emit('user_joined', {
            'sid': request.sid,
            'user_type': user_type,
            'user_name': user_name,
            'participant_count': len(room_participants[session_id])
        }, room=session_id, include_self=False)
        
        # Send current participants to the new joiner
        emit('session_state', {
            'session_id': session_id,
            'participants': active_sessions[session_id]['participants'],
            'participant_count': len(room_participants[session_id])
        })
    
    @socketio.on('leave_session')
    def handle_leave_session(data):
        """Handle user leaving a session"""
        session_id = data.get('session_id')
        
        logger.info(f"User leaving session: {session_id}")
        
        leave_room(session_id)
        
        # Remove from participants
        if session_id in room_participants:
            if request.sid in room_participants[session_id]:
                room_participants[session_id].remove(request.sid)
            
            # Notify others
            emit('user_left', {
                'sid': request.sid,
                'participant_count': len(room_participants[session_id])
            }, room=session_id)
    
    @socketio.on('webrtc_offer')
    def handle_webrtc_offer(data):
        """Forward WebRTC offer to peer"""
        target_sid = data.get('target_sid')
        offer = data.get('offer')
        
        logger.info(f"Forwarding WebRTC offer from {request.sid} to {target_sid}")
        
        emit('webrtc_offer', {
            'offer': offer,
            'from_sid': request.sid
        }, room=target_sid)
    
    @socketio.on('webrtc_answer')
    def handle_webrtc_answer(data):
        """Forward WebRTC answer to peer"""
        target_sid = data.get('target_sid')
        answer = data.get('answer')
        
        logger.info(f"Forwarding WebRTC answer from {request.sid} to {target_sid}")
        
        emit('webrtc_answer', {
            'answer': answer,
            'from_sid': request.sid
        }, room=target_sid)
    
    @socketio.on('webrtc_ice_candidate')
    def handle_ice_candidate(data):
        """Forward ICE candidate to peer"""
        target_sid = data.get('target_sid')
        candidate = data.get('candidate')
        
        emit('webrtc_ice_candidate', {
            'candidate': candidate,
            'from_sid': request.sid
        }, room=target_sid)
    
    @socketio.on('emotion_data')
    def handle_emotion_data(data):
        """Receive and broadcast emotion analysis data"""
        session_id = data.get('session_id')
        emotion_data = data.get('emotion_data')
        timestamp = datetime.utcnow().isoformat()
        
        # Store emotion data
        if session_id in active_sessions:
            active_sessions[session_id]['emotions'].append({
                'timestamp': timestamp,
                'user_sid': request.sid,
                'data': emotion_data
            })
        
        # Broadcast to therapist only
        emit('emotion_update', {
            'timestamp': timestamp,
            'user_sid': request.sid,
            'emotion_data': emotion_data
        }, room=session_id)
    
    @socketio.on('transcription_chunk')
    def handle_transcription(data):
        """Receive and store transcription chunks"""
        session_id = data.get('session_id')
        text = data.get('text')
        speaker = data.get('speaker', 'unknown')
        timestamp = datetime.utcnow().isoformat()
        
        # Store transcription
        if session_id in active_sessions:
            active_sessions[session_id]['transcription'].append({
                'timestamp': timestamp,
                'speaker': speaker,
                'text': text
            })
        
        # Broadcast to all participants
        emit('transcription_update', {
            'timestamp': timestamp,
            'speaker': speaker,
            'text': text
        }, room=session_id)

# REST API endpoints
@webrtc_bp.route('/session/<session_id>/start', methods=['POST'])
@jwt_required()
def start_video_session(session_id):
    """Initialize a video session"""
    try:
        current_user_id = get_jwt_identity()
        
        return jsonify({
            'session_id': session_id,
            'status': 'ready',
            'message': 'Video session initialized'
        }), 200
        
    except Exception as e:
        logger.error(f"Error starting video session: {e}")
        return jsonify({'error': str(e)}), 500

@webrtc_bp.route('/session/<session_id>/data', methods=['GET'])
@jwt_required()
def get_session_data(session_id):
    """Get session data including emotions and transcription"""
    try:
        if session_id in active_sessions:
            return jsonify({
                'session_data': active_sessions[session_id]
            }), 200
        else:
            return jsonify({'error': 'Session not found'}), 404
            
    except Exception as e:
        logger.error(f"Error fetching session data: {e}")
        return jsonify({'error': str(e)}), 500

@webrtc_bp.route('/session/<session_id>/end', methods=['POST'])
@jwt_required()
def end_video_session(session_id):
    """End video session and return all collected data"""
    try:
        current_user_id = get_jwt_identity()
        
        if session_id not in active_sessions:
            return jsonify({'error': 'Session not found'}), 404
        
        session_data = active_sessions[session_id]
        session_data['end_time'] = datetime.utcnow().isoformat()
        
        # Clean up
        result = session_data.copy()
        del active_sessions[session_id]
        if session_id in room_participants:
            del room_participants[session_id]
        
        return jsonify({
            'message': 'Session ended successfully',
            'session_data': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error ending session: {e}")
        return jsonify({'error': str(e)}), 500
