import { useState } from 'react'
import { logWeight } from '../../lib/api'

export default function WeightLog({ weights }) {
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleLog() {
    const w = parseFloat(input)
    if (!w || w < 50 || w > 500) return
    setSaving(true)
    try {
      await logWeight(w)
      setInput('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
    setSaving(false)
  }

  // Rolling 7-day average
  const recent = weights.slice(0, 7)
  const avg7 = recent.length > 0
    ? (recent.reduce((s, e) => s + e.weight_lbs, 0) / recent.length).toFixed(1)
    : null

  const latest = weights[0]
  const oldest = weights[weights.length - 1]
  const trend = latest && oldest && latest !== oldest
    ? (latest.weight_lbs - oldest.weight_lbs).toFixed(1)
    : null

  return (
    <div>
      <p className="section-label" style={{ marginTop: '24px' }}>Weight</p>

      {/* Log weight */}
      <div style={s.logRow}>
        <input
          type="number"
          inputMode="decimal"
          placeholder="lbs"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLog()}
          style={{ ...s.wtInput }}
        />
        <button
          className="btn btn-surface"
          onClick={handleLog}
          disabled={saving || !input}
          style={{ flexShrink: 0 }}
        >
          {saving ? '…' : saved ? '✓ Logged' : 'Log Weight'}
        </button>
      </div>

      {/* Summary */}
      {latest && (
        <div style={s.summary}>
          <div style={s.summaryItem}>
            <div style={s.summaryVal}>{latest.weight_lbs} lbs</div>
            <div style={s.summaryLabel}>Latest</div>
          </div>
          {avg7 && (
            <div style={s.summaryItem}>
              <div style={s.summaryVal}>{avg7}</div>
              <div style={s.summaryLabel}>7-day avg</div>
            </div>
          )}
          {trend && weights.length >= 2 && (
            <div style={s.summaryItem}>
              <div style={{
                ...s.summaryVal,
                color: parseFloat(trend) < 0 ? 'var(--green)' : parseFloat(trend) > 0 ? 'var(--red)' : 'var(--muted)',
              }}>
                {parseFloat(trend) > 0 ? `+${trend}` : trend} lbs
              </div>
              <div style={s.summaryLabel}>{weights.length}d trend</div>
            </div>
          )}
        </div>
      )}

      {/* Recent entries */}
      {weights.slice(0, 10).map(w => {
        const dateStr = new Date(w.date + 'T12:00:00').toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric'
        })
        return (
          <div key={w.date} style={s.wRow}>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{dateStr}</span>
            <span style={{ fontSize: '14px', fontWeight: 700 }}>{w.weight_lbs} lbs</span>
          </div>
        )
      })}
    </div>
  )
}

const s = {
  logRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
    alignItems: 'center',
  },
  wtInput: {
    flex: 1,
    textAlign: 'left',
  },
  summary: {
    display: 'flex',
    gap: '16px',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '14px 16px',
    marginBottom: '12px',
  },
  summaryItem: {
    flex: 1,
    textAlign: 'center',
  },
  summaryVal: {
    fontSize: '18px',
    fontWeight: 800,
    lineHeight: 1.1,
  },
  summaryLabel: {
    fontSize: '11px',
    color: 'var(--muted)',
    marginTop: '2px',
  },
  wRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: 'var(--card)',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '2px',
  },
}
