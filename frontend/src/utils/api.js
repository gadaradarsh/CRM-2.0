import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCheck = error.config?.url?.includes('/auth/me');
    const isPublicPage = ['/login', '/register'].some(p => window.location.pathname.startsWith(p));
    if (error.response?.status === 401 && !isAuthCheck && !isPublicPage) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.get('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

export const clientsAPI = {
  getClients: (params) => api.get('/clients', { params }),
  getClient: (id) => api.get(`/clients/${id}`),
  createClient: (data) => api.post('/clients', data),
  updateClient: (id, data) => api.patch(`/clients/${id}`, data),
  deleteClient: (id) => api.delete(`/clients/${id}`),
  assignClient: (id, assignedTo) => api.patch(`/clients/${id}/assign`, { assignedTo }),
  updateStatus: (id, status) => api.patch(`/clients/${id}/status`, { status }),
};

export const activitiesAPI = {
  getClientActivities: (clientId, params) => api.get(`/activities/client/${clientId}`, { params }),
  getAllActivities: (params) => api.get('/activities/all', { params }),
  createActivity: (clientId, data) => api.post(`/activities/client/${clientId}`, data),
  updateActivity: (id, data) => api.patch(`/activities/${id}`, data),
  deleteActivity: (id) => api.delete(`/activities/${id}`),
};

export const reportsAPI = {
  getSummary: () => api.get('/reports/summary'),
  getEmployeePerformance: () => api.get('/reports/employees'),
  getRevenueReport: (period) => api.get('/reports/revenue', { params: { period } }),
  getEmployeeQuickStats: () => api.get('/reports/employee-quick-stats'),
};

export const feedbackAPI = {
  submitFeedback: (data) => api.post('/feedback/submit', data),
  getClientFeedback: (clientId) => api.get(`/feedback/client/${clientId}`),
  getAllFeedback: (params) => api.get('/feedback', { params }),
  getFeedbackStats: () => api.get('/feedback/stats'),
  updateFeedbackStatus: (id, status) => api.patch(`/feedback/${id}/status`, { status }),
};

export const tasksAPI = {
  createTask: (data) => api.post('/tasks', data),
  getMyTasks: (params) => api.get('/tasks/my-tasks', { params }),
  updateTaskStatus: (id, data) => api.patch(`/tasks/${id}/status`, data),
  getTaskStats: () => api.get('/tasks/stats'),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};

export const usersAPI = {
  getEmployees: () => api.get('/auth/employees'),
};

export const expensesAPI = {
  addExpense: (clientId, data) => api.post(`/clients/${clientId}/expenses`, data),
  getClientExpenses: (clientId, params) => api.get(`/clients/${clientId}/expenses`, { params }),
  getAllExpenses: (params) => api.get('/expenses/all', { params }),
  updateExpense: (id, data) => api.patch(`/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  getExpenseStats: () => api.get('/expenses/stats'),
};

export const invoicesAPI = {
  generateInvoice: (clientId, data) => api.post(`/clients/${clientId}/invoices/generate`, data),
  getClientInvoices: (clientId) => api.get(`/clients/${clientId}/invoices`),
  getAllInvoices: (params) => api.get('/invoices', { params }),
  getInvoice: (id) => api.get(`/invoices/${id}`),
  updateInvoiceStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }),
  deleteInvoice: (id) => api.delete(`/invoices/${id}`),
  downloadInvoice: (id) => api.get(`/invoices/${id}/download`, { responseType: 'blob' }),
};

export default api;
