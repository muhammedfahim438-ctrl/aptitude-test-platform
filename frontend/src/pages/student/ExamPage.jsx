import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { usePersistedAnswers } from '../../hooks/usePersistedAnswers';
import CountdownTimer from '../../components/CountdownTimer';

// Get user info from JWT token
function getUserFromToken() {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
}

// Sample questions for testing (will come from API later)
const SAMPLE_QUESTIONS = [
  {
    id: 1,
    text: 'Study the comparative revenue growth chart below between the SaaS and Enterprise divisions. Which division showed the highest percentage increase in Q3 compared to Q2?',
    options: {
      A: 'SaaS Division (25% increase)',
      B: 'SaaS Division (41.6% increase)',
      C: 'Enterprise Division (11.1% increase)',
      D: 'Data is insufficient to determine',
    },
  },
  {
    id: 2,
    text: 'If the total revenue in Q1 was 100 units and grew by 60% in Q2, what was the revenue in Q2?',
    options: {
      A: '140 units',
      B: '150 units',
      C: '160 units',
      D: '170 units',
    },
  },
  {
    id: 3,
    text: 'Which quarter showed the most stable growth across both divisions?',
    options: {
      A: 'Q1',
      B: 'Q2',
      C: 'Q3',
      D: 'Q4',
    },
  },
];

export default function ExamPage() {
  const navigate = useNavigate();
  const user = getUserFromToken();
  const userId = user?.user_id || 'guest';
  const examDate = new Date().toISOString().split('T')[0];

  const { answers, saveAnswer, clearAnswers } = usePersistedAnswers(userId, examDate);
  const [currentQ, setCurrentQ] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Exam ends at 2:00 PM today
  const examEndTime = new Date();
  examEndTime.setHours(14, 0, 0, 0);

  const handleAutoSubmit = useCallback(async () => {
    await submitAnswers();
  }, [answers]);

  const submitAnswers = async (retries = 3) => {
    setSubmitting(true);
    for (let i = 0; i < retries; i++) {
      try {
        const token = localStorage.getItem('access_token');
        await axios.post(
          '/api/tests/submit/',
          { exam_date: examDate, answers },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        clearAnswers();
        setSubmitted(true);
        navigate('/student/submitted');
        return;
      } catch (err) {
        if (i < retries - 1) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }
    setSubmitting(false);
    alert('Submission failed. Please try again.');
  };

  const question = SAMPLE_QUESTIONS[currentQ];
  const totalQuestions = SAMPLE_QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center">
        <p className="text-navy-deep font-space text-2xl">Submitting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-page">

      {/* Top Header */}
      <header className="bg-white flex justify-between items-center px-4 md:px-10 w-full h-16 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <button className="material-symbols-outlined text-primary p-2 hover:bg-surface-container-low rounded-full">
            menu
          </button>
          <h1 className="font-space text-xl font-bold text-navy-deep">AptitudePortal</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Countdown Timer */}
          <div className="flex items-center gap-2 bg-error-container text-on-error-container px-3 py-1.5 rounded-xl font-mono text-sm">
            <span className="material-symbols-outlined text-lg">timer</span>
            <CountdownTimer
              examEndTime={examEndTime.toISOString()}
              onExpire={handleAutoSubmit}
            />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-8 flex flex-col gap-6">

        {/* Question Palette */}
        <div className="flex overflow-x-auto gap-2 pb-2">
          {SAMPLE_QUESTIONS.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQ(idx)}
              className={`min-w-[40px] h-10 rounded-lg flex-shrink-0 flex items-center justify-center font-mono text-sm font-bold transition-all
                ${idx === currentQ
                  ? 'bg-primary text-white shadow-md'
                  : answers[q.id]
                  ? 'bg-tertiary-container text-white'
                  : 'bg-surface-container-high text-on-surface border border-outline-variant'
                }`}
            >
              {q.id}
            </button>
          ))}
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs text-ink-subtle uppercase tracking-widest">
            Question {currentQ + 1} of {totalQuestions}
          </p>
          <p className="font-mono text-xs text-ink-subtle">
            {answeredCount}/{totalQuestions} Answered
          </p>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-md border border-outline-variant/30 overflow-hidden">

          {/* Question Header */}
          <div className="p-5 border-b border-outline-variant/30 bg-surface-container-low/50 flex justify-between items-start">
            <div>
              <p className="font-mono text-xs text-primary mb-1 uppercase tracking-widest">
                Q{question.id} OF {totalQuestions}
              </p>
              <h2 className="font-space text-lg font-semibold text-navy-deep">
                {question.text}
              </h2>
            </div>
          </div>

          {/* Options */}
          <div className="p-6">
            <p className="font-mono text-xs text-ink-subtle uppercase mb-4 tracking-wide">
              Select your answer
            </p>
            <div className="flex flex-col gap-3">
              {Object.entries(question.options).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => saveAnswer(question.id, key)}
                  className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all text-left
                    ${answers[question.id] === key
                      ? 'border-2 border-primary bg-primary/5'
                      : 'border border-outline-variant hover:border-primary hover:bg-primary/5'
                    }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 flex-shrink-0
                    ${answers[question.id] === key
                      ? 'border-primary bg-primary'
                      : 'border-outline'
                    }`}
                  >
                    {answers[question.id] === key && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className={`font-inter text-base
                    ${answers[question.id] === key
                      ? 'text-navy-deep font-medium'
                      : 'text-on-surface'
                    }`}
                  >
                    <span className="font-mono text-sm mr-2">{key}.</span>
                    {val}
                  </span>
                </button>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center gap-3">
              <button
                onClick={() => setCurrentQ((prev) => Math.max(0, prev - 1))}
                disabled={currentQ === 0}
                className="flex-1 py-4 border border-outline text-navy-deep rounded-xl font-mono text-sm hover:bg-surface-container transition-colors disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentQ((prev) => Math.min(totalQuestions - 1, prev + 1))}
                disabled={currentQ === totalQuestions - 1}
                className="flex-1 py-4 bg-primary text-white rounded-xl font-mono text-sm shadow-md hover:bg-primary-container transition-all disabled:opacity-40"
              >
                Next Question
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={() => submitAnswers()}
          disabled={submitting}
          className="w-full py-5 bg-navy-deep text-white rounded-2xl font-mono font-bold text-sm shadow-xl hover:bg-primary transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          {submitting ? (
            <>
              <span className="material-symbols-outlined animate-spin">sync</span>
              Submitting...
            </>
          ) : (
            <>
              FINISH ASSESSMENT
              <span className="material-symbols-outlined">arrow_forward</span>
            </>
          )}
        </button>

      </main>
    </div>
  );
}