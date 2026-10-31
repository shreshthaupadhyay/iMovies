import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('imovies_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error message handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred. Please try again.';

    // If token expired / unauthorized on private route
    if (error.response?.status === 401 && localStorage.getItem('imovies_token')) {
      // Don't auto-clear on failed login requests
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('imovies_token');
        localStorage.removeItem('imovies_user');
        window.dispatchEvent(new Event('imovies:auth:expired'));
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default API;
