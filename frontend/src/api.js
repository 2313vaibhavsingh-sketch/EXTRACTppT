import axios from 'axios';

// When deployed separately (e.g., Frontend on Vercel and Backend on Render),
// set VITE_API_URL in your hosting environment variables (e.g., https://my-backend.onrender.com).
// When deployed together (Docker / single service) or in local development (via Vite proxy),
// leave VITE_API_URL empty and it defaults to current origin.
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getFullApiUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
};

export default api;
