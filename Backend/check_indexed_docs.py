"""
Check which PDFs are indexed in the vector store
"""
import chromadb

# Connect to ChromaDB
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_collection(name="therapy_documents")

# Get all documents
print("Fetching all documents from vector store...")
results = collection.get(include=['metadatas'])

# Count by type and source
pdf_sources = set()
note_count = 0
client_count = 0

for metadata in results['metadatas']:
    doc_type = metadata.get('type', 'unknown')
    if doc_type == 'pdf':
        source = metadata.get('source', 'unknown')
        pdf_sources.add(source)
    elif doc_type == 'note':
        note_count += 1
    elif doc_type == 'client':
        client_count += 1

print(f"\n{'='*60}")
print("VECTOR STORE INDEX STATUS")
print(f"{'='*60}")
print(f"\nTotal documents: {len(results['ids'])}")
print(f"\nPDF Documents: {len(results['metadatas']) - note_count - client_count}")
print(f"  Unique PDF files indexed:")
for source in sorted(pdf_sources):
    print(f"    - {source}")

print(f"\nSession Notes: {note_count} documents")
print(f"Client Records: {client_count} documents")

print(f"\n{'='*60}")
