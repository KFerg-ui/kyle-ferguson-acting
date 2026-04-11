import { useState, useEffect } from 'react'
import { MUSCLES } from '../../lib/training-data'
import { generatePlan } from '../../lib/api'
import Sheet from './Sheet'

const ALL_GOALS = ['Build muscle', 'Lose fat', 'Increase strength', 'General fitness', 'Athletic performance']

export default function SettingsSheet({ open, onClose, settings, onSave, onLogout, user }) {
  const [form, setForm] = useState(settings)
  const [regenLoading, setRegenLoading] = useState(false)
  const [regenDone, setRegenDone] = useState(false)

  useEffect(() => {
    if (open) setForm(settings)
  }, [open, settings])

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function toggleGoal(goal) {
    const goals = form.goals.includes(goal)
      ? form.goals.filter(g => g !== goal)
      : [...form.goals, goal]
    setField('goals', goals)
  }

  function toggleMuscle(name) {
    const focus = form.focusMuscles.includes(name)
      ? form.focusMuscles.filter(m => m !== name)
      : [...form.focusMuscles, name]
    setField('focusMuscles', focus)
  }

  function handleSave() {
    onSave(form)
  }

  async function handleRegenPlan() {
    if (!window.confirm('Generate a new training plan? This will reset your current progress.')) return
    setRegenLoading(true)
    try {
      await generatePlan()
      setRegenDone(true)
      setTimeout(() => setRegenDone(false), 3000)
    } catch {}
    setRegenLoading(false)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Settings">

      {/* User info */}
      {user && (
        <div style={s.userCard}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>{user.display_name}</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>@{user.username}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onLogout} style={{ fontSize: '11px' }}>
            Log Out
          </button>
        </div>
      )}

      {/* ── Nutrition Targets ── */}
      <p style={s.sectionLabel}>Nutrition Targets</p>
      <div style={s.fieldGroup}>
        <NumberField label="Daily Calories" value={form.calTarget} onChange={v => setField('calTarget', v)} unit="cal" />
        <NumberField label="Daily Protein" value={form.proTarget} onChange={v => setField('proTarget', v)} unit="g" />
        <NumberField label="Fiber Threshold" value={form.fiberTarget} onChange={v => setField('fiberTarget', v)} unit="g" hint="Warning shown if under this after 6pm" />
      </div>

      {/* ── Goals ── */}
      <p style={s.sectionLabel}>Goals</p>
      <div style={s.chipRow}>
        {ALL_GOALS.map(goal => {
          const active = form.goals.includes(goal)
          return (
            <button key={goal} onClick={() => toggleGoal(goal)} style={{ ...s.chip, ...(active ? s.chipActive : {}) }}>
              {goal}
            </button>
          )
        })}
      </div>

      {/* ── Priority Muscles ── */}
      <p style={s.sectionLabel}>Priority Muscles</p>
      <div style={s.chipRow}>
        {MUSCLES.map(m => {
          const active = form.focusMuscles.includes(m.name)
          return (
            <button key={m.name} onClick={() => toggleMuscle(m.name)} style={{ ...s.chip, ...(active ? s.chipActive : {}) }}>
              {m.name}
            </button>
          )
        })}
      </div>

      {/* ── Save ── */}
      <button className="btn btn-accent btn-block" style={{ marginTop: '28px', padding: '16px', fontSize: '15px' }} onClick={handleSave}>
        Save Settings
      </button>

      {/* ── Training Plan ── */}
      <div style={s.danger}>
        <p style={s.dangerLabel}>Training Plan</p>
        <button
          className="btn btn-ghost btn-block btn-sm"
          style={{ borderColor: 'var(--accent2)', color: 'var(--accent2)' }}
          onClick={handleRegenPlan}
          disabled={regenLoading}
        >
          {regenLoading ? 'Generating...' : regenDone ? 'Plan regenerated — go to Train tab' : 'Regenerate Training Plan'}
        </button>
      </div>

      {/* ── Logout ── */}
      <div style={s.danger}>
        <button
          className="btn btn-ghost btn-block btn-sm"
          style={{ borderColor: 'var(--red)', color: 'var(--red)' }}
          onClick={onLogout}
        >
          Log Out
        </button>
      </div>
    </Sheet>
  )
}

function NumberField({ label, value, onChange, unit, hint }) {
  return (
    <div style={nf.wrap}>
      <div style={nf.top}>
        <label style={nf.label}>{label}</label>
        {hint && <span style={nf.hint}>{hint}</span>}
      </div>
      <div style={nf.row}>
        <input type="number" inputMode="numeric" value={value} onChange={e => onChange(Number(e.target.value))} style={{ flex: 1, textAlign: 'left' }} />
        {unit && <span style={nf.unit}>{unit}</span>}
      </div>
    </div>
  )
}

const s = {
  userCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 14px',
    marginBottom: '8px',
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--muted)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginTop: '24px',
    marginBottom: '10px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  chip: {
    padding: '8px 14px',
    borderRadius: '99px',
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--muted)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  chipActive: {
    background: 'var(--accent-dim)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent)',
  },
  danger: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid var(--border)',
  },
  dangerLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--muted)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: '10px',
  },
}

const nf = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '6px' },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontSize: '13px', fontWeight: 700, color: 'var(--text)' },
  hint: { fontSize: '11px', color: 'var(--muted)' },
  row: { display: 'flex', alignItems: 'center', gap: '10px' },
  unit: { fontSize: '13px', color: 'var(--muted)', fontWeight: 600, flexShrink: 0 },
}
