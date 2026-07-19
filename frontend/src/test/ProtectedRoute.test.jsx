import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockAxiosPost = vi.fn()

vi.mock('axios', () => ({
  default: { post: mockAxiosPost },
  post: mockAxiosPost,
}))

const ProtectedRoute = (await import('../router/ProtectedRoute')).default

function makeToken(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  const sig = 'fake-sig'
  return `${header}.${body}.${sig}`
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    mockAxiosPost.mockReset()
  })

  it('renders children when token has correct role and is not expired', async () => {
    const token = makeToken({ is_student: true, exp: 9999999999 })
    localStorage.setItem('access_token', token)
    localStorage.setItem('refresh_token', 'fake-refresh')

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute requiredRole="is_student">
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('redirects to /login when no refresh token', async () => {
    localStorage.clear()

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute requiredRole="is_student">
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  it('redirects when token has wrong role', async () => {
    const token = makeToken({ is_teacher: true, exp: 9999999999 })
    localStorage.setItem('access_token', token)
    localStorage.setItem('refresh_token', 'fake-refresh')

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute requiredRole="is_student">
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  it('allows access without requiredRole', async () => {
    const token = makeToken({ is_student: true, exp: 9999999999 })
    localStorage.setItem('access_token', token)
    localStorage.setItem('refresh_token', 'fake-refresh')

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('refreshes token when access token is expired', async () => {
    const expiredToken = makeToken({ is_student: true, exp: 1 })
    localStorage.setItem('access_token', expiredToken)
    localStorage.setItem('refresh_token', 'valid-refresh')

    const newToken = makeToken({ is_student: true, exp: 9999999999 })
    mockAxiosPost.mockResolvedValue({ data: { access: newToken } })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute requiredRole="is_student">
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    expect(mockAxiosPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/refresh/'),
      { refresh: 'valid-refresh' }
    )
  })
})
