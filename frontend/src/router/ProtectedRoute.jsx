// src/router/ProtectedRoute.jsx  ── US-V01
// Decodes JWT from localStorage and checks role before rendering children.
// Unauthenticated or wrong role → <Navigate to="/login" />

import { Navigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

export default function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('access_token')

  if (!token) return <Navigate to="/login" replace />

  let decoded
  try {
    decoded = jwtDecode(token)
  } catch {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    return <Navigate to="/login" replace />
  }

  // Expired?
  const now = Math.floor(Date.now() / 1000)
  if (decoded.exp && decoded.exp < now) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    return <Navigate to="/login" replace />
  }

  // Role gate
  if (requiredRole && !decoded[requiredRole]) {
    return <Navigate to="/login" replace />
  }

  return children
}
