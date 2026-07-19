import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import TeacherReports from '../pages/admin/TeacherReports'
import { adminAPI } from '../api/client'

vi.mock('../api/client', () => ({
  adminAPI: {
    getReports: vi.fn(),
    downloadReport: vi.fn(),
  },
}))

const mockReports = [
  { exam_date: '2026-07-18', student_count: 45, total_submissions: 42 },
  { exam_date: '2026-07-17', student_count: 40, total_submissions: 38 },
]

function renderReports(reports = mockReports) {
  adminAPI.getReports.mockResolvedValue({
    data: { student_performance: reports },
  })
  return render(
    <MemoryRouter initialEntries={['/admin/reports']}>
      <TeacherReports />
    </MemoryRouter>
  )
}

async function switchToReportsTab(user) {
  const reportsButtons = screen.getAllByRole('button', { name: /reports/i })
  await user.click(reportsButtons[0])
}

describe('TeacherReports', () => {
  it('renders header and tabs', async () => {
    renderReports()
    expect(screen.getByText('Performance Reports')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /performance/i })).toBeInTheDocument()
    const reportsButtons = screen.getAllByRole('button', { name: /reports/i })
    expect(reportsButtons.length).toBeGreaterThanOrEqual(2)
  })

  it('shows report cards with dates after switching to Reports tab', async () => {
    const user = userEvent.setup()
    renderReports()
    await switchToReportsTab(user)
    await waitFor(() => {
      expect(screen.getByText('2026-07-18')).toBeInTheDocument()
    })
    expect(screen.getByText('2026-07-17')).toBeInTheDocument()
  })

  it('shows student counts after switching to Reports tab', async () => {
    const user = userEvent.setup()
    renderReports()
    await switchToReportsTab(user)
    await waitFor(() => {
      expect(screen.getByText(/45 students/)).toBeInTheDocument()
    })
    expect(screen.getByText(/40 students/)).toBeInTheDocument()
  })

  it('calls downloadReport on download click', async () => {
    adminAPI.downloadReport.mockResolvedValue({
      data: new Blob(['col1,col2\nval1,val2'], { type: 'text/csv' }),
    })
    const user = userEvent.setup()
    renderReports()
    await switchToReportsTab(user)
    await waitFor(() => {
      expect(screen.getByText('2026-07-18')).toBeInTheDocument()
    })

    const downloadIcons = screen.getAllByText('download')
    await user.click(downloadIcons[0].closest('button'))
    await waitFor(() => {
      expect(adminAPI.downloadReport).toHaveBeenCalledWith('2026-07-18')
    })
  })

  it('shows empty state when no reports', async () => {
    adminAPI.getReports.mockResolvedValue({
      data: { student_performance: [] },
    })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/admin/reports']}>
        <TeacherReports />
      </MemoryRouter>
    )
    await switchToReportsTab(user)
    await waitFor(() => {
      expect(screen.getByText(/no reports available/i)).toBeInTheDocument()
    })
  })

  it('shows loading skeletons during load', async () => {
    adminAPI.getReports.mockImplementation(() => new Promise(() => {}))
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter initialEntries={['/admin/reports']}>
        <TeacherReports />
      </MemoryRouter>
    )
    await switchToReportsTab(user)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
