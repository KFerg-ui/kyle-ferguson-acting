import { MUSCLES, getVolZone } from '../../lib/training-data'

export default function MesocycleProgress({ training }) {
  const { week, mesoLen, sess, totalSets, vols } = training
  const daysToDeload = Math.max(0, (mesoLen - week) * 7)
  const pct = Math.round((week / mesoLen) * 100)

  return (
    <div>
      <p className="section-label">Mesocycle</p>

      {/* Progress bar */}
      <div style={s.card}>
        <div style={s.mesoHeader}>
          <div>
            <span style={s.weekNum}>Week {week}</span>
            <span style={{ color: 'var(--muted)', fontSize: '13px' }}> of {mesoLen}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>{daysToDeload}d to deload</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{sess} sessions · {totalSets} sets</div>
          </div>
        </div>

        <div style={s.barTrack}>
          <div style={{ ...s.barFill, width: `${pct}%` }} />
          {/* Week markers */}
          {Array.from({ length: mesoLen - 1 }, (_, i) => (
            <div key={i} style={{ ...s.weekMark, left: `${((i + 1) / mesoLen) * 100}%` }} />
          ))}
        </div>
        <div style={s.barLabels}>
          <span>Wk 1</span>
          <span>Deload</span>
        </div>

        {week >= mesoLen && (
          <div style={s.deloadBanner}>
            Deload week — drop to MEV, keep frequency, prioritize sleep.
          </div>
        )}
      </div>

      {/* Volume summary — compact */}
      <p className="section-label" style={{ marginTop: '20px' }}>Volume This Week</p>
      <div style={s.volGrid}>
        {MUSCLES.map(m => {
          const sets = vols[m.name] ?? m.mev
          const zone = getVolZone(m.name, sets)
          const colors = { below: 'var(--muted)', mev: 'var(--accent2)', mav: 'var(--accent)', mrv: 'var(--red)' }
          const color = colors[zone]

          return (
            <div key={m.name} style={s.volItem}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px' }}>{m.name}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color }}>{sets}</div>
              <div style={{ fontSize: '9px', color, fontWeight: 700 }}>
                {zone === 'mav' ? 'MAV ✓' : zone === 'mrv' ? 'MRV ⚠' : zone === 'below' ? 'LOW' : 'MEV'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const s = {
  card: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '16px',
    marginBottom: '4px',
  },
  mesoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '14px',
  },
  weekNum: {
    fontSize: '20px',
    fontWeight: 800,
  },
  barTrack: {
    height: '8px',
    background: 'var(--border)',
    borderRadius: '99px',
    position: 'relative',
    overflow: 'visible',
    marginBottom: '6px',
  },
  barFill: {
    height: '100%',
    background: 'var(--accent)',
    borderRadius: '99px',
    transition: 'width 0.4s ease',
  },
  weekMark: {
    position: 'absolute',
    top: '-2px',
    bottom: '-2px',
    width: '2px',
    background: 'var(--surface)',
    transform: 'translateX(-1px)',
  },
  barLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: 'var(--muted)',
  },
  deloadBanner: {
    marginTop: '12px',
    padding: '10px 12px',
    background: 'var(--accent-dim)',
    border: '1px solid var(--accent-border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    color: 'var(--accent)',
    lineHeight: 1.5,
  },
  volGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '8px',
  },
  volItem: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 6px',
    textAlign: 'center',
  },
}
