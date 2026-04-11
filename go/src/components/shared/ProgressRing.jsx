export default function ProgressRing({ value, max, size = 64, stroke = 5, color = 'var(--accent)', label, sublabel }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  const dash = circ * pct

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth={stroke}
          />
          {/* Progress */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={pct >= 1 ? 'var(--green)' : color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.4s ease' }}
          />
        </svg>
        {/* Center label */}
        {label && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: size < 56 ? '11px' : '12px', fontWeight: 800, lineHeight: 1.1 }}>{label}</span>
          </div>
        )}
      </div>
      {sublabel && (
        <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textAlign: 'center' }}>{sublabel}</span>
      )}
    </div>
  )
}
