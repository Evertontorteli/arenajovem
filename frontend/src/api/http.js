import axios from 'axios';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('arena_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default http;
