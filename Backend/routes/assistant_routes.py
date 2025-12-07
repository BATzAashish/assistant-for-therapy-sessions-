"""
Assistant Routes
Handles RAG assistant queries and data indexing
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.rag_assistant import RAGAssistant
from bson.objectid import ObjectId
import os

assistant_bp = Blueprint('assistant', __name__)

# Initialize RAG assistant (will be set in init_assistant function)
rag_assistant = None


def init_assistant(db):
    """Initialize RAG assistant with database connection"""
    global rag_assistant
    docs_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'docs')
    rag_assistant = RAGAssistant(docs_folder=docs_folder, db=db)
    print(f"RAG Assistant initialized with docs folder: {docs_folder}")


@assistant_bp.route('/query', methods=['POST'])
@jwt_required()
def query_assistant():
    """
    Query the RAG assistant
    POST /api/assistant/query
    Body: { "query": "your question here", "n_results": 5 }
    """
    try:
        if not rag_assistant:
            return jsonify({'error': 'Assistant not initialized'}), 500
        
        data = request.get_json()
        query = data.get('query')
        n_results = data.get('n_results', 5)
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400
        
        # Query the assistant
        result = rag_assistant.query_assistant(query, n_results=n_results)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@assistant_bp.route('/initialize', methods=['POST'])
@jwt_required()
def initialize_assistant():
    """
    Initialize/Re-index all data (PDFs, notes, clients) for the RAG system
    POST /api/assistant/initialize
    Body: { "chunk_size": 1000 } (optional)
    """
    try:
        if not rag_assistant:
            return jsonify({'error': 'Assistant not initialized'}), 500
        
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        chunk_size = data.get('chunk_size', 1000)
        
        # Initialize all data sources
        result = rag_assistant.initialize_all_data(
            therapist_id=current_user_id,
            chunk_size=chunk_size
        )
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@assistant_bp.route('/index-notes', methods=['POST'])
@jwt_required()
def index_notes():
    """
    Index notes for the current therapist
    POST /api/assistant/index-notes
    """
    try:
        if not rag_assistant:
            return jsonify({'error': 'Assistant not initialized'}), 500
        
        current_user_id = get_jwt_identity()
        
        result = rag_assistant.index_notes(therapist_id=current_user_id)
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@assistant_bp.route('/index-clients', methods=['POST'])
@jwt_required()
def index_clients():
    """
    Index client records for the current therapist
    POST /api/assistant/index-clients
    """
    try:
        if not rag_assistant:
            return jsonify({'error': 'Assistant not initialized'}), 500
        
        current_user_id = get_jwt_identity()
        
        result = rag_assistant.index_clients(therapist_id=current_user_id)
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@assistant_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """
    Get statistics about the RAG system
    GET /api/assistant/stats
    """
    try:
        if not rag_assistant:
            return jsonify({'error': 'Assistant not initialized'}), 500
        
        result = rag_assistant.get_stats()
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@assistant_bp.route('/clear', methods=['POST'])
@jwt_required()
def clear_database():
    """
    Clear the entire vector database
    POST /api/assistant/clear
    WARNING: This deletes all indexed data
    """
    try:
        if not rag_assistant:
            return jsonify({'error': 'Assistant not initialized'}), 500
        
        result = rag_assistant.clear_database()
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@assistant_bp.route('/upload-pdf', methods=['POST'])
@jwt_required()
def upload_pdf():
    """
    Upload and process a PDF file
    POST /api/assistant/upload-pdf
    """
    try:
        if not rag_assistant:
            return jsonify({'error': 'Assistant not initialized'}), 500
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.pdf'):
            return jsonify({'error': 'Only PDF files are allowed'}), 400
        
        # Save file to docs folder
        docs_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'docs')
        os.makedirs(docs_folder, exist_ok=True)
        
        file_path = os.path.join(docs_folder, file.filename)
        file.save(file_path)
        
        # Process the PDF
        result = rag_assistant.add_pdf(file_path)
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
