import { useState, useEffect, useCallback } from 'react'
import { getSavedMeals, deleteSavedMeal, updateSavedMeal } from '../../lib/api'

const USAGE_KEY = 'gymshred-meal-usage'

function loadUsage() {
  try { return JSON.parse(localStorage.getItem(USAGE_KEY)) || {} } catch { return {} }
}

function recordUsage(mealId) {
  const map = loadUsage()
  const prev = map[mealId] || { count: 0, lastUsed: 0 }
  map[mealId] = { count: prev.count + 1, lastUsed: Date.now() }
  localStorage.setItem(USAGE_KEY, JSON.stringify(map))
}

function sortByUsage(meals) {
  const map = loadUsage()
  return [...meals].sort((a, b) => {
    const ua = map[a.id] || { count: 0, lastUsed: 0 }
    const ub = map[b.id] || { count: 0, lastUsed: 0 }
    // Most recently used first, then by count, then alphabetical
    if (ub.lastUsed !== ua.lastUsed) return ub.lastUsed - ua.lastUsed
    if (ub.count !== ua.count) return ub.count - ua.count
    return a.name.localeCompare(b.name)
  })
}

export default function SavedMeals({ onSelect }) {
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    getSavedMeals()
      .then(data => setMeals(sortByUsage(data.meals || data || [])))
      .catch(() => setMeals([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = query.trim()
    ? meals.filter(m => m.name.toLowerCase().includes(query.toLowerCase()))
    : meals

  const handleSelect = useCallback((meal) => {
    recordUsage(meal.id)
    onSelect(meal)
  }, [onSelect])

  async function handleDelete(id, e) {
    e.stopPropagation()
    try {
      await deleteSavedMeal(id)
      setMeals(m => m.filter(x => x.id !== id))
    } catch {}
  }

  function startEdit(meal, e) {
    e.stopPropagation()
    setEditingId(meal.id)
    setEditForm({
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      fiber: meal.fiber || '',
      carbs: meal.carbs || '',
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
      }
      await updateSavedMeal(id, payload)
      setMeals(m => m.map(x => x.id === id ? { ...x, ...payload } : x))
      setEditingId(null)
    } catch {}
  }

  if (loading) return <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Loading…</p>

  if (meals.length === 0) {
    return (
      <div style={{ color: 'var(--muted)', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
        <p>No saved meals yet.</p>
        <p style={{ fontSize: '12px', marginTop: '6px' }}>Log a meal and tap "Save to Favorites" to add it here.</p>
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      {/* Sticky search — stays visible above keyboard */}
      <div style={s.searchWrap}>
        <input
          type="text"
          placeholder="Search saved meals…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ marginBottom: 0, textAlign: 'left' }}
          autoComplete="off"
        />
      </div>

      {filtered.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>
          No matches for "{query}"
        </p>
      )}

      <div style={{ ...s.list, paddingBottom: focused ? '50vh' : '0' }}>
        {filtered.map(m => {
          if (editingId === m.id) {
            return (
              <div key={m.id} style={s.editCard}>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  style={{ marginBottom: '10px', textAlign: 'left' }}
                  autoFocus
                />
                <div style={s.editRow}>
                  <div style={s.editField}>
                    <label style={s.editLabel}>Cal</label>
                    <input type="number" inputMode="numeric" value={editForm.calories}
                      onChange={e => setEditForm(f => ({ ...f, calories: e.target.value }))} />
                  </div>
                  <div style={s.editField}>
                    <label style={s.editLabel}>Protein</label>
                    <input type="number" inputMode="decimal" value={editForm.protein}
                      onChange={e => setEditForm(f => ({ ...f, protein: e.target.value }))} />
                  </div>
                  <div style={s.editField}>
                    <label style={s.editLabel}>Fiber</label>
                    <input type="number" inputMode="decimal" value={editForm.fiber}
                      onChange={e => setEditForm(f => ({ ...f, fiber: e.target.value }))} />
                  </div>
                  <div style={s.editField}>
                    <label style={s.editLabel}>Carbs</label>
                    <input type="number" inputMode="decimal" value={editForm.carbs}
                      onChange={e => setEditForm(f => ({ ...f, carbs: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button className="btn btn-accent btn-sm" style={{ flex: 1 }} onClick={() => saveEdit(m.id)}>
                    Save
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )
          }

          return (
            <div key={m.id} style={s.card}>
              {/* Main tap target: log it */}
              <button style={s.cardMain} onClick={() => handleSelect(m)}>
                <div style={s.name}>{m.name}</div>
                <div style={s.macros}>
                  <span style={s.cal}>{m.calories} cal</span>
                  <span style={s.pro}>{m.protein}g P</span>
                  {m.fiber > 0 && <span style={s.extra}>{m.fiber}g F</span>}
                </div>
              </button>
              {/* Actions */}
              <div style={s.actions}>
                <button style={s.actionBtn} onClick={e => startEdit(m, e)} aria-label="Edit">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button style={{ ...s.actionBtn, color: 'var(--red)' }} onClick={e => handleDelete(m.id, e)} aria-label="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const s = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  searchWrap: {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    background: 'var(--surface)',
    paddingBottom: '2px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    transition: 'padding-bottom 0.2s',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
  },
  cardMain: {
    flex: 1,
    padding: '13px 14px',
    textAlign: 'left',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text)',
    minHeight: '52px',
  },
  name: {
    fontSize: '14px',
    fontWeight: 700,
    marginBottom: '3px',
  },
  macros: {
    display: 'flex',
    gap: '10px',
  },
  cal: {
    fontSize: '13px',
    fontWeight: 800,
    color: 'var(--text)',
  },
  pro: {
    fontSize: '12px',
    color: 'var(--accent2)',
    fontWeight: 700,
  },
  extra: {
    fontSize: '12px',
    color: 'var(--muted)',
    fontWeight: 600,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid var(--border)',
  },
  actionBtn: {
    padding: '12px 14px',
    background: 'transparent',
    border: 'none',
    color: 'var(--muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  editCard: {
    background: 'var(--card)',
    border: '1px solid var(--accent-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '14px',
  },
  editRow: {
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
    letterSpacing: '0.3px',
  },
}
