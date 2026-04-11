import FoodEntry from './FoodEntry'

export default function FoodLog({ entries, onEdit, onDelete }) {
  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🥗</div>
        <p>Nothing logged yet today.<br />Tap <strong>+ Log Food</strong> to start.</p>
      </div>
    )
  }

  return (
    <div>
      <div style={s.label}>Today's Log</div>
      {entries.map(entry => (
        <FoodEntry
          key={entry.id}
          entry={entry}
          onEdit={() => onEdit(entry)}
          onDelete={() => onDelete(entry.id)}
        />
      ))}
    </div>
  )
}

const s = {
  label: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--muted)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: '10px',
  },
}
