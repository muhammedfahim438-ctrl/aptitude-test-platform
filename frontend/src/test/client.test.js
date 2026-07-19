import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockDelete = vi.fn()

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      post: mockPost,
      delete: mockDelete,
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}))

const { authAPI, examAPI, studentAPI, adminAPI } = await import('../api/client')

describe('API client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('authAPI', () => {
    it('login calls POST /api/auth/login/', async () => {
      mockPost.mockResolvedValue({ data: { access: 'token' } })
      await authAPI.login('test@test.com', 'password')
      expect(mockPost).toHaveBeenCalledWith('/api/auth/login/', { email: 'test@test.com', password: 'password' })
    })

    it('register calls POST /api/auth/register/', async () => {
      mockPost.mockResolvedValue({ data: { success: true } })
      const data = { email: 'test@test.com', password: 'pass', full_name: 'Test' }
      await authAPI.register(data)
      expect(mockPost).toHaveBeenCalledWith('/api/auth/register/', data)
    })

    it('studentSignin calls POST /api/auth/student-signin/', async () => {
      mockPost.mockResolvedValue({ data: { access: 'token' } })
      const data = { email: 'test@test.com', full_name: 'Test' }
      await authAPI.studentSignin(data)
      expect(mockPost).toHaveBeenCalledWith('/api/auth/student-signin/', data)
    })

    it('refresh calls POST /api/auth/refresh/', async () => {
      mockPost.mockResolvedValue({ data: { access: 'new-token' } })
      await authAPI.refresh('old-refresh')
      expect(mockPost).toHaveBeenCalledWith('/api/auth/refresh/', { refresh: 'old-refresh' })
    })
  })

  describe('examAPI', () => {
    it('getQuestions calls GET with date param', async () => {
      mockGet.mockResolvedValue({ data: { questions: [] } })
      await examAPI.getQuestions('2026-07-19')
      expect(mockGet).toHaveBeenCalledWith('/api/tests/questions/?date=2026-07-19')
    })

    it('submitAnswers calls POST with exam_date and answers', async () => {
      mockPost.mockResolvedValue({ data: { status: 'created' } })
      await examAPI.submitAnswers('2026-07-19', { q1: 'A', q2: 'B' })
      expect(mockPost).toHaveBeenCalledWith('/api/tests/submit/', { exam_date: '2026-07-19', answers: { q1: 'A', q2: 'B' } })
    })

    it('getAnswerKey calls GET with date param', async () => {
      mockGet.mockResolvedValue({ data: { correct_answers: {} } })
      await examAPI.getAnswerKey('2026-07-19')
      expect(mockGet).toHaveBeenCalledWith('/api/tests/answers/?date=2026-07-19')
    })

    it('getLeaderboard calls GET with top param', async () => {
      mockGet.mockResolvedValue({ data: [] })
      await examAPI.getLeaderboard(25)
      expect(mockGet).toHaveBeenCalledWith('/api/student/leaderboard/?top=25')
    })

    it('getReview calls GET with date param', async () => {
      mockGet.mockResolvedValue({ data: {} })
      await examAPI.getReview('2026-07-19')
      expect(mockGet).toHaveBeenCalledWith('/api/student/review/?date=2026-07-19')
    })
  })

  describe('studentAPI', () => {
    it('getDashboard calls GET /api/student/dashboard/', async () => {
      mockGet.mockResolvedValue({ data: {} })
      await studentAPI.getDashboard()
      expect(mockGet).toHaveBeenCalledWith('/api/student/dashboard/')
    })
  })

  describe('adminAPI', () => {
    it('getDashboardStats calls GET /api/admin/dashboard-stats/', async () => {
      mockGet.mockResolvedValue({ data: {} })
      await adminAPI.getDashboardStats()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/dashboard-stats/')
    })

    it('getRankings calls GET with period and top', async () => {
      mockGet.mockResolvedValue({ data: [] })
      await adminAPI.getRankings('weekly', 10)
      expect(mockGet).toHaveBeenCalledWith('/api/admin/rankings/?period=weekly&top=10')
    })

    it('getReports calls GET with range, from, to', async () => {
      mockGet.mockResolvedValue({ data: {} })
      await adminAPI.getReports('weekly', '2026-07-01', '2026-07-19')
      expect(mockGet).toHaveBeenCalledWith('/api/admin/reports/?range=weekly&from=2026-07-01&to=2026-07-19')
    })

    it('getReports omits undefined params', async () => {
      mockGet.mockResolvedValue({ data: {} })
      await adminAPI.getReports('weekly')
      expect(mockGet).toHaveBeenCalledWith('/api/admin/reports/?range=weekly')
    })

    it('downloadReport calls GET with responseType blob', async () => {
      mockGet.mockResolvedValue({ data: new Blob() })
      await adminAPI.downloadReport('2026-07-19')
      expect(mockGet).toHaveBeenCalledWith('/api/admin/download-report/2026-07-19/', { responseType: 'blob' })
    })

    it('uploadQuestions calls POST with multipart/form-data', async () => {
      mockPost.mockResolvedValue({ data: { uploaded: 10 } })
      const formData = new FormData()
      await adminAPI.uploadQuestions(formData)
      expect(mockPost).toHaveBeenCalledWith('/api/admin/upload-questions/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    })

    it('deleteQuestion calls DELETE with id', async () => {
      mockDelete.mockResolvedValue({ data: { deleted: true } })
      await adminAPI.deleteQuestion(42)
      expect(mockDelete).toHaveBeenCalledWith('/api/admin/questions/42/')
    })
  })
})
