import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

axiosClient.interceptors.request.use(
  (config) => {
    const url = config.url || ''
    const isAuthEndpoint = url.includes('/api/auth/login/') || url.includes('/api/auth/student-signin/') || url.includes('/api/auth/register/') || url.includes('/api/auth/refresh/')
    if (!isAuthEndpoint) {
      const token = localStorage.getItem('access_token')
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const url = originalRequest.url || ''
    const isAuthEndpoint = url.includes('/api/auth/login/') || url.includes('/api/auth/student-signin/') || url.includes('/api/auth/register/') || url.includes('/api/auth/refresh/')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
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
          // Refresh failed
        }
      }

      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (email, password) =>
    axiosClient.post('/api/auth/login/', { email, password }),

  register: (data) =>
    axiosClient.post('/api/auth/register/', data),

  studentSignin: (data) =>
    axiosClient.post('/api/auth/student-signin/', data),

  refresh: (refresh) =>
    axiosClient.post('/api/auth/refresh/', { refresh }),
}

export const examAPI = {
  getQuestions: (date) =>
    axiosClient.get(`/api/tests/questions/?date=${date}`),

  submitAnswers: (examDate, answers) =>
    axiosClient.post('/api/tests/submit/', { exam_date: examDate, answers }),

  getAnswerKey: (date) =>
    axiosClient.get(`/api/tests/answers/?date=${date}`),

  getLeaderboard: (top = 25) =>
    axiosClient.get(`/api/student/leaderboard/?top=${top}`),

  getReview: (date) =>
    axiosClient.get(`/api/student/review/?date=${date}`),
}

export const studentAPI = {
  getDashboard: () =>
    axiosClient.get('/api/student/dashboard/'),
}

export const adminAPI = {
  getDashboardStats: () =>
    axiosClient.get('/api/admin/dashboard-stats/'),

  getQuestions: (search, date) => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (date) params.append('date', date)
    return axiosClient.get(`/api/admin/questions/?${params.toString()}`)
  },

  getQuestion: (id) =>
    axiosClient.get(`/api/admin/questions/${id}/`),

  deleteQuestion: (id) =>
    axiosClient.delete(`/api/admin/questions/${id}/`),

  getRankings: (top = 10, period = 'weekly') =>
    axiosClient.get(`/api/admin/rankings/?top=${top}&period=${period}`),

  getReports: (from, to, range) => {
    const params = new URLSearchParams()
    if (from) params.append('from', from)
    if (to) params.append('to', to)
    if (range) params.append('range', range)
    return axiosClient.get(`/api/admin/reports/?${params.toString()}`)
  },

  downloadReport: (date) =>
    axiosClient.get(`/api/admin/download-report/${date}/`, {
      responseType: 'blob',
    }),

  uploadQuestions: (formData) =>
    axiosClient.post('/api/admin/upload-questions/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

export default axiosClient
