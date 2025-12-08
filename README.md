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
- [System Workflow](#system-workflow)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)

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

## 🔄 System Workflow

### **1. Session Initialization**
```
Therapist logs in → Schedules session → Client joins video call
```

### **2. Real-Time Processing During Session**
```
┌─────────────────────────────────────────────────────────┐
│  Video Stream (Client's Camera)                         │
│         ↓                                                │
│  Face Detection (MediaPipe) → Emotion Analysis (FER)    │
│         ↓                                                │
│  Emotion Data → Socket.io → Therapist Dashboard         │
│                                                          │
│  Audio Stream (Both Participants)                        │
│         ↓                                                │
│  Speech Recognition → Text Transcription                 │
│         ↓                                                │
│  Speaker Identification (THERAPIST vs CLIENT)            │
│         ↓                                                │
│  Real-time Transcript Display                            │
└─────────────────────────────────────────────────────────┘
```

### **3. Post-Session Processing**
```
Session Ends
    ↓
Collect Transcript + Emotions
    ↓
RAG: Fetch Previous Session Context (ChromaDB)
    ↓
AI Generation (Gemini/Groq):
### **Data Flow Architecture**

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                         │
│  React + TypeScript + TailwindCSS + shadcn/ui            │
│                                                           │
│  Components:                                              │
│  • VideoConference (WebRTC)                               │
│  • EmotionMonitor (Real-time Display)                     │
│  • TranscriptViewer (Live Text)                           │
│  • Dashboard (Analytics & Management)                     │
└──────────────────────────────────────────────────────────┘
                          ↕
              REST API + Socket.io (Real-time)
                          ↕
┌──────────────────────────────────────────────────────────┐
│                    BACKEND LAYER                          │
│              Flask + Python + Socket.io                   │
│                                                           │
│  Services:                                                │
│  • WebRTC Routes (Video Session Management)               │
│  • Emotion Detection (FER + OpenCV + MediaPipe)           │
│  • Transcription (Web Speech API Integration)             │
│  • Summary Generation (Gemini/Groq AI)                    │
│  • RAG Assistant (Vector Search + LLM)                    │
│  • Authentication (JWT)                                   │
└──────────────────────────────────────────────────────────┘
                          ↕
┌────────────────────┬─────────────────────────────────────┐
│   MongoDB Atlas    │         ChromaDB (Local)            │
│   (Cloud NoSQL)    │       (Vector Database)             │
│                    │                                     │
│  Collections:      │  Embeddings:                        │
│  • users           │  • PDF documents (10,872 chunks)    │
│  • clients         │  • Session notes (10 docs)          │
│  • sessions        │  • Client records (8 docs)          │
│  • notes           │  Total: 10,890 indexed documents    │
│  • ai_insights     │                                     │
└────────────────────┴─────────────────────────────────────┘
```

---

## 🛠️ Tech Stackgnitive patterns
    - Track progress
    ↓
Generate Structured Clinical Notes:
    - Initial Assessment / Progress Updates
    - Clinical Observations
    - Cognitive Pattern Analysis
    - Therapeutic Interventions
    - Action Items & Homework
    ↓
Store in MongoDB + Index in Vector DB
    ↓
Available for RAG Assistant Queries
```

### **4. RAG Assistant Query Flow**
```
Therapist Query
    ↓
Generate Query Embedding (Gemini)
    ↓
Semantic Search in ChromaDB (10,890 documents)
    ↓
Retrieve Top-K Relevant Chunks:
    - Previous session notes
    - PDF therapy resources
    - Client records
    ↓
Re-rank by Relevance
    ↓
LLM Generation (Gemini/Groq) with Retrieved Context
    ↓
Return Grounded Response with Sources
```

### **5. Emotion Detection Pipeline**
```
Video Frame (30 FPS)
    ↓
Sample at 2 FPS (configurable)
    ↓
Convert to grayscale (OpenCV)
    ↓
Face Detection (MediaPipe FaceMesh)
    ↓
Face Landmarks Extraction
    ↓
Emotion Classification (FER Model):
    - Happy, Sad, Angry, Surprise
    - Fear, Disgust, Neutral
    ↓
Confidence Scores (0-1)
    ↓
Dominant Emotion Selection
    ↓
Real-time Broadcast (Socket.io)
    ↓
Store Emotion Timeline in MongoDB
    ↓
Generate Emotion Summary & Visualization
```

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
---

## 🎨 Features in Detail
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

**Built with ❤️ for mental health professionals**
---
