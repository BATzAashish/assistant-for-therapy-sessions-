"""
PDF Processing Service
Handles PDF extraction and chunking for RAG pipeline
"""
import os
from typing import List, Dict
import PyPDF2


class PDFProcessor:
    def __init__(self, docs_folder: str = "./docs"):
        """Initialize PDF processor with docs folder path"""
        self.docs_folder = docs_folder
        
        # Create docs folder if it doesn't exist
        if not os.path.exists(docs_folder):
            os.makedirs(docs_folder)
            print(f"Created docs folder: {docs_folder}")
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from a PDF file"""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text
        except Exception as e:
            print(f"Error extracting text from {pdf_path}: {e}")
            return ""
    
    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """
        Split text into overlapping chunks
        
        Args:
            text: Text to chunk
            chunk_size: Size of each chunk in characters
            overlap: Number of characters to overlap between chunks
        
        Returns:
            List of text chunks
        """
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + chunk_size
            chunk = text[start:end]
            
            # Only add non-empty chunks
            if chunk.strip():
                chunks.append(chunk.strip())
            
            start += (chunk_size - overlap)
        
        return chunks
    
    def process_pdf(self, pdf_path: str, chunk_size: int = 1000) -> List[Dict[str, any]]:
        """
        Process a single PDF file: extract text and chunk it
        
        Returns:
            List of chunks with metadata
        """
        if not os.path.exists(pdf_path):
            print(f"PDF not found: {pdf_path}")
            return []
        
        filename = os.path.basename(pdf_path)
        print(f"Processing {filename}...")
        
        # Extract text
        text = self.extract_text_from_pdf(pdf_path)
        if not text.strip():
            print(f"No text extracted from {filename}")
            return []
        
        # Chunk text
        chunks = self.chunk_text(text, chunk_size=chunk_size)
        
        # Add metadata to each chunk
        processed_chunks = [
            {
                "text": chunk,
                "metadata": {
                    "source": filename,
                    "path": pdf_path,
                    "chunk_index": i,
                    "type": "pdf"
                }
            }
            for i, chunk in enumerate(chunks)
        ]
        
        print(f"Extracted {len(processed_chunks)} chunks from {filename}")
        return processed_chunks
    
    def process_all_pdfs(self, chunk_size: int = 1000) -> List[Dict[str, any]]:
        """
        Process all PDFs in the docs folder
        
        Returns:
            List of all chunks from all PDFs with metadata
        """
        all_chunks = []
        
        if not os.path.exists(self.docs_folder):
            print(f"Docs folder not found: {self.docs_folder}")
            return all_chunks
        
        pdf_files = [f for f in os.listdir(self.docs_folder) if f.endswith('.pdf')]
        
        if not pdf_files:
            print(f"No PDF files found in {self.docs_folder}")
            return all_chunks
        
        print(f"Found {len(pdf_files)} PDF files")
        
        for pdf_file in pdf_files:
            pdf_path = os.path.join(self.docs_folder, pdf_file)
            chunks = self.process_pdf(pdf_path, chunk_size=chunk_size)
            all_chunks.extend(chunks)
        
        return all_chunks
