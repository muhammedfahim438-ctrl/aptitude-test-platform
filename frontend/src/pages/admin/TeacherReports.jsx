// src/pages/admin/TeacherReports.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api/axiosClient';

const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: 'ri-layout-grid-line', path: '/admin/dashboard' },
  { key: 'stats', label: 'Stats', icon: 'ri-bar-chart-line', path: '/admin/stats' },
  { key: 'rank', label: 'Rank', icon: 'ri-bar-chart-grouped-line', path: '/admin/rank' },
  { key: 'library', label: 'Library', icon: 'ri-archive-line', path: '/admin/questions' },
  { key: 'reports', label: 'Reports', icon: 'ri-file-chart-line', path: '/admin/reports' },
];

function StatCard({ accent, label, value, icon, trendLabel }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '18px 20px',
        borderLeft: `4px solid ${accent}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
      }}
    >
      <div>
        <p style={{ fontSize: 12, letterSpacing: '0.06em', color: '#8a8a86', textTransform: 'uppercase', margin: 0 }}>
          {label}
        </p>
        <p style={{ fontSize: 30, fontWeight: 700, margin: '6px 0 8px', color: '#1a1a18' }}>{value}</p>
        {trendLabel && (
          <p style={{ fontSize: 13, margin: 0, color: accent }}>{trendLabel}</p>
        )}
      </div>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${accent}1A`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accent,
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        <i className={`ri ${icon}`} aria-hidden="true" />
      </div>
    </div>
  );
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const navigate = useNavigate();

  // 'weekly' / 'monthly' = preset mode (sends ?range=). Picking custom
  // From/To dates switches to 'custom' mode (sends ?from=&to=), matching
  // the backend's priority: range param wins over from/to when present.
  const [range, setRange] = useState('weekly');
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [mode, setMode] = useState('range'); // 'range' | 'custom'

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const orange = '#E8621A';
  const blue = '#2F6FE0';

  const fetchReports = useCallback(async () => {
    // Client-side guard: catch invalid ranges before hitting the API,
    // so the person gets an inline message instead of a console error.
    if (mode === 'custom' && from && to && from > to) {
      setError('"From" date cannot be after "To" date.');
      setReport(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res =
        mode === 'range'
          ? await adminAPI.getReports(undefined, undefined, range)
          : await adminAPI.getReports(from, to, undefined);
      setReport(res.data);
    } catch (err) {
      // Surface the backend's specific validation message when available
      // (e.g. "from date must not be after to date.") instead of a generic one.
      const backendMsg = err.response?.data?.error;
      setError(backendMsg || 'Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [mode, range, from, to]);

  // Initial load + reload whenever preset range changes
  useEffect(() => {
    if (mode === 'range') fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  function handlePresetClick(preset) {
    setMode('range');
    setRange(preset);
  }

  function handleRefresh() {
    // REFRESH now re-fetches using whatever From/To dates are currently
    // set, switching into custom-range mode (overrides weekly/monthly).
    setMode('custom');
    fetchReports();
  }

  const totalAttended = report?.total_attended ?? 0;
  const totalAbsent = report?.total_absent ?? 0;
  const totalStudents = report?.total_students ?? 0;
  const attendanceRate = totalStudents > 0 ? ((totalAttended / totalStudents) * 100).toFixed(1) : '0.0';

  const performance = report?.student_performance ?? [];
  const maxScore = performance.length > 0 ? Math.max(...performance.map((s) => s.score)) : 0;

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#f5f5f2', minHeight: '100vh', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', background: '#fff', borderBottom: '1px solid #eee' }}>
        <i className="ri ri-menu-2-line" style={{ fontSize: 22, color: orange }} aria-hidden="true" />
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, fontFamily: 'Georgia, serif' }}>Admin Command</h1>
        <i className="ri ri-notification-3-line" style={{ fontSize: 20 }} aria-hidden="true" />
      </div>

      <div style={{ padding: 20, paddingBottom: 100 }}>
        {/* Filter panel */}
        <div style={{ background: '#eeeeea', borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', background: '#fff', borderRadius: 10, padding: 4, marginBottom: 14 }}>
            <button
              onClick={() => handlePresetClick('weekly')}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: 8,
                padding: '8px 0',
                fontWeight: 600,
                fontSize: 14,
                background: mode === 'range' && range === 'weekly' ? orange : 'transparent',
                color: mode === 'range' && range === 'weekly' ? '#fff' : '#555',
                cursor: 'pointer',
              }}
            >
              Weekly
            </button>
            <button
              onClick={() => handlePresetClick('monthly')}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: 8,
                padding: '8px 0',
                fontWeight: 600,
                fontSize: 14,
                background: mode === 'range' && range === 'monthly' ? orange : 'transparent',
                color: mode === 'range' && range === 'monthly' ? '#fff' : '#555',
                cursor: 'pointer',
              }}
            >
              Monthly
            </button>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
            <i className="ri ri-calendar-line" style={{ color: blue, fontSize: 16 }} aria-hidden="true" />
            <span style={{ fontSize: 13, color: '#555' }}>From:</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{ border: 'none', fontSize: 13, flex: 1, background: 'transparent', color: '#1a1a18' }}
            />
          </label>

          <div style={{ textAlign: 'center', fontSize: 12, color: '#999', margin: '4px 0' }}>TO</div>

          <div style={{ display: 'flex', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 8, padding: '10px 12px', flex: 1 }}>
              <i className="ri ri-calendar-line" style={{ color: blue, fontSize: 16 }} aria-hidden="true" />
              <span style={{ fontSize: 13, color: '#555' }}>To:</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                style={{ border: 'none', fontSize: 13, flex: 1, background: 'transparent', color: '#1a1a18' }}
              />
            </label>
            <button
              onClick={handleRefresh}
              disabled={loading}
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
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <i className="ri ri-filter-2-line" style={{ fontSize: 14 }} aria-hidden="true" />
              REFRESH
            </button>
          </div>
        </div>

        {/* Loading / error states */}
        {loading && (
          <p style={{ textAlign: 'center', color: '#999', fontSize: 13, padding: '20px 0' }}>Loading report...</p>
        )}
        {!loading && error && (
          <p style={{ textAlign: 'center', color: '#C0392B', fontSize: 13, padding: '20px 0' }}>{error}</p>
        )}

        {!loading && !error && report && (
          <>
            {/* Stat cards */}
            <StatCard
              accent={orange}
              label="Total attended"
              value={totalAttended.toLocaleString()}
              icon="ri-group-line"
              trendLabel={`${attendanceRate}% participation rate`}
            />
            <StatCard
              accent={blue}
              label="Absent"
              value={totalAbsent.toLocaleString()}
              icon="ri-user-unfollow-line"
              trendLabel={`out of ${totalStudents.toLocaleString()} students`}
            />
            {/*
              'Avg. duration' card intentionally removed — StudentSubmission
              has no started_at field, so per-student duration can't be
              computed from the current schema (see backend AdminReportsView note).
            */}

            {/* Student performance */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, fontFamily: 'Georgia, serif' }}>Student performance</h2>
              </div>

              {performance.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', fontSize: 13, padding: '20px 0' }}>
                  No submissions in this date range.
                </p>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.9fr 1fr', fontSize: 11, letterSpacing: '0.04em', color: '#999', textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: 8, marginBottom: 4 }}>
                    <span>Student</span>
                    <span>Roll No.</span>
                    <span>Score</span>
                  </div>

                  {performance.map((s) => {
                    const barPct = maxScore > 0 ? Math.round((s.score / maxScore) * 100) : 0;
                    return (
                      <div
                        key={`${s.student_id}-${s.exam_date}`}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.3fr 0.9fr 1fr',
                          alignItems: 'center',
                          padding: '12px 0',
                          borderBottom: '1px solid #f2f2f0',
                          fontSize: 13,
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{s.name}</span>
                        <span style={{ color: '#888' }}>{s.roll_number}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600, minWidth: 20 }}>{s.score}</span>
                          <div style={{ background: '#eee', borderRadius: 4, height: 6, flex: 1, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${barPct}%`,
                                height: '100%',
                                background: orange,
                                borderRadius: 4,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          background: '#fff',
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '10px 0 14px',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === 'reports';
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: isActive ? '6px 14px' : '6px 0',
                borderRadius: 10,
                background: isActive ? `${orange}1A` : 'transparent',
                color: isActive ? orange : '#8a8a86',
                fontSize: 11,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <i className={`ri ${item.icon}`} style={{ fontSize: 20 }} aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}