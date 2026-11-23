// API service configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Signed-in user saved by login()
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}') || {};
    } catch {
      return {};
    }
  }

  // Auth token plus the signed-in user's id, which the backend uses for
  // attribution (audit trail, time logs) and permission checks
  authHeaders() {
    const token = localStorage.getItem('authToken');
    const user = this.getCurrentUser();
    return {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(user.id != null && { 'X-User-Id': String(user.id) }),
    };
  }

  // Prefer the backend's { message } over a bare status code
  async errorFrom(response) {
    let message = `API Error: ${response.status}`;
    try {
      const body = await response.json();
      if (body && body.message) message = body.message;
    } catch (_) { /* no JSON body */ }
    const error = new Error(message);
    error.status = response.status;
    return error;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const { headers, ...rest } = options;

    const config = {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeaders(),
        ...headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw await this.errorFrom(response);
    }
    
    return response.json();
  }

  // Multipart upload; the browser sets the Content-Type (with boundary)
  async uploadFiles(endpoint, files) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: formData,
    });
    if (!response.ok) {
      throw await this.errorFrom(response);
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

  // Members page: whole company for admins, own team for everyone else
  getMemberDirectory() {
    return this.request('/users/directory');
  }

  // Admin only: name, email, designation, jobRole, teamId
  updateUser(userId, changes) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(changes),
    });
  }

  // Story endpoints
  getStories() {
    const companyId = this.getCompanyId();
    return this.request(`/stories?companyId=${companyId}`);
  }

  async createStory(storyData) {
    const { newAttachments, newSubtasks, ...data } = storyData;
    const story = await this.request('/stories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await this.savePendingItems(story.id, newAttachments, newSubtasks);
    return story;
  }

  /**
   * The story form collects attachments (File objects) and subtask titles before the
   * story exists; save them once the story has an id. Failures are reported but do not
   * undo the story save.
   */
  async savePendingItems(storyId, files = [], subtaskTitles = []) {
    const failures = [];
    if (files && files.length) {
      try {
        await this.uploadAttachments(storyId, files);
      } catch (err) {
        failures.push(`attachments (${err.message})`);
      }
    }
    for (const title of subtaskTitles || []) {
      try {
        await this.createSubtask(storyId, title);
      } catch (err) {
        failures.push(`subtask "${title}" (${err.message})`);
      }
    }
    if (failures.length) {
      alert(`Saved, but some items could not be added: ${failures.join(', ')}`);
    }
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

  async updateStory(storyId, storyData) {
    const { newAttachments, newSubtasks, ...data } = storyData;
    const story = await this.request(`/stories/${storyId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    await this.savePendingItems(storyId, newAttachments, newSubtasks);
    return story;
  }

  // Tasks and Bugs linked to an epic
  // Look up by the readable key, e.g. ABC-T0012
  getStoryByKey(storyKey) {
    return this.request(`/stories/story/${encodeURIComponent(storyKey)}`);
  }

  getEpicChildren(epicId) {
    return this.request(`/stories/${epicId}/children`);
  }

  // Subtask endpoints (Task / Bug)
  getSubtasks(storyId) {
    return this.request(`/stories/${storyId}/subtasks`);
  }

  createSubtask(storyId, title) {
    return this.request(`/stories/${storyId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  updateSubtask(subtaskId, changes) {
    return this.request(`/subtasks/${subtaskId}`, {
      method: 'PUT',
      body: JSON.stringify(changes),
    });
  }

  deleteSubtask(subtaskId) {
    return this.request(`/subtasks/${subtaskId}`, {
      method: 'DELETE',
    });
  }

  // Attachment endpoints (Epic / Task / Bug)
  getAttachments(storyId) {
    return this.request(`/stories/${storyId}/attachments`);
  }

  uploadAttachments(storyId, files) {
    return this.uploadFiles(`/stories/${storyId}/attachments`, files);
  }

  getSubtaskAttachments(subtaskId) {
    return this.request(`/subtasks/${subtaskId}/attachments`);
  }

  uploadSubtaskAttachments(subtaskId, files) {
    return this.uploadFiles(`/subtasks/${subtaskId}/attachments`, files);
  }

  async downloadAttachment(attachment, endpoint = `/attachments/${attachment.id}/download`) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: this.authHeaders(),
    });
    if (!response.ok) {
      throw await this.errorFrom(response);
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

  // Time tracking (Task / Bug): estimate set by assignees, daily time logs
  getTimeTracking(storyId) {
    return this.request(`/stories/${storyId}/time`);
  }

  setEstimate(storyId, estimatedHours) {
    return this.request(`/stories/${storyId}/estimate`, {
      method: 'PUT',
      body: JSON.stringify({ estimatedHours }),
    });
  }

  logTime(storyId, { workDate, hours, note }) {
    return this.request(`/stories/${storyId}/timelogs`, {
      method: 'POST',
      body: JSON.stringify({ workDate, hours, note }),
    });
  }

  deleteTimeLog(timeLogId) {
    return this.request(`/timelogs/${timeLogId}`, {
      method: 'DELETE',
    });
  }

  // Account
  changePassword(currentPassword, newPassword) {
    return this.request('/account/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Story Comments (Tasks, Epics, Bugs)
  getStoryComments(storyId) {
    return this.request(`/stories/${storyId}/comments`);
  }

  addStoryComment(storyId, { content, parentId }) {
    return this.request(`/stories/${storyId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
  }

  deleteStoryComment(storyId, commentId) {
    return this.request(`/stories/${storyId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Audit trail
  getStoryHistory(storyId) {
    return this.request(`/stories/${storyId}/history`);
  }

  getAuditLogs({ type, action, user, search, page = 0, size = 25 } = {}) {
    const params = new URLSearchParams({
      companyId: String(this.getCompanyId()),
      page: String(page),
      size: String(size),
    });
    if (type) params.set('type', type);
    if (action) params.set('action', action);
    if (user) params.set('user', user);
    if (search) params.set('search', search);
    return this.request(`/audit?${params.toString()}`);
  }

  // Ideas
  getIdeas() {
    return this.request('/ideas');
  }

  createIdea({ title, description, category }) {
    return this.request('/ideas', {
      method: 'POST',
      body: JSON.stringify({ title, description, category }),
    });
  }

  updateIdea(ideaId, { title, description, category }) {
    return this.request(`/ideas/${ideaId}`, {
      method: 'PUT',
      body: JSON.stringify({ title, description, category }),
    });
  }

  setIdeaStatus(ideaId, status, note) {
    return this.request(`/ideas/${ideaId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    });
  }

  toggleIdeaVote(ideaId) {
    return this.request(`/ideas/${ideaId}/vote`, { method: 'POST' });
  }

  deleteIdea(ideaId) {
    return this.request(`/ideas/${ideaId}`, { method: 'DELETE' });
  }

  // Idea comments
  getIdeaComments(ideaId) {
    return this.request(`/ideas/${ideaId}/comments`);
  }

  addIdeaComment(ideaId, { content, parentId }) {
    return this.request(`/ideas/${ideaId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
  }

  deleteIdeaComment(ideaId, commentId) {
    return this.request(`/ideas/${ideaId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Leave
  getMyLeaves() {
    return this.request('/leaves/mine');
  }

  getAllLeaves(status) {
    return this.request(`/leaves${status ? `?status=${encodeURIComponent(status)}` : ''}`);
  }

  getUpcomingLeaves(days = 14) {
    return this.request(`/leaves/upcoming?days=${days}`);
  }

  applyLeave({ type, startDate, endDate, halfDay, reason }) {
    return this.request('/leaves', {
      method: 'POST',
      body: JSON.stringify({ type, startDate, endDate, halfDay, reason }),
    });
  }

  cancelLeave(leaveId) {
    return this.request(`/leaves/${leaveId}/cancel`, { method: 'POST' });
  }

  reviewLeave(leaveId, decision, note) {
    return this.request(`/leaves/${leaveId}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, note }),
    });
  }

  // Documents (company library with tags & Google Doc-style editor/comments)
  getDocuments() {
    return this.request('/documents');
  }

  getDocument(documentId) {
    return this.request(`/documents/${documentId}`);
  }

  getDocumentTags() {
    return this.request('/documents/tags');
  }

  createDocument({ title, description, tags = [], content = '' } = {}) {
    return this.request('/documents/create', {
      method: 'POST',
      body: JSON.stringify({ title, description, tags, content }),
    });
  }

  async uploadDocument(file, { title, description, tags = [] } = {}) {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    tags.forEach(tag => formData.append('tags', tag));
    const response = await fetch(`${this.baseURL}/documents`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: formData,
    });
    if (!response.ok) {
      throw await this.errorFrom(response);
    }
    return response.json();
  }

  updateDocument(documentId, { title, description, tags, content }) {
    return this.request(`/documents/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify({ title, description, tags, content }),
    });
  }

  async downloadDocument(doc) {
    const response = await fetch(`${this.baseURL}/documents/${doc.id}/download`, {
      headers: this.authHeaders(),
    });
    if (!response.ok) {
      throw await this.errorFrom(response);
    }

    // Determine clean filename ending in .docx
    let filename = '';
    const disposition = response.headers.get('content-disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
    }
    if (!filename) {
      const baseName = (doc.title || doc.fileName || 'document').replace(/\.[^/.]+$/, '');
      filename = `${baseName.trim().replace(/[^a-zA-Z0-9 ._-]+/g, '_')}.docx`;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  deleteDocument(documentId) {
    return this.request(`/documents/${documentId}`, { method: 'DELETE' });
  }

  getDocumentComments(documentId) {
    return this.request(`/documents/${documentId}/comments`);
  }

  addDocumentComment(documentId, { content, selectedText, parentId }) {
    return this.request(`/documents/${documentId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, selectedText, parentId }),
    });
  }

  resolveDocumentComment(documentId, commentId, resolved) {
    return this.request(`/documents/${documentId}/comments/${commentId}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ resolved }),
    });
  }

  deleteDocumentComment(documentId, commentId) {
    return this.request(`/documents/${documentId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Analytics endpoints
  getDashboardStats() {
    return this.request('/analytics/dashboard');
  }
}

export default new ApiService();
