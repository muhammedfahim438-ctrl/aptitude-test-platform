import { useExamCountdown } from '../hooks/useExamCountdown';

export default function CountdownTimer({ examEndTime, onExpire }) {
  const timeLeft = useExamCountdown(examEndTime, onExpire);

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      color: '#e94560',
      padding: '10px 20px',
      borderRadius: '8px',
      fontSize: '24px',
      fontWeight: 'bold',
      textAlign: 'center',
      letterSpacing: '2px'
    }}>
      ⏱ Time Remaining: {timeLeft}
    </div>
  );
}