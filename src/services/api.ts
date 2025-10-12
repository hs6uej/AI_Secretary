import axios from 'axios';
// Create an axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  // This would be your API endpoint
  headers: {
    'Content-Type': 'application/json'
  }
});
// Add auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ais_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export default api;