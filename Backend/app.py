from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from pymongo import MongoClient
from config import config
import os

# Initialize Flask app
app = Flask(__name__)
app.url_map.strict_slashes = False

# Load configuration
env = os.environ.get('FLASK_ENV', 'development')
app.config.from_object(config[env])

# Initialize Socket.IO with polling only to avoid WebSocket errors in development
socketio = SocketIO(
    app, 
    cors_allowed_origins="*",
    async_mode='threading',
    logger=False,
    engineio_logger=False,
    # Use polling only - more reliable in development
    transports=['polling'],
    # Disable WebSocket upgrades
    allow_upgrades=False,
    # Increase timeouts
    ping_timeout=60,
    ping_interval=25,
    # CORS settings
    cors_credentials=True
)

# Initialize extensions
CORS(app, 
     resources={r"/api/*": {
         "origins": app.config['CORS_ORIGINS'],
         "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"],
         "expose_headers": ["Content-Type", "Authorization"],
         "supports_credentials": True,
         "max_age": 3600
     }})
jwt = JWTManager(app)

# Initialize MongoDB
try:
    mongo_client = MongoClient(
        app.config['MONGO_URI'],
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=30000,
        socketTimeoutMS=30000,
        retryWrites=True,
        retryReads=True
    )
    db = mongo_client.get_database()
    # Test the connection
    db.command('ping')
    print("Successfully connected to MongoDB!")
except Exception as e:
    print(f"Warning: Could not connect to MongoDB: {e}")
    print("Note: Make sure MongoDB is running or update MONGO_URI in config")
    db = None

# Make db available to routes
app.db = db

# Import routes
from routes.auth_routes import auth_bp
from routes.client_routes import client_bp
from routes.session_routes import session_bp
from routes.notes_routes import notes_bp
from routes.ai_routes import ai_bp
from routes.meeting_routes import meeting_bp
from routes.webrtc_routes import webrtc_bp, init_socketio
from routes.emotion_routes import emotion_bp

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(client_bp, url_prefix='/api/clients')
app.register_blueprint(session_bp, url_prefix='/api/sessions')
app.register_blueprint(notes_bp, url_prefix='/api/notes')
app.register_blueprint(ai_bp, url_prefix='/api/ai')
app.register_blueprint(meeting_bp, url_prefix='/api/meetings')
app.register_blueprint(webrtc_bp, url_prefix='/api/webrtc')
app.register_blueprint(emotion_bp, url_prefix='/api/emotion')

# Initialize WebRTC Socket.IO handlers
init_socketio(socketio, db)

# Debug: Print all registered routes
print("\nRegistered Routes:")
for rule in app.url_map.iter_rules():
    methods = ', '.join(sorted(rule.methods - {'HEAD', 'OPTIONS'}))
    print(f"  {rule.endpoint:50s} {methods:30s} {rule.rule}")
print()

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
    # Run with Socket.IO
    socketio.run(app, debug=app.config['DEBUG'], host='0.0.0.0', port=5000)
