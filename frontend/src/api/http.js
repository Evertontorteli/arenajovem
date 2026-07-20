import axios from 'axios';

function resolveApiUrl() {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (
    typeof fromEnv === 'string' &&
    fromEnv.trim() &&
    !fromEnv.startsWith('/Volumes/') &&
    (import.meta.env.DEV || !/localhost|127\.0\.0\.1/.test(fromEnv))
  ) {
    return fromEnv.replace(/\/$/, '');
  }
  return import.meta.env.DEV ? 'http://localhost:3333/api' : '/api';
}

const http = axios.create({
  baseURL: resolveApiUrl(),
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('arena_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default http;
