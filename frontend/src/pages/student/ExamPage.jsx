import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import QuestionCard from '../../components/QuestionCard';
import useExamCountdown from '../../hooks/useExamCountdown';
import { usePersistedAnswers } from '../../hooks/usePersistedAnswers';
import { examAPI } from '../../api/client';

const orange = '#E8621A';

function getExamEndTime(examDate) {
  return new Date(`${examDate}T14:00:00`);
}

function getExamStartTime(examDate) {
  return new Date(`${examDate}T10:00:00`);
}

export default function ExamPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [examDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const decoded = jwtDecode(token);
      setUser(decoded);
    } catch {
      setUser(null);
    }
  }, []);

  const userId = user?.user_id ?? user?.sub ?? 'anonymous';
  const { answers, saveAnswer, clearAnswers } = usePersistedAnswers(userId, examDate);

  const now = new Date();
  const examStart = getExamStartTime(examDate);
  const examEnd = getExamEndTime(examDate);
  const isBeforeWindow = now < examStart;
  const isAfterWindow = now > examEnd;
  const isReadOnly = isAfterWindow || submitted;

  useEffect(() => {
    let cancelled = false;
    async function fetchQuestions() {
      setLoading(true);
      setError(null);
      try {
        const res = await examAPI.getQuestions(examDate);
        if (!cancelled) {
          setQuestions(res.data.questions || []);
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err.response?.status === 503
              ? 'Questions are loading, please wait a moment and refresh.'
              : err.response?.data?.error || 'Failed to load questions. Please refresh.';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (!isBeforeWindow) fetchQuestions();
    else setLoading(false);
    return () => { cancelled = true; };
  }, [examDate, isBeforeWindow]);

  const handleSubmit = useCallback(
    async (isAutoSubmit = false) => {
      if (submitted) return;
      setSubmitting(true);
      setSubmitError(null);

      const attempt = async (retriesLeft) => {
        try {
          await examAPI.submitAnswers(examDate, answers);
          setSubmitted(true);
          clearAnswers();
        } catch (err) {
          const status = err.response?.status;
          const isRetryable = !status || status === 503 || status === 500;
          if (retriesLeft > 0 && isRetryable) {
            await new Promise((r) => setTimeout(r, 2000));
            return attempt(retriesLeft - 1);
          }
          const msg = err.response?.data?.error || err.message || 'Unknown error';
          setSubmitError(
            isAutoSubmit
              ? `Auto-submit failed: ${msg}. Please submit manually if possible.`
              : `Submission failed: ${msg}`
          );
        }
      };
      await attempt(isAutoSubmit ? 3 : 0);
      setSubmitting(false);
    },
    [examDate, answers, submitted, clearAnswers]
  );

  const handleAutoSubmit = useCallback(() => {
    handleSubmit(true);
  }, [handleSubmit]);

  const timerDisplay = useExamCountdown(examEnd, handleAutoSubmit);
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  if (isBeforeWindow && !loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: '#f9f9f7',
        padding: 24, fontFamily: 'Inter, sans-serif', gap: 16,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#465aa3' }}>
          schedule
        </span>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1c1c1b' }}>Exam not started yet</h2>
        <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
          The exam window opens at 10:00 AM IST.<br />
          Please come back then.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f9f9f7',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Sticky Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '12px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: '#465aa3' }}>
            Aptitude Test
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 500,
            color: '#6b7280',
          }}>
            {answeredCount}/{questions.length}
          </span>
          {!isAfterWindow && !submitted && (
            <span style={{
              fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 500,
              color: '#E2737A', background: '#FCEAEC',
              padding: '4px 10px', borderRadius: 999,
            }}>
              {timerDisplay}
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '16px 16px 120px', maxWidth: 600, margin: '0 auto' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
            Loading questions...
          </div>
        )}

        {error && (
          <div style={{
            background: '#FCEAEC', border: '1px solid #E2737A30', borderRadius: 12,
            padding: 16, marginBottom: 16, color: '#93000a', fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {submitted && (
          <div style={{
            background: '#E5FAF1', border: '1px solid #116b5130', borderRadius: 12,
            padding: 20, marginBottom: 20, textAlign: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#116b51' }}>
              check_circle
            </span>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1c1c1b', marginTop: 8 }}>
              Exam Submitted!
            </h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              Your answers have been recorded.
            </p>
            <button
              onClick={() => navigate('/student/review')}
              style={{
                marginTop: 14, background: '#fff', color: '#116b51',
                border: '1px solid #116b5150', borderRadius: 999,
                padding: '10px 20px', fontFamily: 'Space Grotesk',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#116b51' }}>
                visibility
              </span>
              Review Answers
            </button>
          </div>
        )}

        {submitError && (
          <div style={{
            background: '#FCEAEC', border: '1px solid #E2737A30', borderRadius: 12,
            padding: 14, marginBottom: 16, color: '#93000a', fontSize: 13,
          }}>
            {submitError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              id={q.id}
              text={q.text}
              option_a={q.option_a}
              option_b={q.option_b}
              option_c={q.option_c}
              option_d={q.option_d}
              image_url={q.image_url}
              selected={answers[`q${q.id}`] || null}
              onSelect={isReadOnly ? () => {} : (qid, label) => saveAnswer(`q${qid}`, label)}
            />
          ))}
        </div>
      </div>

      {/* Submit Button */}
      {!isAfterWindow && !submitted && questions.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#fff', borderTop: '1px solid #e5e7eb',
          padding: '12px 16px 24px', display: 'flex', justifyContent: 'center',
        }}>
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            style={{
              background: submitting ? '#8CA0EE' : '#465aa3',
              color: '#fff', border: 'none', borderRadius: 999,
              padding: '14px 48px', fontFamily: 'Space Grotesk',
              fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(70,90,163,0.25)',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      )}
    </div>
  );
}
