// src/api.js
import axios from 'axios';

let apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
if (!apiURL.endsWith('/api') && !apiURL.endsWith('/api/')) {
  apiURL = apiURL.replace(/\/$/, '') + '/api';
}

const api = axios.create({
  baseURL: apiURL,
});

// Attach SimpleJWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('staypik_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;