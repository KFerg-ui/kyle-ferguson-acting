const RIR_STYLE = {
  0: { background: 'rgba(255,71,87,0.2)',   color: 'var(--red)' },
  1: { background: 'rgba(255,71,87,0.15)',  color: 'var(--red)' },
  2: { background: 'rgba(255,165,2,0.15)',  color: 'var(--orange)' },
  3: { background: 'rgba(46,213,115,0.15)', color: 'var(--green)' },
}

export default function SetRow({ setNum, targetRir, log, onChange }) {
  const rirStyle = RIR_STYLE[targetRir] || RIR_STYLE[3]
  const isDone = log.weight || log.reps

  return (
    <div style={{ ...s.row, ...(isDone ? s.rowDone : {}) }}>
      <span style={s.num}>{setNum}</span>

      <input
        type="number"
        inputMode="decimal"
        placeholder="lbs"
        value={log.weight || ''}
        onChange={e => onChange('weight', e.target.value)}
        style={s.input}
      />

      <input
        type="number"
        inputMode="numeric"
        placeholder="reps"
        value={log.reps || ''}
        onChange={e => onChange('reps', e.target.value)}
        style={s.input}
      />

      <div style={{ ...s.rir, ...rirStyle }}>
        {targetRir} RIR
      </div>
    </div>
  )
}

const s = {
  row: {
    display: 'grid',
    gridTemplateColumns: '28px 1fr 1fr 52px',
    gap: '6px',
    alignItems: 'center',
    padding: '7px 0',
    borderBottom: '1px solid var(--border)',
    transition: 'background 0.15s',
  },
  rowDone: {
    background: 'rgba(46,213,115,0.04)',
  },
  num: {
    fontSize: '12px',
    color: 'var(--muted)',
    fontWeight: 700,
    textAlign: 'center',
  },
  input: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '9px 6px',
    color: 'var(--text)',
    fontSize: '15px',
    fontWeight: 700,
    textAlign: 'center',
    width: '100%',
    outline: 'none',
    minHeight: '44px',
  },
  rir: {
    fontSize: '10px',
    padding: '5px 4px',
    borderRadius: '7px',
    fontWeight: 800,
    textAlign: 'center',
    letterSpacing: '0.3px',
  },
}
