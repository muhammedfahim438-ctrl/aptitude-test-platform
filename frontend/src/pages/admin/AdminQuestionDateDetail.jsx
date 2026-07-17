// src/pages/admin/AdminQuestionDateDetail.jsx  ── Task 8
// Shows every question uploaded for a single exam_date, with a per-question
// delete option. Reuses adminAPI.getQuestions(search, date) — no new backend
// endpoint needed since the list view already supports ?date= filtering.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminAPI } from '../../api/axiosClient';

const orange = '#E8621A';

export default function AdminQuestionDateDetail() {
  const { examDate } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAPI.getQuestions(undefined, examDate);
      setQuestions(res.data);
    } catch (err) {
      setError('Failed to load questions for this date.');
    } finally {
      setLoading(false);
    }
  }, [examDate]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  async function handleDeleteOne(questionId) {
    const confirmed = window.confirm('Delete this question? This cannot be undone.');
    if (!confirmed) return;

    setDeletingId(questionId);
    try {
      await adminAPI.deleteQuestion(questionId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (err) {
      setError('Failed to delete question. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#f5f5f2', minHeight: '100vh', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', background: '#fff', borderBottom: '1px solid #eee' }}>
        <i
          className="ri ri-arrow-left-line"
          style={{ fontSize: 22, color: orange, cursor: 'pointer' }}
          aria-hidden="true"
          onClick={() => navigate('/admin/questions')}
        />
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0, fontFamily: 'Georgia, serif' }}>
            Exam — {examDate}
          </h1>
          <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
            {loading ? 'Loading...' : `${questions.length} question${questions.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      <div style={{ padding: '20px 20px 60px' }}>
        {loading && (
          <p style={{ textAlign: 'center', color: '#999', fontSize: 13, padding: '30px 0' }}>Loading questions...</p>
        )}

        {!loading && error && (
          <p style={{ textAlign: 'center', color: '#C0392B', fontSize: 13, padding: '30px 0' }}>{error}</p>
        )}

        {!loading && !error && questions.length === 0 && (
          <p style={{ textAlign: 'center', color: '#999', fontSize: 13, padding: '30px 0' }}>
            No questions found for this date.
          </p>
        )}

        {!loading && !error && questions.map((q, idx) => (
          <div
            key={q.id}
            style={{
              background: '#fff',
              border: '1px solid #ece9e2',
              borderRadius: 14,
              padding: 16,
              marginBottom: 14,
              opacity: deletingId === q.id ? 0.5 : 1,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#2a2a28', flex: 1 }}>
                Q{idx + 1}. {q.text}
              </p>
              <i
                className="ri ri-delete-bin-line"
                style={{
                  fontSize: 18,
                  color: '#C0392B',
                  cursor: deletingId === q.id ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                }}
                aria-hidden="true"
                onClick={() => deletingId !== q.id && handleDeleteOne(q.id)}
              />
            </div>

            {(q.image_url || q.image) && (
              <img
                src={q.image_url || q.image}
                alt={`Question ${idx + 1} diagram`}
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; }}
                style={{ width: '100%', borderRadius: 8, marginBottom: 10, display: 'block' }}
              />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['option_a', 'option_b', 'option_c', 'option_d'].map((key, i) => (
                <div
                  key={key}
                  style={{
                    background: '#f5f5f2',
                    border: '1px solid #ece9e2',
                    borderRadius: 8,
                    padding: '8px 10px',
                    fontSize: 12,
                    color: '#2a2a28',
                  }}
                >
                  <strong>{String.fromCharCode(65 + i)}.</strong> {q[key]}
                </div>
              ))}
            </div>

            {!q.retake_allowed && (
              <p style={{ fontSize: 11, color: '#C0392B', margin: '10px 0 0', fontWeight: 600 }}>
                Retake not allowed for this question.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}