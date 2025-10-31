// src/services/api.ts
import axios from 'axios';

// 1. (FIX) ใช้ baseURL เดิมของคุณ ('/api')
const api = axios.create({
  baseURL: '/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. (FIX) ใช้ Interceptor ที่แก้ Key 'ais_token' ให้ถูกต้อง
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ais_token'); // <-- The correct key from AuthContext
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// 3. (RECOMMENDED) เพิ่ม Interceptor สำหรับดักจับ 401 (เผื่อ Token หมดอายุ)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Handle 401: Unauthorized (e.g., token expired)
      // Clear the correct local storage keys
      localStorage.removeItem('ais_token');
      localStorage.removeItem('ais_user');
      localStorage.removeItem('ais_settings');
      
      // Use window.location to force reload outside of React Router context
      if (window.location.pathname !== '/login') {
         window.location.href = '/login';
         alert('Session expired. Please log in again.');
      }
    }
    return Promise.reject(error);
  }
);

export default api;