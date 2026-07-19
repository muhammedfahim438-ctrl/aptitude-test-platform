import '@testing-library/jest-dom'

vi.stubGlobal('import.meta', {
  env: {
    VITE_API_BASE_URL: 'http://localhost:8000',
  },
})

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})
