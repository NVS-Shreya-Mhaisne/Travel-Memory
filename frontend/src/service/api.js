import axios from "axios";

// Allow override via Vite env VITE_API_BASE, otherwise derive from origin
// Default to the project backend path where PHP files live during local dev
const envBase = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE;
// Default back to the original vhost path used earlier in the project
// Use the same protocol as the current page to avoid mixed-content blocks
const defaultProtocol = (typeof window !== 'undefined' && window.location && window.location.protocol) ? window.location.protocol + '//' : 'http://';
const base = envBase || `${defaultProtocol}travelmemory.local/api/`;

const api = axios.create({
  baseURL: base
});

// Root URL for static files (images) — strip trailing /api/ if present
export const API_ROOT = base.replace(/\/api\/?$/, '/')

// Resolve image path returned by backend to a full URL
export function resolveImage(path) {
  if (!path) return '';
  // If already a full URL, return as-is
  if (/^https?:\/\//i.test(path)) return path;
  // Remove leading slashes
  const cleaned = path.replace(/^\/+/, '');
  return `${API_ROOT}${cleaned}`;
}

// Debug interceptors
api.interceptors.request.use(request => {
  // Add X-User-Id header if user is logged in
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.id) {
        request.headers["X-User-Id"] = user.id;
      }
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
    }
  }

  console.log('Starting Request', request.method, request.url);
  return request;
});

api.interceptors.response.use(
  response => {
    console.log('Response Success:', response.status);
    return response;
  },
  error => {
    console.error('Response Error:', error.message);
    if (error.response) {
      console.error('Response Data:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;
