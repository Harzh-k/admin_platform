import axios from 'axios';

// 1. Create the base Axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000', // Ensure this matches your FastAPI port
  headers: {
    'Content-Type': 'application/json',
  }
});

export const adminService = {
  // --- Enterprise & Team Setup ---
  createEnterprise: (data) => api.post('/admin/enterprise', data),
  createTeam: (data) => api.post('/admin/teams', data),
  
  // --- Dashboard Data Fetching ---
  // Returns total spend, team count, and budget percentage
  getStats: () => api.get('/admin/stats'),
  
  // Returns a list of all teams with their keys and budget progress
  getTeams: () => api.get('/admin/teams'),
  
  // Returns the latest 10-20 AI transactions for the Audit Table
  getUsageHistory: () => api.get('/admin/usage-history'),

  getViolations: () => api.get('/admin/violations'),
  getSystemStatus: () => api.get('/admin/system/status'),
  configureSystem: (data) => api.post('/admin/system/configure', data),
  deleteConfig: (providerId) => api.delete(`/admin/system/config/${providerId}`),
  getTeamMembers: (teamId) => api.get(`/admin/teams/${teamId}/members`),
  addTeamMember: (teamId, memberData) => api.post(`/admin/teams/${teamId}/members`, memberData),
  removeTeamMember: (teamId, email) => api.delete(`/admin/teams/${teamId}/members/${email}`),
  getLeaderboard: () => api.get('/admin/analytics/top-spenders'),
  updateTeam: (id, teamData) => api.patch(`/admin/teams/${id}`, teamData),
  getTeamTokenStats: () => api.get('/admin/team-token-stats'),
  rotateKey: (teamId) => api.post(`/admin/teams/${teamId}/rotate-key`),
  // --- Policy Management (Future Proofing) ---
  updateModelPricing: (modelId, data) => api.patch(`/admin/model-catalog/${modelId}`, data),
};

// 2. Service for the Proxy (if you decide to build a chat tester in the UI)
export const proxyService = {
  sendChat: (payload, teamKey) => api.post('/proxy/chat', payload, {
    headers: { 'x-team-key': teamKey }
  }),
};

export default api;