from flask import Blueprint, request, jsonify
import jwt
import datetime
import bcrypt
from utils.db import db
from utils.config import Config
from functools import wraps

auth_bp = Blueprint('auth', __name__)

# Middleware for JWT verification
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            # Assumes 'Bearer <token>'
            if token.startswith('Bearer '):
                token = token.split(" ")[1]
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=[Config.ALGORITHM])
            current_user = db.users.find_one({'email': data['email']})
        except Exception as e:
            return jsonify({'message': f'Token is invalid! Error: {str(e)}'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({'message': 'All fields are required!'}), 400

    # Check if user already exists
    if db.users.find_one({'email': email}):
        return jsonify({'message': 'User already exists!'}), 400

    # Hash password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Save to MongoDB
    user = {
        'name': name,
        'email': email,
        'password': hashed_password,
        'created_at': datetime.datetime.utcnow()
    }
    db.users.insert_one(user)

    return jsonify({'message': 'User registered successfully!'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user and return JWT."""
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email and password are required!'}), 400

    user = db.users.find_one({'email': email})

    if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        token = jwt.encode({
            'email': user['email'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)
        }, Config.SECRET_KEY, algorithm=Config.ALGORITHM)
        
        return jsonify({
            'message': 'Login successful!',
            'token': token,
            'user': {'name': user['name'], 'email': user['email']}
        }), 200

    return jsonify({'message': 'Invalid credentials!'}), 401
