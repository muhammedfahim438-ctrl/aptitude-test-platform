import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import ExamPage from '../pages/student/ExamPage'
import { examAPI } from '../api/client'

vi.mock('../api/client', () => ({
  examAPI: {
    getQuestions: vi.fn(),
    submitAnswers: vi.fn(),
    getAnswerKey: vi.fn(),
  },
}))

vi.mock('../hooks/useExamCountdown', () => ({
  default: () => '01:59:45',
}))

vi.mock('../hooks/usePersistedAnswers', () => ({
  usePersistedAnswers: () => ({
    answers: {},
    saveAnswer: vi.fn(),
    clearAnswers: vi.fn(),
  }),
}))

function makeToken(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.fake-sig`
}

function renderExam() {
  const token = makeToken({ user_id: 1, exp: 9999999999 })
  localStorage.setItem('access_token', token)
  localStorage.setItem('refresh_token', 'fake-refresh')

  return render(
    <MemoryRouter initialEntries={['/student/exam']}>
      <ExamPage />
    </MemoryRouter>
  )
}

describe('ExamPage', () => {
  it('shows loading state while fetching questions', () => {
    examAPI.getQuestions.mockImplementation(() => new Promise(() => {}))
    renderExam()
    expect(screen.getByText(/loading questions/i)).toBeInTheDocument()
  })

  it('renders questions after loading', async () => {
    examAPI.getQuestions.mockResolvedValue({
      data: {
        questions: [
          { id: 1, text: 'What is 2+2?', option_a: '3', option_b: '4', option_c: '5', option_d: '6' },
          { id: 2, text: 'Capital of France?', option_a: 'London', option_b: 'Paris', option_c: 'Berlin', option_d: 'Madrid' },
        ],
      },
    })

    renderExam()

    await waitFor(() => {
      expect(screen.getByText('What is 2+2?')).toBeInTheDocument()
      expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
    })
  })

  it('shows 404-friendly message when no questions found', async () => {
    examAPI.getQuestions.mockRejectedValue({ response: { status: 404 } })
    renderExam()
    await waitFor(() => {
      expect(screen.getByText(/no questions available for today/i)).toBeInTheDocument()
    })
  })

  it('shows 503 message when questions are loading', async () => {
    examAPI.getQuestions.mockRejectedValue({ response: { status: 503 } })
    renderExam()
    await waitFor(() => {
      expect(screen.getByText(/questions are loading/i)).toBeInTheDocument()
    })
  })

  it('renders the back button with arrow_back', async () => {
    examAPI.getQuestions.mockResolvedValue({
      data: { questions: [{ id: 1, text: 'Q1?', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D' }] },
    })
    renderExam()
    await waitFor(() => {
      expect(screen.getByText('Q1?')).toBeInTheDocument()
    })
    expect(screen.getByText('arrow_back')).toBeInTheDocument()
  })

  it('renders all four options for a question', async () => {
    examAPI.getQuestions.mockResolvedValue({
      data: {
        questions: [{ id: 1, text: 'Test?', option_a: 'Alpha', option_b: 'Beta', option_c: 'Gamma', option_d: 'Delta' }],
      },
    })
    renderExam()
    await waitFor(() => {
      expect(screen.getByText('Alpha')).toBeInTheDocument()
      expect(screen.getByText('Beta')).toBeInTheDocument()
      expect(screen.getByText('Gamma')).toBeInTheDocument()
      expect(screen.getByText('Delta')).toBeInTheDocument()
    })
  })

  it('renders exam header with title', async () => {
    examAPI.getQuestions.mockResolvedValue({
      data: { questions: [{ id: 1, text: 'Q1?', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D' }] },
    })
    renderExam()
    await waitFor(() => {
      expect(screen.getByText(/quantitative aptitude/i)).toBeInTheDocument()
    })
  })

  it('shows timer display during exam window', async () => {
    const RealDate = Date
    const fakeNow = new Date('2026-07-19T11:00:00+05:30')
    global.Date = class extends RealDate {
      constructor(...args) {
        if (args.length === 0) return new RealDate(fakeNow)
        super(...args)
      }
      static now() { return fakeNow.getTime() }
    }

    examAPI.getQuestions.mockResolvedValue({
      data: { questions: [{ id: 1, text: 'Q1?', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D' }] },
    })
    renderExam()
    await waitFor(() => {
      expect(screen.getByText('01:59:45')).toBeInTheDocument()
    })

    global.Date = RealDate
  })
})
