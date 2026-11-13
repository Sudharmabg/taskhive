// API service configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('authToken');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  // Helper method to get company ID from user
  getCompanyId() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.companyId || 1; // Default to 1 for demo
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }

  // Auth endpoints
  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // User endpoints
  getUsers() {
    const companyId = this.getCompanyId();
    return this.request(`/users?companyId=${companyId}`);
  }

  createUser(userData) {
    const companyId = this.getCompanyId();
    return this.request(`/users?companyId=${companyId}`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Story endpoints
  getStories() {
    const companyId = this.getCompanyId();
    return this.request(`/stories?companyId=${companyId}`);
  }

  createStory(storyData) {
    return this.request('/stories', {
      method: 'POST',
      body: JSON.stringify(storyData),
    });
  }

  // Team endpoints
  getTeams() {
    const companyId = this.getCompanyId();
    return this.request(`/teams?companyId=${companyId}`);
  }

  createTeam(teamData) {
    const companyId = this.getCompanyId();
    return this.request(`/teams?companyId=${companyId}`, {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  }

  updateTeam(teamId, teamData) {
    return this.request(`/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(teamData),
    });
  }

  updateTeamMembers(teamId, memberNames) {
    return this.request(`/teams/${teamId}/members`, {
      method: 'PUT',
      body: JSON.stringify({ members: memberNames }),
    });
  }

  deleteTeam(teamId) {
    return this.request(`/teams/${teamId}`, {
      method: 'DELETE',
    });
  }

  // Sprint endpoints
  getSprints() {
    const companyId = this.getCompanyId();
    return this.request(`/sprints?companyId=${companyId}`);
  }

  getSprint(sprintId) {
    return this.request(`/sprints/${sprintId}`);
  }

  getCurrentSprint() {
    const companyId = this.getCompanyId();
    return this.request(`/sprints/current?companyId=${companyId}`);
  }

  createSprint(sprintData) {
    return this.request('/sprints', {
      method: 'POST',
      body: JSON.stringify(sprintData),
    });
  }

  updateSprint(sprintId, sprintData) {
    return this.request(`/sprints/${sprintId}`, {
      method: 'PUT',
      body: JSON.stringify(sprintData),
    });
  }

  closeSprint(sprintId) {
    return this.request(`/sprints/${sprintId}/close`, {
      method: 'POST',
    });
  }

  addStoryToSprint(sprintId, storyId) {
    return this.request(`/sprints/${sprintId}/stories`, {
      method: 'POST',
      body: JSON.stringify({ storyId }),
    });
  }

  removeStoryFromSprint(sprintId, storyId) {
    return this.request(`/sprints/${sprintId}/stories/${storyId}`, {
      method: 'DELETE',
    });
  }

  getStory(storyId) {
    return this.request(`/stories/${storyId}`);
  }

  updateStory(storyId, storyData) {
    return this.request(`/stories/${storyId}`, {
      method: 'PUT',
      body: JSON.stringify(storyData),
    });
  }

  // Attachment endpoints (Epic / Task / Bug)
  getAttachments(storyId) {
    return this.request(`/stories/${storyId}/attachments`);
  }

  async uploadAttachments(storyId, files) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.name) formData.append('uploadedBy', user.name);

    const token = localStorage.getItem('authToken');
    // Let the browser set the multipart Content-Type (with boundary)
    const response = await fetch(`${this.baseURL}/stories/${storyId}/attachments`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      let message = `API Error: ${response.status}`;
      try {
        const body = await response.json();
        if (body.message) message = body.message;
      } catch (_) { /* ignore */ }
      throw new Error(message);
    }
    return response.json();
  }

  async downloadAttachment(attachment) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${this.baseURL}/attachments/${attachment.id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  deleteAttachment(attachmentId) {
    return this.request(`/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  }

  // Analytics endpoints
  getDashboardStats() {
    return this.request('/analytics/dashboard');
  }
}

export default new ApiService();
