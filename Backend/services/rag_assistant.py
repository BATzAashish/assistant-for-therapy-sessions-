"""
RAG Assistant Service
Orchestrates the RAG pipeline: retrieval and generation
Includes PDFs, session notes, and client records
"""
from typing import Dict, List, Optional
import google.generativeai as genai
import os
from datetime import datetime
from bson.objectid import ObjectId
from .pdf_processing import PDFProcessor
from .vector_store import VectorStore


class RAGAssistant:
    def __init__(self, docs_folder: str = "./docs", db=None):
        """Initialize RAG Assistant with all components"""
        self.pdf_processor = PDFProcessor(docs_folder)
        self.vector_store = VectorStore()
        self.db = db  # MongoDB database instance
        
        # Initialize Gemini API
        api_key = os.getenv('GEMINI_API_KEY')
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash-exp')  # Updated model name
        else:
            print("Warning: GEMINI_API_KEY not found. Generation will fail.")
            self.model = None
    
    def initialize_from_pdfs(self, chunk_size: int = 1000) -> Dict[str, any]:
        """
        Process all PDFs in docs folder and store in vector database
        This should be called on startup or when new PDFs are added
        """
        try:
            print("Processing PDFs...")
            chunks = self.pdf_processor.process_all_pdfs(chunk_size=chunk_size)
            
            if not chunks:
                return {
                    "success": False,
                    "message": "No PDFs found or processed",
                    "chunks_processed": 0
                }
            
            print(f"Adding {len(chunks)} chunks to vector store...")
            self.vector_store.add_documents(chunks)
            
            return {
                "success": True,
                "message": "PDFs processed and stored successfully",
                "chunks_processed": len(chunks)
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error initializing from PDFs: {str(e)}",
                "chunks_processed": 0
            }
    
    def add_pdf(self, pdf_path: str, chunk_size: int = 1000) -> Dict[str, any]:
        """Add a single PDF to the system"""
        try:
            print(f"Processing PDF: {pdf_path}")
            chunks = self.pdf_processor.process_pdf(pdf_path, chunk_size=chunk_size)
            
            if not chunks:
                return {
                    "success": False,
                    "message": "No content extracted from PDF",
                    "chunks_processed": 0
                }
            
            print(f"Adding {len(chunks)} chunks to vector store...")
            self.vector_store.add_documents(chunks)
            
            return {
                "success": True,
                "message": f"PDF processed successfully",
                "chunks_processed": len(chunks),
                "filename": os.path.basename(pdf_path)
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error processing PDF: {str(e)}",
                "chunks_processed": 0
            }
    
    def retrieve_context(self, query: str, n_results: int = 5) -> List[Dict[str, any]]:
        """Retrieve relevant context chunks for a query"""
        results = self.vector_store.query(query, n_results=n_results)
        return results.get("results", [])
    
    def generate_response(self, query: str, context_chunks: List[Dict[str, any]]) -> str:
        """Generate response using Gemini (primary) or Groq (fallback) with retrieved context"""
        # Build context from chunks (without source labels - cleaner)
        context = "\n\n---\n\n".join([chunk['text'] for chunk in context_chunks])
        
        print(f"Context length: {len(context)} characters from {len(context_chunks)} chunks")
        
        # Create improved prompt for therapy-specific responses
        prompt = f"""You are an expert therapy assistant with deep knowledge of psychological treatments, therapeutic techniques, and mental health interventions.

Your role is to provide actionable, evidence-based guidance for therapists working with clients. Always:
- Give specific, practical recommendations
- Reference therapeutic approaches (CBT, DBT, psychodynamic, etc.) when relevant
- Provide concrete techniques, exercises, or interventions
- Be direct and professional, avoiding generic statements
- Focus on what the therapist should DO, not just theory

Use ONLY the information provided below to answer. If the context doesn't contain sufficient information, briefly state what's missing rather than giving generic advice.

CONTEXT FROM THERAPY RESOURCES:
{context}

THERAPIST'S QUESTION: {query}

ANSWER (Be specific, actionable, and practical):"""
        
        # Try Gemini first
        if self.model:
            try:
                print("Attempting Gemini generation...")
                response = self.model.generate_content(prompt)
                print("Gemini generation successful!")
                return response.text
            except Exception as e:
                error_msg = str(e)
                if "429" in error_msg or "quota" in error_msg.lower():
                    print(f"Gemini quota exceeded, falling back to Groq")
                else:
                    print(f"Gemini error: {e}, falling back to Groq")
        
        # Fallback to Groq
        groq_api_key = os.getenv('GROQ_API_KEY')
        if groq_api_key:
            try:
                print("Attempting Groq generation...")
                from groq import Groq
                groq_client = Groq(api_key=groq_api_key)
                
                response = groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",  # Fast and accurate
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert therapy assistant providing practical, evidence-based guidance to mental health professionals. Always give specific, actionable recommendations based on the provided context."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.3,  # Lower temperature for more focused responses
                    max_tokens=1500  # Allow longer, more detailed answers
                )
                
                answer = response.choices[0].message.content
                print(f"Groq generation successful! Response length: {len(answer)} characters")
                return answer
            except Exception as e:
                error_msg = f"Error generating response with Groq: {str(e)}"
                print(error_msg)
                return error_msg
        
        return "Error: No AI service available. Please configure GEMINI_API_KEY or GROQ_API_KEY."
    
    def query_assistant(self, query: str, n_results: int = 5) -> Dict[str, any]:
        """
        Main query interface for the RAG assistant
        Full RAG pipeline: Query → Retrieve → Rerank → Generate
        """
        try:
            # Step 1: Query Preprocessing (basic cleaning)
            cleaned_query = query.strip()
            print(f"Retrieving context for query: {cleaned_query}")
            
            # Step 2: Retrieval - Fetch top relevant chunks from vector DB
            context_chunks = self.retrieve_context(cleaned_query, n_results=n_results)
            
            if not context_chunks:
                return {
                    "success": True,
                    "query": query,
                    "answer": "I couldn't find any relevant information in the document database to answer your question.",
                    "sources": [],
                    "context_used": []
                }
            
            # Step 3: Re-Ranking - Improve relevance with hybrid scoring
            print(f"Re-ranking {len(context_chunks)} chunks...")
            top_chunks = self.vector_store.rerank_chunks(cleaned_query, context_chunks, top_k=3)
            
            # Step 4: Context Construction - Build prompt with top chunks
            print(f"Using {len(top_chunks)} chunks for generation")
            
            # Step 5: LLM Generation - Generate grounded answer
            print("Generating response...")
            answer = self.generate_response(cleaned_query, top_chunks)
            
            # Step 6: Post-Processing - Extract sources and metadata
            sources = list(set([chunk["metadata"].get("source", "unknown") for chunk in top_chunks]))
            
            return {
                "success": True,
                "query": query,
                "answer": answer,
                "sources": sources,
                "context_used": [
                    {
                        "text": chunk["text"][:200] + "...",  # Truncate for response
                        "source": chunk["metadata"].get("source", "unknown"),
                        "similarity": chunk.get("similarity", 0),
                        "rerank_score": chunk.get("rerank_score", 0)
                    }
                    for chunk in top_chunks
                ]
            }
        except Exception as e:
            return {
                "success": False,
                "query": query,
                "error": str(e)
            }
    
    def get_stats(self) -> Dict[str, any]:
        """Get statistics about the RAG system"""
        return self.vector_store.get_collection_stats()
    
    def clear_database(self) -> Dict[str, any]:
        """Clear the vector database"""
        try:
            self.vector_store.clear_collection()
            return {
                "success": True,
                "message": "Vector database cleared successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error clearing database: {str(e)}"
            }
    
    def index_notes(self, therapist_id: str, chunk_size: int = 800) -> Dict[str, any]:
        """
        Index all notes for a therapist into the vector store
        """
        if self.db is None:
            return {"success": False, "message": "Database not available"}
        
        try:
            # Fetch all notes for the therapist
            notes = list(self.db.notes.find({'therapist_id': ObjectId(therapist_id)}))
            
            if not notes:
                return {
                    "success": True,
                    "message": "No notes found to index",
                    "chunks_processed": 0
                }
            
            chunks = []
            for note in notes:
                # Get client info for better context
                client = self.db.clients.find_one({'_id': note['client_id']})
                client_name = client['name'] if client else "Unknown Client"
                
                # Get session info if available
                session = None
                session_date = "Unknown Date"
                if note.get('session_id'):
                    session = self.db.sessions.find_one({'_id': note['session_id']})
                    if session and session.get('scheduled_time'):
                        session_date = session['scheduled_time'].strftime('%Y-%m-%d')
                
                # Combine note content
                note_content = f"""
Client: {client_name}
Session Date: {session_date}
Note Type: {note.get('note_type', 'session')}

Content:
{note.get('content', '')}

{f"AI Summary: {note.get('ai_summary', '')}" if note.get('ai_summary') else ''}
{f"Action Items: {', '.join(note.get('action_items', []))}" if note.get('action_items') else ''}
                """.strip()
                
                # Chunk the note if it's too long
                if len(note_content) > chunk_size:
                    note_chunks = self.pdf_processor.chunk_text(note_content, chunk_size=chunk_size)
                    for i, chunk_text in enumerate(note_chunks):
                        chunks.append({
                            "text": chunk_text,
                            "metadata": {
                                "source": f"Note - {client_name} - {session_date}",
                                "type": "note",
                                "client_id": str(note['client_id']),
                                "note_id": str(note['_id']),
                                "session_date": session_date,
                                "chunk_index": i
                            }
                        })
                else:
                    chunks.append({
                        "text": note_content,
                        "metadata": {
                            "source": f"Note - {client_name} - {session_date}",
                            "type": "note",
                            "client_id": str(note['client_id']),
                            "note_id": str(note['_id']),
                            "session_date": session_date,
                            "chunk_index": 0
                        }
                    })
            
            # Add to vector store
            self.vector_store.add_documents(chunks)
            
            return {
                "success": True,
                "message": f"Indexed {len(notes)} notes into {len(chunks)} chunks",
                "notes_processed": len(notes),
                "chunks_processed": len(chunks)
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error indexing notes: {str(e)}",
                "chunks_processed": 0
            }
    
    def index_clients(self, therapist_id: str) -> Dict[str, any]:
        """
        Index all clients for a therapist into the vector store
        """
        if self.db is None:
            return {"success": False, "message": "Database not available"}
        
        try:
            # Fetch all clients for the therapist
            clients = list(self.db.clients.find({'therapist_id': ObjectId(therapist_id)}))
            
            if not clients:
                return {
                    "success": True,
                    "message": "No clients found to index",
                    "chunks_processed": 0
                }
            
            chunks = []
            for client in clients:
                # Build comprehensive client record
                client_info = f"""
Client Profile: {client['name']}
Email: {client.get('email', 'N/A')}
Phone: {client.get('phone', 'N/A')}
Date of Birth: {client.get('date_of_birth', 'N/A')}
Status: {client.get('status', 'active')}
Emergency Contact: {client.get('emergency_contact', 'N/A')}

Notes:
{client.get('notes', 'No additional notes')}

Created: {client.get('created_at', 'Unknown').strftime('%Y-%m-%d') if isinstance(client.get('created_at'), datetime) else 'Unknown'}
                """.strip()
                
                chunks.append({
                    "text": client_info,
                    "metadata": {
                        "source": f"Client Profile - {client['name']}",
                        "type": "client",
                        "client_id": str(client['_id']),
                        "client_name": client['name']
                    }
                })
            
            # Add to vector store
            self.vector_store.add_documents(chunks)
            
            return {
                "success": True,
                "message": f"Indexed {len(clients)} client records",
                "clients_processed": len(clients),
                "chunks_processed": len(chunks)
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error indexing clients: {str(e)}",
                "chunks_processed": 0
            }
    
    def initialize_all_data(self, therapist_id: str, chunk_size: int = 1000) -> Dict[str, any]:
        """
        Initialize RAG system with all data: PDFs, notes, and client records
        """
        results = {
            "pdfs": self.initialize_from_pdfs(chunk_size=chunk_size),
            "notes": self.index_notes(therapist_id, chunk_size=chunk_size),
            "clients": self.index_clients(therapist_id)
        }
        
        total_chunks = (
            results['pdfs'].get('chunks_processed', 0) +
            results['notes'].get('chunks_processed', 0) +
            results['clients'].get('chunks_processed', 0)
        )
        
        return {
            "success": True,
            "message": f"Initialized RAG system with {total_chunks} total chunks",
            "details": results,
            "total_chunks": total_chunks
        }

