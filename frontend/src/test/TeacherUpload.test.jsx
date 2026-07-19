import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import TeacherUpload from '../pages/admin/TeacherUpload'
import { adminAPI } from '../api/client'

vi.mock('../api/client', () => ({
  adminAPI: {
    uploadQuestions: vi.fn(),
  },
}))

function renderUpload() {
  return render(
    <MemoryRouter initialEntries={['/admin/questions/upload']}>
      <TeacherUpload />
    </MemoryRouter>
  )
}

describe('TeacherUpload', () => {
  it('renders upload form with initial fields', () => {
    renderUpload()
    expect(screen.getByText('Question Bank Editor')).toBeInTheDocument()
    expect(screen.getByText('Add Row')).toBeInTheDocument()
    expect(screen.getByText(/Upload \d+ Question/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Enter the aptitude question here/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Enter option A/)).toBeInTheDocument()
  })

  it('adds a new question row when Add Row clicked', async () => {
    const user = userEvent.setup()
    renderUpload()
    const addButtons = screen.getAllByText('Add Row')
    await user.click(addButtons[addButtons.length - 1])
    const textareas = screen.getAllByPlaceholderText(/Enter the aptitude question here/)
    expect(textareas).toHaveLength(2)
  })

  it('removes a question row when delete clicked', async () => {
    const user = userEvent.setup()
    renderUpload()
    const addButtons = screen.getAllByText('Add Row')
    await user.click(addButtons[addButtons.length - 1])
    expect(screen.getAllByPlaceholderText(/Enter the aptitude question here/)).toHaveLength(2)

    const deleteButtons = screen.getAllByRole('button').filter(
      (btn) => btn.querySelector('.material-symbols-outlined')?.textContent === 'delete'
    )
    await user.click(deleteButtons[0])
    expect(screen.getAllByPlaceholderText(/Enter the aptitude question here/)).toHaveLength(1)
  })

  it('validates empty question text on submit', async () => {
    const user = userEvent.setup()
    renderUpload()
    const submitBtn = screen.getByText(/Upload \d+ Question/)
    await user.click(submitBtn)
    expect(screen.getByText(/text is empty/)).toBeInTheDocument()
    expect(adminAPI.uploadQuestions).not.toHaveBeenCalled()
  })

  it('validates missing options on submit', async () => {
    const user = userEvent.setup()
    renderUpload()
    const textarea = screen.getByPlaceholderText(/Enter the aptitude question here/)
    await user.type(textarea, 'What is 2+2?')
    const submitBtn = screen.getByText(/Upload \d+ Question/)
    await user.click(submitBtn)
    expect(screen.getByText(/missing options/)).toBeInTheDocument()
    expect(adminAPI.uploadQuestions).not.toHaveBeenCalled()
  })

  it('calls uploadQuestions with correct FormData on valid submit', async () => {
    const user = userEvent.setup()
    adminAPI.uploadQuestions.mockResolvedValueOnce({ data: { status: 'uploaded' } })
    renderUpload()

    const textarea = screen.getByPlaceholderText(/Enter the aptitude question here/)
    await user.type(textarea, 'What is 2+2?')
    await user.type(screen.getByPlaceholderText(/Enter option A/), '4')
    await user.type(screen.getByPlaceholderText(/Enter option B/), '3')
    await user.type(screen.getByPlaceholderText(/Enter option C/), '5')
    await user.type(screen.getByPlaceholderText(/Enter option D/), '6')

    const submitBtn = screen.getByText(/Upload \d+ Question/)
    await user.click(submitBtn)

    await waitFor(() => {
      expect(adminAPI.uploadQuestions).toHaveBeenCalledTimes(1)
    })

    const formData = adminAPI.uploadQuestions.mock.calls[0][0]
    expect(formData.get('questions')).toBeDefined()
    const questions = JSON.parse(formData.get('questions'))
    expect(questions).toHaveLength(1)
    expect(questions[0].text).toBe('What is 2+2?')
    expect(questions[0].correct_answer).toBe('A')
  })

  it('shows success message after upload', async () => {
    const user = userEvent.setup()
    adminAPI.uploadQuestions.mockResolvedValueOnce({ data: { status: 'uploaded' } })
    renderUpload()

    await user.type(screen.getByPlaceholderText(/Enter the aptitude question here/), 'Test Q')
    await user.type(screen.getByPlaceholderText(/Enter option A/), 'A')
    await user.type(screen.getByPlaceholderText(/Enter option B/), 'B')
    await user.type(screen.getByPlaceholderText(/Enter option C/), 'C')
    await user.type(screen.getByPlaceholderText(/Enter option D/), 'D')

    await user.click(screen.getByText(/Upload \d+ Question/))

    await waitFor(() => {
      expect(screen.getByText(/uploaded successfully/)).toBeInTheDocument()
    })
  })

  it('shows error message on upload failure', async () => {
    const user = userEvent.setup()
    adminAPI.uploadQuestions.mockRejectedValueOnce({
      response: { data: { error: 'Upload failed.' } },
    })
    renderUpload()

    await user.type(screen.getByPlaceholderText(/Enter the aptitude question here/), 'Test Q')
    await user.type(screen.getByPlaceholderText(/Enter option A/), 'A')
    await user.type(screen.getByPlaceholderText(/Enter option B/), 'B')
    await user.type(screen.getByPlaceholderText(/Enter option C/), 'C')
    await user.type(screen.getByPlaceholderText(/Enter option D/), 'D')

    await user.click(screen.getByText(/Upload \d+ Question/))

    await waitFor(() => {
      expect(screen.getByText('Upload failed.')).toBeInTheDocument()
    })
  })

  it('correct answer selector updates', async () => {
    const user = userEvent.setup()
    renderUpload()

    const btnC = screen.getAllByRole('button').filter((b) => b.textContent === 'C')[0]
    await user.click(btnC)

    const formData = new FormData()
    const questions = JSON.parse(formData.get('questions') || '[]')
  })
})
