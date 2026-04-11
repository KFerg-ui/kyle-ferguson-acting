import { useState, useEffect, useRef } from 'react'
import { addEntry, updateEntry, addSavedMeal, analyzePhoto, estimateText } from '../../lib/api'
import Sheet from '../shared/Sheet'
import SavedMeals from './SavedMeals'

const TABS = ['Manual', 'Saved', 'Photo']

const EMPTY_FORM = { name: '', calories: '', protein: '', fiber: '', carbs: '' }

export default function LogSheet({ open, onClose, onSaved, editEntry }) {
  const [tab, setTab] = useState('Manual')
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // AutoFill state (AI estimation built into Manual tab)
  const [autoFilling, setAutoFilling] = useState(false)
  const [autoFillDone, setAutoFillDone] = useState(false)

  // Photo state
  const [photoSrc, setPhotoSrc] = useState(null)
  const [photoResults, setPhotoResults] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const cameraRef = useRef()
  const galleryRef = useRef()

  // When editing an entry, pre-fill form
  useEffect(() => {
    if (editEntry) {
      setForm({
        name: editEntry.name || '',
        calories: editEntry.calories ?? '',
        protein: editEntry.protein ?? '',
        fiber: editEntry.fiber ?? '',
        carbs: editEntry.carbs ?? '',
      })
      setTab('Manual')
    } else {
      setForm(EMPTY_FORM)
    }
    setPhotoSrc(null)
    setPhotoResults(null)
    setAutoFillDone(false)
    setError('')
  }, [editEntry, open])

  function handleField(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (autoFillDone) setAutoFillDone(false)
  }

  async function handleSave() {
    const { name, calories, protein } = form
    if (!name.trim() || !calories || !protein) {
      setError('Name, calories, and protein are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: name.trim(),
        calories: Number(calories),
        protein: Number(protein),
        fiber: Number(form.fiber) || 0,
        carbs: Number(form.carbs) || 0,
        source: 'manual',
      }
      if (editEntry) {
        await updateEntry(editEntry.id, payload)
      } else {
        await addEntry(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function handleSavedMealSelect(meal) {
    setForm({
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      fiber: meal.fiber || '',
      carbs: meal.carbs || '',
    })
    setTab('Manual')
  }

  // ── AutoFill (AI estimation) ──
  async function handleAutoFill() {
    if (!form.name.trim()) {
      setError('Type a food name first, then hit AutoFill.')
      return
    }
    setAutoFilling(true)
    setError('')
    try {
      // Send descriptive text to push the AI toward USDA-level accuracy
      const desc = form.name.trim()
      const data = await estimateText(desc)
      const items = data.items || data || []
      if (items.length > 0) {
        const item = items[0]
        // Only fill empty fields — don't overwrite what the user already typed
        setForm(f => ({
          ...f,
          name: f.name || item.name,
          calories: f.calories || item.calories,
          protein: f.protein || item.protein,
          fiber: f.fiber || item.fiber || '',
          carbs: f.carbs || item.carbs || '',
        }))
        setAutoFillDone(true)
      } else {
        setError('No results — try being more specific (e.g. "8oz grilled chicken breast").')
      }
    } catch {
      setError('AutoFill failed — check connection.')
    } finally {
      setAutoFilling(false)
    }
  }

  // ── Photo ──
  function handlePhotoSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const dataUrl = ev.target.result
      setPhotoSrc(dataUrl)
      setAnalyzing(true)
      setPhotoResults(null)
      try {
        const base64 = dataUrl.split(',')[1]
        const mediaType = file.type || 'image/jpeg'
        const data = await analyzePhoto(base64, mediaType)
        setPhotoResults(data.items || data)
      } catch {
        setError('Photo analysis failed. Try again.')
      } finally {
        setAnalyzing(false)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function selectPhotoItem(item) {
    setForm({
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      fiber: item.fiber || '',
      carbs: item.carbs || '',
    })
    setTab('Manual')
  }

  async function handleSaveToFavorites() {
    const { name, calories, protein, fiber, carbs } = form
    if (!name.trim() || !calories) return
    try {
      await addSavedMeal({
        name: name.trim(),
        calories: Number(calories),
        protein: Number(protein) || 0,
        fiber: Number(fiber) || 0,
        carbs: Number(carbs) || 0,
      })
    } catch {}
  }

  const title = editEntry ? 'Edit Entry' : 'Log Food'

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {/* Tab row */}
      {!editEntry && (
        <div style={s.tabs}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ ...s.tabBtn, ...(tab === t ? s.tabActive : {}) }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {error && <p style={s.error}>{error}</p>}

      {/* ── Manual ── */}
      {tab === 'Manual' && (
        <div style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Item name *</label>
            <input
              type="text"
              placeholder="e.g. 8oz grilled chicken breast"
              value={form.name}
              onChange={e => handleField('name', e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* AutoFill button — visible when name is filled but macros are empty */}
          {!editEntry && form.name.trim() && !form.calories && !form.protein && (
            <button
              className="btn btn-ghost btn-block btn-sm"
              onClick={handleAutoFill}
              disabled={autoFilling}
              style={{ borderColor: 'var(--accent2)', color: 'var(--accent2)' }}
            >
              {autoFilling ? 'Looking up macros…' : 'AutoFill Macros'}
            </button>
          )}

          {autoFillDone && (
            <p style={s.autoFillNote}>
              AI-estimated — review and adjust before logging.
            </p>
          )}

          <div style={s.row2}>
            <div style={s.field}>
              <label style={s.label}>Calories *</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={form.calories}
                onChange={e => handleField('calories', e.target.value)}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Protein (g) *</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={form.protein}
                onChange={e => handleField('protein', e.target.value)}
              />
            </div>
          </div>
          <div style={s.row2}>
            <div style={s.field}>
              <label style={s.label}>Fiber (g)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={form.fiber}
                onChange={e => handleField('fiber', e.target.value)}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Carbs (g)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={form.carbs}
                onChange={e => handleField('carbs', e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn btn-accent btn-block"
            onClick={handleSave}
            disabled={saving}
            style={{ marginTop: '8px' }}
          >
            {saving ? 'Saving…' : editEntry ? 'Update Entry' : 'Log It'}
          </button>

          {/* AutoFill at the bottom too — for when macros already have values */}
          {!editEntry && form.name.trim() && (form.calories || form.protein) && !autoFilling && (
            <button
              className="btn btn-ghost btn-block btn-sm"
              onClick={() => {
                // Clear macros then autofill
                setForm(f => ({ ...f, calories: '', protein: '', fiber: '', carbs: '' }))
                setTimeout(handleAutoFill, 0)
              }}
              style={{ marginTop: '4px', fontSize: '11px', color: 'var(--accent2)' }}
            >
              Re-AutoFill Macros
            </button>
          )}

          {!editEntry && form.name && form.calories && (
            <button
              className="btn btn-ghost btn-block btn-sm"
              onClick={handleSaveToFavorites}
              style={{ marginTop: '4px' }}
            >
              + Save to Favorites
            </button>
          )}
        </div>
      )}

      {/* ── Saved ── */}
      {tab === 'Saved' && (
        <SavedMeals onSelect={handleSavedMealSelect} />
      )}

      {/* ── Photo ── */}
      {tab === 'Photo' && (
        <div style={s.form}>
          {/* Two separate inputs: camera and gallery */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handlePhotoSelect}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoSelect}
          />

          {!photoSrc && !analyzing && (
            <div style={s.photoPrompt}>
              <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '16px', lineHeight: 1.6, textAlign: 'center' }}>
                Snap or upload a photo of your food and Claude will estimate the macros.
              </p>
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button
                  className="btn btn-accent"
                  onClick={() => cameraRef.current.click()}
                  style={{ flex: 1, fontSize: '14px' }}
                >
                  Camera
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => galleryRef.current.click()}
                  style={{ flex: 1, fontSize: '14px' }}
                >
                  Upload
                </button>
              </div>
            </div>
          )}

          {photoSrc && (
            <img src={photoSrc} alt="Food" style={s.photoPreview} />
          )}

          {analyzing && (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '16px', fontSize: '14px' }}>
              Analyzing…
            </p>
          )}

          {photoResults && (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
                Tap an item to log it. Adjust values in the form before saving.
              </p>
              {photoResults.map((item, i) => (
                <button key={i} style={s.resultCard} onClick={() => selectPhotoItem(item)}>
                  <div style={s.resultName}>{item.name}</div>
                  <div style={s.resultMacros}>
                    {item.calories} cal · {item.protein}g P
                    {item.fiber > 0 ? ` · ${item.fiber}g F` : ''}
                  </div>
                </button>
              ))}
              <button
                className="btn btn-ghost btn-block btn-sm"
                onClick={() => { setPhotoSrc(null); setPhotoResults(null) }}
                style={{ marginTop: '12px' }}
              >
                Retake Photo
              </button>
            </div>
          )}
        </div>
      )}
    </Sheet>
  )
}

const s = {
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '20px',
    background: 'var(--card)',
    padding: '4px',
    borderRadius: 'var(--radius-sm)',
  },
  tabBtn: {
    flex: 1,
    padding: '8px 4px',
    border: 'none',
    background: 'transparent',
    color: 'var(--muted)',
    fontSize: '12px',
    fontWeight: 700,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: 'var(--surface)',
    color: 'var(--text)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--muted)',
    letterSpacing: '0.3px',
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  error: {
    color: 'var(--red)',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  autoFillNote: {
    fontSize: '12px',
    color: 'var(--accent2)',
    fontWeight: 600,
    textAlign: 'center',
    margin: '-6px 0',
  },
  photoPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 0',
  },
  photoPreview: {
    width: '100%',
    maxHeight: '200px',
    objectFit: 'cover',
    borderRadius: 'var(--radius)',
    marginBottom: '12px',
  },
  resultCard: {
    width: '100%',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '13px 14px',
    textAlign: 'left',
    cursor: 'pointer',
    marginBottom: '8px',
    transition: 'border-color 0.15s',
  },
  resultName: {
    fontSize: '14px',
    fontWeight: 700,
    marginBottom: '4px',
    color: 'var(--text)',
  },
  resultMacros: {
    fontSize: '12px',
    color: 'var(--muted)',
  },
}
