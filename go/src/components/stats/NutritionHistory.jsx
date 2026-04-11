import { useState } from 'react'
import DayDetailSheet from '../eat/DayDetailSheet'

export default function NutritionHistory({ history, weekly, settings }) {
  const calTarget = settings?.calTarget || 3300
  const proTarget = settings?.proTarget || 200
  const calRange = [calTarget - 200, calTarget + 200]

  const [detailDate, setDetailDate] = useState(null)
  const recent = history.slice(0, 14)

  if (recent.length === 0) {
    return (
      <div>
        <p className="section-label">Nutrition History</p>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>No history yet.</p>
      </div>
    )
  }

  const latestWeek = weekly[0]

  return (
    <div>
      {latestWeek && (
        <>
          <p className="section-label">This Week</p>
          <div style={s.weekCard}>
            <Stat label="Avg Calories" value={Math.round(latestWeek.avg_calories || 0)} sub={`target ${calTarget}`} />
            <Stat label="Avg Protein" value={`${Math.round(latestWeek.avg_protein || 0)}g`} sub={`target ${proTarget}g`} />
            <Stat label="Protein Days" value={`${latestWeek.protein_hit_days || 0}/7`} sub="≥190g" />
            <Stat label="Cal in Range" value={`${latestWeek.calorie_range_days || 0}/7`} sub={`${calRange[0].toLocaleString()}–${calRange[1].toLocaleString()}`} />
          </div>
        </>
      )}

      <p className="section-label" style={{ marginTop: '20px' }}>
        Daily Log <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: 'none', fontSize: '11px' }}>— tap a day to see full log</span>
      </p>

      {recent.map(day => {
        const proHit = (day.protein || 0) >= (proTarget * 0.95)
        const calInRange = (day.calories || 0) >= calRange[0] && (day.calories || 0) <= calRange[1]
        const dateStr = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric'
        })

        return (
          <button
            key={day.date}
            style={s.dayRow}
            onClick={() => setDetailDate(day.date)}
          >
            <span style={s.dayDate}>{dateStr}</span>
            <div style={s.dayStats}>
              <span style={{ ...s.dayVal, color: calInRange ? 'var(--text)' : 'var(--muted)' }}>
                {day.calories || 0} cal
              </span>
              <span style={{ ...s.dayVal, color: proHit ? 'var(--green)' : 'var(--muted)' }}>
                {day.protein || 0}g P {proHit ? '✓' : ''}
              </span>
              <span style={s.chevron}>›</span>
            </div>
          </button>
        )
      })}

      <DayDetailSheet
        date={detailDate}
        open={Boolean(detailDate)}
        onClose={() => setDetailDate(null)}
      />
    </div>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div style={s.stat}>
      <div style={s.statVal}>{value}</div>
      <div style={s.statLabel}>{label}</div>
      {sub && <div style={s.statSub}>{sub}</div>}
    </div>
  )
}

const s = {
  weekCard: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '16px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '4px',
  },
  stat: { textAlign: 'center' },
  statVal: { fontSize: '20px', fontWeight: 800, lineHeight: 1.1 },
  statLabel: { fontSize: '11px', color: 'var(--muted)', fontWeight: 600, marginTop: '2px' },
  statSub: { fontSize: '10px', color: 'var(--muted)', marginTop: '1px' },
  dayRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    background: 'var(--card)',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '2px',
    width: '100%',
    border: 'none',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  dayDate: { fontSize: '13px', fontWeight: 600, color: 'var(--muted)' },
  dayStats: { display: 'flex', gap: '12px', alignItems: 'center' },
  dayVal: { fontSize: '13px', fontWeight: 700 },
  chevron: { color: 'var(--muted)', fontSize: '16px', lineHeight: 1 },
}
