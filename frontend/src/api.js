import axios from 'axios';

const DEV = import.meta.env.DEV;

// In production (Vercel), VITE_API_URL points at the tunnel URL of the
// locally-hosted backend (e.g. https://flowgo.ngrok-free.app).
const REMOTE_API = import.meta.env.VITE_API_URL;

export const API_BASE = REMOTE_API
  ? `${REMOTE_API.replace(/\/$/, "")}/api`
  : DEV
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
    const raw = localStorage.getItem('flowgo_user');
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
      const hadUser = localStorage.getItem('flowgo_user');
      localStorage.removeItem('flowgo_user');
      if (hadUser) {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
