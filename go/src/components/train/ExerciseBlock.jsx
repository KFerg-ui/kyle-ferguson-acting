import { useState } from 'react'
import SetRow from './SetRow'

const RIR_COLOR = {
  0: 'var(--red)',
  1: 'var(--red)',
  2: 'var(--orange)',
  3: 'var(--green)',
}

export default function ExerciseBlock({ exercise, setLogs, onChange }) {
  const [open, setOpen] = useState(true)

  // Derive feedback from set logs
  const allLogged = setLogs && exercise.rir.every((_, i) => setLogs[i]?.weight || setLogs[i]?.reps)

  return (
    <div style={{ ...s.block, ...(allLogged ? s.blockDone : {}) }}>
      {/* Header */}
      <button style={s.header} onClick={() => setOpen(o => !o)}>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={s.name}>{exercise.name}</div>
          <div style={s.meta}>
            {exercise.sets} sets · {exercise.reps} reps · RIR {Math.min(...exercise.rir)}–{Math.max(...exercise.rir)}
            <span style={{ marginLeft: '6px', color: 'var(--muted)', fontSize: '10px' }}>
              {exercise.muscle}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {allLogged && <span style={{ color: 'var(--green)', fontSize: '14px' }}>✓</span>}
          <span style={{ color: 'var(--muted)', fontSize: '18px', lineHeight: 1 }}>
            {open ? '‹' : '›'}
          </span>
        </div>
      </button>

      {/* Sets */}
      {open && (
        <div style={s.body}>
          {/* Column labels */}
          <div style={s.colLabels}>
            <span style={{ width: '28px' }}>#</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Weight (lbs)</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Reps</span>
            <span style={{ width: '52px', textAlign: 'center' }}>RIR</span>
          </div>
          {exercise.rir.map((targetRir, i) => (
            <SetRow
              key={i}
              setNum={i + 1}
              targetRir={targetRir}
              log={setLogs?.[i] || {}}
              onChange={(field, value) => onChange(i, field, value)}
            />
          ))}

          {/* Subjective feedback */}
          <FeedbackRow
            label="Pump"
            value={setLogs?.__pump}
            onChange={v => onChange('__pump', 'value', v)}
          />
          <FeedbackRow
            label="Soreness"
            value={setLogs?.__soreness}
            onChange={v => onChange('__soreness', 'value', v)}
          />
        </div>
      )}
    </div>
  )
}

function FeedbackRow({ label, value, onChange }) {
  const opts = ['Low', 'Mid', 'High']
  return (
    <div style={fb.row}>
      <span style={fb.label}>{label}</span>
      <div style={fb.btns}>
        {opts.map(o => {
          const sel = value === o
          const colors = { Low: 'var(--accent2)', Mid: 'var(--accent)', High: 'var(--red)' }
          return (
            <button
              key={o}
              onClick={() => onChange(sel ? null : o)}
              style={{
                ...fb.btn,
                ...(sel ? {
                  background: `${colors[o]}22`,
                  border: `1px solid ${colors[o]}`,
                  color: colors[o],
                } : {}),
              }}
            >
              {o}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const s = {
  block: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    marginBottom: '10px',
    overflow: 'hidden',
  },
  blockDone: {
    borderColor: 'rgba(46,213,115,0.3)',
  },
  header: {
    width: '100%',
    padding: '13px 15px',
    display: 'flex',
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text)',
  },
  name: {
    fontSize: '14px',
    fontWeight: 700,
    marginBottom: '2px',
  },
  meta: {
    fontSize: '11px',
    color: 'var(--muted)',
  },
  body: {
    padding: '0 14px 14px',
    borderTop: '1px solid var(--border)',
  },
  colLabels: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 0 4px',
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--muted)',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    gap: '6px',
  },
}

const fb = {
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingTop: '8px',
    marginTop: '4px',
    borderTop: '1px solid var(--border)',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--muted)',
    width: '64px',
    flexShrink: 0,
  },
  btns: {
    display: 'flex',
    gap: '5px',
  },
  btn: {
    padding: '5px 11px',
    borderRadius: '7px',
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--muted)',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.1s',
  },
}
