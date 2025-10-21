// Shared API Service for Uni-Manager applications
import {
  getApiBaseUrl,
  getSharedEnvironmentConfig,
} from '../config/environment.ts';

class ApiService {
  constructor() {
    this.baseURL = getApiBaseUrl();
    this.config = getSharedEnvironmentConfig();
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        // Try to extract error message from response body
        try {
          const errorData = await response.json();
          const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
          throw new Error(errorMessage);
        } catch (jsonError) {
          // If JSON parsing fails, use generic error
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(
        `${this.baseURL.replace('/api', '')}/health`
      );
      return await response.json();
    } catch (_error) {
      // console.error('Health check failed:', error);
      return { status: 'error', message: error.message };
    }
  }
}

// Business-specific API methods
export class BusinessApiService extends ApiService {
  // Client management
  async getClients() {
    return this.get('/clients');
  }

  async createClient(clientData) {
    return this.post('/clients', clientData);
  }

  async updateClient(clientId, clientData) {
    return this.put(`/clients/${clientId}`, clientData);
  }

  async deleteClient(clientId) {
    return this.delete(`/clients/${clientId}`);
  }

  // Project management
  async getProjects() {
    return this.get('/projects');
  }

  async createProject(projectData) {
    return this.post('/projects', projectData);
  }

  async updateProject(projectId, projectData) {
    return this.put(`/projects/${projectId}`, projectData);
  }

  async deleteProject(projectId) {
    return this.delete(`/projects/${projectId}`);
  }

  // Invoice management
  async getInvoices() {
    return this.get('/invoices');
  }

  async createInvoice(invoiceData) {
    return this.post('/invoices', invoiceData);
  }

  async updateInvoice(invoiceId, invoiceData) {
    return this.put(`/invoices/${invoiceId}`, invoiceData);
  }

  async deleteInvoice(invoiceId) {
    return this.delete(`/invoices/${invoiceId}`);
  }

  // Reports
  async getReports() {
    return this.get('/reports');
  }

  async generateReport(reportType, params = {}) {
    return this.post(`/reports/${reportType}`, params);
  }
}

// Personal-specific API methods
export class PersonalApiService extends ApiService {
  // Task management
  async getTasks() {
    return this.get('/tasks');
  }

  async createTask(taskData) {
    return this.post('/tasks', taskData);
  }

  async updateTask(taskId, taskData) {
    return this.put(`/tasks/${taskId}`, taskData);
  }

  async deleteTask(taskId) {
    return this.delete(`/tasks/${taskId}`);
  }

  // Notes management
  async getNotes() {
    return this.get('/notes');
  }

  async createNote(noteData) {
    return this.post('/notes', noteData);
  }

  async updateNote(noteId, noteData) {
    return this.put(`/notes/${noteId}`, noteData);
  }

  async deleteNote(noteId) {
    return this.delete(`/notes/${noteId}`);
  }

  // Calendar events
  async getEvents() {
    return this.get('/events');
  }

  async createEvent(eventData) {
    return this.post('/events', eventData);
  }

  async updateEvent(eventId, eventData) {
    return this.put(`/events/${eventId}`, eventData);
  }

  async deleteEvent(eventId) {
    return this.delete(`/events/${eventId}`);
  }

  // Goals management
  async getGoals() {
    return this.get('/goals');
  }

  async createGoal(goalData) {
    return this.post('/goals', goalData);
  }

  async updateGoal(goalId, goalData) {
    return this.put(`/goals/${goalId}`, goalData);
  }

  async deleteGoal(goalId) {
    return this.delete(`/goals/${goalId}`);
  }
}

// Create singleton instances
export const businessApi = new BusinessApiService();
export const personalApi = new PersonalApiService();

// Export base class for custom implementations
export default ApiService;
