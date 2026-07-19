import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

import Login from '../pages/Login'
import AdminLogin from '../pages/admin/AdminLogin'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminQuestions from '../pages/admin/AdminQuestions'
import TeacherUpload from '../pages/admin/TeacherUpload'
import AdminQuestionDateDetail from '../pages/admin/AdminQuestionDateDetail'
import PlatformAnalytics from '../pages/admin/PlatformAnalytics'
import RankPage from '../pages/admin/RankPage'
import TeacherReports from '../pages/admin/TeacherReports'
import ExamPage from '../pages/student/ExamPage'
import LeaderboardPage from '../pages/student/LeaderboardPage'
import Register from '../pages/student/Register'
import AnswerReview from '../pages/student/AnswerReview'
import StudentDashboard from '../pages/student/StudentDashboard'
import StudentResult from '../pages/student/StudentResult'

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

        <Route path="/student/dashboard" element={
          <ProtectedRoute requiredRole="is_student">
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student/exam" element={
          <ProtectedRoute requiredRole="is_student">
            <ExamPage />
          </ProtectedRoute>
        } />
        <Route path="/student/result" element={
          <ProtectedRoute requiredRole="is_student">
            <StudentResult />
          </ProtectedRoute>
        } />
        <Route path="/student/leaderboard" element={
          <ProtectedRoute requiredRole="is_student">
            <LeaderboardPage />
          </ProtectedRoute>
        } />
        <Route path="/student/review" element={
          <ProtectedRoute requiredRole="is_student">
            <AnswerReview />
          </ProtectedRoute>
        } />
        <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />

        <Route path="/admin/dashboard" element={
          <ProtectedRoute requiredRole="is_teacher">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/questions" element={
          <ProtectedRoute requiredRole="is_teacher">
            <AdminQuestions />
          </ProtectedRoute>
        } />
        <Route path="/admin/questions/upload" element={
          <ProtectedRoute requiredRole="is_teacher">
            <TeacherUpload />
          </ProtectedRoute>
        } />
        <Route path="/admin/questions/date/:date" element={
          <ProtectedRoute requiredRole="is_teacher">
            <AdminQuestionDateDetail />
          </ProtectedRoute>
        } />
        <Route path="/admin/stats" element={
          <ProtectedRoute requiredRole="is_teacher">
            <PlatformAnalytics />
          </ProtectedRoute>
        } />
        <Route path="/admin/rank" element={
          <ProtectedRoute requiredRole="is_teacher">
            <RankPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute requiredRole="is_teacher">
            <TeacherReports />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
