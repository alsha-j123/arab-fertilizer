/**
 * Shared Axios instance for all API calls.
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

const apiClient = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL || ''}/api`,
  withCredentials: true,   // sends the HTTP-only af.sid cookie automatically
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('af_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default apiClient;