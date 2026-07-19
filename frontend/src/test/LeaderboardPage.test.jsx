import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import LeaderboardPage from '../pages/student/LeaderboardPage'
import { examAPI } from '../api/client'

vi.mock('../api/client', () => ({
  examAPI: {
    getLeaderboard: vi.fn(),
  },
}))

const mockRankings = [
  { rank: 1, name: 'Alice Smith', roll_number: 'NGI001', score: 9 },
  { rank: 2, name: 'Bob Jones', roll_number: 'NGI002', score: 7 },
  { rank: 3, name: 'Charlie Brown', roll_number: 'NGI003', score: 5 },
]

function renderLeaderboard(data = mockRankings, total = 50) {
  examAPI.getLeaderboard.mockResolvedValue({
    data: { rankings: data, total_examinees: total },
  })
  return render(
    <MemoryRouter initialEntries={['/student/leaderboard']}>
      <LeaderboardPage />
    </MemoryRouter>
  )
}

describe('LeaderboardPage', () => {
  it('shows loading state initially', () => {
    examAPI.getLeaderboard.mockImplementation(() => new Promise(() => {}))
    render(
      <MemoryRouter initialEntries={['/student/leaderboard']}>
        <LeaderboardPage />
      </MemoryRouter>
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders podium for top 3', async () => {
    renderLeaderboard()
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('renders ranked list below podium', async () => {
    renderLeaderboard()
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument()
  })

  it('displays total examinees count', async () => {
    renderLeaderboard()
    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument()
    })
    expect(screen.getByText('Examinees')).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    examAPI.getLeaderboard.mockRejectedValue(new Error('Network'))
    render(
      <MemoryRouter initialEntries={['/student/leaderboard']}>
        <LeaderboardPage />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('Failed to load leaderboard.')).toBeInTheDocument()
    })
  })

  it('shows empty state when no data', async () => {
    examAPI.getLeaderboard.mockResolvedValue({
      data: { rankings: [], total_examinees: 0 },
    })
    render(
      <MemoryRouter initialEntries={['/student/leaderboard']}>
        <LeaderboardPage />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText(/no leaderboard data available/i)).toBeInTheDocument()
    })
  })

  it('calls leaderboard API on mount', async () => {
    renderLeaderboard()
    await waitFor(() => {
      expect(examAPI.getLeaderboard).toHaveBeenCalled()
    })
    expect(examAPI.getLeaderboard).toHaveBeenCalledWith(25)
  })

  it('shows roll numbers for each entry', async () => {
    renderLeaderboard()
    await waitFor(() => {
      expect(screen.getByText('NGI001')).toBeInTheDocument()
    })
    expect(screen.getByText('NGI002')).toBeInTheDocument()
    expect(screen.getByText('NGI003')).toBeInTheDocument()
  })
})
