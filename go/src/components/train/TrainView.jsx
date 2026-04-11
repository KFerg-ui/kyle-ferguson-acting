import { useState, useEffect, useRef, useCallback } from 'react'
import { PLAN, MUSCLES, getVolZone, defaultState } from '../../lib/training-data'
import { fetchPlan, fetchTrainingState, saveTrainingState as saveTrainingStateRemote } from '../../lib/api'
import DayGrid from './DayGrid'
import SessionView from './SessionView'
import VolumeSheet from './VolumeSheet'

function GearIcon({ onClick }) {
  return (
    <button onClick={onClick} style={g.btn} aria-label="Settings">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>
  )
}
const g = { btn: { background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' } }

export default function TrainView({ openCoach, onOpenSettings }) {
  const [plan, setPlan] = useState(PLAN)
  const [state, setState] = useState(defaultState)
  const [session, setSession] = useState(null)
  const [volumeOpen, setVolumeOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const saveTimer = useRef(null)

  // Fetch plan and state from API on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [planData, stateData] = await Promise.all([fetchPlan(), fetchTrainingState()])
        if (cancelled) return
        if (planData.plan) setPlan(planData.plan)
        if (stateData.state) setState(stateData.state)
        else setState(defaultState())
      } catch {
        // Fallback to defaults if API fails
        setState(defaultState())
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Debounced save to server
  const debouncedSave = useCallback((nextState) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveTrainingStateRemote(nextState).catch(() => {})
    }, 2000)
  }, [])

  function update(patch) {
    setState(prev => {
      const next = { ...prev, ...patch }
      debouncedSave(next)
      return next
    })
  }

  function closeSession(completed) {
    if (completed) {
      const newSess = state.sess + 1
      const addedSets = plan[session]?.exercises?.reduce((s, e) => s + e.sets, 0) || 0
      const patch = { sess: newSess, totalSets: state.totalSets + addedSets }
      if (newSess % 5 === 0 && state.week < state.mesoLen) patch.week = state.week + 1
      update(patch)
      // Force immediate save on session complete
      if (saveTimer.current) clearTimeout(saveTimer.current)
      const nextState = { ...state, ...patch, sessionLogs: state.sessionLogs }
      saveTrainingStateRemote(nextState).catch(() => {})
    }
    setSession(null)
  }

  function updateSessionLog(dayKey, exerciseName, sets) {
    update({
      sessionLogs: {
        ...state.sessionLogs,
        [dayKey]: { ...(state.sessionLogs[dayKey] || {}), [exerciseName]: sets },
      },
    })
  }

  function adjustVolume(muscleName, delta) {
    const m = MUSCLES.find(x => x.name === muscleName)
    if (!m) return
    const cur = state.vols[muscleName] ?? m.mev
    const next = Math.max(0, Math.min(m.mrv + 2, cur + delta))
    update({ vols: { ...state.vols, [muscleName]: next } })
  }

  if (loading) {
    return (
      <div className="view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Loading training plan...</p>
      </div>
    )
  }

  if (session !== null) {
    return (
      <SessionView
        day={plan[session]}
        planIdx={session}
        week={state.week}
        sessionLogs={state.sessionLogs}
        onUpdateLog={updateSessionLog}
        onClose={closeSession}
        openCoach={openCoach}
      />
    )
  }

  return (
    <div className="view">
      <div style={s.header}>
        <div>
          <h2>Train</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '2px' }}>
            Week {state.week} / {state.mesoLen} · {state.sess} sessions
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setVolumeOpen(true)}>
            Volume
          </button>
          <GearIcon onClick={onOpenSettings} />
        </div>
      </div>

      <DayGrid plan={plan} week={state.week} sessionLogs={state.sessionLogs} onSelectDay={setSession} />

      <VolumeSheet open={volumeOpen} onClose={() => setVolumeOpen(false)} vols={state.vols} onAdjust={adjustVolume} />
    </div>
  )
}

const s = {
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
}
