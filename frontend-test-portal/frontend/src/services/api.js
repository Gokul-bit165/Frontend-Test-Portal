/**
 * API Service
 * All backend API calls centralized here
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Challenges
export const getChallenges = () => api.get('/challenges');
export const getChallenge = (id) => api.get(`/challenges/${id}`);

// Submissions
export const submitSolution = (data) => api.post('/submissions', data);
export const getSubmission = (id) => api.get(`/submissions/${id}`);
export const getSubmissionResult = (id) => api.get(`/submissions/${id}/result`);

// Evaluation
export const evaluateSolution = (submissionId) => 
  api.post('/evaluate', { submissionId });

export const quickEvaluate = (code, challengeId) =>
  api.post('/evaluate/quick', { code, challengeId });

// Admin
export const adminLogin = (credentials) => 
  api.post('/admin/login', credentials);

export const getAdminChallenges = () => 
  api.get('/admin/challenges');

export const createChallenge = (challenge) =>
  api.post('/admin/challenges', challenge);

export const updateChallenge = (id, challenge) =>
  api.put(`/admin/challenges/${id}`, challenge);

export const deleteChallenge = (id) =>
  api.delete(`/admin/challenges/${id}`);

export const getAllSubmissions = () =>
  api.get('/admin/submissions');

export const reEvaluateSubmission = (id) =>
  api.post(`/admin/evaluate/${id}`);

export default api;
