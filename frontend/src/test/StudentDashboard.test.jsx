import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import StudentDashboard from '../pages/student/StudentDashboard'
import { studentAPI } from '../api/client'

vi.mock('../api/client', () => ({
  studentAPI: {
    getDashboard: vi.fn(),
  },
}))

function makeToken(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.fake-sig`
}

function renderDashboard() {
  const token = makeToken({ full_name: 'Test Student', roll_number: 'NGI001', department: 'BCA', exp: 9999999999 })
  localStorage.setItem('access_token', token)

  return render(
    <MemoryRouter initialEntries={['/student/dashboard']}>
      <StudentDashboard />
    </MemoryRouter>
  )
}

describe('StudentDashboard', () => {
  it('shows loading state initially', () => {
    studentAPI.getDashboard.mockImplementation(() => new Promise(() => {}))
    renderDashboard()

    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument()
  })

  it('renders student name from token', async () => {
    studentAPI.getDashboard.mockResolvedValue({
      data: {
        today_status: 'before_window',
        recent_scores: [],
        total_exams_taken: 0,
        average_score: 0,
      },
    })

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/test student/i)).toBeInTheDocument()
    })
  })

  it('renders exam card with before_window state', async () => {
    studentAPI.getDashboard.mockResolvedValue({
      data: {
        today_status: 'before_window',
        recent_scores: [],
        total_exams_taken: 0,
        average_score: 0,
      },
    })

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/exam starts at 10:00 am/i)).toBeInTheDocument()
    })
  })

  it('renders exam card with in_progress state and Start Exam button', async () => {
    studentAPI.getDashboard.mockResolvedValue({
      data: {
        today_status: 'in_progress',
        recent_scores: [],
        total_exams_taken: 0,
        average_score: 0,
      },
    })

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/exam in progress/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start exam/i })).toBeInTheDocument()
    })
  })

  it('renders exam card with reviewed state showing score', async () => {
    studentAPI.getDashboard.mockResolvedValue({
      data: {
        today_status: 'reviewed',
        today: { score: 8, total_questions: 10 },
        recent_scores: [],
        total_exams_taken: 15,
        average_score: 7.3,
      },
    })

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/score: 8\/10/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /view result/i })).toBeInTheDocument()
    })
  })

  it('renders exam card with missed state', async () => {
    studentAPI.getDashboard.mockResolvedValue({
      data: {
        today_status: 'missed',
        recent_scores: [],
        total_exams_taken: 0,
        average_score: 0,
      },
    })

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/missed today/i)).toBeInTheDocument()
    })
  })

  it('renders recent scores section', async () => {
    studentAPI.getDashboard.mockResolvedValue({
      data: {
        today_status: 'before_window',
        recent_scores: [
          { date: '2026-07-18', score: 8, total_questions: 10 },
          { date: '2026-07-17', score: 6, total_questions: 10 },
        ],
        total_exams_taken: 15,
        average_score: 7.3,
      },
    })

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/recent scores/i)).toBeInTheDocument()
      expect(screen.getByText('8/10')).toBeInTheDocument()
      expect(screen.getByText('6/10')).toBeInTheDocument()
    })
  })

  it('shows empty state when no recent scores', async () => {
    studentAPI.getDashboard.mockResolvedValue({
      data: {
        today_status: 'before_window',
        recent_scores: [],
        total_exams_taken: 0,
        average_score: 0,
      },
    })

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/no scores yet/i)).toBeInTheDocument()
    })
  })

  it('displays error on API failure', async () => {
    studentAPI.getDashboard.mockRejectedValue({
      response: { data: { detail: 'Server error' } },
    })

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument()
    })
  })

  it('renders the student bottom navigation', async () => {
    studentAPI.getDashboard.mockResolvedValue({
      data: {
        today_status: 'before_window',
        recent_scores: [],
        total_exams_taken: 0,
        average_score: 0,
      },
    })

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/exam starts at 10:00 am/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})
