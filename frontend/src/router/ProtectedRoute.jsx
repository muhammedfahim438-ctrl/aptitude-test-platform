import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function ProtectedRoute({ children, requiredRole }) {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let cancelled = false

    async function checkAccess() {
      const token = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')

      if (!refreshToken) {
        if (!cancelled) setStatus('denied')
        return
      }

      if (token) {
        try {
          const decoded = jwtDecode(token)
          const now = Math.floor(Date.now() / 1000)

          if (decoded.exp && decoded.exp > now) {
            return finish(decoded)
          }
        } catch {
          // Corrupt token
        }
      }

      try {
        const res = await axios.post(`${BASE_URL}/api/auth/refresh/`, {
          refresh: refreshToken,
        })
        const newAccess = res.data.access
        localStorage.setItem('access_token', newAccess)

        const decoded = jwtDecode(newAccess)
        if (!cancelled) finish(decoded)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        if (!cancelled) setStatus('denied')
      }
    }

    function finish(decoded) {
      if (requiredRole && !decoded[requiredRole]) {
        setStatus('denied')
      } else {
        setStatus('ok')
      }
    }

    checkAccess()
    return () => { cancelled = true }
  }, [requiredRole])

  if (status === 'checking') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', fontFamily: 'Inter, sans-serif',
        color: '#4e473e', fontSize: 14,
      }}>
        Checking session...
      </div>
    )
  }

  if (status === 'denied') {
    return <Navigate to="/login" replace />
  }

  return children
}
