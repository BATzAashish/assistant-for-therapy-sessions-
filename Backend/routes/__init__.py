from .auth_routes import auth_bp
from .client_routes import client_bp
from .session_routes import session_bp
from .notes_routes import notes_bp
from .ai_routes import ai_bp

__all__ = ['auth_bp', 'client_bp', 'session_bp', 'notes_bp', 'ai_bp']
