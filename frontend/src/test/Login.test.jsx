import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import LoginPage from '../pages/Login'
import { authAPI } from '../api/client'

vi.mock('../api/client', () => ({
  authAPI: {
    studentSignin: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
  },
}))

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  it('renders all form fields', () => {
    renderLogin()
    expect(screen.getByPlaceholderText(/enter your full name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/NGI2026CS045/i)).toBeInTheDocument()
    expect(screen.getByText('Department')).toBeInTheDocument()
    expect(screen.getByText('Year')).toBeInTheDocument()
    expect(screen.getByText('Semester')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/your@ngi.edu.in/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/9876543210/i)).toBeInTheDocument()
  })

  it('renders the sign-in button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders Apptist branding', () => {
    renderLogin()
    expect(screen.getByText('Apptist')).toBeInTheDocument()
    expect(screen.getByText(/nehru group of institutions/i)).toBeInTheDocument()
  })

  it('shows missing fields modal when submitting empty form', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/missing information/i)).toBeInTheDocument()
    })
  })

  it('validates email must contain @', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText(/enter your full name/i), 'John')
    await user.type(screen.getByPlaceholderText(/NGI2026CS045/i), 'NGI001')
    await user.selectOptions(screen.getAllByRole('combobox')[0], 'BCA')
    await user.selectOptions(screen.getAllByRole('combobox')[1], '1st Year')
    await user.selectOptions(screen.getAllByRole('combobox')[2], 'Semester 1')
    await user.type(screen.getByPlaceholderText(/your@ngi.edu.in/i), 'bademail')
    await user.type(screen.getByPlaceholderText(/9876543210/i), '9876543210')

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })

  it('validates mobile must be 10 digits', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText(/enter your full name/i), 'John')
    await user.type(screen.getByPlaceholderText(/NGI2026CS045/i), 'NGI001')
    await user.selectOptions(screen.getAllByRole('combobox')[0], 'BCA')
    await user.selectOptions(screen.getAllByRole('combobox')[1], '1st Year')
    await user.selectOptions(screen.getAllByRole('combobox')[2], 'Semester 1')
    await user.type(screen.getByPlaceholderText(/your@ngi.edu.in/i), 'john@test.com')
    await user.type(screen.getByPlaceholderText(/9876543210/i), '123')

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/10 digits/i)).toBeInTheDocument()
    })
  })

  it('calls studentSignin on valid submission', async () => {
    authAPI.studentSignin.mockResolvedValue({
      data: {
        access: 'fake-access',
        refresh: 'fake-refresh',
        user: { full_name: 'John', is_student: true },
      },
    })

    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText(/enter your full name/i), 'John Doe')
    await user.type(screen.getByPlaceholderText(/NGI2026CS045/i), 'NGI001CS')
    await user.selectOptions(screen.getAllByRole('combobox')[0], 'BCA')
    await user.selectOptions(screen.getAllByRole('combobox')[1], '1st Year')
    await user.selectOptions(screen.getAllByRole('combobox')[2], 'Semester 1')
    await user.type(screen.getByPlaceholderText(/your@ngi.edu.in/i), 'john@test.com')
    await user.type(screen.getByPlaceholderText(/9876543210/i), '9876543210')

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(authAPI.studentSignin).toHaveBeenCalledWith({
        full_name: 'John Doe',
        roll_number: 'NGI001CS',
        department: 'BCA',
        email: 'john@test.com',
        mobile: '9876543210',
        year: '1st Year',
        semester: 'Semester 1',
      })
    })
  })

  it('stores tokens in localStorage after successful sign-in', async () => {
    authAPI.studentSignin.mockResolvedValue({
      data: {
        access: 'fake-access',
        refresh: 'fake-refresh',
        user: { full_name: 'John', is_student: true },
      },
    })

    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText(/enter your full name/i), 'John Doe')
    await user.type(screen.getByPlaceholderText(/NGI2026CS045/i), 'NGI001CS')
    await user.selectOptions(screen.getAllByRole('combobox')[0], 'BCA')
    await user.selectOptions(screen.getAllByRole('combobox')[1], '1st Year')
    await user.selectOptions(screen.getAllByRole('combobox')[2], 'Semester 1')
    await user.type(screen.getByPlaceholderText(/your@ngi.edu.in/i), 'john@test.com')
    await user.type(screen.getByPlaceholderText(/9876543210/i), '9876543210')

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('fake-access')
      expect(localStorage.getItem('refresh_token')).toBe('fake-refresh')
    })
  })

  it('displays API error on failed sign-in', async () => {
    authAPI.studentSignin.mockRejectedValue({
      response: { data: { detail: 'User already exists with this email.' } },
    })

    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText(/enter your full name/i), 'John Doe')
    await user.type(screen.getByPlaceholderText(/NGI2026CS045/i), 'NGI001CS')
    await user.selectOptions(screen.getAllByRole('combobox')[0], 'BCA')
    await user.selectOptions(screen.getAllByRole('combobox')[1], '1st Year')
    await user.selectOptions(screen.getAllByRole('combobox')[2], 'Semester 1')
    await user.type(screen.getByPlaceholderText(/your@ngi.edu.in/i), 'john@test.com')
    await user.type(screen.getByPlaceholderText(/9876543210/i), '9876543210')

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/user already exists/i)).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    authAPI.studentSignin.mockImplementation(() => new Promise(() => {}))

    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText(/enter your full name/i), 'John Doe')
    await user.type(screen.getByPlaceholderText(/NGI2026CS045/i), 'NGI001CS')
    await user.selectOptions(screen.getAllByRole('combobox')[0], 'BCA')
    await user.selectOptions(screen.getAllByRole('combobox')[1], '1st Year')
    await user.selectOptions(screen.getAllByRole('combobox')[2], 'Semester 1')
    await user.type(screen.getByPlaceholderText(/your@ngi.edu.in/i), 'john@test.com')
    await user.type(screen.getByPlaceholderText(/9876543210/i), '9876543210')

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
    })
  })

  it('sanitizes name input - rejects numbers', async () => {
    const user = userEvent.setup()
    renderLogin()

    const nameInput = screen.getByPlaceholderText(/enter your full name/i)
    await user.type(nameInput, 'John123')

    expect(nameInput.value).toBe('John')
  })

  it('sanitizes mobile input - rejects letters', async () => {
    const user = userEvent.setup()
    renderLogin()

    const mobileInput = screen.getByPlaceholderText(/9876543210/i)
    await user.type(mobileInput, 'abc123')

    expect(mobileInput.value).toBe('123')
  })

  it('shows custom department field when Others is selected', async () => {
    const user = userEvent.setup()
    renderLogin()

    const deptSelect = screen.getAllByRole('combobox')[0]
    await user.selectOptions(deptSelect, '__others__')

    expect(screen.getByPlaceholderText(/type your course/i)).toBeInTheDocument()
  })

  it('has a link to admin login', () => {
    renderLogin()
    const adminLink = screen.getByRole('link', { name: /admin/i })
    expect(adminLink).toHaveAttribute('href', '/admin/login')
  })
})
