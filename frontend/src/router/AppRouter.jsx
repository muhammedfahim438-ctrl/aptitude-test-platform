// src/router/AppRouter.jsx  ── US-V01
// Central route map for the entire frontend.
// Route map:
//   /login                 → public
//   /student/exam          → is_student only
//   /student/leaderboard   → is_student only
//   /teacher/upload        → is_teacher only
//   /teacher/reports       → is_teacher only
//   *                      → redirect to /login

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

// Pages
import Login          from '../pages/Login'
import ExamPage       from '../pages/student/ExamPage'
import LeaderboardPage from '../pages/student/LeaderboardPage'
import TeacherUpload  from '../pages/teacher/TeacherUpload'
import TeacherReports from '../pages/teacher/TeacherReports'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Student routes */}
        <Route
          path="/student/exam"
          element={
            <ProtectedRoute requiredRole="is_student">
              <ExamPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/leaderboard"
          element={
            <ProtectedRoute requiredRole="is_student">
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />

        {/* Teacher routes */}
        <Route
          path="/teacher/upload"
          element={
            <ProtectedRoute requiredRole="is_teacher">
              <TeacherUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/reports"
          element={
            <ProtectedRoute requiredRole="is_teacher">
              <TeacherReports />
            </ProtectedRoute>
          }
        />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
