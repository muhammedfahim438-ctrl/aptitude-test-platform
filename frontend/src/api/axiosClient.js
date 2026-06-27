// src/api/axiosClient.js
// Axios instance with JWT interceptor.
// Every request automatically attaches the Bearer token from localStorage.
// On 401, clears tokens and redirects to /login.

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach access token ──
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401 / token refresh ──
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refresh_token')

      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/api/auth/refresh/`, {
            refresh: refreshToken,
          })
          const newAccess = res.data.access
          localStorage.setItem('access_token', newAccess)
          originalRequest.headers['Authorization'] = `Bearer ${newAccess}`
          return axiosClient(originalRequest)
        } catch {
          // Refresh failed — fall through to logout
        }
      }

      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

// ── Auth API ──
export const authAPI = {
  login: (email, password) =>
    axiosClient.post('/api/auth/login/', { email, password }),

  refresh: (refresh) =>
    axiosClient.post('/api/auth/refresh/', { refresh }),
}

// ── Exam API ──
export const examAPI = {
  getQuestions: (date) =>
    axiosClient.get(`/api/tests/questions/?date=${date}`),

  submitAnswers: (examDate, answers) =>
    axiosClient.post('/api/tests/submit/', { exam_date: examDate, answers }),

  getAnswerKey: (date) =>
    axiosClient.get(`/api/tests/answers/?date=${date}`),

  getLeaderboard: () =>
    axiosClient.get('/api/leaderboard/'),
}

export default axiosClient
