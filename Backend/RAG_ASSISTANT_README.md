# RAG Assistant Setup Guide

## Overview
The RAG (Retrieval-Augmented Generation) Assistant is an AI-powered feature that allows you to query your therapy practice data including:
- 📄 PDF documents (therapy resources, guides, etc.)
- 📝 Session notes
- 👥 Client records

## Architecture
The system follows the flow diagram you provided:

```
1. Input PDFs → Process & Chunk → Generate Embeddings → Store in ChromaDB
2. Index Notes → Process & Chunk → Generate Embeddings → Store in ChromaDB
3. Index Clients → Process → Generate Embeddings → Store in ChromaDB
4. User Query → Retrieve Relevant Chunks → Rerank → Generate Response → Display
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd Backend
pip install -r requirements.txt
```

New packages added:
- `chromadb>=0.4.0` - Vector database for embeddings
- `PyPDF2>=3.0.0` - PDF text extraction

### 2. Set up API Keys
The system uses Google's Gemini API as primary and Groq as fallback for embeddings and text generation.

Add to your `.env` file:
```
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

**Get your API keys:**
- Gemini (free tier): https://makersuite.google.com/app/apikey
- Groq (free tier): https://console.groq.com/keys

**Why two API keys?**
- Gemini has usage quotas (1500 requests/day free tier)
- Groq provides fallback with higher limits and faster responses
- System automatically switches if Gemini quota is exceeded

### 3. Create docs folder
Place your PDF resources in the `Backend/docs` folder:
```bash
mkdir Backend/docs
# Add your PDF files here
```

### 4. Run the Backend
```bash
cd Backend
python app.py
```

The RAG assistant will be automatically initialized on startup.

### 5. Access the Assistant
Navigate to the Dashboard and click on "Assistant" in the sidebar.

## Usage

### First Time Setup
1. Go to the "Manage Data" tab
2. Click "Initialize System" to index all data sources
3. Wait for the indexing to complete

### Querying the Assistant
Go to the "Chat" tab and ask questions like:
- "What are the latest notes for John Doe?"
- "Summarize client progress this month"
- "What are the best techniques for anxiety treatment?"
- "Show me clients with depression diagnoses"

### Managing Data

**Index Notes**: Re-index all session notes after adding new ones
**Index Clients**: Re-index client records after updates
**Upload PDF**: Add new therapy resources or guides
**Clear All Data**: Reset the vector database (WARNING: irreversible)

## Features

### Smart Context Retrieval
- Retrieves relevant information from all data sources
- Ranks results by relevance
- Shows source references for transparency

### Multi-Source Integration
- PDFs: Therapy resources, treatment guides
- Notes: Session summaries, AI insights, action items
- Clients: Demographics, contact info, case history

### Privacy & Security
- All data is stored locally in ChromaDB
- JWT authentication required
- Data is isolated per therapist

## API Endpoints

### Query Assistant
```
POST /api/assistant/query
Body: { "query": "your question", "n_results": 5 }
```

### Initialize All Data
```
POST /api/assistant/initialize
Body: { "chunk_size": 1000 }
```

### Index Notes
```
POST /api/assistant/index-notes
```

### Index Clients
```
POST /api/assistant/index-clients
```

### Upload PDF
```
POST /api/assistant/upload-pdf
FormData: { "file": PDF file }
```

### Get Stats
```
GET /api/assistant/stats
```

### Clear Database
```
POST /api/assistant/clear
```

## Technical Details

### Vector Store (ChromaDB)
- Collection: `therapy_documents`
- Storage: `Backend/chroma_db/`
- Embedding Model: Gemini `embedding-001` (768 dimensions)

### Chunking Strategy
- PDF chunks: 1000 characters with 200 char overlap
- Note chunks: 800 characters (preserves context)
- Client records: Single document per client

### Generation Model
- Model: Gemini Pro
- Context window: Includes top 3 most relevant chunks
- Temperature: Default (controlled responses)

## Troubleshooting

### "Assistant not initialized" error
- Ensure MongoDB is running
- Check that `GEMINI_API_KEY` is set in `.env`
- Restart the Flask server

### No results from queries
- Run "Initialize System" to index data
- Check that you have notes/clients/PDFs to index
- Verify Gemini API key is valid

### Slow query responses
- Reduce `n_results` parameter (default: 5)
- Check internet connection (Gemini API requires network)
- Consider upgrading to Gemini API paid tier for faster responses

## Future Enhancements

- [ ] Support for more document formats (Word, Excel)
- [ ] Conversation history and follow-up questions
- [ ] Fine-tuning on therapy-specific language
- [ ] Offline mode with local embeddings
- [ ] Multi-language support
- [ ] Export chat transcripts

## Support

For issues or questions, check the main project README or contact support.
