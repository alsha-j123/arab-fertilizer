/**
 * Shared Axios instance for all API calls.
 *
 * IMPORTANT — Environment variable setup:
 *   On Vercel (frontend), set REACT_APP_API_URL to your Render backend URL.
 *   Example: REACT_APP_API_URL=https://arab-fertilizer-backend.onrender.com
 *
 *   On localhost, leave it unset (or set to http://localhost:5000) and the
 *   CRA proxy in package.json will forward /api requests to the backend.
 *
 * withCredentials: true  — sends the HTTP-only session cookie (af.sid) on
 *                          every request so the server authenticates via the
 *                          MongoDB session store even when localStorage is empty.
 *
 * The Bearer-token interceptor is kept as a fallback: if a token exists in
 * localStorage (written on login) it is sent alongside the cookie, so the
 * server's authMiddleware can satisfy either auth path.
 */
import axios from 'axios';

// In production (Vercel), REACT_APP_API_URL must be set to the full Render URL.
// In development, CRA's proxy handles /api requests, so baseURL is just '/api'.
const baseURL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : '/api';

const apiClient = axios.create({
  baseURL,
  withCredentials: true,   // sends the HTTP-only af.sid cookie automatically
  timeout: 30000,          // 30s timeout — Render free tier can be slow on cold start
});

// Attach JWT token from localStorage as Bearer header (fallback auth)
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('af_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Log errors in development for easier debugging
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        '[apiClient] Request failed:',
        error.config?.url,
        error.response?.status,
        error.response?.data?.message || error.message
      );
    }
    return Promise.reject(error);
  }
);

export default apiClient;