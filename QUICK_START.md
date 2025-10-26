# 🚀 Quick Start Guide - TherapyHub Application

## ✅ Your Application is Now Connected!

The frontend and backend are now integrated. Follow these steps to start using the application.

## Prerequisites Check

Before starting, ensure you have:
- ✅ Python 3.8+ installed
- ✅ Node.js 16+ installed
- ✅ MongoDB installed and configured

## Step-by-Step Startup

### 1. Start MongoDB

**Windows PowerShell:**
```powershell
net start MongoDB
```

**Or check if it's running:**
```powershell
mongosh
# If it connects, MongoDB is running. Type 'exit' to quit.
```

### 2. Start Backend Server

Open a **new PowerShell terminal**:

```powershell
# Navigate to backend folder
cd d:\Projects\assistant-for-therapy-sessions-\Backend-Flask

# Activate virtual environment (if not already)
.\venv\Scripts\Activate.ps1

# Seed database with test data (first time only)
python seed.py

# Start Flask server
python app.py
```

**Expected output:**
```
✓ Successfully connected to MongoDB!
 * Running on http://127.0.0.1:5000
```

**Backend is now running at:** `http://localhost:5000`

### 3. Start Frontend Development Server

Open **another PowerShell terminal**:

```powershell
# Navigate to frontend folder
cd d:\Projects\assistant-for-therapy-sessions-\Frontend

# Install dependencies (if not done)
npm install

# Start Vite dev server
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Frontend is now running at:** `http://localhost:5173`

### 4. Access Application

Open your browser and go to:
```
http://localhost:5173
```

**Login with test credentials:**
- **Email:** `therapist@example.com`
- **Password:** `password123`

## ✨ What's Now Connected

### ✅ Login Page
- Real authentication with backend
- JWT token management
- Error handling and loading states
- Test credentials displayed

### ✅ Client Sidebar
- Fetches real clients from MongoDB
- Shows client details from database
- Loading and error states
- Auto-refreshes on load

### ✅ Notes Panel
- Saves notes to MongoDB
- Requires client selection
- Shows success/error messages
- Form validation

### ✅ AI Insights Panel
- Fetches mock AI analysis from backend
- Real-time updates during active sessions
- Auto-refreshes every 30 seconds
- Error handling

## 🧪 Testing the Connection

### Test 1: Backend Health Check
```powershell
curl http://localhost:5000/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "development"
}
```

### Test 2: Login API
```powershell
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"therapist@example.com","password":"password123"}'
```

### Test 3: Use the Interactive Test Page
Open in browser:
```
file:///d:/Projects/assistant-for-therapy-sessions-/connection-test.html
```

Click through all the test buttons to verify each API endpoint.

## 📋 Sample Data

After running `python seed.py`, you'll have:

**2 Therapist Accounts:**
1. Email: `therapist@example.com` / Password: `password123`
2. Email: `demo@therapyhub.com` / Password: `demo123`

**4 Sample Clients:**
- Emma Thompson
- James Wilson
- Sofia Rodriguez
- Michael Chen

**Multiple Sessions:**
- Past completed sessions
- Upcoming scheduled sessions

**Session Notes:**
- Sample notes for completed sessions

**AI Insights:**
- Sample insights for past sessions

## 🔧 Troubleshooting

### Backend won't start

**Error: MongoDB connection failed**
```powershell
# Start MongoDB
net start MongoDB

# Or install MongoDB if not installed
# Download from: https://www.mongodb.com/try/download/community
```

**Error: Module not found**
```powershell
cd Backend-Flask
pip install -r requirements.txt
```

### Frontend won't start

**Error: Cannot find module**
```powershell
cd Frontend
npm install
```

**Error: Port 5173 already in use**
```powershell
# Kill the process using port 5173
netstat -ano | findstr :5173
# Note the PID and kill it
taskkill /PID <PID> /F
```

### Login doesn't work

**Check backend is running:**
```powershell
curl http://localhost:5000/api/health
```

**Check database has users:**
```powershell
cd Backend-Flask
python seed.py
```

**Check browser console for errors:**
- Press F12 in browser
- Go to Console tab
- Look for error messages

### CORS errors

**Error: "blocked by CORS policy"**

Backend CORS is already configured for `http://localhost:5173`. Ensure:
1. Backend is running
2. Frontend is running on port 5173 (default Vite port)
3. Check `Backend-Flask/config.py` CORS_ORIGINS setting

### Empty client list

**Database not seeded:**
```powershell
cd Backend-Flask
python seed.py
```

**Check if seeding worked:**
```powershell
mongosh
use therapy_assistant
db.clients.count()
# Should show: 4
```

## 📱 Application Features

### Currently Working:
- ✅ User authentication (login/logout)
- ✅ JWT token management
- ✅ Client list from database
- ✅ Notes saving to database
- ✅ AI mock insights
- ✅ Loading and error states

### To Be Implemented:
- ⚠️ Session management (start/stop)
- ⚠️ Client creation/editing
- ⚠️ Session scheduling
- ⚠️ Notes loading and editing
- ⚠️ User profile management
- ⚠️ Real AI integration

## 🎯 Next Steps

### For Development:

1. **Add Session Management:**
   - Update SessionControls component
   - Connect to session API endpoints
   - Add session creation UI

2. **Add Client Management:**
   - Add "Create Client" button
   - Create client form dialog
   - Edit/delete functionality

3. **Enhance Notes:**
   - Load existing notes
   - Edit saved notes
   - Note history view

4. **Add Real AI:**
   - Integrate OpenAI API
   - Real emotion detection
   - Actual transcription

### For Production:

1. **Security:**
   - Change SECRET_KEY and JWT_SECRET_KEY
   - Use production MongoDB (MongoDB Atlas)
   - Enable HTTPS
   - Add rate limiting

2. **Deployment:**
   - Deploy backend (Heroku, AWS, etc.)
   - Deploy frontend (Vercel, Netlify, etc.)
   - Update API URLs
   - Set up CI/CD

3. **Monitoring:**
   - Add error tracking (Sentry)
   - Add analytics
   - Set up logging
   - Configure backups

## 📚 Documentation

- **API Docs:** `Backend-Flask/API_DOCUMENTATION.md`
- **Backend Setup:** `Backend-Flask/README.md`
- **Integration Guide:** `INTEGRATION_GUIDE.md`
- **Connection Status:** `CONNECTION_STATUS.md`

## 🆘 Getting Help

1. Check browser console for errors (F12)
2. Check backend terminal for errors
3. Check frontend terminal for errors
4. Review `INTEGRATION_GUIDE.md` for detailed help
5. Test with `connection-test.html`

## ✅ Success Checklist

Before considering the app fully working, verify:

- [ ] MongoDB is running
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access http://localhost:5173
- [ ] Can login with test credentials
- [ ] Can see client list from database
- [ ] Can save notes successfully
- [ ] Can see AI insights when session is active
- [ ] No CORS errors in browser console
- [ ] No authentication errors

## 🎉 You're All Set!

If all checks pass, your TherapyHub application is now fully connected and running!

**Enjoy building your therapy management platform! 🚀**

---

*Last Updated: October 26, 2025*
