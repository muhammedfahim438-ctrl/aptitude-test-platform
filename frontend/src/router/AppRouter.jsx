import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import ExamPage from '../pages/student/ExamPage';
import SubmittedPage from '../pages/student/SubmittedPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/student/exam" element={<ExamPage />} />
        <Route path="/student/submitted" element={<SubmittedPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}