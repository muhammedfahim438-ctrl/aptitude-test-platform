import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Register from '../pages/student/Register'
import { authAPI } from '../api/client'

vi.mock('../api/client', () => ({
  authAPI: {
    register: vi.fn(),
  },
}))

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Register />
    </MemoryRouter>
  )
}

function fillValidForm(user) {
  return async () => {
    await user.type(screen.getByPlaceholderText(/vignesh subramaniam/i), 'Test User')
    await user.type(screen.getByPlaceholderText(/NGI2026CS045/i), 'NGI001')
    await user.type(screen.getByPlaceholderText(/CSE-A/i), 'CSE')
    await user.type(screen.getByPlaceholderText(/vignesh@ngi\.edu\.in/i), 'test@test.com')
    await user.type(screen.getByPlaceholderText(/9876543210/i), '9876543210')
    await user.type(screen.getByPlaceholderText(/min 6 characters/i), 'password123')
    await user.type(screen.getByPlaceholderText(/re-enter password/i), 'password123')
  }
}

const getSubmitBtn = () => screen.getByRole('button', { name: /create account/i })

describe('Register', () => {
  it('renders all form fields', () => {
    renderRegister()
    expect(screen.getByText('NGI Portal')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/vignesh subramaniam/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/NGI2026CS045/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/CSE-A/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/vignesh@ngi\.edu\.in/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/9876543210/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/min 6 characters/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/re-enter password/i)).toBeInTheDocument()
    expect(getSubmitBtn()).toBeInTheDocument()
  })

  it('shows validation error for empty fields', async () => {
    const user = userEvent.setup()
    renderRegister()
    await user.click(getSubmitBtn())
    await waitFor(() => {
      expect(screen.getByText(/all fields are required/i)).toBeInTheDocument()
    })
  })

  it('calls register API on valid submit', async () => {
    authAPI.register.mockResolvedValue({
      data: {
        access: 'fake-access',
        refresh: 'fake-refresh',
        user: { full_name: 'Test User', is_student: true },
      },
    })
    const user = userEvent.setup()
    renderRegister()

    await fillValidForm(user)()
    await user.click(getSubmitBtn())

    await waitFor(() => {
      expect(authAPI.register).toHaveBeenCalledTimes(1)
    })
  })

  it('does not call login API', async () => {
    authAPI.register.mockResolvedValue({
      data: {
        access: 'fake-access',
        refresh: 'fake-refresh',
        user: { full_name: 'Test User', is_student: true },
      },
    })
    const user = userEvent.setup()
    renderRegister()

    await fillValidForm(user)()
    await user.click(getSubmitBtn())

    await waitFor(() => {
      expect(authAPI.register).toHaveBeenCalled()
    })
  })

  it('shows success screen after registration', async () => {
    authAPI.register.mockResolvedValue({
      data: {
        access: 'fake-access',
        refresh: 'fake-refresh',
        user: { full_name: 'Test User', is_student: true },
      },
    })
    const user = userEvent.setup()
    renderRegister()

    await fillValidForm(user)()
    await user.click(getSubmitBtn())

    await waitFor(() => {
      expect(screen.getByText('Registration Successful!')).toBeInTheDocument()
    })
  })

  it('shows error on API failure', async () => {
    authAPI.register.mockRejectedValue({
      response: { data: { detail: 'Email already exists.' } },
    })
    const user = userEvent.setup()
    renderRegister()

    await fillValidForm(user)()
    await user.click(getSubmitBtn())

    await waitFor(() => {
      expect(screen.getByText('Email already exists.')).toBeInTheDocument()
    })
  })

  it('validates password mismatch', async () => {
    const user = userEvent.setup()
    renderRegister()

    await user.type(screen.getByPlaceholderText(/vignesh subramaniam/i), 'Test User')
    await user.type(screen.getByPlaceholderText(/NGI2026CS045/i), 'NGI001')
    await user.type(screen.getByPlaceholderText(/CSE-A/i), 'CSE')
    await user.type(screen.getByPlaceholderText(/vignesh@ngi\.edu\.in/i), 'test@test.com')
    await user.type(screen.getByPlaceholderText(/9876543210/i), '9876543210')
    await user.type(screen.getByPlaceholderText(/min 6 characters/i), 'password123')
    await user.type(screen.getByPlaceholderText(/re-enter password/i), 'differentpassword')

    await user.click(getSubmitBtn())

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })
})
