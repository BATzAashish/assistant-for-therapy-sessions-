from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.ai_insight import AIInsight
from models.session import Session
from models.client import Client
import random

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/insights/session/<session_id>', methods=['GET'])
@jwt_required()
def get_session_insights(session_id):
    """Get AI insights for a specific session"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify session belongs to therapist
        session_model = Session(current_app.db)
        session = session_model.find_by_id(session_id)
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        if str(session['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        ai_model = AIInsight(current_app.db)
        insight_type = request.args.get('type')
        insights = ai_model.find_by_session(session_id, insight_type)
        
        return jsonify({
            'insights': [ai_model.to_dict(insight) for insight in insights]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/insights/session/<session_id>/latest', methods=['GET'])
@jwt_required()
def get_latest_session_insights(session_id):
    """Get the latest insights for each type for a session"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify session belongs to therapist
        session_model = Session(current_app.db)
        session = session_model.find_by_id(session_id)
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        if str(session['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        ai_model = AIInsight(current_app.db)
        insights = ai_model.get_latest_insights(session_id)
        
        return jsonify({
            'insights': [ai_model.to_dict(insight) for insight in insights]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/insights/session/<session_id>/summary', methods=['GET'])
@jwt_required()
def get_session_summary(session_id):
    """Get aggregated summary of insights for a session"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify session belongs to therapist
        session_model = Session(current_app.db)
        session = session_model.find_by_id(session_id)
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        if str(session['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        ai_model = AIInsight(current_app.db)
        summary = ai_model.get_session_summary(session_id)
        
        return jsonify({
            'summary': summary
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/insights/client/<client_id>', methods=['GET'])
@jwt_required()
def get_client_insights(client_id):
    """Get AI insights for a specific client"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify client belongs to therapist
        client_model = Client(current_app.db)
        client = client_model.find_by_id(client_id)
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        if str(client['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        ai_model = AIInsight(current_app.db)
        insight_type = request.args.get('type')
        limit = request.args.get('limit', type=int)
        insights = ai_model.find_by_client(client_id, insight_type, limit)
        
        return jsonify({
            'insights': [ai_model.to_dict(insight) for insight in insights]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/insights', methods=['POST'])
@jwt_required()
def create_insight():
    """Create a new AI insight (for testing/demo purposes)"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['session_id', 'client_id', 'insight_type', 'data']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Verify session belongs to therapist
        session_model = Session(current_app.db)
        session = session_model.find_by_id(data['session_id'])
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        if str(session['therapist_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        ai_model = AIInsight(current_app.db)
        
        # Create insight
        insight_id = ai_model.create_insight(
            session_id=data['session_id'],
            client_id=data['client_id'],
            insight_type=data['insight_type'],
            data=data['data'],
            confidence=data.get('confidence')
        )
        
        insight = ai_model.collection.find_one({'_id': insight_id})
        
        return jsonify({
            'message': 'Insight created successfully',
            'insight': ai_model.to_dict(insight)
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/analyze/mock', methods=['POST'])
@jwt_required()
def mock_analysis():
    """Mock AI analysis endpoint for demo purposes"""
    try:
        data = request.get_json()
        
        # Generate mock insights
        emotions = ['Calm', 'Anxious', 'Happy', 'Stressed', 'Neutral']
        stress_levels = ['Low', 'Moderate', 'High']
        engagement_levels = ['Low', 'Medium', 'High']
        
        mock_insights = {
            'emotion': {
                'type': 'emotion',
                'label': 'Emotional State',
                'value': random.choice(emotions),
                'confidence': random.randint(70, 95),
                'color': 'text-success'
            },
            'stress': {
                'type': 'stress',
                'label': 'Stress Level',
                'value': random.choice(stress_levels),
                'confidence': random.randint(65, 90),
                'color': 'text-primary'
            },
            'engagement': {
                'type': 'engagement',
                'label': 'Engagement',
                'value': random.choice(engagement_levels),
                'confidence': random.randint(75, 98),
                'color': 'text-accent'
            }
        }
        
        suggestions = [
            "Consider exploring recent work-related stressors",
            "Client showing openness to discussing coping strategies",
            "Good moment to introduce mindfulness techniques",
            "Notice positive change in body language",
            "Explore family dynamics mentioned earlier"
        ]
        
        return jsonify({
            'insights': mock_insights,
            'suggestions': random.sample(suggestions, 3),
            'overall_progress': random.randint(50, 80)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
