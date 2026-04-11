import { useState, useRef } from 'react'

const SOURCE_LABEL = { photo: '📷', saved: '⭐', restaurant: '🍽', manual: '' }

export default function FoodEntry({ entry, onEdit, onDelete }) {
  const [swiped, setSwiped] = useState(false)
  const touchStart = useRef(null)
  const touchDelta = useRef(0)

  function handleTouchStart(e) {
    touchStart.current = e.touches[0].clientX
    touchDelta.current = 0
  }

  function handleTouchMove(e) {
    if (touchStart.current === null) return
    touchDelta.current = e.touches[0].clientX - touchStart.current
    if (touchDelta.current < -40) setSwiped(true)
    if (touchDelta.current > 20) setSwiped(false)
  }

  function handleTouchEnd() {
    touchStart.current = null
  }

  const time = new Date(entry.created_at).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit'
  })

  const sourceIcon = SOURCE_LABEL[entry.source] || ''

  return (
    <div style={s.wrapper}>
      {/* Delete reveal */}
      {swiped && (
        <button style={s.deleteBtn} onClick={onDelete}>
          Delete
        </button>
      )}

      {/* Main row */}
      <div
        style={{
          ...s.row,
          transform: swiped ? 'translateX(-80px)' : 'translateX(0)',
          transition: 'transform 0.2s ease',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => { if (!swiped) onEdit(); else setSwiped(false) }}
      >
        <div style={s.left}>
          <div style={s.name}>
            {sourceIcon && <span style={{ marginRight: '4px' }}>{sourceIcon}</span>}
            {entry.name}
          </div>
          <div style={s.macros}>
            <span style={s.macro}>{entry.protein}g P</span>
            {entry.fiber > 0 && <span style={s.macro}>{entry.fiber}g F</span>}
            {entry.carbs > 0 && <span style={s.macro}>{entry.carbs}g C</span>}
          </div>
        </div>
        <div style={s.right}>
          <div style={s.cal}>{entry.calories}</div>
          <div style={s.time}>{time}</div>
        </div>
      </div>
    </div>
  )
}

const s = {
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
    marginBottom: '2px',
    borderRadius: 'var(--radius-sm)',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--card)',
    padding: '13px 14px',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    willChange: 'transform',
    minHeight: '60px',
  },
  left: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '3px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  macros: {
    display: 'flex',
    gap: '8px',
  },
  macro: {
    fontSize: '11px',
    color: 'var(--muted)',
    fontWeight: 600,
  },
  right: {
    textAlign: 'right',
    flexShrink: 0,
    marginLeft: '12px',
  },
  cal: {
    fontSize: '16px',
    fontWeight: 800,
    color: 'var(--text)',
  },
  time: {
    fontSize: '11px',
    color: 'var(--muted)',
  },
  deleteBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '80px',
    background: 'var(--red)',
    color: '#fff',
    border: 'none',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
  },
}
