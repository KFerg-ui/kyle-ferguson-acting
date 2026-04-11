const DAY_TO_PLAN = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 } // JS dayOfWeek → PLAN index

function isSessionDone(day, week, sessionLogs) {
  const key = `${day.label.toLowerCase()}-w${week}`
  return Boolean(sessionLogs[key]?.__completed)
}

export default function DayGrid({ plan, week, sessionLogs, onSelectDay }) {
  const todayIdx = DAY_TO_PLAN[new Date().getDay()]

  return (
    <div style={s.grid}>
      {plan.map((day, i) => {
        const isToday = i === todayIdx
        const isDone = isSessionDone(day, week, sessionLogs)
        const isRest = day.rest

        return (
          <button
            key={day.label}
            onClick={() => !isRest && onSelectDay(i)}
            disabled={isRest}
            style={{
              ...s.card,
              ...(isRest ? s.cardRest : {}),
              ...(isToday ? s.cardToday : {}),
              ...(isDone ? s.cardDone : {}),
            }}
          >
            {isToday && <div style={s.todayBadge}>TODAY</div>}
            {isDone && !isToday && <div style={s.doneBadge}>✓ Done</div>}

            <div style={s.dayLabel}>{day.label}</div>
            <div style={s.title}>{day.title}</div>
            {day.subtitle && <div style={s.subtitle}>{day.subtitle}</div>}

            {day.muscles.length > 0 && (
              <div style={s.muscles}>
                {day.muscles.map(m => (
                  <span key={m} style={s.chip}>{m}</span>
                ))}
              </div>
            )}

            {!isRest && (
              <div style={s.meta}>
                {day.exercises.length} exercises · {day.exercises.reduce((s, e) => s + e.sets, 0)} sets
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

const s = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  card: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '14px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minHeight: '110px',
  },
  cardRest: {
    opacity: 0.4,
    cursor: 'default',
  },
  cardToday: {
    border: '1px solid var(--accent)',
    boxShadow: '0 0 0 1px var(--accent)',
  },
  cardDone: {
    border: '1px solid var(--green)',
    background: 'rgba(46,213,115,0.06)',
  },
  todayBadge: {
    fontSize: '9px',
    fontWeight: 800,
    letterSpacing: '1px',
    color: '#000',
    background: 'var(--accent)',
    padding: '2px 6px',
    borderRadius: '99px',
    alignSelf: 'flex-start',
    marginBottom: '2px',
  },
  doneBadge: {
    fontSize: '9px',
    fontWeight: 800,
    letterSpacing: '0.5px',
    color: 'var(--green)',
    marginBottom: '2px',
  },
  dayLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--muted)',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: '15px',
    fontWeight: 800,
    color: 'var(--text)',
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: '11px',
    color: 'var(--muted)',
  },
  muscles: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginTop: '4px',
  },
  chip: {
    fontSize: '10px',
    padding: '2px 7px',
    borderRadius: '99px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--muted)',
  },
  meta: {
    fontSize: '11px',
    color: 'var(--muted)',
    marginTop: 'auto',
    paddingTop: '4px',
  },
}
