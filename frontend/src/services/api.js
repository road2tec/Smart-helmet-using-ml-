import axios from 'axios';

const API_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

export const detectionService = {
  getStatus: () => api.get('/detect/status'),
  getHistory: () => api.get('/detect/history'),
};

export const alertService = {
  checkAccident: () => api.get('/alerts/check-accident'),
  sendPanicAlert: () => api.post('/alerts/send'),
  getHistory: () => api.get('/alerts/history'),
};

export default api;
