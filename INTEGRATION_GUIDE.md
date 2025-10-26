# 🔗 Frontend-Backend Integration Guide

## Current Status

### ✅ Backend Setup
- Flask API created with all endpoints
- MongoDB models configured
- Authentication with JWT
- CORS enabled for `http://localhost:5173` (Vite default)
- All routes registered and working

### ⚠️ Frontend Status
**NOT YET CONNECTED** - Your frontend is currently using mock data and doesn't make API calls to the backend.

## What You Have

### Backend (Ready ✅)
- **Location**: `Backend-Flask/`
- **Server**: Flask on port 5000
- **API Base URL**: `http://localhost:5000/api`
- **Endpoints**: All functional (auth, clients, sessions, notes, AI)
- **Database**: MongoDB ready

### Frontend (Needs Integration ⚠️)
- **Location**: `Frontend/`
- **Framework**: React + Vite
- **Dev Server**: Port 5173
- **Current State**: Using hardcoded mock data
- **API Service**: Created at `src/lib/api.ts` (ready to use)

## 🚀 Quick Integration Steps

### Step 1: Start Backend

```powershell
# In Backend-Flask directory
cd d:\Projects\assistant-for-therapy-sessions-\Backend-Flask

# Create .env if not exists
Copy-Item .env.example .env -ErrorAction SilentlyContinue

# Install dependencies
pip install -r requirements.txt

# Seed database with test data
python seed.py

# Start server
python app.py
```

**Backend should be running at**: `http://localhost:5000`

**Test it**:
```powershell
curl http://localhost:5000/api/health
```

### Step 2: Start Frontend

```powershell
# In Frontend directory
cd d:\Projects\assistant-for-therapy-sessions-\Frontend

# Install dependencies (if not done)
npm install

# Start dev server
npm run dev
```

**Frontend should be running at**: `http://localhost:5173`

### Step 3: Test Connection

Open browser console and run:
```javascript
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(d => console.log('Backend connected:', d))
  .catch(e => console.error('Backend error:', e));
```

If successful, you'll see:
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "development"
}
```

## 📝 Integration Checklist

### Files Created for Integration

✅ **Frontend/src/lib/api.ts**
- Complete API service layer
- All backend endpoints wrapped
- Authentication handling
- Token management
- Type-safe requests

✅ **Frontend/.env**
- API URL configuration
- Environment variables

### Files That Need Updates

The following files are still using **mock data** and need to be updated to use the API:

#### 1. ⚠️ Login.tsx
**Current**: Mock login (line 14-17)
```tsx
const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();
  // Mock login - in real app would validate credentials
  navigate("/dashboard");
};
```

**Update to**:
```tsx
import { authAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();
const [loading, setLoading] = useState(false);

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const data = await authAPI.login(email, password);
    toast({
      title: "Login successful",
      description: `Welcome back, ${data.user.full_name}!`,
    });
    navigate("/dashboard");
  } catch (error: any) {
    toast({
      title: "Login failed",
      description: error.message || "Invalid credentials",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
```

#### 2. ⚠️ ClientSidebar.tsx
**Current**: Using mockClients array (line 16-47)

**Update to**:
```tsx
import { useEffect, useState } from "react";
import { clientAPI } from "@/lib/api";

const [clients, setClients] = useState<Client[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchClients = async () => {
    try {
      const data = await clientAPI.getAll();
      setClients(data.clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchClients();
}, []);
```

#### 3. ⚠️ NotesPanel.tsx
**Current**: Only saves to state (line 12-17)

**Update to**:
```tsx
import { notesAPI } from "@/lib/api";

const handleSave = async () => {
  if (!activeClient || !activeSession) {
    toast({
      title: "Error",
      description: "Please select a client and session first",
      variant: "destructive",
    });
    return;
  }
  
  try {
    await notesAPI.create({
      client_id: activeClient,
      session_id: activeSession,
      content: notes,
      note_type: "session"
    });
    
    toast({
      title: "Notes saved",
      description: "Session notes have been saved successfully.",
    });
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Failed to save notes",
      variant: "destructive",
    });
  }
};
```

#### 4. ⚠️ AIInsightsPanel.tsx
**Current**: Using hardcoded insights (line 13-32)

**Update to**:
```tsx
import { useEffect, useState } from "react";
import { aiAPI } from "@/lib/api";

const [insights, setInsights] = useState<any>(null);
const [loading, setLoading] = useState(false);

useEffect(() => {
  if (sessionActive && currentSessionId) {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const data = await aiAPI.mockAnalysis("current session data");
        setInsights(data);
      } catch (error) {
        console.error("Error fetching insights:", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch insights every 30 seconds during active session
    fetchInsights();
    const interval = setInterval(fetchInsights, 30000);
    return () => clearInterval(interval);
  }
}, [sessionActive, currentSessionId]);
```

#### 5. ⚠️ SessionControls.tsx
**Current**: Only toggles local state

**Update to**:
```tsx
import { sessionAPI } from "@/lib/api";

const handleSessionToggle = async () => {
  if (!activeSession) {
    toast({
      title: "Error",
      description: "Please select a session first",
      variant: "destructive",
    });
    return;
  }
  
  try {
    if (sessionActive) {
      await sessionAPI.end(activeSession);
      toast({ title: "Session ended successfully" });
    } else {
      await sessionAPI.start(activeSession);
      toast({ title: "Session started successfully" });
    }
    onSessionToggle();
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Failed to update session",
      variant: "destructive",
    });
  }
};
```

## 🧪 Testing the Integration

### 1. Test Authentication

```typescript
// In browser console or a test component
import { authAPI } from '@/lib/api';

// Login
const result = await authAPI.login('therapist@example.com', 'password123');
console.log('Logged in:', result.user);

// Get current user
const user = await authAPI.getCurrentUser();
console.log('Current user:', user);
```

### 2. Test Client API

```typescript
import { clientAPI } from '@/lib/api';

// Get all clients
const clients = await clientAPI.getAll();
console.log('Clients:', clients);

// Create new client
const newClient = await clientAPI.create({
  name: "Test Client",
  email: "test@example.com",
  phone: "+1-555-1234"
});
console.log('Created:', newClient);
```

### 3. Test Session API

```typescript
import { sessionAPI } from '@/lib/api';

// Get all sessions
const sessions = await sessionAPI.getAll();
console.log('Sessions:', sessions);

// Create session
const newSession = await sessionAPI.create({
  client_id: "CLIENT_ID_HERE",
  scheduled_date: new Date().toISOString(),
  duration: 60
});
```

## 🔒 Authentication Flow

1. **User logs in** → API returns access_token + refresh_token
2. **Tokens stored** in localStorage
3. **API requests** automatically include Bearer token
4. **Token expires** → Use refresh token to get new one
5. **User logs out** → Remove tokens from localStorage

## 🛠️ Development Tools

### Test Backend Endpoints

Use the provided test script:
```powershell
cd Backend-Flask
python test_api.py
```

### Use Postman Collection

Import the Postman collection:
```
Backend-Flask/Therapy_Assistant_API.postman_collection.json
```

### Monitor API Requests

In browser DevTools → Network tab, filter by "Fetch/XHR" to see API calls.

## 🐛 Troubleshooting

### CORS Errors

**Error**: "Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:5173' has been blocked by CORS"

**Fix**: Backend CORS is already configured for port 5173. Ensure backend is running.

### 401 Unauthorized

**Error**: "Token has expired" or "Authorization token is missing"

**Fix**: 
```typescript
// Check if token exists
const token = localStorage.getItem('access_token');
console.log('Token:', token);

// If expired, login again
await authAPI.login('email', 'password');
```

### Connection Refused

**Error**: "Failed to fetch" or "ERR_CONNECTION_REFUSED"

**Fix**: Make sure backend is running on port 5000
```powershell
# Check if backend is running
curl http://localhost:5000/api/health
```

### MongoDB Connection Failed

**Error**: "MongoDB connection failed" in backend logs

**Fix**:
```powershell
# Start MongoDB service
net start MongoDB

# Or check if running
mongosh
```

## 📋 Complete Integration Example

Here's a complete example of updating the Login component:

```tsx
// Frontend/src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Activity, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/lib/api";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authAPI.login(email, password);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.full_name}!`,
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">TherapyHub</h1>
          </div>
          <p className="text-muted-foreground text-center">
            Professional therapy session management
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="therapist@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="text-sm text-muted-foreground text-center">
          <p>Test credentials:</p>
          <p className="font-mono text-xs mt-1">
            therapist@example.com / password123
          </p>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Secure therapist portal - Protected by end-to-end encryption
        </p>
      </Card>
    </div>
  );
};

export default Login;
```

## ✅ Next Steps

1. **Start both servers**:
   - Backend: `python app.py` in Backend-Flask/
   - Frontend: `npm run dev` in Frontend/

2. **Update each component** to use the API service from `src/lib/api.ts`

3. **Test the flow**:
   - Login with test credentials
   - View clients from database
   - Create/update/delete operations
   - Session management
   - Notes saving

4. **Add error handling** and loading states to all components

5. **Implement proper state management** (consider using React Query or Zustand)

## 🎉 Summary

**Status**: Backend and Frontend are **NOT YET CONNECTED**

**What's Ready**:
- ✅ Backend API fully functional
- ✅ API service layer created (`api.ts`)
- ✅ Environment configured

**What's Needed**:
- ⚠️ Update all frontend components to use API calls instead of mock data
- ⚠️ Add loading and error states
- ⚠️ Test full integration

**Time to Integration**: ~2-3 hours to update all components

---

For detailed API documentation, see `Backend-Flask/API_DOCUMENTATION.md`
