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
    """End a session and automatically generate notes"""
    try:
        current_user_id = get_jwt_identity()
        session_model = Session(current_app.db)
        
        session = session_model.find_by_id(session_id)
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Verify the session belongs to the current therapist
        if str(session['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get any transcription data from the request body
        data = request.get_json() or {}
        transcription_data = data.get('transcription_data', [])
        language = data.get('language', 'en')  # Get language preference, default to English
        
        # End the session
        if session_model.end_session(session_id):
            updated_session = session_model.find_by_id(session_id)
            
            # Auto-generate notes from transcription if available
            note_created = False
            note_id = None
            
            print(f"\n[AUTO-NOTES] Checking transcription data: {bool(transcription_data)}")
            if transcription_data:
                print(f"[AUTO-NOTES] Transcription length: {len(transcription_data)} messages")
            
            if transcription_data:
                try:
                    from services.transcription_service import TranscriptionService, MockTranscriptionService
                    from services.summary_service import SummaryService, MockSummaryService
                    from models.note import Note
                    from models.client import Client
                    import os
                    
                    # Use mock services if no API key is configured
                    has_api_key = os.environ.get('OPENAI_API_KEY') or os.environ.get('GEMINI_API_KEY')
                    print(f"[AUTO-NOTES] Has API key: {bool(has_api_key)}")
                    if has_api_key:
                        transcription_service = TranscriptionService()
                        summary_service = SummaryService()
                        print(f"[AUTO-NOTES] Using real AI service")
                    else:
                        transcription_service = MockTranscriptionService()
                        summary_service = MockSummaryService()
                        print(f"[AUTO-NOTES] Using mock service")
                    
                    # Format the transcription
                    transcript_text = transcription_service.format_transcript(transcription_data)
                    print(f"[AUTO-NOTES] Formatted transcript length: {len(transcript_text)} chars")
                    
                    # Get client information for personalized summary
                    client_model = Client(current_app.db)
                    client = client_model.find_by_id(str(session['client_id']))
                    client_name = client.get('name') if client else None
                    print(f"[AUTO-NOTES] Client name: {client_name}")
                    
                    # Generate summary
                    print(f"[AUTO-NOTES] Generating summary with {summary_service.__class__.__name__} in {language} language...")
                    print(f"[RAG] Including context from past sessions for client {str(session['client_id'])}")
                    summary_result = summary_service.generate_session_summary(
                        transcript=transcript_text,
                        session_type=session.get('session_type', 'individual'),
                        client_name=client_name,
                        language=language,
                        client_id=str(session['client_id']),
                        db=current_app.db
                    )
                    print(f"[AUTO-NOTES] Summary result success: {summary_result.get('success')}")
                    
                    # Log error if summary generation failed
                    if not summary_result.get('success'):
                        error_msg = summary_result.get('error', 'Unknown error')
                        print(f"[AUTO-NOTES] ERROR: Summary generation failed - {error_msg}")
                    
                    if summary_result['success']:
                        # Extract key points
                        key_points_result = summary_service.extract_key_points(transcript_text)
                        
                        # Get session number for this client
                        session_model_count = Session(current_app.db)
                        client_sessions = list(current_app.db.sessions.find({
                            'client_id': session['client_id'],
                            'status': {'$in': ['completed', 'cancelled']}
                        }).sort('created_at', 1))
                        session_number = len([s for s in client_sessions if s['_id'] <= session['_id']])
                        
                        # Get client name for title
                        client_name_display = client_name if client_name else "Client"
                        
                        # Create comprehensive note content with session number
                        note_content = f"""# {client_name_display} - Session {session_number}
**Date:** {datetime.utcnow().strftime('%B %d, %Y')}
**Duration:** {session.get('duration', 'N/A')}
**Type:** {session.get('session_type', 'individual').title()}

---

## Clinical Summary
{summary_result['summary']}

---

## Session Transcript
{transcript_text}
"""
                        
                        # Add key points if available
                        if key_points_result.get('success'):
                            key_points = key_points_result['key_points']
                            note_content += f"""
---

## Quick Reference

### Topics Addressed
{chr(10).join([f'• {topic}' for topic in key_points.get('main_topics', [])]) if key_points.get('main_topics') else '• None recorded'}

### Emotions & Mood
{chr(10).join([f'• {emotion}' for emotion in key_points.get('emotions_identified', [])]) if key_points.get('emotions_identified') else '• None identified'}

### Action Items
{chr(10).join([f'• {item}' for item in key_points.get('action_items', [])]) if key_points.get('action_items') else '• None assigned'}

### Next Session Plan
{key_points.get('next_session_focus', 'To be determined based on client progress')}
"""
                        
                        # Save the note with separate fields for PDF export
                        note_model = Note(current_app.db)
                        
                        # Extract action items from key points
                        action_items_list = []
                        if key_points_result.get('success'):
                            key_points = key_points_result['key_points']
                            action_items_list = key_points.get('action_items', [])
                        
                        note_id = note_model.create_note(
                            therapist_id=current_user_id,
                            client_id=str(session['client_id']),
                            session_id=session_id,
                            content=note_content,
                            note_type='session',
                            ai_summary=summary_result['summary'],
                            transcript=transcript_text,
                            action_items=action_items_list,
                            session_date=session.get('scheduled_date')
                        )
                        note_created = True
                        print(f"[AUTO-NOTES] Note created successfully with ID: {note_id}")
                        
                except Exception as note_error:
                    # Log the error but don't fail the session end
                    print(f"[AUTO-NOTES] Error creating automatic notes: {note_error}")
                    import traceback
                    traceback.print_exc()
            
            response_data = {
                'message': 'Session ended successfully',
                'session': session_model.to_dict(updated_session),
                'note_auto_generated': note_created
            }
            
            if note_created and note_id:
                response_data['note_id'] = note_id
            
            return jsonify(response_data), 200
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
