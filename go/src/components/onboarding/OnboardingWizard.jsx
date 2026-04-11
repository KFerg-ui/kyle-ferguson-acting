import { useState } from 'react'
import { submitOnboarding, generatePlan } from '../../lib/api'

const STEPS = ['Experience', 'Goals', 'Schedule', 'Equipment', 'Injuries', 'Muscles', 'Body', 'Nutrition']
const GOAL_OPTIONS = ['Build muscle', 'Lose fat', 'Strength', 'General fitness', 'Athletic performance']
const EQUIPMENT_OPTIONS = [
  { value: 'full_gym', label: 'Full Gym' },
  { value: 'home_gym', label: 'Home Gym' },
  { value: 'bodyweight', label: 'Bodyweight Only' },
]
const MUSCLE_OPTIONS = ['Chest', 'Back', 'Quads', 'Hamstrings', 'Delts', 'Biceps', 'Triceps', 'Glutes', 'Calves', 'Abs']

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    experience: '',
    goals: [],
    days_per_week: 4,
    equipment: 'full_gym',
    injuries: '',
    priority_muscles: [],
    height_in: '',
    weight_lbs: '',
    age: '',
    cal_target: 2500,
    pro_target: 150,
  })
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function toggleArray(field, item) {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(item)
        ? f[field].filter(x => x !== item)
        : [...f[field], item],
    }))
  }

  function canAdvance() {
    switch (step) {
      case 0: return !!form.experience
      case 1: return form.goals.length > 0
      case 2: return true
      case 3: return true
      case 4: return true
      case 5: return form.priority_muscles.length > 0
      case 6: return true
      case 7: return form.cal_target > 0 && form.pro_target > 0
      default: return true
    }
  }

  async function handleFinish() {
    setGenerating(true)
    setError('')
    try {
      await submitOnboarding(form)
      await generatePlan()
      onComplete()
    } catch (err) {
      setError(err.message || 'Failed to generate plan')
      setGenerating(false)
    }
  }

  if (generating) {
    return (
      <div style={s.screen}>
        <div style={s.inner}>
          <div style={s.logo}>GYM<span style={{ color: 'var(--accent)' }}>SHRED</span></div>
          <div style={s.spinner} />
          <p style={s.genText}>Building your training plan...</p>
          <p style={s.genSub}>AI is designing a personalized program based on your goals, experience, and available days.</p>
          {error && <p style={{ ...s.error, marginTop: '16px' }}>{error}</p>}
          {error && (
            <button className="btn btn-ghost btn-block" style={{ marginTop: '12px' }} onClick={handleFinish}>
              Retry
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={s.screen}>
      <div style={s.inner}>
        <div style={s.logo}>GYM<span style={{ color: 'var(--accent)' }}>SHRED</span></div>

        {/* Progress */}
        <div style={s.progress}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ ...s.dot, background: i <= step ? 'var(--accent)' : 'var(--border)' }} />
          ))}
        </div>

        <p style={s.stepLabel}>{STEPS[step]}</p>

        {/* Step 0: Experience */}
        {step === 0 && (
          <div style={s.stepBody}>
            <p style={s.q}>How would you describe your training experience?</p>
            {['beginner', 'intermediate', 'advanced'].map(lvl => (
              <button
                key={lvl}
                className={`btn btn-block ${form.experience === lvl ? 'btn-accent' : 'btn-ghost'}`}
                onClick={() => set('experience', lvl)}
                style={{ marginBottom: '8px', textTransform: 'capitalize' }}
              >{lvl}</button>
            ))}
          </div>
        )}

        {/* Step 1: Goals */}
        {step === 1 && (
          <div style={s.stepBody}>
            <p style={s.q}>What are your goals? (select all that apply)</p>
            <div style={s.chips}>
              {GOAL_OPTIONS.map(g => (
                <button
                  key={g}
                  className={`btn btn-sm ${form.goals.includes(g) ? 'btn-accent' : 'btn-ghost'}`}
                  onClick={() => toggleArray('goals', g)}
                >{g}</button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <div style={s.stepBody}>
            <p style={s.q}>How many days per week can you train?</p>
            <div style={s.chips}>
              {[3, 4, 5, 6].map(n => (
                <button
                  key={n}
                  className={`btn btn-sm ${form.days_per_week === n ? 'btn-accent' : 'btn-ghost'}`}
                  onClick={() => set('days_per_week', n)}
                >{n} days</button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Equipment */}
        {step === 3 && (
          <div style={s.stepBody}>
            <p style={s.q}>What equipment do you have access to?</p>
            {EQUIPMENT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`btn btn-block ${form.equipment === opt.value ? 'btn-accent' : 'btn-ghost'}`}
                onClick={() => set('equipment', opt.value)}
                style={{ marginBottom: '8px' }}
              >{opt.label}</button>
            ))}
          </div>
        )}

        {/* Step 4: Injuries */}
        {step === 4 && (
          <div style={s.stepBody}>
            <p style={s.q}>Any injuries or limitations?</p>
            <input
              type="text"
              placeholder="e.g. bad left knee, shoulder impingement (or leave blank)"
              value={form.injuries}
              onChange={e => set('injuries', e.target.value)}
              style={{ textAlign: 'left' }}
            />
          </div>
        )}

        {/* Step 5: Priority Muscles */}
        {step === 5 && (
          <div style={s.stepBody}>
            <p style={s.q}>Which muscles do you want to prioritize?</p>
            <div style={s.chips}>
              {MUSCLE_OPTIONS.map(m => (
                <button
                  key={m}
                  className={`btn btn-sm ${form.priority_muscles.includes(m) ? 'btn-accent' : 'btn-ghost'}`}
                  onClick={() => toggleArray('priority_muscles', m)}
                >{m}</button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Body stats */}
        {step === 6 && (
          <div style={s.stepBody}>
            <p style={s.q}>Body stats (optional — helps personalize your plan)</p>
            <div style={s.fieldRow}>
              <div style={s.field}>
                <label style={s.fieldLabel}>Age</label>
                <input type="number" inputMode="numeric" placeholder="—" value={form.age} onChange={e => set('age', e.target.value)} />
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>Weight (lbs)</label>
                <input type="number" inputMode="decimal" placeholder="—" value={form.weight_lbs} onChange={e => set('weight_lbs', e.target.value)} />
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>Height (in)</label>
                <input type="number" inputMode="decimal" placeholder="—" value={form.height_in} onChange={e => set('height_in', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Nutrition */}
        {step === 7 && (
          <div style={s.stepBody}>
            <p style={s.q}>Set your daily nutrition targets</p>
            <div style={s.fieldRow}>
              <div style={s.field}>
                <label style={s.fieldLabel}>Calories</label>
                <input type="number" inputMode="numeric" value={form.cal_target} onChange={e => set('cal_target', Number(e.target.value))} />
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>Protein (g)</label>
                <input type="number" inputMode="numeric" value={form.pro_target} onChange={e => set('pro_target', Number(e.target.value))} />
              </div>
            </div>
          </div>
        )}

        {error && <p style={s.error}>{error}</p>}

        {/* Nav buttons */}
        <div style={s.nav}>
          {step > 0 && (
            <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)} style={{ flex: 1 }}>
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              className="btn btn-accent"
              disabled={!canAdvance()}
              onClick={() => setStep(s => s + 1)}
              style={{ flex: 1 }}
            >
              Next
            </button>
          ) : (
            <button
              className="btn btn-accent"
              disabled={!canAdvance()}
              onClick={handleFinish}
              style={{ flex: 1 }}
            >
              Generate My Plan
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  screen: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: '24px',
  },
  inner: {
    width: '100%',
    maxWidth: '380px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 900,
    letterSpacing: '-1px',
    textAlign: 'center',
    marginBottom: '20px',
  },
  progress: {
    display: 'flex',
    gap: '6px',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    transition: 'background 0.2s',
  },
  stepLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    textAlign: 'center',
    marginBottom: '16px',
  },
  stepBody: {
    marginBottom: '24px',
  },
  q: {
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '16px',
    lineHeight: 1.5,
    textAlign: 'center',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
  },
  fieldRow: {
    display: 'flex',
    gap: '10px',
  },
  field: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--muted)',
  },
  nav: {
    display: 'flex',
    gap: '10px',
  },
  error: {
    color: 'var(--red)',
    fontSize: '13px',
    fontWeight: 600,
    textAlign: 'center',
    marginBottom: '12px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid var(--border)',
    borderTopColor: 'var(--accent)',
    borderRadius: '50%',
    margin: '32px auto 16px',
    animation: 'spin 0.8s linear infinite',
  },
  genText: {
    fontSize: '16px',
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: '8px',
  },
  genSub: {
    fontSize: '13px',
    color: 'var(--muted)',
    textAlign: 'center',
    lineHeight: 1.5,
  },
}

// Spinner keyframe
if (typeof document !== 'undefined' && !document.getElementById('spin-style')) {
  const style = document.createElement('style')
  style.id = 'spin-style'
  style.textContent = '@keyframes spin { to { transform: rotate(360deg) } }'
  document.head.appendChild(style)
}
