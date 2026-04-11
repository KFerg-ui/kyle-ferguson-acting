import ProgressRing from '../shared/ProgressRing'

const CAL_TARGET = 3300
const PRO_TARGET = 200
const FIBER_TARGET = 25

export default function SummaryBar({ totals, fiberWarn }) {
  const { calories = 0, protein = 0, fiber = 0, carbs = 0 } = totals
  const remaining = Math.max(0, CAL_TARGET - calories)
  const calOver = calories > CAL_TARGET

  return (
    <div style={s.bar}>
      {/* Rings */}
      <div style={s.rings}>
        <ProgressRing
          value={calories}
          max={CAL_TARGET}
          size={68}
          stroke={5}
          color="var(--accent)"
          label={calOver ? `+${calories - CAL_TARGET}` : `${remaining}`}
          sublabel={calOver ? 'over' : 'left'}
        />
        <ProgressRing
          value={protein}
          max={PRO_TARGET}
          size={68}
          stroke={5}
          color="var(--accent2)"
          label={`${protein}g`}
          sublabel="protein"
        />
      </div>

      {/* Stats column */}
      <div style={s.stats}>
        <div style={s.statRow}>
          <span style={s.statLabel}>Calories</span>
          <span style={s.statVal}>
            <strong style={{ color: calOver ? 'var(--red)' : 'var(--text)' }}>{calories}</strong>
            <span style={{ color: 'var(--muted)' }}> / {CAL_TARGET}</span>
          </span>
        </div>
        <div style={s.statRow}>
          <span style={s.statLabel}>Protein</span>
          <span style={s.statVal}>
            <strong style={{ color: protein >= PRO_TARGET ? 'var(--green)' : 'var(--text)' }}>{protein}g</strong>
            <span style={{ color: 'var(--muted)' }}> / {PRO_TARGET}g</span>
          </span>
        </div>
        <div style={s.statRow}>
          <span style={{ ...s.statLabel, color: fiberWarn ? 'var(--orange)' : 'var(--muted)' }}>
            Fiber {fiberWarn ? '⚠' : ''}
          </span>
          <span style={{ ...s.statVal, color: fiberWarn ? 'var(--orange)' : 'var(--muted)' }}>
            {fiber}g
          </span>
        </div>
        <div style={s.statRow}>
          <span style={s.statLabel}>Carbs</span>
          <span style={{ ...s.statVal, color: 'var(--muted)' }}>{carbs}g</span>
        </div>
      </div>
    </div>
  )
}

const s = {
  bar: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    padding: '14px 16px',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  rings: {
    display: 'flex',
    gap: '12px',
    flexShrink: 0,
  },
  stats: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  statLabel: {
    fontSize: '12px',
    color: 'var(--muted)',
  },
  statVal: {
    fontSize: '12px',
    fontWeight: 600,
  },
}
