import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api/axiosClient';

const orange = '#E8621A';
const blue = '#2F6FE0';

const TOP3_COLORS = { 1: orange, 2: '#EE8C4E', 3: '#F0AC7A' };

const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: 'ri-layout-grid-line', path: '/admin/dashboard' },
  { key: 'stats', label: 'Stats', icon: 'ri-bar-chart-line', path: '/admin/stats' },
  { key: 'rank', label: 'Rank', icon: 'ri-bar-chart-grouped-line', path: '/admin/rank' },
  { key: 'library', label: 'Library', icon: 'ri-archive-line', path: '/admin/questions' },
  { key: 'reports', label: 'Reports', icon: 'ri-file-chart-line', path: '/admin/reports' },
];

function RankBadge({ rank }) {
  if (rank <= 3) {
    return (
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: TOP3_COLORS[rank],
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 15,
          flexShrink: 0,
        }}
      >
        {rank}
      </div>
    );
  }
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        border: `1.5px solid ${blue}55`,
        color: blue,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 15,
        flexShrink: 0,
      }}
    >
      {rank}
    </div>
  );
}

function Avatar({ name }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        background: '#eee',
        color: '#888',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

export default function RankPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('weekly'); // 'daily' | 'weekly'
  const [rankings, setRankings] = useState([]);
  const [totalStudents, setTotalStudents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Rankings for the selected period + total student count (for the
        // "active examinees" footer stat) are fetched in parallel.
        const [rankRes, statsRes] = await Promise.all([
          adminAPI.getRankings(10, period),
          adminAPI.getDashboardStats(),
        ]);
        if (cancelled) return;
        setRankings(rankRes.data);
        setTotalStudents(statsRes.data.total_students);
      } catch (err) {
        if (!cancelled) setError('Failed to load rankings. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [period]);

  // Backend returns raw score counts (e.g. 10, 9, 8...), not percentages —
  // there's no fixed "out of 100" scale. Bar width + "AVG TOP SCORE" are
  // computed relative to the top scorer in this list so the visual still
  // makes sense without a hardcoded max-score assumption.
  const topEntry = rankings[0];
  const topScore = topEntry ? topEntry.score : 0;

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#f5f5f2', minHeight: '100vh', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', background: '#fff', borderBottom: '1px solid #eee' }}>
        <i className="ri ri-menu-2-line" style={{ fontSize: 22 }} aria-hidden="true" />
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0, fontFamily: 'Georgia, serif' }}>Top 10 Scorers</h1>
          <p style={{ fontSize: 11, color: '#999', margin: 0 }}>
            {period === 'weekly' ? 'This Week' : "Today's Exam"}
          </p>
        </div>
        <i className="ri ri-notification-3-line" style={{ fontSize: 20 }} aria-hidden="true" />
      </div>

      <div style={{ padding: '18px 20px 100px' }}>
        {/* Section header + period toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: '#555' }}>GLOBAL RANKINGS</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setPeriod('daily')}
              style={{
                background: period === 'daily' ? orange : `${orange}12`,
                border: `1px solid ${orange}33`,
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: period === 'daily' ? '#fff' : orange,
                cursor: 'pointer',
              }}
            >
              Daily
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              style={{
                background: period === 'weekly' ? blue : `${blue}12`,
                border: `1px solid ${blue}33`,
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: period === 'weekly' ? '#fff' : blue,
                cursor: 'pointer',
              }}
            >
              Weekly
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <p style={{ textAlign: 'center', color: '#999', fontSize: 13, padding: '30px 0' }}>Loading rankings...</p>
        )}

        {/* Error state */}
        {!loading && error && (
          <p style={{ textAlign: 'center', color: '#C0392B', fontSize: 13, padding: '30px 0' }}>{error}</p>
        )}

        {/* Empty state */}
        {!loading && !error && rankings.length === 0 && (
          <p style={{ textAlign: 'center', color: '#999', fontSize: 13, padding: '30px 0' }}>
            No rankings available for this period yet.
          </p>
        )}

        {/* Rankings list */}
        {!loading && !error && rankings.map((entry) => {
          const barPct = topScore > 0 ? Math.round((entry.score / topScore) * 100) : 0;
          return (
            <div
              key={`${entry.rank}-${entry.roll_number}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: '#fff',
                border: entry.rank === 1 ? `1px solid ${orange}55` : '1px solid #ece9e2',
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <RankBadge rank={entry.rank} />
              <Avatar name={entry.name} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#2a2a28', lineHeight: 1.25 }}>{entry.name}</p>
                <p style={{ fontSize: 10, color: '#999', margin: '2px 0 0', letterSpacing: '0.04em' }}>
                  ROLL: {entry.roll_number}
                </p>
              </div>
              <div style={{ textAlign: 'right', minWidth: 90 }}>
                <p style={{ fontSize: 10, color: '#999', margin: '0 0 2px', letterSpacing: '0.04em' }}>SCORE</p>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    margin: '0 0 6px',
                    color: entry.rank <= 3 ? orange : '#2a2a28',
                  }}
                >
                  {entry.score}
                </p>
                <div style={{ background: '#eee', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${barPct}%`,
                      height: '100%',
                      background: entry.rank <= 3 ? TOP3_COLORS[entry.rank] : blue,
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Summary footer */}
        {!loading && !error && rankings.length > 0 && (
          <div
            style={{
              background: '#eeeeea',
              borderRadius: 14,
              padding: '20px 18px',
              textAlign: 'center',
              marginTop: 16,
            }}
          >
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px', lineHeight: 1.5 }}>
              Top {rankings.length} shown out of {totalStudents ?? '—'} active students.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24 }}>
              <div>
                <p style={{ fontSize: 24, fontWeight: 700, color: orange, margin: 0 }}>{topScore}</p>
                <p style={{ fontSize: 10, color: '#999', margin: '2px 0 0', letterSpacing: '0.04em' }}>TOP SCORE</p>
              </div>
              <div style={{ width: 1, height: 36, background: '#ccc' }} />
              <div>
                <p style={{ fontSize: 24, fontWeight: 700, color: blue, margin: 0 }}>{totalStudents ?? '—'}</p>
                <p style={{ fontSize: 10, color: '#999', margin: '2px 0 0', letterSpacing: '0.04em' }}>TOTAL STUDENTS</p>
              </div>
            </div>
          </div>
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
          const isActive = item.key === 'rank';
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
                border: 'none',
                cursor: 'pointer',
                color: isActive ? orange : '#8a8a86',
                fontSize: 11,
                fontWeight: 600,
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