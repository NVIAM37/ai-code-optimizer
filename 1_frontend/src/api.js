import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Add request interceptor to include JWT token and log requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('[API] Request error:', error.message);
        return Promise.reject(error);
    }
);

// Add response interceptor for logging
api.interceptors.response.use(
    (response) => {
        console.log(`[API] Response ${response.config.method?.toUpperCase()} ${response.config.url}: ${response.status}`);
        return response;
    },
    (error) => {
        console.error(`[API] Error ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, {
            status: error.response?.status,
            message: error.message
        });
        return Promise.reject(error);
    }
);

export default api;
