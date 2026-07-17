// src/router/AppRouter.jsx  ── US-V01
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

// Pages
import Login                  from '../pages/Login'
import AdminLogin             from '../pages/admin/AdminLogin'
import AdminDashboard         from '../pages/admin/AdminDashboard'
import AdminQuestions         from '../pages/admin/AdminQuestions'
import AdminQuestionDateDetail from '../pages/admin/AdminQuestionDateDetail'
import TeacherUpload          from '../pages/admin/TeacherUpload'
import PlatformAnalytics      from '../pages/admin/PlatformAnalytics'
import RankPage                from '../pages/admin/RankPage'
import ExamPage                from '../pages/student/ExamPage'
import LeaderboardPage         from '../pages/student/LeaderboardPage'
import TeacherReports          from '../pages/admin/TeacherReports'

export default function AppRouter() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />

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

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="is_teacher">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/questions"
          element={
            <ProtectedRoute requiredRole="is_teacher">
              <AdminQuestions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/questions/upload"
          element={
            <ProtectedRoute requiredRole="is_teacher">
              <TeacherUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/questions/date/:examDate"
          element={
            <ProtectedRoute requiredRole="is_teacher">
              <AdminQuestionDateDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stats"
          element={
            <ProtectedRoute requiredRole="is_teacher">
              <PlatformAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rank"
          element={
            <ProtectedRoute requiredRole="is_teacher">
              <RankPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
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