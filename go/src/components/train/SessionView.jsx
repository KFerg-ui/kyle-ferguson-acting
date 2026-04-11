import { useState } from 'react'
import ExerciseBlock from './ExerciseBlock'

export default function SessionView({ day, planIdx, week, sessionLogs, onUpdateLog, onClose, openCoach }) {
  const dayKey = `${day.label.toLowerCase()}-w${week}`
  const logs = sessionLogs[dayKey] || {}
  const [done, setDone] = useState(false)

  function handleSetChange(exerciseName, setIdx, field, value) {
    const prevSets = logs[exerciseName] || day.exercises.find(e => e.name === exerciseName).rir.map(() => ({}))
    const nextSets = prevSets.map((s, i) => i === setIdx ? { ...s, [field]: value } : s)
    onUpdateLog(dayKey, exerciseName, nextSets)
  }

  function handleComplete() {
    // Mark session as completed
    onUpdateLog(dayKey, '__completed', true)
    setDone(true)
    setTimeout(() => onClose(true), 1200)
  }

  if (done) {
    return (
      <div style={s.celebration}>
        <div style={s.celebIcon}>✓</div>
        <h2 style={{ color: 'var(--accent)' }}>Session done.</h2>
        <p style={{ color: 'var(--muted)', marginTop: '8px', fontSize: '14px' }}>
          {day.title} — {day.subtitle}
        </p>
      </div>
    )
  }

  return (
    <div className="view">
      {/* Header */}
      <div style={s.header}>
        <button className="btn btn-ghost btn-sm" onClick={() => onClose(false)} style={{ flexShrink: 0 }}>
          ← Back
        </button>
        <div style={{ flex: 1, minWidth: 0, marginLeft: '12px' }}>
          <h2 style={{ fontSize: '18px' }}>{day.title}</h2>
          <p style={{ color: 'var(--muted)', fontSize: '12px' }}>
            {day.label} · Week {week} · {day.subtitle}
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ flexShrink: 0 }}
          onClick={() => openCoach({ day: day.title, week })}
        >
          Coach
        </button>
      </div>

      {/* Exercises */}
      {day.exercises.map(ex => (
        <ExerciseBlock
          key={ex.name}
          exercise={ex}
          setLogs={logs[ex.name] || null}
          onChange={(setIdx, field, value) => handleSetChange(ex.name, setIdx, field, value)}
        />
      ))}

      {/* Complete */}
      <button
        className="btn btn-accent btn-block"
        style={{ marginTop: '24px', fontSize: '15px', padding: '16px' }}
        onClick={handleComplete}
      >
        Complete Session
      </button>
    </div>
  )
}

const s = {
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
  },
  celebration: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    textAlign: 'center',
    padding: '24px',
  },
  celebIcon: {
    fontSize: '64px',
    color: 'var(--accent)',
    marginBottom: '16px',
    display: 'block',
    lineHeight: 1,
  },
}
