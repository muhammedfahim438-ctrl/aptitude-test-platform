import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function getUserFromToken() {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function AnswerKeyPage() {
  const navigate = useNavigate();
  const user = getUserFromToken();
  const userId = user?.user_id || 'guest';
  const examDate = new Date().toISOString().split('T')[0];
  const storageKey = `exam_answers_${userId}_${examDate}`;

  const [answerKey, setAnswerKey] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [ended, setEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  // Get student's saved answers
  const getSavedAnswers = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return {};
      return JSON.parse(atob(saved));
    } catch {
      return {};
    }
  };

  // Countdown to 2 PM
  const startCountdown = () => {
    countdownRef.current = setInterval(() => {
      const now = new Date();
      const unlock = new Date();
      unlock.setHours(14, 0, 0, 0);
      const diff = Math.max(0, Math.floor((unlock - now) / 1000));
      const mm = String(Math.floor(diff / 60)).padStart(2, '0');
      const ss = String(diff % 60).padStart(2, '0');
      setTimeLeft(`${mm}:${ss}`);
      if (diff <= 0) {
        clearInterval(countdownRef.current);
        fetchAnswerKey();
      }
    }, 1000);
  };

  const fetchAnswerKey = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(
        `/api/tests/answers/?date=${examDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 200) {
        setAnswerKey(res.data);
        clearInterval(intervalRef.current);
        clearInterval(countdownRef.current);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        // Not yet 2 PM - start countdown
        startCountdown();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    const endTime = new Date();
    endTime.setHours(19, 0, 0, 0);

    // After 7 PM - stop everything
    if (now >= endTime) {
      setEnded(true);
      setLoading(false);
      return;
    }

    fetchAnswerKey();

    // Poll every 60 seconds after 1:50 PM
    const startPolling = new Date();
    startPolling.setHours(13, 50, 0, 0);
    if (now >= startPolling) {
      intervalRef.current = setInterval(() => {
        const current = new Date();
        if (current >= endTime) {
          setEnded(true);
          clearInterval(intervalRef.current);
          return;
        }
        fetchAnswerKey();
      }, 60000);
    }

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, []);

  const savedAnswers = getSavedAnswers();

  // Sample answer key for testing (will come from API later)
  const SAMPLE_KEY = [
    { question_id: 1, correct_answer: 'B', question_text: 'Which division showed highest % increase in Q3?' },
    { question_id: 2, correct_answer: 'C', question_text: 'Revenue in Q2 after 60% growth?' },
    { question_id: 3, correct_answer: 'D', question_text: 'Most stable growth quarter?' },
  ];

 const displayKey = Array.isArray(answerKey) ? answerKey : SAMPLE_KEY;

  return (
    <div className="min-h-screen bg-surface-page">

      {/* Header */}
      <header className="bg-white flex justify-between items-center px-4 md:px-10 w-full h-16 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="material-symbols-outlined text-primary p-2 hover:bg-surface-container-low rounded-full"
          >
            arrow_back
          </button>
          <h1 className="font-space text-xl font-bold text-navy-deep">Answer Key</h1>
        </div>
        <p className="font-mono text-xs text-ink-subtle">{examDate}</p>
      </header>

      <main className="max-w-2xl mx-auto p-4 md:p-8 flex flex-col gap-6">

        {/* After 7 PM */}
        {ended && (
          <div className="bg-surface-container rounded-2xl p-8 text-center border border-outline-variant">
            <span className="material-symbols-outlined text-ink-disabled text-5xl mb-4 block">lock</span>
            <h2 className="font-space text-xl font-bold text-navy-deep mb-2">
              Review Period Ended
            </h2>
            <p className="font-inter text-sm text-ink-subtle">
              Answer key review period has ended.
            </p>
          </div>
        )}

        {/* Loading */}
        {!ended && loading && (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
          </div>
        )}

        {/* Before 2 PM — Countdown Banner */}
        {!ended && !loading && !answerKey && (
          <div className="bg-error-container rounded-2xl p-8 text-center border border-error/20">
            <span className="material-symbols-outlined text-on-error-container text-5xl mb-4 block">lock_clock</span>
            <h2 className="font-space text-xl font-bold text-on-error-container mb-2">
              Answer Key Locked
            </h2>
            <p className="font-inter text-sm text-on-error-container/70 mb-6">
              The answer key will be available at 2:00 PM
            </p>
            {timeLeft && (
              <div className="bg-white/50 rounded-xl px-6 py-4 inline-block">
                <p className="font-mono text-xs text-ink-subtle uppercase tracking-widest mb-1">
                  Unlocks in
                </p>
                <p className="font-mono text-3xl font-bold text-on-error-container">
                  {timeLeft}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Answer Key Display */}
        {!ended && !loading && (
          <>
            {/* Summary Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-4 border border-outline-variant text-center shadow-sm">
                <p className="font-mono text-xs text-ink-subtle uppercase mb-1">Total</p>
                <p className="font-space text-2xl font-bold text-navy-deep">{displayKey.length}</p>
              </div>
              <div className="bg-tertiary-container/30 rounded-xl p-4 border border-tertiary/20 text-center shadow-sm">
                <p className="font-mono text-xs text-ink-subtle uppercase mb-1">Correct</p>
                <p className="font-space text-2xl font-bold text-tertiary">
                  {displayKey.filter(item => savedAnswers[item.question_id] === item.correct_answer).length}
                </p>
              </div>
              <div className="bg-error-container/30 rounded-xl p-4 border border-error/20 text-center shadow-sm">
                <p className="font-mono text-xs text-ink-subtle uppercase mb-1">Wrong</p>
                <p className="font-space text-2xl font-bold text-error">
                  {displayKey.filter(item =>
                    savedAnswers[item.question_id] &&
                    savedAnswers[item.question_id] !== item.correct_answer
                  ).length}
                </p>
              </div>
            </div>

            {/* Answer List */}
            <div className="flex flex-col gap-3">
              {displayKey.map((item) => {
                const studentAnswer = savedAnswers[item.question_id];
                const isCorrect = studentAnswer === item.correct_answer;
                const isUnanswered = !studentAnswer;

                return (
                  <div
                    key={item.question_id}
                    className={`bg-white rounded-2xl border shadow-sm overflow-hidden
                      ${isUnanswered
                        ? 'border-outline-variant'
                        : isCorrect
                        ? 'border-tertiary/30'
                        : 'border-error/30'
                      }`}
                  >
                    {/* Color bar on left */}
                    <div className={`h-1 w-full
                      ${isUnanswered ? 'bg-outline-variant' : isCorrect ? 'bg-tertiary' : 'bg-error'}`}
                    />

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-mono text-xs text-ink-subtle uppercase mb-1">
                            Question {item.question_id}
                          </p>
                          <p className="font-inter text-sm text-on-surface mb-3">
                            {item.question_text}
                          </p>

                          {/* Correct Answer */}
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-tertiary text-lg"
                              style={{ fontVariationSettings: "'FILL' 1" }}>
                              check_circle
                            </span>
                            <span className="font-mono text-sm font-bold text-tertiary">
                              Correct: {item.correct_answer}
                            </span>
                          </div>

                          {/* Student Answer */}
                          {studentAnswer && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`material-symbols-outlined text-lg
                                ${isCorrect ? 'text-tertiary' : 'text-error'}`}
                                style={{ fontVariationSettings: "'FILL' 1" }}>
                                {isCorrect ? 'check_circle' : 'cancel'}
                              </span>
                              <span className={`font-mono text-sm font-bold
                                ${isCorrect ? 'text-tertiary' : 'text-error'}`}>
                                Your Answer: {studentAnswer}
                              </span>
                            </div>
                          )}

                          {isUnanswered && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="material-symbols-outlined text-ink-disabled text-lg">
                                radio_button_unchecked
                              </span>
                              <span className="font-mono text-sm text-ink-disabled">
                                Not answered
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className={`px-3 py-1 rounded-full font-mono text-xs font-bold flex-shrink-0
                          ${isUnanswered
                            ? 'bg-surface-container text-ink-subtle'
                            : isCorrect
                            ? 'bg-tertiary-container/30 text-tertiary'
                            : 'bg-error-container text-on-error-container'
                          }`}>
                          {isUnanswered ? 'SKIPPED' : isCorrect ? '✓ CORRECT' : '✗ WRONG'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}