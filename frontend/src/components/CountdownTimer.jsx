import useExamCountdown from '../hooks/useExamCountdown'

export default function CountdownTimer({ examEndTime, onExpire }) {
  const formatted = useExamCountdown(examEndTime, onExpire)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: '#FCEAEC', borderRadius: 9999,
      padding: '6px 12px', border: '1px solid #E2737A30',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#E2737A' }}>timer</span>
      <span style={{
        fontFamily: 'JetBrains Mono', fontSize: 14,
        fontWeight: 500, color: '#E2737A',
      }}>{formatted}</span>
    </div>
  )
}
