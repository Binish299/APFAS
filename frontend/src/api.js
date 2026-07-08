import axios from 'axios';

const DEV = import.meta.env.DEV;

export const API_BASE = DEV
  ? "http://localhost:8000/api"
  : "/api";

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('nepalish_user');
    if (raw) {
      const user = JSON.parse(raw);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
  } catch {
    // ignore parse errors
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('nepalish_user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;
