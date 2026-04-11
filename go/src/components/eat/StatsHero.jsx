function GearIcon({ onClick }) {
  return (
    <button onClick={onClick} style={g.btn} aria-label="Settings">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>
  )
}
const g = { btn: { background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' } }

function ProgressBar({ value, max, color }) {
  const pct = Math.min(value / max, 1) * 100
  return (
    <div style={{ height: '4px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden', marginTop: '8px' }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: pct >= 100 ? 'var(--green)' : color,
        borderRadius: '99px',
        transition: 'width 0.4s ease',
      }} />
    </div>
  )
}

// Shared two-column macro block used for protein and fiber
function MacroBlock({ name, leftVal, leftLabel, leftColor, rightVal, rightLabel, bar, warn }) {
  return (
    <div style={mb.wrap}>
      <span style={mb.name}>{name}</span>
      <div style={mb.cols}>
        <div style={mb.col}>
          <span style={{ ...mb.bigNum, color: leftColor }}>{leftVal}</span>
          <span style={{ ...mb.sub, color: leftColor === 'var(--muted)' ? 'var(--muted)' : leftColor }}>{leftLabel}</span>
        </div>
        <div style={mb.divider} />
        <div style={{ ...mb.col, alignItems: 'flex-end' }}>
          <span style={mb.smallNum}>{rightVal}</span>
          <span style={mb.sub}>{rightLabel}</span>
        </div>
      </div>
      {bar}
      {warn && <span style={mb.warn}>{warn}</span>}
    </div>
  )
}

const mb = {
  wrap: { flex: 1 },
  name: { fontSize: '10px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '5px' },
  cols: { display: 'flex', alignItems: 'center' },
  col: { display: 'flex', flexDirection: 'column', flex: 1 },
  divider: { width: '1px', height: '32px', background: 'var(--border)', flexShrink: 0, margin: '0 12px' },
  bigNum: { fontSize: '28px', fontWeight: 900, lineHeight: 1, letterSpacing: '-1px' },
  smallNum: { fontSize: '20px', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.5px', color: 'var(--muted)' },
  sub: { fontSize: '11px', color: 'var(--muted)', marginTop: '2px' },
  warn: { display: 'block', fontSize: '11px', color: 'var(--orange)', marginTop: '5px' },
}

export default function StatsHero({ totals, settings, onOpenSettings }) {
  const { calories = 0, protein = 0, fiber = 0, carbs = 0 } = totals
  const { calTarget = 3300, proTarget = 200, fiberTarget = 25 } = settings

  const calLeft  = calTarget - calories
  const calOver  = calories > calTarget
  const proLeft  = proTarget - protein
  const proOver  = protein > proTarget
  const fiberLeft = fiberTarget - fiber
  const fiberHit  = fiber >= fiberTarget

  const hour = new Date().getHours()
  const fiberWarn = hour >= 18 && !fiberHit

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <div style={s.hero}>
      {/* Date + gear */}
      <div style={s.topRow}>
        <span style={s.date}>{dateStr}</span>
        <GearIcon onClick={onOpenSettings} />
      </div>

      {/* ── Calories — full width ── */}
      <div style={s.calRow}>
        <div style={s.calLeft}>
          <span style={{ ...s.calBig, color: calOver ? 'var(--red)' : 'var(--accent)' }}>
            {calories.toLocaleString()}
          </span>
          <span style={s.calSub}>cal eaten</span>
        </div>
        <div style={s.calDivider} />
        <div style={s.calRight}>
          <span style={{ ...s.calEaten, color: calOver ? 'var(--red)' : 'var(--muted)' }}>
            {calOver ? `+${Math.abs(calLeft).toLocaleString()}` : calLeft.toLocaleString()}
          </span>
          <span style={s.calSub}>{calOver ? 'over target' : 'left'}</span>
        </div>
      </div>
      <div style={s.calBarWrap}>
        <div style={s.calBarTrack}>
          <div style={{ ...s.calBarFill, width: `${Math.min(calories / calTarget, 1) * 100}%`, background: calOver ? 'var(--red)' : 'var(--accent)' }} />
        </div>
        <span style={s.calBarLabel}>of {calTarget.toLocaleString()}</span>
      </div>

      {/* ── Protein + Fiber — side by side ── */}
      <div style={s.macroGrid}>
        {/* Protein */}
        <MacroBlock
          name="Protein"
          leftVal={proOver ? '✓' : `${protein}g`}
          leftLabel={proOver ? 'goal hit' : 'eaten'}
          leftColor={proOver ? 'var(--green)' : 'var(--accent2)'}
          rightVal={proOver ? `+${Math.abs(proLeft)}g` : `${proLeft}g`}
          rightLabel={proOver ? 'over' : 'left'}
          bar={<ProgressBar value={protein} max={proTarget} color="var(--accent2)" />}
        />

        <div style={s.macroDivider} />

        {/* Fiber */}
        <MacroBlock
          name="Fiber"
          leftVal={fiberHit ? '✓' : `${fiber}g`}
          leftLabel={fiberHit ? 'goal hit' : 'eaten'}
          leftColor={fiberHit ? 'var(--green)' : fiberWarn ? 'var(--orange)' : 'var(--text)'}
          rightVal={`${Math.max(0, fiberLeft)}g`}
          rightLabel={fiberWarn ? 'left ⚠' : 'left'}
          bar={<ProgressBar value={fiber} max={fiberTarget} color={fiberWarn ? 'var(--orange)' : 'var(--muted)'} />}
          warn={fiberWarn ? 'Under target — add a high-fiber item' : null}
        />
      </div>

      {/* Carbs — info only */}
      <div style={s.carbs}>
        <span style={s.carbsLabel}>Carbs</span>
        <span style={s.carbsVal}>{carbs}g eaten</span>
      </div>
    </div>
  )
}

const s = {
  hero: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    padding: '14px 16px 14px',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  date: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--muted)',
    letterSpacing: '0.3px',
  },

  // Calories
  calRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
  },
  calLeft: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  calRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    flex: 1,
  },
  calBig: {
    fontSize: '44px',
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: '-2px',
  },
  calEaten: {
    fontSize: '28px',
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: '-1px',
    color: 'var(--muted)',
  },
  calSub: {
    fontSize: '11px',
    color: 'var(--muted)',
    marginTop: '2px',
  },
  calDivider: {
    width: '1px',
    height: '44px',
    background: 'var(--border)',
    flexShrink: 0,
    margin: '0 16px',
  },
  calBarWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  calBarTrack: {
    flex: 1,
    height: '5px',
    background: 'var(--border)',
    borderRadius: '99px',
    overflow: 'hidden',
  },
  calBarFill: {
    height: '100%',
    borderRadius: '99px',
    transition: 'width 0.4s ease',
  },
  calBarLabel: {
    fontSize: '11px',
    color: 'var(--muted)',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },

  // Protein + Fiber grid
  macroGrid: {
    display: 'flex',
    gap: '0',
    marginBottom: '12px',
  },
  macroDivider: {
    width: '1px',
    background: 'var(--border)',
    flexShrink: 0,
    margin: '0 16px',
    alignSelf: 'stretch',
  },

  // Carbs
  carbs: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '10px',
    borderTop: '1px solid var(--border)',
  },
  carbsLabel: {
    fontSize: '12px',
    color: 'var(--muted)',
    fontWeight: 600,
  },
  carbsVal: {
    fontSize: '12px',
    color: 'var(--muted)',
    fontWeight: 700,
  },
}
