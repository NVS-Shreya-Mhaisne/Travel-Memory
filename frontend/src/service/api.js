import axios from "axios";

/*
Use Vercel environment variable if available.
Fallback to localhost during development.
*/
const base =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Axios instance
const api = axios.create({
  baseURL: base
});

// Root URL for static files (remove /api from end)
export const API_ROOT = base.replace(/\/api\/?$/, "/");

// Convert image path to full URL
export function resolveImage(path) {
  if (!path) return "";

  // If already full URL
  if (/^https?:\/\//i.test(path)) return path;

  const cleaned = path.replace(/^\/+/, "");
  return `${API_ROOT}${cleaned}`;
}

// Request interceptor
api.interceptors.request.use((request) => {

  // Get logged user
  const userStr = localStorage.getItem("user");

  if (userStr) {
    try {
      const user = JSON.parse(userStr);

      if (user && user.id) {
        request.headers["X-User-Id"] = user.id;
      }

    } catch (e) {
      console.error("User parse error", e);
    }
  }

  console.log("Request:", request.method, request.url);
  return request;

});

// Response interceptor
api.interceptors.response.use(

  (response) => {
    console.log("Response Success:", response.status);
    return response;
  },

  (error) => {
    console.error("Response Error:", error.message);

    if (error.response) {
      console.error("Server Response:", error.response.data);
    }

    return Promise.reject(error);
  }

);

export default api;