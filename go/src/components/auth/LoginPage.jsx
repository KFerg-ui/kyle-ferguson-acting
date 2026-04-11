import { useState } from 'react'
import { login } from '../../lib/api'

export default function LoginPage({ onAuth, onGoSignup }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      const user = await login(username.trim(), password)
      onAuth(user)
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.screen}>
      <div style={s.inner}>
        <div style={s.logo}>
          GYM<span style={{ color: 'var(--accent)' }}>SHRED</span>
        </div>
        <p style={s.sub}>Log in to continue</p>
        <form onSubmit={handleSubmit} style={s.form}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => { setUsername(e.target.value); setError('') }}
            autoComplete="username"
            autoCapitalize="none"
            style={{ textAlign: 'center' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            autoComplete="current-password"
            style={{ textAlign: 'center', letterSpacing: '2px' }}
          />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" className="btn btn-accent btn-block" disabled={loading}>
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>
        <button style={s.link} onClick={onGoSignup}>
          Have an invite code? Sign up
        </button>
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
  link: {
    background: 'none',
    border: 'none',
    color: 'var(--accent2)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '20px',
    padding: '8px',
  },
}
