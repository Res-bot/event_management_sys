import axios from 'axios';

const API_URL = 'BACKENDURL';

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data)
};

export const eventAPI = {
  getAll: (params) => api.get('/events', { params }),
  getOne: (id) => api.get(`/events/${id}`),
  create: (formData) => api.post('/events', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/events/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/events/${id}`),
  generateDesc: (data) => api.post('/events/generate-description', data)
};

export const rsvpAPI = {
  create: (eventId) => api.post(`/rsvp/${eventId}`),
  cancel: (eventId) => api.delete(`/rsvp/${eventId}`),
  getMyRSVPs: () => api.get('/rsvp/my-rsvps'),
  getMyEvents: () => api.get('/rsvp/my-events'),
  checkRSVP: (eventId) => api.get(`/rsvp/check/${eventId}`)
};

export default api;