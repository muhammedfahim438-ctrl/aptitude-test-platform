import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { examAPI } from "../../api/client";

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarColor(name) {
  const colors = ['#FFE0B2', '#B2EBF2', '#C8E6C9', '#F8BBD0', '#D1C4E9', '#BBDEFB', '#FFCCBC', '#DCEDC8'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function RankBadge({ rank }) {
  if (rank <= 3) {
    const colors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
    return (
      <div style={{
        width: 28, height: 28, borderRadius: '50%', background: colors[rank],
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 700, color: '#fff',
      }}>
        {rank}
      </div>
    );
  }
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', background: '#f0f0f0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'JetBrains Mono', fontSize: 12, color: '#6b7280',
    }}>
      {rank}
    </div>
  );
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [totalExaminees, setTotalExaminees] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchLeaderboard() {
      try {
        const res = await examAPI.getLeaderboard(25);
        if (!cancelled) {
          setData(res.data.rankings || []);
          setTotalExaminees(res.data.total_examinees || 0);
        }
      } catch {
        if (!cancelled) setError('Failed to load leaderboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLeaderboard();
    return () => { cancelled = true; };
  }, []);

  const maxScore = useMemo(() => {
    if (data.length === 0) return 1;
    return Math.max(...data.map(d => d.score), 1);
  }, [data]);

  const podium = data.length >= 3
    ? [data[1], data[0], data[2]]
    : data;

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f7', fontFamily: 'Inter, sans-serif', paddingBottom: 80 }}>
      <div style={{
        background: '#fff', padding: '16px', borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#465aa3', cursor: 'pointer' }}
          onClick={() => navigate('/student/dashboard')}>
          arrow_back
        </span>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: '#1c1c1b' }}>
          Leaderboard
        </h1>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading...</div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>{error}</div>
      ) : data.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
          No leaderboard data available yet.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 12, padding: '24px 16px' }}>
            {podium.map((entry, i) => {
              const heights = [100, 130, 80];
              return (
                <div key={entry.rank} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: getAvatarColor(entry.name),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, color: '#1c1c1b',
                  }}>
                    {getInitials(entry.name)}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1c1c1b', textAlign: 'center' }}>
                    {entry.name.split(' ')[0]}
                  </span>
                  <div style={{
                    width: 80, height: heights[i], borderRadius: '8px 8px 0 0',
                    background: entry.rank === 1 ? '#FFD700' : entry.rank === 2 ? '#C0C0C0' : '#CD7F32',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                      {entry.score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '0 16px' }}>
            {data.map((entry) => (
              <div key={entry.rank} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: '#fff', borderRadius: 12,
                marginBottom: 8, border: '1px solid #f0f0f0',
              }}>
                <RankBadge rank={entry.rank} />
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: getAvatarColor(entry.name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 700, color: '#1c1c1b',
                }}>
                  {getInitials(entry.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1c1c1b' }}>{entry.name}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', fontFamily: 'JetBrains Mono' }}>{entry.roll_number}</p>
                </div>
                <div style={{ width: 100 }}>
                  <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${(entry.score / maxScore) * 100}%`,
                      background: '#465aa3',
                    }} />
                  </div>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 700, color: '#465aa3', minWidth: 40, textAlign: 'right' }}>
                  {entry.score}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            margin: '16px', padding: 16, background: '#EAEFFD', borderRadius: 12,
            display: 'flex', justifyContent: 'space-around', textAlign: 'center',
          }}>
            <div>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: 700, color: '#1e347b' }}>{totalExaminees}</p>
              <p style={{ fontSize: 11, color: '#465aa3' }}>Examinees</p>
            </div>
            <div>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: 700, color: '#1e347b' }}>{data.length}</p>
              <p style={{ fontSize: 11, color: '#465aa3' }}>Top Ranked</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
