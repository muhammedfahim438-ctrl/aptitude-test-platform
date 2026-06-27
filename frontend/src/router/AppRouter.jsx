import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import ExamPage from '../pages/student/ExamPage';
import SubmittedPage from '../pages/student/SubmittedPage';
import AnswerKeyPage from '../pages/student/AnswerKeyPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/student/exam" element={<ExamPage />} />
        <Route path="/student/submitted" element={<SubmittedPage />} />
        <Route path="/student/answers" element={<AnswerKeyPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}