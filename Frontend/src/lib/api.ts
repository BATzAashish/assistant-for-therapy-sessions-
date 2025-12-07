// API configuration and endpoints
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    // If unauthorized, clear storage and redirect to login
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
    
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || error.error || 'Request failed');
  }
  return response.json();
};

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
  },

  register: async (userData: { username: string; email: string; password: string; full_name: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    // For now, return user from localStorage
    // TODO: Implement backend endpoint /api/auth/me
    const token = getAuthToken();
    const user = localStorage.getItem('user');
    if (!token || !user) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }
    return { user: JSON.parse(user) };
  },
};

// Client API
export const clientAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/clients/`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  create: async (clientData: any) => {
    const response = await fetch(`${API_BASE_URL}/clients/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(clientData),
    });
    return handleResponse(response);
  },

  update: async (id: string, clientData: any) => {
    const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(clientData),
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  updateStatus: async (id: string, status: string) => {
    const response = await fetch(`${API_BASE_URL}/clients/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },
};

// Session API
export const sessionAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/sessions/`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/sessions/${id}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  getByClient: async (clientId: string) => {
    const response = await fetch(`${API_BASE_URL}/sessions/client/${clientId}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  create: async (sessionData: any) => {
    const response = await fetch(`${API_BASE_URL}/sessions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(sessionData),
    });
    return handleResponse(response);
  },

  update: async (id: string, sessionData: any) => {
    const response = await fetch(`${API_BASE_URL}/sessions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(sessionData),
    });
    return handleResponse(response);
  },

  cancel: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/sessions/${id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({}),
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/sessions/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },
};

// Notes API
export const notesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/notes/`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  getBySession: async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/notes/session/${sessionId}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  getByClient: async (clientId: string) => {
    const response = await fetch(`${API_BASE_URL}/notes/client/${clientId}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  create: async (noteData: any) => {
    const response = await fetch(`${API_BASE_URL}/notes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(noteData),
    });
    return handleResponse(response);
  },

  update: async (id: string, noteData: any) => {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(noteData),
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  getPreviousSessionNotes: async (clientId: string, currentSessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/notes/previous-session/${clientId}/${currentSessionId}`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },
};

// AI Insights API
export const aiAPI = {
  getInsights: async (sessionId?: string) => {
    const url = sessionId 
      ? `${API_BASE_URL}/ai/insights?session_id=${sessionId}`
      : `${API_BASE_URL}/ai/insights`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  analyzeSentiment: async (text: string) => {
    const response = await fetch(`${API_BASE_URL}/ai/sentiment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ text }),
    });
    return handleResponse(response);
  },

  generateSummary: async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/ai/summary/${sessionId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  createMeeting: async (meetingData: { client_name: string; start_time: string; end_time?: string }) => {
    const response = await fetch(`${API_BASE_URL}/meetings/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(meetingData),
    });
    return handleResponse(response);
  },

  validateMeetingLink: async (meeting_link: string) => {
    const response = await fetch(`${API_BASE_URL}/meetings/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ meeting_link }),
    });
    return handleResponse(response);
  },
};

// Assistant API
export const assistantAPI = {
  query: async (query: string, n_results: number = 5) => {
    const response = await fetch(`${API_BASE_URL}/assistant/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ query, n_results }),
    });
    return handleResponse(response);
  },

  initialize: async (chunk_size: number = 1000) => {
    const response = await fetch(`${API_BASE_URL}/assistant/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ chunk_size }),
    });
    return handleResponse(response);
  },

  indexNotes: async () => {
    const response = await fetch(`${API_BASE_URL}/assistant/index-notes`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  indexClients: async () => {
    const response = await fetch(`${API_BASE_URL}/assistant/index-clients`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/assistant/stats`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  clearDatabase: async () => {
    const response = await fetch(`${API_BASE_URL}/assistant/clear`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  uploadPDF: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/assistant/upload-pdf`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      body: formData,
    });
    return handleResponse(response);
  },
};
