import axios from 'axios';

// REACT_APP_API_URL is baked in at build time by Vercel.
// The hardcoded fallback ensures it always points to Render
// even if the env var wasn't set when the build ran.
const baseURL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'https://arab-fertilizer-api.onrender.com/api';

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000,
});

// Attach JWT token from localStorage as Bearer header
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