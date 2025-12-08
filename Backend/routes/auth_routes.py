from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from models.user import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new therapist user"""
    try:
        # Check if database is connected
        if current_app.db is None:
            return jsonify({'error': 'Database not connected. Please ensure MongoDB is running.'}), 503
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'username', 'password', 'full_name']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        user_model = User(current_app.db)
        
        # Check if user already exists
        if user_model.find_by_email(data['email']):
            return jsonify({'error': 'Email already registered'}), 409
        
        if user_model.find_by_username(data['username']):
            return jsonify({'error': 'Username already taken'}), 409
        
        # Create user
        user_id = user_model.create_user(
            email=data['email'],
            username=data['username'],
            password=data['password'],
            full_name=data['full_name'],
            specialization=data.get('specialization')
        )
        
        # Get created user
        user = user_model.find_by_id(user_id)
        
        # Generate tokens
        access_token = create_access_token(identity=user_id)
        refresh_token = create_refresh_token(identity=user_id)
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user_model.to_dict(user),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login a therapist user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        identifier = data.get('email') or data.get('username')
        password = data.get('password')
        
        print(f"\n[LOGIN] Attempting login for: {identifier}")
        print(f"[LOGIN] Database object: {current_app.db}")
        
        if not identifier or not password:
            return jsonify({'error': 'Username/email and password are required'}), 400
        
        user_model = User(current_app.db)
        
        # Find user by email or username
        print(f"[LOGIN] Searching by email: {identifier}")
        user = user_model.find_by_email(identifier)
        print(f"[LOGIN] Email search result: {user is not None}")
        
        if not user:
            print(f"[LOGIN] Searching by username: {identifier}")
            user = user_model.find_by_username(identifier)
            print(f"[LOGIN] Username search result: {user is not None}")
        
        if not user:
            print(f"[LOGIN] User not found: {identifier}")
            return jsonify({'error': 'Invalid credentials'}), 401
        
        print(f"[LOGIN] User found: {user.get('username')} ({user.get('email')})")
        
        # Verify password
        password_valid = user_model.verify_password(user, password)
        print(f"[LOGIN] Password valid: {password_valid}")
        
        if not password_valid:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Check if user is active
        if not user.get('is_active', True):
            return jsonify({'error': 'Account is inactive'}), 403
        
        # Generate tokens
        user_id = str(user['_id'])
        access_token = create_access_token(identity=user_id)
        refresh_token = create_refresh_token(identity=user_id)
        
        return jsonify({
            'message': 'Login successful',
            'user': user_model.to_dict(user),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        current_user_id = get_jwt_identity()
        access_token = create_access_token(identity=current_user_id)
        
        return jsonify({
            'access_token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    try:
        current_user_id = get_jwt_identity()
        user_model = User(current_app.db)
        
        user = user_model.find_by_id(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': user_model.to_dict(user)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/update-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Fields that can be updated
        allowed_fields = ['full_name', 'specialization']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        user_model = User(current_app.db)
        
        if user_model.update_user(current_user_id, update_data):
            user = user_model.find_by_id(current_user_id)
            return jsonify({
                'message': 'Profile updated successfully',
                'user': user_model.to_dict(user)
            }), 200
        else:
            return jsonify({'error': 'Failed to update profile'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
