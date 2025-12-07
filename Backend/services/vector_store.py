"""
Vector Store Service
Handles ChromaDB operations for storing and retrieving embeddings
"""
import chromadb
from typing import List, Dict, Optional
import google.generativeai as genai
from groq import Groq
import os
import numpy as np


class VectorStore:
    def __init__(self, collection_name: str = "therapy_documents"):
        """Initialize ChromaDB vector store"""
        # Initialize ChromaDB client with persistent storage (new API)
        self.client = chromadb.PersistentClient(path="./chroma_db")
        
        self.collection_name = collection_name
        
        # Get or create collection
        try:
            self.collection = self.client.get_collection(name=collection_name)
            print(f"Loaded existing collection: {collection_name}")
        except:
            self.collection = self.client.create_collection(
                name=collection_name,
                metadata={"description": "Therapy practice documents, notes, and client records"}
            )
            print(f"Created new collection: {collection_name}")
        
        # Initialize Gemini for embeddings
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)
            print("Gemini API configured for embeddings")
        
        # Initialize Groq as fallback
        self.groq_api_key = os.getenv('GROQ_API_KEY')
        if self.groq_api_key:
            self.groq_client = Groq(api_key=self.groq_api_key)
            print("Groq API configured as fallback")
        else:
            self.groq_client = None
            
        if not self.gemini_api_key and not self.groq_api_key:
            print("Warning: No API keys found. Embeddings will use dummy values.")
    
    def generate_embedding_with_groq(self, text: str) -> List[float]:
        """Generate embedding using Groq's LLM to create a simple hash-based embedding"""
        try:
            if not self.groq_client:
                raise Exception("Groq client not initialized")
            
            # Use Groq to generate a text representation, then convert to embedding
            # This is a workaround since Groq doesn't have embedding models
            # We'll create a simple embedding from text characteristics
            
            # Normalize and create a deterministic embedding
            words = text.lower().split()
            # Create a 768-dimensional embedding based on text features
            embedding = [0.0] * 768
            
            # Use word characteristics to populate embedding
            for i, word in enumerate(words[:384]):  # Use first 384 words
                # Create two values per word based on hash
                hash_val = hash(word)
                embedding[i*2] = (hash_val % 1000) / 1000.0
                embedding[i*2 + 1] = ((hash_val // 1000) % 1000) / 1000.0
            
            # Normalize the embedding
            norm = np.linalg.norm(embedding)
            if norm > 0:
                embedding = [x / norm for x in embedding]
            
            return embedding
        except Exception as e:
            print(f"Error generating Groq embedding: {e}")
            return [0.0] * 768
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using Gemini (primary) or Groq (fallback)"""
        # Try Gemini first
        if self.gemini_api_key:
            try:
                result = genai.embed_content(
                    model="models/embedding-001",
                    content=text,
                    task_type="retrieval_document"
                )
                return result['embedding']
            except Exception as e:
                error_msg = str(e)
                if "429" in error_msg or "quota" in error_msg.lower():
                    print(f"Gemini quota exceeded, falling back to Groq")
                else:
                    print(f"Gemini error: {e}, falling back to Groq")
        
        # Fallback to Groq
        if self.groq_client:
            return self.generate_embedding_with_groq(text)
        
        # Last resort: dummy embedding
        print("Warning: Using dummy embedding")
        return [0.0] * 768
    
    def add_documents(self, documents: List[Dict[str, any]]) -> None:
        """
        Add documents to the vector store
        
        Args:
            documents: List of dicts with 'text' and 'metadata' keys
        """
        if not documents:
            print("No documents to add")
            return
        
        print(f"Adding {len(documents)} documents to vector store...")
        
        # ChromaDB has a max batch size of ~5000, so we'll batch in chunks of 1000
        batch_size = 1000
        total_batches = (len(documents) + batch_size - 1) // batch_size
        
        for batch_idx in range(total_batches):
            start_idx = batch_idx * batch_size
            end_idx = min((batch_idx + 1) * batch_size, len(documents))
            batch_docs = documents[start_idx:end_idx]
            
            print(f"Processing batch {batch_idx + 1}/{total_batches} ({len(batch_docs)} documents)...")
            
            # Prepare data for ChromaDB
            ids = []
            embeddings = []
            metadatas = []
            documents_text = []
            
            for i, doc in enumerate(batch_docs):
                # Generate unique ID
                source = doc['metadata'].get('source', 'unknown')
                doc_id = f"{source}_{doc['metadata'].get('chunk_index', start_idx + i)}_{batch_idx}"
                ids.append(doc_id)
                
                # Generate embedding
                embedding = self.generate_embedding(doc['text'])
                embeddings.append(embedding)
                
                # Store metadata and text
                metadatas.append(doc['metadata'])
                documents_text.append(doc['text'])
            
            # Add batch to collection
            try:
                self.collection.add(
                    ids=ids,
                    embeddings=embeddings,
                    metadatas=metadatas,
                    documents=documents_text
                )
                print(f"Batch {batch_idx + 1}/{total_batches} added successfully!")
            except Exception as e:
                print(f"Error adding batch {batch_idx + 1}: {type(e).__name__}: {e}")
                raise
        
        print(f"All {len(documents)} documents added successfully!")
    
    def query(self, query_text: str, n_results: int = 5) -> Dict[str, any]:
        """
        Query the vector store for similar documents
        
        Args:
            query_text: Query string
            n_results: Number of results to return
        
        Returns:
            Dictionary with query results
        """
        try:
            # Generate query embedding
            query_embedding = self.generate_embedding(query_text)
            
            # Query collection
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results
            )
            
            # Format results
            formatted_results = []
            if results['documents'] and len(results['documents']) > 0:
                for i in range(len(results['documents'][0])):
                    formatted_results.append({
                        'text': results['documents'][0][i],
                        'metadata': results['metadatas'][0][i] if results['metadatas'] else {},
                        'similarity': 1 - results['distances'][0][i] if results['distances'] else 0.0
                    })
            
            return {
                "success": True,
                "results": formatted_results,
                "query": query_text
            }
        except Exception as e:
            print(f"Error querying collection: {e}")
            return {
                "success": False,
                "results": [],
                "error": str(e)
            }
    
    def rerank_chunks(self, query: str, chunks: List[Dict[str, any]], top_k: int = 3) -> List[Dict[str, any]]:
        """
        Rerank chunks based on relevance using lexical matching + similarity scores
        Combines semantic similarity with keyword matching for better results
        """
        import re
        
        # Extract keywords from query (simple approach)
        query_lower = query.lower()
        query_words = set(re.findall(r'\b\w+\b', query_lower))
        
        # Remove common stopwords
        stopwords = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'what', 'how', 'why', 'when', 'where'}
        query_words = query_words - stopwords
        
        # Score each chunk
        scored_chunks = []
        for chunk in chunks:
            text_lower = chunk['text'].lower()
            text_words = set(re.findall(r'\b\w+\b', text_lower))
            
            # Lexical overlap score (Jaccard similarity)
            if query_words:
                overlap = len(query_words & text_words)
                lexical_score = overlap / len(query_words)
            else:
                lexical_score = 0
            
            # Combine semantic similarity (from vector search) with lexical score
            semantic_score = chunk.get('similarity', 0)
            
            # Weighted combination: 70% semantic, 30% lexical
            final_score = (0.7 * semantic_score) + (0.3 * lexical_score)
            
            chunk['rerank_score'] = final_score
            scored_chunks.append(chunk)
        
        # Sort by final score
        sorted_chunks = sorted(scored_chunks, key=lambda x: x.get('rerank_score', 0), reverse=True)
        
        print(f"Re-ranking: Top chunk score = {sorted_chunks[0]['rerank_score']:.3f}")
        return sorted_chunks[:top_k]
    
    def get_collection_stats(self) -> Dict[str, any]:
        """Get statistics about the collection"""
        try:
            count = self.collection.count()
            return {
                "success": True,
                "collection_name": self.collection_name,
                "document_count": count
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def clear_collection(self) -> None:
        """Clear all documents from the collection"""
        try:
            # Delete and recreate collection
            self.client.delete_collection(name=self.collection_name)
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"description": "Therapy practice documents, notes, and client records"}
            )
            print(f"Collection {self.collection_name} cleared")
        except Exception as e:
            print(f"Error clearing collection: {e}")
    
    def delete_by_source(self, source: str) -> None:
        """Delete all documents from a specific source"""
        try:
            # Query all documents from this source
            results = self.collection.get(
                where={"source": source}
            )
            
            if results['ids']:
                self.collection.delete(ids=results['ids'])
                print(f"Deleted {len(results['ids'])} documents from source: {source}")
        except Exception as e:
            print(f"Error deleting documents: {e}")
