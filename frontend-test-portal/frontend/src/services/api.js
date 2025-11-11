/**
 * API Service
 * All backend API calls centralized here
 */

import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 120000 // 120 seconds for evaluation requests (Puppeteer in Docker needs time)
});

// Add auth token to requests if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Challenges (Legacy - still used for old system)
export const getChallenges = () => api.get('/challenges');
export const getChallenge = (id) => api.get(`/challenges/${id}`);

// Courses (New course-based system)
export const getCourses = () => api.get('/courses');
export const getCourse = (courseId) => api.get(`/courses/${courseId}`);
export const getCourseLevels = (courseId) => api.get(`/courses/${courseId}/levels`);
export const getLevelQuestions = (courseId, level, userId = 'default-user') => 
  api.get(`/courses/${courseId}/levels/${level}/questions?userId=${userId}`);
export const completeQuestion = (userId, data) => api.post(`/courses/progress/${userId}/complete`, data);
export const getUserProgress = (userId) => api.get(`/courses/progress/${userId}`);

// Course Management (Admin)
export const updateCourse = (courseId, course) => api.put(`/courses/${courseId}`, course);
export const createCourse = (course) => api.post('/courses', course);
export const deleteCourse = (courseId) => api.delete(`/courses/${courseId}`);
export const getCourseQuestions = (courseId) => api.get(`/courses/${courseId}/questions`);
export const updateQuestion = (questionId, question) => api.put(`/courses/questions/${questionId}`, question);
export const createQuestion = (courseId, question) => api.post(`/courses/${courseId}/questions`, question);
export const deleteQuestion = (questionId) => api.delete(`/courses/questions/${questionId}`);
export const bulkUploadQuestions = (courseId, questions) => api.post(`/courses/${courseId}/questions/bulk`, { questions });
export const getRandomQuestions = (courseId, level, count = 2) => api.get(`/courses/${courseId}/levels/${level}/randomize?count=${count}`);

// Level-specific question bank management
export const downloadLevelTemplate = (courseId, level) => 
  api.get(`/courses/${courseId}/levels/${level}/template`, { responseType: 'blob' });
export const uploadLevelQuestionBank = (courseId, level, questions, randomizeCount) =>
  api.post(`/courses/${courseId}/levels/${level}/questions/bulk`, { questions, randomizeCount });

// Course restrictions management
export const updateCourseRestrictions = (courseId, restrictions) =>
  api.put(`/courses/${courseId}/restrictions`, restrictions);
export const getCourseRestrictions = (courseId) =>
  api.get(`/courses/${courseId}/restrictions`);
export const getLevelSettings = (courseId) =>
  api.get(`/courses/${courseId}/level-settings`);

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

export const deleteSubmission = (id) =>
  api.delete(`/admin/submissions/${id}`);

export default api;
