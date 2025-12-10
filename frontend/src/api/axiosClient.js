import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid: remove token and notify the app
      try {
        localStorage.removeItem('token');
        // Notify the app so the UI (redux/router) can handle logout centrally
        window.dispatchEvent(new CustomEvent('app:unauthorized', { detail: { status: 401 } }));
      } catch (e) {
        // ignore
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;