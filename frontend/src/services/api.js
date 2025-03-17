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
  getApiCalls: (params) => api.get('/api/logs/api', { params }),
  triggerSync: (type) => api.post('/api/erp/sync', { type }),
};

// API-Funktionen für Transformationen
export const transformationApi = {
  getTransformations: () => api.get('/api/transform/list'),
  getTransformationById: (id) => api.get(`/api/transform/${id}`),
  createTransformation: (data) => api.post('/api/transform', data),
  updateTransformation: (id, data) => api.put(`/api/transform/${id}`, data),
  deleteTransformation: (id) => api.delete(`/api/transform/${id}`),
};

// API-Funktionen für Webhooks
export const webhookApi = {
  getWebhooks: () => api.get('/api/webhooks/list'),
  getWebhookById: (id) => api.get(`/api/webhooks/${id}`),
  createWebhook: (data) => api.post('/api/webhooks', data),
  updateWebhook: (id, data) => api.put(`/api/webhooks/${id}`, data),
  deleteWebhook: (id) => api.delete(`/api/webhooks/${id}`),
  getWebhookLogs: (id, params) => api.get(`/api/webhooks/${id}/logs`, { params }),
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
  getErpLogs: (params) => api.get('/api/logs/erp', { params }),
  getMonitoringLogs: (params) => api.get('/api/logs/monitoring', { params }),
  getLogsList: () => api.get('/api/logs/list')
    .then(response => {
      // Überprüfen und extrahieren der Daten aus der Antwort
      if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
        return response.data.data; // Gibt direkt das Array der Log-Dateien zurück
      } else {
        console.error('Unerwartetes Format der Log-Dateiliste:', response.data);
        return [];
      }
    }),
  // Universeller Log-Abruf für dynamische Log-Typen
  getLogs: (type, params) => api.get(`/api/logs/${type}`, { params }),
};

// API-Funktionen für Statistiken
export const statsApi = {
  getDashboardStats: () => api.get('/api/stats/dashboard'),
  getApiCallStats: (params) => api.get('/api/stats/api-calls', { params }),
  getSystemStats: () => api.get('/api/stats/system'),
  getUserStats: () => api.get('/api/stats/users'),
  getTransformationStats: (params) => api.get('/api/stats/transformations', { params }),
  getWebhookStats: (params) => api.get('/api/stats/webhooks', { params })
};

export default api; 