import { useState, useEffect, useCallback } from 'react'
import { getEntries, deleteEntry } from '../../lib/api'
import StatsHero from './StatsHero'
import FoodLog from './FoodLog'
import LogSheet from './LogSheet'

function todayDate() {
  return new Date().toISOString().split('T')[0]
}

export default function EatView({ openCoach, onOpenSettings, settings }) {
  const [entries, setEntries] = useState([])
  const [totals, setTotals] = useState({ calories: 0, protein: 0, fiber: 0, carbs: 0 })
  const [loading, setLoading] = useState(true)
  const [logOpen, setLogOpen] = useState(false)
  const [editEntry, setEditEntry] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getEntries(todayDate())
      setEntries(data.entries || [])
      setTotals(data.totals || { calories: 0, protein: 0, fiber: 0, carbs: 0 })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function handleAdd() {
    setEditEntry(null)
    setLogOpen(true)
  }

  function handleEdit(entry) {
    setEditEntry(entry)
    setLogOpen(true)
  }

  async function handleDelete(id) {
    try {
      await deleteEntry(id)
      load()
    } catch (err) {
      console.error(err)
    }
  }

  function handleSaved() {
    setLogOpen(false)
    setEditEntry(null)
    load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Stats hero — sticky, always visible */}
      <StatsHero
        totals={totals}
        settings={settings}
        onOpenSettings={onOpenSettings}
      />

      {/* Scrollable content below */}
      <div className="view" style={{ paddingTop: '16px' }}>
        {/* Action row */}
        <div style={s.actionRow}>
          <button className="btn btn-accent" style={{ flex: 1, fontSize: '15px', padding: '14px' }} onClick={handleAdd}>
            + Log Food
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => openCoach({ context: 'nutrition', totals })}
          >
            Ask Coach
          </button>
        </div>

        {/* Food log */}
        {loading ? (
          <div style={{ color: 'var(--muted)', fontSize: '14px', textAlign: 'center', padding: '32px' }}>
            Loading…
          </div>
        ) : (
          <FoodLog entries={entries} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </div>

      <LogSheet
        open={logOpen}
        onClose={() => { setLogOpen(false); setEditEntry(null) }}
        onSaved={handleSaved}
        editEntry={editEntry}
      />
    </div>
  )
}

const s = {
  actionRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    alignItems: 'center',
  },
}
