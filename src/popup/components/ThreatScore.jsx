
function getScoreColor(score) {
  if (score === 0) return '#22c55e'
  if (score < 25) return '#84cc16'
  if (score < 50) return '#f59e0b'
  return '#ef4444'
}

export default function ThreatScore({ score, size = 48 }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const progress = circumference - (score / 100) * circumference
  const color = getScoreColor(score)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span
        className="absolute text-[11px] font-mono font-semibold"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  )
}