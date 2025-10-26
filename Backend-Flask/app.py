from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from config import config
import os

# Initialize Flask app
app = Flask(__name__)

# Load configuration
env = os.environ.get('FLASK_ENV', 'development')
app.config.from_object(config[env])

# Initialize extensions
CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})
jwt = JWTManager(app)

# Initialize MongoDB
try:
    mongo_client = MongoClient(app.config['MONGO_URI'])
    db = mongo_client.get_database()
    # Test the connection
    db.command('ping')
    print("✓ Successfully connected to MongoDB!")
except Exception as e:
    print(f"✗ Error connecting to MongoDB: {e}")
    db = None

# Make db available to routes
app.db = db

# Import routes
from routes.auth_routes import auth_bp
from routes.client_routes import client_bp
from routes.session_routes import session_bp
from routes.notes_routes import notes_bp
from routes.ai_routes import ai_bp

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(client_bp, url_prefix='/api/clients')
app.register_blueprint(session_bp, url_prefix='/api/sessions')
app.register_blueprint(notes_bp, url_prefix='/api/notes')
app.register_blueprint(ai_bp, url_prefix='/api/ai')

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'database': 'connected' if db is not None else 'disconnected',
        'environment': env
    }), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

# JWT error handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Authorization token is missing'}), 401

if __name__ == '__main__':
    app.run(debug=app.config['DEBUG'], host='0.0.0.0', port=5000)
