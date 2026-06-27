import { useExamCountdown } from '../hooks/useExamCountdown';

export default function CountdownTimer({ examEndTime, onExpire }) {
  const timeLeft = useExamCountdown(examEndTime, onExpire);

  return (
    <span className="font-mono text-sm font-bold">
      {timeLeft}
    </span>
  );
}