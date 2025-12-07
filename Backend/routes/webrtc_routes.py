from flask import Blueprint, request, jsonify, current_app
from flask_socketio import SocketIO, emit, join_room, leave_room, rooms
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson.objectid import ObjectId
import logging
import base64
import io

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
    
    @socketio.on('audio_chunk')
    def handle_audio_chunk(data):
        """Receive and transcribe audio chunks in real-time"""
        try:
            session_id = data.get('session_id')
            audio_data = data.get('audio_data')  # Base64 encoded audio
            speaker = data.get('speaker', 'unknown')
            
            if not session_id or not audio_data:
                return
            
            # Lazy import to avoid circular dependencies
            from services.transcription_service import TranscriptionService, MockTranscriptionService
            import os
            
            # Use mock service if no API key is configured
            if os.environ.get('OPENAI_API_KEY'):
                transcription_service = TranscriptionService()
            else:
                transcription_service = MockTranscriptionService()
            
            # Decode audio data
            try:
                audio_bytes = base64.b64decode(audio_data)
            except:
                logger.error("Failed to decode audio data")
                return
            
            # Transcribe the audio chunk
            result = transcription_service.transcribe_audio_chunk(audio_bytes)
            
            if result['success']:
                text = result['text']
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
            else:
                logger.error(f"Transcription failed: {result.get('error')}")
                
        except Exception as e:
            logger.error(f"Error handling audio chunk: {e}")

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
        
        # Automatically update the main session with transcription data
        try:
            from models.session import Session
            from models.note import Note
            from models.client import Client
            from services.transcription_service import TranscriptionService, MockTranscriptionService
            from services.summary_service import SummaryService, MockSummaryService
            import os
            
            session_model = Session(current_app.db)
            session = session_model.find_by_id(session_id)
            
            # Check if note already exists for this session
            note_model = Note(current_app.db)
            if session and note_model.note_exists_for_session(session_id):
                print(f"[AUTO-NOTES] Note already exists for session {session_id}, skipping creation in webrtc")
                session_data['auto_note_created'] = False
                session_data['note_exists'] = True
            elif session and session_data.get('transcription'):
                # Use mock services if no API key
                has_api_key = os.environ.get('OPENAI_API_KEY') or os.environ.get('GEMINI_API_KEY')
                if has_api_key:
                    transcription_service = TranscriptionService()
                    summary_service = SummaryService()
                else:
                    transcription_service = MockTranscriptionService()
                    summary_service = MockSummaryService()
                
                # Format transcription
                transcript_text = transcription_service.format_transcript(
                    session_data['transcription']
                )
                
                # Get client info
                client_model = Client(current_app.db)
                client = client_model.find_by_id(str(session['client_id']))
                client_name = client.get('name') if client else None
                
                # Generate summary
                summary_result = summary_service.generate_session_summary(
                    transcript=transcript_text,
                    session_type=session.get('session_type', 'individual'),
                    client_name=client_name
                )
                
                if summary_result['success']:
                    # Extract key points
                    key_points_result = summary_service.extract_key_points(transcript_text)
                    
                    # Create note content
                    note_content = f"""# Session Notes - {datetime.utcnow().strftime('%B %d, %Y')}

## AI-Generated Summary
{summary_result['summary']}

---

## Full Transcript
{transcript_text}

---

"""
                    if key_points_result['success']:
                        key_points = key_points_result['key_points']
                        note_content += f"""## Key Points

**Main Topics:**
{chr(10).join([f'- {topic}' for topic in key_points.get('main_topics', [])])}

**Emotions Identified:**
{chr(10).join([f'- {emotion}' for emotion in key_points.get('emotions_identified', [])])}

**Action Items:**
{chr(10).join([f'- {item}' for item in key_points.get('action_items', [])])}

**Next Session Focus:**
{key_points.get('next_session_focus', 'To be determined')}
"""
                    
                    # Save the note (note_model already initialized above)
                    note_id = note_model.create_note(
                        therapist_id=str(session['therapist_id']),
                        client_id=str(session['client_id']),
                        session_id=session_id,
                        content=note_content,
                        note_type='session'
                    )
                    session_data['auto_note_created'] = True
                    session_data['note_id'] = note_id
                    
        except Exception as note_error:
            logger.error(f"Error auto-creating notes: {note_error}")
            session_data['auto_note_error'] = str(note_error)
        
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
