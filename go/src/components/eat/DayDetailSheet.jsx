import { useState, useEffect } from 'react'
import { getEntries, deleteEntry, updateEntry } from '../../lib/api'
import { buildDayExport } from '../../lib/export'
import Sheet from '../shared/Sheet'

export default function DayDetailSheet({ date, open, onClose }) {
  const [entries, setEntries] = useState([])
  const [totals, setTotals] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [copied, setCopied] = useState(false)

  async function handleExport() {
    const text = buildDayExport({ date, entries, totals })
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      window.prompt('Copy and paste into Claude:', text)
    }
  }

  useEffect(() => {
    if (!open || !date) return
    setLoading(true)
    getEntries(date)
      .then(data => {
        setEntries(data.entries || [])
        setTotals(data.totals || null)
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [open, date])

  async function handleDelete(id) {
    try {
      await deleteEntry(id)
      setEntries(e => e.filter(x => x.id !== id))
    } catch {}
  }

  function startEdit(entry) {
    setEditingId(entry.id)
    setEditForm({
      name: entry.name,
      calories: entry.calories,
      protein: entry.protein,
      fiber: entry.fiber || '',
      carbs: entry.carbs || '',
    })
  }

  async function saveEdit(id) {
    try {
      const payload = {
        name: editForm.name.trim(),
        calories: Number(editForm.calories),
        protein: Number(editForm.protein),
        fiber: Number(editForm.fiber) || 0,
        carbs: Number(editForm.carbs) || 0,
        source: 'manual',
      }
      await updateEntry(id, payload)
      setEntries(e => e.map(x => x.id === id ? { ...x, ...payload } : x))
      setEditingId(null)
    } catch {}
  }

  const dateStr = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
      })
    : ''

  return (
    <Sheet open={open} onClose={onClose} title={dateStr}>
      {/* Totals summary + export */}
      {totals && (
        <div style={s.totalsWrap}>
          <div style={s.totals}>
            <TotalPill label="Cal" value={totals.calories} />
            <TotalPill label="Protein" value={`${totals.protein}g`} color="var(--accent2)" />
            <TotalPill label="Fiber" value={`${totals.fiber}g`} />
            <TotalPill label="Carbs" value={`${totals.carbs}g`} />
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleExport}
            style={copied ? { borderColor: 'var(--green)', color: 'var(--green)', marginTop: '10px', width: '100%' } : { marginTop: '10px', width: '100%' }}
          >
            {copied ? '✓ Copied!' : 'Export Day'}
          </button>
        </div>
      )}

      {loading && <p style={{ color: 'var(--muted)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>Loading…</p>}

      {!loading && entries.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
          Nothing logged this day.
        </p>
      )}

      <div style={s.list}>
        {entries.map(entry => {
          const time = new Date(entry.created_at).toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit'
          })

          if (editingId === entry.id) {
            return (
              <div key={entry.id} style={s.editCard}>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  style={{ marginBottom: '10px', textAlign: 'left' }}
                  autoFocus
                />
                <div style={s.editGrid}>
                  {['calories', 'protein', 'fiber', 'carbs'].map(field => (
                    <div key={field} style={s.editField}>
                      <label style={s.editLabel}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={editForm[field]}
                        onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button className="btn btn-accent btn-sm" style={{ flex: 1 }} onClick={() => saveEdit(entry.id)}>Save</button>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            )
          }

          return (
            <div key={entry.id} style={s.row}>
              <div style={s.rowLeft}>
                <span style={s.rowTime}>{time}</span>
                <span style={s.rowName}>{entry.name}</span>
                <span style={s.rowMacros}>{entry.protein}g P{entry.fiber > 0 ? ` · ${entry.fiber}g F` : ''}</span>
              </div>
              <div style={s.rowRight}>
                <span style={s.rowCal}>{entry.calories}</span>
                <div style={s.rowActions}>
                  <button style={s.actionBtn} onClick={() => startEdit(entry)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button style={{ ...s.actionBtn, color: 'var(--red)' }} onClick={() => handleDelete(entry.id)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Sheet>
  )
}

function TotalPill({ label, value, color = 'var(--text)' }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '16px', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600, marginTop: '2px' }}>{label}</div>
    </div>
  )
}

const s = {
  totalsWrap: {
    marginBottom: '16px',
  },
  totals: {
    display: 'flex',
    justifyContent: 'space-around',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '14px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--card)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 12px',
    gap: '10px',
  },
  rowLeft: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  rowTime: {
    fontSize: '10px',
    color: 'var(--muted)',
    fontWeight: 600,
  },
  rowName: {
    fontSize: '14px',
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  rowMacros: {
    fontSize: '11px',
    color: 'var(--muted)',
  },
  rowRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
    flexShrink: 0,
  },
  rowCal: {
    fontSize: '16px',
    fontWeight: 800,
  },
  rowActions: {
    display: 'flex',
    gap: '4px',
  },
  actionBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--muted)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCard: {
    background: 'var(--card)',
    border: '1px solid var(--accent-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '14px',
    marginBottom: '2px',
  },
  editGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '8px',
  },
  editField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  editLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--muted)',
  },
}
