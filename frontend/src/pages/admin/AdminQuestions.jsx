import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../../components/BottomNav';
import { adminAPI } from '../../api/axiosClient';

const BATCH_AVATARS = ['#F0997B', '#B4B2A9', '#F0997B'];
const SEARCH_DEBOUNCE_MS = 500;

export default function AdminQuestions() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingDate, setDeletingDate] = useState(null); // exam_date currently being deleted

  const orange = '#E8621A';
  const debounceRef = useRef(null);

  // Fetches questions from the backend. `searchTerm` maps to the API's
  // ?search= param, which filters by question text (not exam_date).
  async function fetchQuestions(searchTerm) {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAPI.getQuestions(searchTerm || undefined);
      setQuestions(res.data);
    } catch (err) {
      setError('Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    fetchQuestions('');
  }, []);

  // Debounced search — refetches from backend ?search= whenever the
  // user stops typing for SEARCH_DEBOUNCE_MS.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchQuestions(search);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Group flat question list into one "module" card per exam_date.
  // `ids` collects every question id in the group so the trash icon
  // can delete all of them (see handleDeleteModule below).
  // registered/avgScore are placeholders (null) until Task 3/4 wire in
  // real DailyScore / submission data.
  const modules = Object.values(
    questions.reduce((acc, q) => {
      if (!acc[q.exam_date]) {
        acc[q.exam_date] = {
          id: q.exam_date,
          examDate: q.exam_date,
          title: `Exam — ${q.exam_date}`,
          questionCount: 0,
          ids: [],
          registered: null,
          avgScore: null,
          thumb: '#F7D9C4',
        };
      }
      acc[q.exam_date].questionCount += 1;
      acc[q.exam_date].ids.push(q.id);
      return acc;
    }, {})
  );

  // Search is now handled server-side, so no client-side filtering here.
  const filtered = modules;

  function handleView(module) {
    // Assumption: "view" opens a per-date question list/detail view.
    // This route doesn't exist yet — build it, or swap this for
    // whatever detail UI you'd rather use.
    navigate(`/admin/questions/date/${module.examDate}`);
  }

  async function handleDeleteModule(module) {
    const confirmed = window.confirm(
      `Delete all ${module.questionCount} question(s) for ${module.examDate}? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingDate(module.examDate);
    try {
      // Backend only exposes single-question delete, so we delete
      // every question id in this date group.
      await Promise.all(module.ids.map((id) => adminAPI.deleteQuestion(id)));
      setQuestions((prev) => prev.filter((q) => q.exam_date !== module.examDate));
    } catch (err) {
      setError(`Failed to delete questions for ${module.examDate}. Please try again.`);
    } finally {
      setDeletingDate(null);
    }
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#f5f5f2', minHeight: '100vh', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', background: '#fff', borderBottom: '1px solid #eee' }}>
        <i className="ri ri-menu-2-line" style={{ fontSize: 22, color: orange }} aria-hidden="true" />
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, fontFamily: 'Georgia, serif' }}>Admin Command</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <i className="ri ri-notification-3-line" style={{ fontSize: 20 }} aria-hidden="true" />
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: `${orange}22`,
              color: orange,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            AD
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 100px' }}>
        {/* Tab */}
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #eee', padding: '18px 0 0' }}>
          <div style={{ paddingBottom: 12, borderBottom: `2px solid ${orange}` }}>
            <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: orange, letterSpacing: '0.02em' }}>
              Quiz results
            </span>
          </div>
        </div>

        {/* Next batch banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: `${orange}15`,
            border: `1px solid ${orange}30`,
            borderRadius: 14,
            padding: '16px 18px',
            margin: '20px 0',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: orange,
              flexShrink: 0,
            }}
          >
            <i className="ri ri-calendar-line" style={{ fontSize: 18 }} aria-hidden="true" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: '#8a7a6d', margin: '0 0 2px' }}>Next scheduled batch:</p>
            <p style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#2a2a28' }}>July 24, 09:00</p>
          </div>
          <div style={{ display: 'flex' }}>
            {BATCH_AVATARS.map((c, i) => (
              <div
                key={i}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: c,
                  border: '2px solid #fdf3ec',
                  marginLeft: i === 0 ? 0 : -8,
                }}
              />
            ))}
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: '#fff',
                border: '2px solid #fdf3ec',
                marginLeft: -8,
                fontSize: 10,
                fontWeight: 700,
                color: orange,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              +12
            </div>
          </div>
        </div>

        {/* Section heading */}
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', fontFamily: 'Georgia, serif' }}>Question board</h2>
        <p style={{ fontSize: 14, color: '#8a8a86', margin: '0 0 16px' }}>Manage and review active assessment modules</p>

        {/* Search + create */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e3dd', borderRadius: 8, padding: '10px 12px' }}>
            <i className="ri ri-search-line" style={{ fontSize: 16, color: '#999' }} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search question text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, background: 'transparent', color: '#1a1a18' }}
            />
          </div>
          <button
            onClick={() => navigate('/admin/questions/upload')}
            style={{
              background: orange,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0 16px',
              fontWeight: 600,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <i className="ri ri-add-line" style={{ fontSize: 14 }} aria-hidden="true" />
            Create new
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <p style={{ textAlign: 'center', color: '#999', fontSize: 13, padding: '30px 0' }}>Loading questions...</p>
        )}

        {/* Error state */}
        {!loading && error && (
          <p style={{ textAlign: 'center', color: '#C0392B', fontSize: 13, padding: '30px 0' }}>{error}</p>
        )}

        {/* Module cards */}
        {!loading && !error && filtered.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: '#fff',
              border: '1px solid #ece9e2',
              borderRadius: 14,
              padding: 14,
              marginBottom: 14,
              opacity: deletingDate === m.examDate ? 0.5 : 1,
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 10, background: m.thumb, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px', color: '#2a2a28' }}>{m.title}</p>
              <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#8a8a86' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="ri ri-file-list-line" style={{ fontSize: 13 }} aria-hidden="true" />
                  {m.questionCount} question{m.questionCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
              <i
                className="ri ri-eye-line"
                style={{ fontSize: 18, color: '#2F6FE0', cursor: 'pointer' }}
                aria-hidden="true"
                onClick={() => handleView(m)}
              />
              <i
                className="ri ri-delete-bin-line"
                style={{
                  fontSize: 18,
                  color: '#C0392B',
                  cursor: deletingDate === m.examDate ? 'not-allowed' : 'pointer',
                }}
                aria-hidden="true"
                onClick={() => deletingDate !== m.examDate && handleDeleteModule(m)}
              />
            </div>
          </div>
        ))}

        {!loading && !error && filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: '#999', fontSize: 13, padding: '30px 0' }}>No exam modules found.</p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}