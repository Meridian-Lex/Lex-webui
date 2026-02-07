import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't auto-redirect on 401 - let React Router handle navigation
    // The App.tsx routes already redirect to /login when user is null
    return Promise.reject(error);
  }
);

export default api;
