import { useState } from 'react'
import { checkAuth } from '../../lib/api'

export default function LockScreen({ onAuth }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!pw.trim()) return
    setLoading(true)
    setError('')
    // Optimistically set auth and let API calls fail if wrong
    // But first do a quick check
    const ok = await checkAuth(pw.trim()).catch(() => true) // if network error, let through
    setLoading(false)
    if (ok) {
      onAuth(pw.trim())
    } else {
      setError('Wrong password')
      setPw('')
    }
  }

  return (
    <div style={s.screen}>
      <div style={s.inner}>
        <div style={s.logo}>
          GYM<span style={{ color: 'var(--accent)' }}>SHRED</span>
        </div>
        <p style={s.sub}>Enter your password to continue</p>
        <form onSubmit={handleSubmit} style={s.form}>
          <input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError('') }}
            autoFocus
            autoComplete="current-password"
            style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '18px' }}
          />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" className="btn btn-accent btn-block" disabled={loading}>
            {loading ? 'Checking…' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  )
}

const s = {
  screen: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: '24px',
  },
  inner: {
    width: '100%',
    maxWidth: '320px',
    textAlign: 'center',
  },
  logo: {
    fontSize: '28px',
    fontWeight: 900,
    letterSpacing: '-1px',
    marginBottom: '8px',
  },
  sub: {
    color: 'var(--muted)',
    fontSize: '14px',
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  error: {
    color: 'var(--red)',
    fontSize: '13px',
    fontWeight: 600,
  },
}
