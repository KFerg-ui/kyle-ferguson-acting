import { useState, useEffect } from 'react'
import { getHistory, getWeeklyHistory, getWeight, getEntries, fetchTrainingState } from '../../lib/api'
import { defaultState } from '../../lib/training-data'
import { buildExport } from '../../lib/export'
import MesocycleProgress from './MesocycleProgress'
import NutritionHistory from './NutritionHistory'
import WeightLog from './WeightLog'

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

export default function StatsView({ onOpenSettings, settings }) {
  const [history, setHistory] = useState([])
  const [weekly, setWeekly] = useState([])
  const [weights, setWeights] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [training, setTraining] = useState(defaultState)

  useEffect(() => {
    fetchTrainingState().then(data => {
      if (data.state) setTraining(data.state)
    }).catch(() => {})

    Promise.all([
      getHistory().catch(() => ({})),
      getWeeklyHistory().catch(() => ({})),
      getWeight(30).catch(() => ({})),
    ]).then(([hist, wk, wt]) => {
      setHistory(hist.days || hist || [])
      setWeekly(wk.weeks || wk || [])
      setWeights(wt.weights || wt || [])
    }).finally(() => setLoading(false))
  }, [])

  async function handleExport() {
    let todayEntries = [], todayTotals = null
    try {
      const today = new Date().toISOString().split('T')[0]
      const data = await getEntries(today)
      todayEntries = data.entries || []
      todayTotals = data.totals || null
    } catch {}

    const text = buildExport({ trainingState: training, nutritionEntries: todayEntries, nutritionTotals: todayTotals, weightHistory: weights, weeklyHistory: weekly })

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      window.prompt('Copy and paste into Claude:', text)
    }
  }

  return (
    <div className="view">
      <div style={s.header}>
        <h2>Stats</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleExport}
            style={copied ? { borderColor: 'var(--green)', color: 'var(--green)' } : {}}
          >
            {copied ? '✓ Copied!' : 'Export'}
          </button>
          <GearIcon onClick={onOpenSettings} />
        </div>
      </div>

      <MesocycleProgress training={training} />

      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: '14px', padding: '16px 0' }}>Loading…</p>
      ) : (
        <>
          <NutritionHistory history={history} weekly={weekly} settings={settings} />
          <WeightLog weights={weights} />
        </>
      )}
    </div>
  )
}

const s = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
}
