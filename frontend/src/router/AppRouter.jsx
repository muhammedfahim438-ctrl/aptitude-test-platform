import { useState, useCallback } from 'react'
import LoginPage from '../pages/Login'
import Register from '../pages/student/Register'
import Dashboard from '../pages/student/Dashboard'
import AssessmentDetails from '../pages/student/AssessmentDetails'
import ExamPage from '../pages/student/ExamPage'
import SubmitPage from '../pages/student/SubmitPage'
import ProcessingPage from '../pages/student/ProcessingPage'
import SuccessPage from '../pages/student/SuccessPage'
import AnswerReview from '../pages/student/AnswerReview'

export default function AppRouter() {
  const [page, setPage] = useState('login')
  const [examData, setExamData] = useState(null)

  const navigate = useCallback((p, data = null) => {
    setPage(p)
    if (data) setExamData(data)
  }, [])

  const pages = {
    login: <LoginPage onLogin={() => navigate('dashboard')} onNavigate={navigate} />,
    register: <Register onNavigate={navigate} />,
    dashboard: <Dashboard onNavigate={navigate} />,
    'assessment-details': <AssessmentDetails onNavigate={navigate} />,
    exam: <ExamPage onNavigate={navigate} />,
    submit: <SubmitPage onNavigate={navigate} />,
    processing: <ProcessingPage onNavigate={navigate} />,
    success: <SuccessPage onNavigate={navigate} />,
    'answer-review': <AnswerReview onNavigate={navigate} />,
  }

  return (
    <div style={{ background: '#e3e1e8', minHeight: '100vh' }}>
      {pages[page] || pages['login']}
    </div>
  )
}