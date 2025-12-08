# 🧠 TherapyHub - AI-Powered Therapy Assistant Platform

A comprehensive, full-stack therapy session management platform with AI-powered features including real-time emotion detection, automatic transcription, intelligent note generation, and RAG-based therapy assistant.

![Tech Stack](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [License](#license)

---

## 🎯 Overview

TherapyHub is an advanced therapy practice management system designed to help mental health professionals conduct, document, and analyze therapy sessions more effectively. The platform combines traditional session management with cutting-edge AI technologies to provide:

- **Real-time Emotion Detection** during video sessions
- **Automatic Speech-to-Text Transcription** (supports Hindi/English bilingual)
- **AI-Generated Session Notes** with cognitive pattern analysis
- **RAG-Based Therapy Assistant** to query session history and therapy resources
- **Comprehensive Client Management** with progress tracking

---

## ✨ Key Features

### 🎥 **Video Conferencing & Real-Time Analysis**
- WebRTC-based peer-to-peer video calls
- Real-time emotion detection using facial expression recognition (FER)
- Live emotion tracking dashboard with 7 emotions: Happy, Sad, Angry, Surprise, Fear, Disgust, Neutral
- Emotion timeline visualization and analysis
- Socket.io for real-time communication

### 🎤 **Automatic Transcription**
- Browser-based speech recognition (Web Speech API)
- Bilingual support: English + Hindi (Hinglish)
- Real-time transcription during sessions
- Clear speaker identification (THERAPIST vs CLIENT)
- Automatic transcript formatting with timestamps

### 🤖 **AI-Powered Note Generation**
- Automatic session note generation using Gemini/Groq AI
- Structured clinical notes with:
  - Initial Assessment / Follow-up Progress
  - Clinical Observations
  - Cognitive Pattern Analysis (self-blame, avoidance, catastrophizing, etc.)
  - Therapeutic Interventions
  - Action Items & Homework
- RAG context from previous sessions for continuity
- Support for first session vs follow-up sessions

### 🔍 **RAG-Based Therapy Assistant**
- Vector database (ChromaDB) for semantic search
- Query 10,890+ indexed documents including:
  - PDF therapy resources and guides
  - Past session notes
  - Client records
- Gemini embeddings with Groq fallback
- Smart context retrieval and re-ranking
- Therapy-specific response generation

### 👥 **Client & Session Management**
- Complete client profile management
- Session scheduling with calendar view
- Session status tracking (scheduled, in-progress, completed, cancelled)
- Client progress tracking across sessions
- Export session notes as PDF

### 📊 **Analytics & Insights**
- Emotion pattern analysis across sessions
- Cognitive pattern tracking over time
- Progress visualization
- Session statistics and trends

### 🔐 **Security & Authentication**
- JWT-based authentication
- Secure password hashing (bcrypt)
- Role-based access control (therapist/client)
- Protected API endpoints
- MongoDB with connection pooling

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Video UI   │  │ Transcription│  │   Emotion    │     │
│  │  (WebRTC)    │  │   Display    │  │   Monitor    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                    Socket.io + REST API
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Flask + Python)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   WebRTC     │  │  Emotion     │  │   Summary    │     │
│  │   Routes     │  │  Detection   │  │   Service    │     │
│  │              │  │  (FER+CV2)   │  │  (Gemini AI) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     RAG      │  │ Transcription│  │    Auth      │     │
│  │  Assistant   │  │   Service    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
        ┌───────────▼─────────┐  ┌─────▼──────────┐
        │   MongoDB Atlas     │  │   ChromaDB     │
        │   (Sessions, Notes, │  │   (Vector      │
        │   Clients, Users)   │  │   Embeddings)  │
        └─────────────────────┘  └────────────────┘
```

---

## 🛠️ Tech Stack

### **Frontend**
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **shadcn/ui** - Component library
- **Socket.io Client** - Real-time communication
- **Lucide React** - Icons
- **React Router** - Navigation

### **Backend**
- **Flask 3.0** - Web framework
- **Python 3.12** - Programming language
- **Flask-SocketIO** - WebSocket support
- **Flask-JWT-Extended** - Authentication
- **PyMongo** - MongoDB driver
- **Flask-CORS** - Cross-origin support

### **AI & ML**
- **Google Gemini API** - Text generation & embeddings
- **Groq API** - Fast LLM inference (fallback)
- **TensorFlow 2.17** - Deep learning framework
- **OpenCV** - Computer vision
- **MediaPipe** - Face detection
- **FER (Facial Expression Recognition)** - Emotion detection
- **ChromaDB** - Vector database

### **Database**
- **MongoDB Atlas** - Cloud NoSQL database
- **ChromaDB** - Vector store for embeddings

---

## 🚀 Setup Instructions

### **Prerequisites**
- Python 3.12+
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key
- Groq API key

### **1. Clone Repository**
```bash
git clone <repository-url>
cd Assistant-For-Therapist-
```

### **2. Backend Setup**

```bash
cd Backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your configuration (see Environment Variables section)

# Initialize RAG system (index PDFs, notes, clients)
python initialize_rag.py

# Run the Flask server
python app.py
```

The backend will start on `http://localhost:5000`

### **3. Frontend Setup**

```bash
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start on `http://localhost:5173`

---

## 🔑 Environment Variables

### **Backend (.env)**

Create a `.env` file in the `Backend` directory:

```env
# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/therapy_assistant?retryWrites=true&w=majority

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# AI API Keys
GEMINI_API_KEY=your-gemini-api-key-here
GROQ_API_KEY=your-groq-api-key-here

# AI Provider (gemini or groq)
AI_PROVIDER=gemini

# Optional: OpenAI (for advanced features)
OPENAI_API_KEY=your-openai-key-here
```

### **Get API Keys:**

1. **Gemini API** (Free): https://makersuite.google.com/app/apikey
   - Free tier: 15 RPM, 1500 RPD
   
2. **Groq API** (Free): https://console.groq.com/keys
   - Free tier: 30 RPM, extremely fast inference

3. **MongoDB Atlas** (Free): https://www.mongodb.com/cloud/atlas
   - Free tier: 512MB storage

---

## 📖 Usage Guide

### **1. Register & Login**

1. Navigate to `http://localhost:5173`
2. Click "Register" and create a therapist account
3. Login with your credentials

### **2. Add Clients**

1. Go to "Clients" in the sidebar
2. Click "Add New Client"
3. Fill in client details (name, email, phone, diagnosis)
4. Save client profile

### **3. Schedule Sessions**

1. Go to "Sessions" in the sidebar
2. Click "Schedule New Session"
3. Select client, date, time, and session type
4. Click "Schedule Session"

### **4. Conduct Video Session**

1. Click "Start Video" on a scheduled session
2. Allow camera and microphone permissions
3. The system will automatically:
   - Detect client emotions in real-time
   - Transcribe conversation (bilingual support)
   - Track emotion patterns
4. Click "End Session" when finished

### **5. Review Generated Notes**

1. After ending a session, navigate to "Notes"
2. View AI-generated session notes with:
   - Initial assessment or progress updates
   - Clinical observations
   - Cognitive patterns identified
   - Therapeutic interventions
   - Homework assignments
3. Edit notes if needed
4. Export as PDF

### **6. Use RAG Assistant**

1. Go to "Assistant" in the sidebar
2. First-time setup: Click "Initialize System" to index data
3. Ask questions like:
   - "What are the recent notes for John Doe?"
   - "Summarize client progress this month"
   - "What techniques work for anxiety treatment?"
   - "Show clients with depression"
4. Assistant will retrieve relevant context and provide answers

### **7. Add Therapy Resources**

1. Place PDF files (therapy guides, research papers) in `Backend/docs/` folder
2. Go to Assistant page → "Manage Data" tab
3. Click "Upload PDF" or "Initialize System" to re-index
4. PDFs are now searchable through the assistant

---

## 📚 API Documentation

### **Authentication**

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "therapist@example.com",
  "username": "dr_smith",
  "password": "securepassword",
  "full_name": "Dr. John Smith",
  "specialization": "Clinical Psychology"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "therapist@example.com",
  "password": "securepassword"
}
```

### **Client Management**

#### Get All Clients
```http
GET /api/clients/
Authorization: Bearer <token>
```

#### Create Client
```http
POST /api/clients/
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-01",
  "diagnosis": "Generalized Anxiety Disorder"
}
```

### **Session Management**

#### Create Session
```http
POST /api/sessions/
Authorization: Bearer <token>
Content-Type: application/json

{
  "client_id": "507f1f77bcf86cd799439011",
  "scheduled_time": "2025-12-10T10:00:00Z",
  "session_type": "individual",
  "duration": 60
}
```

#### Start Video Session
```http
POST /api/webrtc/session/<session_id>/start
Authorization: Bearer <token>
```

### **RAG Assistant**

#### Query Assistant
```http
POST /api/assistant/query
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "What are the recent notes for John Doe?",
  "n_results": 5
}
```

#### Initialize System
```http
POST /api/assistant/initialize
Authorization: Bearer <token>
```

### **Emotion Detection**

#### Analyze Frame
```http
POST /api/emotion/session/<session_id>/analyze-frame
Authorization: Bearer <token>
Content-Type: application/json

{
  "frame": "base64_encoded_image_data"
}
```

For complete API documentation, see `Backend/README.md`

---

## 🎨 Features in Detail

### **Real-Time Emotion Detection**

The emotion detection system uses a combination of:
- **MediaPipe** for face detection and landmark extraction
- **FER (Facial Expression Recognition)** for emotion classification
- **OpenCV** for frame processing

Detected emotions:
- 😊 Happy
- 😢 Sad  
- 😠 Angry
- 😲 Surprise
- 😨 Fear
- 🤢 Disgust
- 😐 Neutral

The system:
- Processes frames at 2 FPS (configurable)
- Calculates emotion confidence scores
- Tracks dominant emotion over time
- Generates emotion timeline visualization
- Stores emotion data for analysis

### **Automatic Transcription**

Uses browser's Web Speech API with:
- Continuous recognition
- Interim results for real-time display
- Automatic restart on errors
- Bilingual support (en-IN for Hinglish)
- Speaker identification (THERAPIST vs CLIENT)
- Timestamp tracking

### **AI Session Notes**

Generated using Gemini/Groq with:
- **Context-aware**: Uses previous session notes via RAG
- **Pattern tracking**: Identifies cognitive patterns (self-blame, avoidance, etc.)
- **Progress comparison**: Tracks changes across sessions
- **Structured format**: Professional clinical note structure
- **Bilingual input**: Understands Hindi/English mixed transcripts
- **English output**: Always generates notes in English

### **RAG Assistant**

Vector database with:
- **10,890+ documents** indexed
- **Semantic search** using Gemini embeddings
- **Re-ranking** for relevance
- **Multi-source**: PDFs, notes, client records
- **Context retrieval**: Top-k relevant chunks
- **LLM generation**: Grounded responses with sources

---

## 📁 Project Structure

```
Assistant-For-Therapist-/
├── Backend/
│   ├── app.py                      # Main Flask application
│   ├── config.py                   # Configuration settings
│   ├── requirements.txt            # Python dependencies
│   ├── initialize_rag.py           # RAG initialization script
│   ├── models/                     # Data models
│   │   ├── user.py
│   │   ├── client.py
│   │   ├── session.py
│   │   ├── note.py
│   │   └── ai_insight.py
│   ├── routes/                     # API endpoints
│   │   ├── auth_routes.py
│   │   ├── client_routes.py
│   │   ├── session_routes.py
│   │   ├── notes_routes.py
│   │   ├── webrtc_routes.py
│   │   ├── emotion_routes.py
│   │   └── assistant_routes.py
│   ├── services/                   # Business logic
│   │   ├── emotion_detection.py   # FER + CV2
│   │   ├── summary_service.py     # AI note generation
│   │   ├── rag_assistant.py       # RAG orchestration
│   │   ├── vector_store.py        # ChromaDB interface
│   │   ├── pdf_processing.py      # PDF extraction
│   │   └── transcription_service.py
│   ├── docs/                       # PDF resources (indexed by RAG)
│   └── chroma_db/                  # Vector database storage
│
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VideoConference.tsx # Main video component
│   │   │   ├── EmotionMonitor.tsx  # Emotion display
│   │   │   └── dashboard/          # Dashboard components
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ClientsPage.tsx
│   │   │   ├── SessionsPage.tsx
│   │   │   ├── NotesPage.tsx
│   │   │   ├── AssistantPage.tsx
│   │   │   └── VideoSessionPage.tsx
│   │   ├── lib/
│   │   │   └── api.ts             # API client
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── README.md                        # This file
```

---

## 🧪 Testing

### **Test Accounts**

After running the backend, you can use these test accounts:

```
Email: therapist@example.com
Username: therapist
Password: (set during registration)

Email: demo@therapyhub.com
Username: demo
Password: (set during registration)
```

### **Test RAG System**

```bash
cd Backend
python test_rag.py
```

### **Check Indexed Documents**

```bash
cd Backend
python check_indexed_docs.py
```

---

## 🐛 Troubleshooting

### **Protobuf Warnings**
If you see `AttributeError: 'MessageFactory' object has no attribute 'GetPrototype'`:
```bash
pip install "protobuf>=4.25.3,<5.0.0"
```

### **Emotion Detection Not Working**
- Ensure camera permissions are granted
- Check if TensorFlow is properly installed
- Verify OpenCV can access webcam

### **Transcription Not Working**
- Use Google Chrome (best support for Web Speech API)
- Grant microphone permissions
- Check if microphone is not muted
- Speak clearly and closer to the mic

### **MongoDB Connection Issues**
- Verify MongoDB URI in `.env`
- Check network connectivity
- Ensure MongoDB Atlas IP whitelist includes your IP

### **RAG Not Returning Results**
- Run `python initialize_rag.py` to index data
- Check if API keys are configured
- Verify ChromaDB is properly initialized

---

## 🚀 Deployment

### **Backend (Flask)**

**Option 1: Render / Railway**
1. Connect GitHub repository
2. Set environment variables
3. Deploy Python application
4. Use `gunicorn app:app` as start command

**Option 2: Docker**
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-k", "geventwebsocket.gunicorn.workers.GeventWebSocketWorker", "-w", "1", "app:app", "--bind", "0.0.0.0:5000"]
```

### **Frontend (React)**

**Option 1: Vercel / Netlify**
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy

**Option 2: Static hosting**
```bash
npm run build
# Upload dist/ folder to hosting
```

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Contributors

- **Aashish Bhandari** - Project Lead & Full Stack Developer
- **Ayushmaan Singh** - Collaborator

---

## 🙏 Acknowledgments

- **Google Gemini** - AI text generation and embeddings
- **Groq** - Fast LLM inference
- **ChromaDB** - Vector database
- **shadcn/ui** - Beautiful UI components
- **TensorFlow & FER** - Emotion detection models

---

## 📞 Support

For questions or issues:
- Create an issue on GitHub
- Email: aashishbhandari272@gmail.com

---

## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Voice-based emotion analysis
- [ ] Multi-language support (full i18n)
- [ ] Advanced analytics dashboard
- [ ] Group therapy sessions
- [ ] Client portal with homework tracking
- [ ] Integration with EHR systems
- [ ] Automated appointment reminders
- [ ] Payment processing
- [ ] Teletherapy platform certification

---

**Built with ❤️ for mental health professionals**
