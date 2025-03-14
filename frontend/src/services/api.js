import axios from 'axios';

// Basis-URL für API-Anfragen
const API_URL = process.env.REACT_APP_API_URL || '';

// Instanz von Axios mit Standardkonfiguration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor für Anfragen, um Token hinzuzufügen
api.interceptors.request.use(
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

// Interceptor für Antworten, um Token-Ablauf zu behandeln
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Automatisch ausloggen, wenn 401 Unauthorized zurückkommt
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API-Funktionen für die Authentifizierung
export const authApi = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (userData) => api.post('/api/auth/register', userData),
  getProfile: () => api.get('/api/auth/me'),
  resetPasswordRequest: (email) => api.post('/api/auth/reset-password-request', { email }),
  resetPassword: (token, password) => api.post('/api/auth/reset-password', { token, password }),
};

// API-Funktionen für die ERP-Integration
export const erpApi = {
  getStatus: () => api.get('/api/erp/status'),
  getSyncStatus: () => api.get('/api/erp/sync-status'),
  getApiCalls: (params) => api.get('/api/erp/api-calls', { params }),
  triggerSync: (type) => api.post('/api/erp/sync', { type }),
};

// API-Funktionen für Transformationen
export const transformationApi = {
  getTransformations: () => api.get('/api/transformation/list'),
  getTransformationById: (id) => api.get(`/api/transformation/${id}`),
  createTransformation: (data) => api.post('/api/transformation', data),
  updateTransformation: (id, data) => api.put(`/api/transformation/${id}`, data),
  deleteTransformation: (id) => api.delete(`/api/transformation/${id}`),
};

// API-Funktionen für Webhooks
export const webhookApi = {
  getWebhooks: () => api.get('/api/webhook/list'),
  getWebhookById: (id) => api.get(`/api/webhook/${id}`),
  createWebhook: (data) => api.post('/api/webhook', data),
  updateWebhook: (id, data) => api.put(`/api/webhook/${id}`, data),
  deleteWebhook: (id) => api.delete(`/api/webhook/${id}`),
  getWebhookLogs: (id, params) => api.get(`/api/webhook/${id}/logs`, { params }),
};

// API-Funktionen für Benutzer (nur für Admins)
export const userApi = {
  getUsers: () => api.get('/api/auth/users'),
  getUserById: (id) => api.get(`/api/auth/users/${id}`),
  createUser: (userData) => api.post('/api/auth/users', userData),
  updateUser: (id, userData) => api.put(`/api/auth/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/api/auth/users/${id}`),
  changeUserStatus: (id, isActive) => api.patch(`/api/auth/users/${id}/status`, { isActive }),
};

// API-Funktionen für Logs und Monitoring
export const logsApi = {
  getSystemLogs: (params) => api.get('/api/logs/system', { params }),
  getApiLogs: (params) => api.get('/api/logs/api', { params }),
  getErrorLogs: (params) => api.get('/api/logs/error', { params }),
  getAuthLogs: (params) => api.get('/api/logs/auth', { params }),
  getDatabaseLogs: (params) => api.get('/api/logs/database', { params }),
  getRedisLogs: (params) => api.get('/api/logs/redis', { params }),
  getEmailLogs: (params) => api.get('/api/logs/email', { params }),
};

// API-Funktionen für Statistiken
export const statsApi = {
  getDashboardStats: () => api.get('/api/stats/dashboard'),
  getApiCallStats: (params) => api.get('/api/stats/api-calls', { params }),
  getSystemStats: () => api.get('/api/stats/system'),
  getUserStats: () => api.get('/api/stats/users'),
};

export default api; 