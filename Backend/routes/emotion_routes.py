"""
Emotion Detection Routes
API endpoints for video emotion detection during therapy sessions
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.emotion_detection import TherapyEmotionPipeline
import cv2
import numpy as np
import base64
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

emotion_bp = Blueprint('emotion', __name__)

# Store active emotion analysis sessions
active_emotion_sessions = {}


@emotion_bp.route('/session/<session_id>/start-emotion-tracking', methods=['POST'])
@jwt_required()
def start_emotion_tracking(session_id):
    """Initialize emotion tracking for a session"""
    try:
        current_user_id = get_jwt_identity()
        print(f"[EMOTION-START] Request received for session {session_id} by user {current_user_id}")
        
        # Initialize emotion pipeline
        pipeline = TherapyEmotionPipeline(fps=7)
        
        active_emotion_sessions[session_id] = {
            'pipeline': pipeline,
            'therapist_id': current_user_id,
            'started_at': datetime.utcnow().isoformat(),
            'frame_count': 0
        }
        
        print(f"[EMOTION-START] ✓ Emotion tracking started for session {session_id}")
        logger.info(f"✓ Emotion tracking started for session {session_id}")
        
        return jsonify({
            'message': 'Emotion tracking started',
            'session_id': session_id,
            'fps': 7
        }), 200
        
    except Exception as e:
        print(f"[EMOTION-START] ERROR: {str(e)}")
        logger.error(f"Error starting emotion tracking: {e}")
        return jsonify({'error': str(e)}), 500


@emotion_bp.route('/session/<session_id>/analyze-frame', methods=['POST'])
@jwt_required()
def analyze_frame(session_id):
    """
    Analyze a single video frame for emotions
    
    Request body:
    {
        "frame": "base64_encoded_image",
        "timestamp": 123.45
    }
    """
    try:
        current_user_id = get_jwt_identity()
        print(f"[EMOTION-FRAME] Received frame for session {session_id}")
        
        if session_id not in active_emotion_sessions:
            print(f"[EMOTION-FRAME] ERROR: Session {session_id} not found in active sessions. Active: {list(active_emotion_sessions.keys())}")
            return jsonify({'error': 'Emotion tracking not started for this session'}), 400
        
        session_data = active_emotion_sessions[session_id]
        
        # Verify ownership
        if session_data['therapist_id'] != current_user_id:
            print(f"[EMOTION-FRAME] ERROR: Unauthorized access attempt")
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        if not data or 'frame' not in data:
            print(f"[EMOTION-FRAME] ERROR: Missing frame data in request")
            return jsonify({'error': 'Missing frame data'}), 400
        
        # Decode base64 image
        frame_base64 = data['frame']
        if ',' in frame_base64:
            frame_base64 = frame_base64.split(',')[1]  # Remove data:image/jpeg;base64,
        
        frame_bytes = base64.b64decode(frame_base64)
        nparr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            print(f"[EMOTION-FRAME] ERROR: Failed to decode frame")
            return jsonify({'error': 'Invalid frame data'}), 400
        
        # Get timestamp
        timestamp = data.get('timestamp', session_data['frame_count'] * (1.0 / 7))
        
        # Process frame
        pipeline = session_data['pipeline']
        result = pipeline.process_frame(frame, timestamp)
        
        print(f"[EMOTION-FRAME] ✓ Processed frame {session_data['frame_count']} - Emotion: {result.get('dominant_emotion', 'none')}")
        
        # Store result
        if result and result.get('face_detected'):
            session_data['frame_count'] += 1
            
            # Store recent emotions for question assistant (keep last 10)
            if 'recent_emotions' not in session_data:
                session_data['recent_emotions'] = []
            session_data['recent_emotions'].append(result)
            if len(session_data['recent_emotions']) > 10:
                session_data['recent_emotions'].pop(0)
            
            # Log significant changes
            if result['composite_scores']['stress_score'] > 0.7:
                logger.info(f"⚠️ High stress detected in session {session_id} at {timestamp:.1f}s")
            
            if result['composite_scores']['anxiety_score'] > 0.7:
                logger.info(f"⚠️ High anxiety detected in session {session_id} at {timestamp:.1f}s")
        
        return jsonify({
            'success': True,
            'result': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error analyzing frame: {e}")
        return jsonify({'error': str(e)}), 500


@emotion_bp.route('/session/<session_id>/emotion-summary', methods=['GET'])
@jwt_required()
def get_emotion_summary(session_id):
    """Get emotion analysis summary for the session"""
    try:
        current_user_id = get_jwt_identity()
        
        if session_id not in active_emotion_sessions:
            return jsonify({'error': 'No emotion data for this session'}), 404
        
        session_data = active_emotion_sessions[session_id]
        
        # Verify ownership
        if session_data['therapist_id'] != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Generate summary
        pipeline = session_data['pipeline']
        summary = pipeline.generate_session_summary()
        
        if summary is None:
            return jsonify({'error': 'No emotion data collected yet'}), 400
        
        # Add session metadata
        summary['session_id'] = session_id
        summary['started_at'] = session_data['started_at']
        summary['frame_count'] = session_data['frame_count']
        
        return jsonify({
            'success': True,
            'summary': summary
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating emotion summary: {e}")
        return jsonify({'error': str(e)}), 500


@emotion_bp.route('/session/<session_id>/stop-emotion-tracking', methods=['POST'])
@jwt_required()
def stop_emotion_tracking(session_id):
    """Stop emotion tracking and return final summary"""
    try:
        current_user_id = get_jwt_identity()
        
        if session_id not in active_emotion_sessions:
            return jsonify({'error': 'No emotion tracking session found'}), 404
        
        session_data = active_emotion_sessions[session_id]
        
        # Verify ownership
        if session_data['therapist_id'] != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Generate final summary
        pipeline = session_data['pipeline']
        summary = pipeline.generate_session_summary()
        
        # Get all frame data
        all_frames = pipeline.session_data
        
        # Save emotion data to database (optional)
        try:
            from models.session import Session
            session_model = Session(current_app.db)
            
            # Update session with emotion data
            emotion_summary = {
                'emotion_distribution': summary.get('emotion_distribution', {}),
                'avg_stress_score': summary.get('avg_stress_score', 0),
                'avg_anxiety_score': summary.get('avg_anxiety_score', 0),
                'avg_engagement_score': summary.get('avg_engagement_score', 0),
                'predominant_emotion': summary.get('predominant_emotion', 'neutral'),
                'total_frames_analyzed': summary.get('total_frames_analyzed', 0),
                'analysis_timestamp': datetime.utcnow()
            }
            
            session_model.collection.update_one(
                {'_id': session_id},
                {'$set': {'emotion_analysis': emotion_summary}}
            )
            
            logger.info(f"✓ Emotion data saved to session {session_id}")
        except Exception as db_error:
            logger.warning(f"Could not save emotion data to database: {db_error}")
        
        # Clean up
        del active_emotion_sessions[session_id]
        
        logger.info(f"✓ Emotion tracking stopped for session {session_id}")
        
        return jsonify({
            'message': 'Emotion tracking stopped',
            'summary': summary,
            'total_frames': len(all_frames)
        }), 200
        
    except Exception as e:
        logger.error(f"Error stopping emotion tracking: {e}")
        return jsonify({'error': str(e)}), 500


@emotion_bp.route('/test-emotion-detection', methods=['POST'])
@jwt_required()
def test_emotion_detection():
    """
    Test endpoint for emotion detection
    Upload a single image and get emotion analysis
    """
    try:
        data = request.get_json()
        
        if not data or 'frame' not in data:
            return jsonify({'error': 'Missing frame data'}), 400
        
        # Decode base64 image
        frame_base64 = data['frame']
        if ',' in frame_base64:
            frame_base64 = frame_base64.split(',')[1]
        
        frame_bytes = base64.b64decode(frame_base64)
        nparr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({'error': 'Invalid frame data'}), 400
        
        # Create temporary pipeline
        pipeline = TherapyEmotionPipeline(fps=7)
        result = pipeline.process_frame(frame, 0.0)
        
        return jsonify({
            'success': True,
            'result': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in test emotion detection: {e}")
        return jsonify({'error': str(e)}), 500


@emotion_bp.route('/emotion-pipeline/status', methods=['GET'])
@jwt_required()
def get_pipeline_status():
    """Get status of emotion detection pipeline"""
    try:
        # Test if dependencies are available
        status = {
            'available': True,
            'dependencies': {}
        }
        
        try:
            import mediapipe
            status['dependencies']['mediapipe'] = 'installed'
        except ImportError:
            status['dependencies']['mediapipe'] = 'missing'
            status['available'] = False
        
        try:
            import fer
            status['dependencies']['fer'] = 'installed'
        except ImportError:
            status['dependencies']['fer'] = 'missing'
            status['available'] = False
        
        try:
            import cv2
            status['dependencies']['opencv'] = 'installed'
        except ImportError:
            status['dependencies']['opencv'] = 'missing'
            status['available'] = False
        
        status['active_sessions'] = len(active_emotion_sessions)
        
        return jsonify(status), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@emotion_bp.route('/session/<session_id>/suggested-question', methods=['GET'])
@jwt_required()
def get_suggested_question(session_id):
    """
    Get AI-generated therapeutic question based on current emotion and context
    """
    try:
        from services.question_assistant import QuestionAssistant
        
        current_user_id = get_jwt_identity()
        
        if session_id not in active_emotion_sessions:
            return jsonify({'error': 'No active emotion tracking for this session'}), 400
        
        session_data = active_emotion_sessions[session_id]
        
        # Verify ownership
        if session_data['therapist_id'] != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get recent emotion data
        recent_emotions = session_data.get('recent_emotions', [])
        if not recent_emotions:
            return jsonify({'error': 'No emotion data available yet'}), 400
        
        latest_emotion = recent_emotions[-1]
        
        # Get recent transcript from session (if available)
        from models.session import Session
        session_model = Session(current_app.db)
        session_obj = session_model.find_by_id(session_id)
        
        recent_transcript = ""
        if session_obj and 'transcription' in session_obj:
            # Get last 5 transcript segments
            transcription = session_obj.get('transcription', [])
            recent_segments = transcription[-5:] if len(transcription) > 5 else transcription
            recent_transcript = "\n".join([f"{seg.get('speaker', 'Speaker')}: {seg.get('text', '')}" for seg in recent_segments])
        
        # Get previous session notes for context (RAG)
        client_id = session_obj.get('client_id') if session_obj else None
        previous_notes = None
        
        if client_id:
            from models.note import Note
            note_model = Note(current_app.db)
            past_notes = note_model.collection.find({
                'client_id': client_id
            }).sort('created_at', -1).limit(3)
            
            notes_context = []
            for note in past_notes:
                if 'content' in note:
                    notes_context.append(note['content'][:200])  # First 200 chars of each note
            
            if notes_context:
                previous_notes = "\n".join(notes_context)
        
        # Generate question
        assistant = QuestionAssistant()
        result = assistant.generate_question(
            emotion_data=latest_emotion,
            recent_transcript=recent_transcript,
            previous_notes=previous_notes
        )
        
        logger.info(f"Generated question for session {session_id}: {result.get('question', '')[:50]}...")
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error generating question: {e}")
        return jsonify({'error': str(e)}), 500
