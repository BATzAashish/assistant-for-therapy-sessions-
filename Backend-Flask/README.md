# TherapyHub Backend - Flask API with MongoDB

A comprehensive Flask backend API for a therapy session management platform with MongoDB database integration.

## Features

- 🔐 **Authentication & Authorization** - JWT-based authentication with secure password hashing
- 👥 **Client Management** - Complete CRUD operations for therapy clients
- 📅 **Session Management** - Schedule, start, end, and track therapy sessions
- 📝 **Notes System** - Create and manage session notes linked to clients and sessions
- 🤖 **AI Insights** - Store and retrieve AI-generated insights from therapy sessions
- 🔒 **Security** - Protected endpoints with JWT tokens and therapist verification
- 📊 **MongoDB Integration** - Efficient NoSQL database with proper indexing

## Tech Stack

- **Framework**: Flask 3.0.0
- **Database**: MongoDB (via PyMongo)
- **Authentication**: Flask-JWT-Extended
- **CORS**: Flask-CORS
- **Password Hashing**: Werkzeug
- **Environment**: python-dotenv

## Project Structure

```
Backend-Flask/
├── app.py                  # Main application file
├── config.py              # Configuration settings
├── requirements.txt       # Python dependencies
├── seed.py               # Database seeding script
├── .env.example          # Environment variables example
├── models/               # Data models
│   ├── __init__.py
│   ├── user.py          # User/Therapist model
│   ├── client.py        # Client model
│   ├── session.py       # Session model
│   ├── note.py          # Note model
│   └── ai_insight.py    # AI Insight model
└── routes/              # API routes
    ├── __init__.py
    ├── auth_routes.py   # Authentication endpoints
    ├── client_routes.py # Client management endpoints
    ├── session_routes.py # Session management endpoints
    ├── notes_routes.py  # Notes management endpoints
    └── ai_routes.py     # AI insights endpoints
```

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- MongoDB installed and running locally or MongoDB Atlas account
- Git

### Installation

1. **Clone the repository**
```powershell
cd d:\Projects\assistant-for-therapy-sessions-\Backend-Flask
```

2. **Create a virtual environment**
```powershell
python -m venv venv
```

3. **Activate the virtual environment**
```powershell
.\venv\Scripts\Activate.ps1
```

4. **Install dependencies**
```powershell
pip install -r requirements.txt
```

5. **Create environment file**
```powershell
Copy-Item .env.example .env
```

6. **Configure environment variables**
Edit `.env` file with your settings:
```env
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
MONGO_URI=mongodb://localhost:27017/therapy_assistant
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### MongoDB Setup

**Option 1: Local MongoDB**
1. Install MongoDB from https://www.mongodb.com/try/download/community
2. Start MongoDB service:
```powershell
net start MongoDB
```

**Option 2: MongoDB Atlas (Cloud)**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string and update `MONGO_URI` in `.env`

### Seed Database

Run the seeding script to populate the database with sample data:

```powershell
python seed.py
```

This creates:
- 2 therapist users
- 4 sample clients
- Multiple sessions (past and upcoming)
- Session notes
- AI insights

**Test Credentials:**
- Email: `therapist@example.com`
- Password: `password123`

### Run the Application

```powershell
python app.py
```

The API will be available at `http://localhost:5000`

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "therapist@example.com",
  "username": "therapist",
  "password": "password123",
  "full_name": "Dr. Sarah Johnson",
  "specialization": "Clinical Psychology"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "therapist@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

#### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer <refresh_token>
```

### Client Endpoints

#### Get All Clients
```http
GET /api/clients
Authorization: Bearer <access_token>
```

#### Get Single Client
```http
GET /api/clients/<client_id>
Authorization: Bearer <access_token>
```

#### Create Client
```http
POST /api/clients
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Emma Thompson",
  "email": "emma@example.com",
  "phone": "+1-555-0101",
  "date_of_birth": "1988-05-15",
  "emergency_contact": {
    "name": "John Thompson",
    "phone": "+1-555-0102"
  },
  "notes": "Initial consultation notes"
}
```

#### Update Client
```http
PUT /api/clients/<client_id>
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Emma Thompson Updated",
  "phone": "+1-555-9999"
}
```

#### Delete Client
```http
DELETE /api/clients/<client_id>
Authorization: Bearer <access_token>
```

### Session Endpoints

#### Get All Sessions
```http
GET /api/sessions?status=scheduled
Authorization: Bearer <access_token>
```

#### Get Single Session
```http
GET /api/sessions/<session_id>
Authorization: Bearer <access_token>
```

#### Get Client Sessions
```http
GET /api/sessions/client/<client_id>
Authorization: Bearer <access_token>
```

#### Create Session
```http
POST /api/sessions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "client_id": "6751234567890abcdef12345",
  "scheduled_date": "2024-12-15T14:00:00Z",
  "duration": 60,
  "session_type": "individual"
}
```

#### Start Session
```http
POST /api/sessions/<session_id>/start
Authorization: Bearer <access_token>
```

#### End Session
```http
POST /api/sessions/<session_id>/end
Authorization: Bearer <access_token>
```

#### Cancel Session
```http
POST /api/sessions/<session_id>/cancel
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "reason": "Client requested rescheduling"
}
```

### Notes Endpoints

#### Get Session Notes
```http
GET /api/notes/session/<session_id>
Authorization: Bearer <access_token>
```

#### Get Client Notes
```http
GET /api/notes/client/<client_id>
Authorization: Bearer <access_token>
```

#### Create Note
```http
POST /api/notes
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "client_id": "6751234567890abcdef12345",
  "session_id": "6751234567890abcdef67890",
  "content": "Client showed progress in managing anxiety...",
  "note_type": "session"
}
```

#### Update Note
```http
PUT /api/notes/<note_id>
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "Updated note content..."
}
```

#### Delete Note
```http
DELETE /api/notes/<note_id>
Authorization: Bearer <access_token>
```

### AI Insights Endpoints

#### Get Session Insights
```http
GET /api/ai/insights/session/<session_id>
Authorization: Bearer <access_token>
```

#### Get Latest Session Insights
```http
GET /api/ai/insights/session/<session_id>/latest
Authorization: Bearer <access_token>
```

#### Get Client Insights
```http
GET /api/ai/insights/client/<client_id>
Authorization: Bearer <access_token>
```

#### Mock AI Analysis
```http
POST /api/ai/analyze/mock
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "text": "Sample text to analyze"
}
```

### Health Check
```http
GET /api/health
```

## Development

### Database Models

1. **User** - Therapist accounts with authentication
2. **Client** - Therapy clients with personal information
3. **Session** - Therapy sessions with scheduling and status
4. **Note** - Session notes and general client notes
5. **AIInsight** - AI-generated insights from sessions

### Authentication Flow

1. User registers or logs in
2. Server returns access token and refresh token
3. Client includes access token in Authorization header
4. Server validates token and therapist ownership for all protected routes
5. Refresh token used to get new access token when expired

### Security Features

- Password hashing with Werkzeug
- JWT token authentication
- Therapist ownership verification on all endpoints
- CORS configuration for frontend access
- Environment-based configuration

## Testing

You can use the provided Postman collection or test with curl:

```powershell
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"therapist@example.com","password":"password123"}'

# Get clients (replace TOKEN with actual token)
curl http://localhost:5000/api/clients `
  -H "Authorization: Bearer TOKEN"
```

## Deployment

### Production Checklist

- [ ] Update `SECRET_KEY` and `JWT_SECRET_KEY` with strong random values
- [ ] Set `FLASK_ENV=production`
- [ ] Use production MongoDB instance (MongoDB Atlas recommended)
- [ ] Configure proper CORS origins
- [ ] Set up HTTPS
- [ ] Use a production WSGI server (Gunicorn, uWSGI)
- [ ] Set up monitoring and logging
- [ ] Configure database backups

### Production Run with Gunicorn

```powershell
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB service is running
- Check `MONGO_URI` in `.env` file
- Verify network connectivity for MongoDB Atlas

### JWT Token Issues
- Ensure `JWT_SECRET_KEY` is set
- Check token expiration times
- Verify Authorization header format: `Bearer <token>`

### CORS Issues
- Update `CORS_ORIGINS` in `.env` with your frontend URL
- Clear browser cache
- Check browser console for specific errors

## Future Enhancements

- [ ] Real-time WebSocket support for live sessions
- [ ] File upload for session recordings
- [ ] OpenAI integration for actual AI insights
- [ ] Email notifications
- [ ] Calendar integration
- [ ] Video conferencing integration
- [ ] Advanced analytics and reporting
- [ ] Export functionality (PDF, CSV)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Email: support@therapyhub.com

---

**Note**: This is a development backend. Ensure proper security measures are implemented before deploying to production.
