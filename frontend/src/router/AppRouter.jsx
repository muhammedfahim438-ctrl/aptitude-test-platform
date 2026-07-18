import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

import Login from '../pages/Login'
import AdminLogin from '../pages/admin/AdminLogin'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminQuestions from '../pages/admin/AdminQuestions'
import TeacherUpload from '../pages/admin/TeacherUpload'
import PlatformAnalytics from '../pages/admin/PlatformAnalytics'
import RankPage from '../pages/admin/RankPage'
import TeacherReports from '../pages/admin/TeacherReports'
import ExamPage from '../pages/student/ExamPage'
import LeaderboardPage from '../pages/student/LeaderboardPage'
import Register from '../pages/student/Register'

export default function AppRouter() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />

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
              <AdminQuestions />
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

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
