import axios from 'axios';

// Create a generic axios instance pointing at the FastAPI backend
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for API calls to inject the Authorization header
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor to catch authenication errors globally
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Clear invalid token
      localStorage.removeItem('access_token');
      // If we're not already on the login page and it's a hard unauthorized, we might prompt login
      // but for now, just rejecting promise is fine.
    }
    return Promise.reject(error);
  }
);

export default apiClient;
