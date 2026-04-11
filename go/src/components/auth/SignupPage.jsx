import { useState } from 'react'
import { signup } from '../../lib/api'

export default function SignupPage({ onAuth, onGoLogin }) {
  const [form, setForm] = useState({ username: '', display_name: '', password: '', invite_code: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleField(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const { username, display_name, password, invite_code } = form
    if (!username.trim() || !display_name.trim() || !password || !invite_code.trim()) {
      setError('All fields are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const user = await signup(username.trim(), display_name.trim(), password, invite_code.trim())
      onAuth(user)
    } catch (err) {
      setError(err.message || 'Signup failed')
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
        <p style={s.sub}>Create your account</p>
        <form onSubmit={handleSubmit} style={s.form}>
          <input
            type="text"
            placeholder="Invite code"
            value={form.invite_code}
            onChange={e => handleField('invite_code', e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            style={{ textAlign: 'center', letterSpacing: '3px', fontWeight: 700 }}
          />
          <input
            type="text"
            placeholder="Display name"
            value={form.display_name}
            onChange={e => handleField('display_name', e.target.value)}
            autoComplete="name"
            style={{ textAlign: 'center' }}
          />
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={e => handleField('username', e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            style={{ textAlign: 'center' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => handleField('password', e.target.value)}
            autoComplete="new-password"
            style={{ textAlign: 'center', letterSpacing: '2px' }}
          />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" className="btn btn-accent btn-block" disabled={loading}>
            {loading ? 'Creating…' : 'Sign Up'}
          </button>
        </form>
        <button style={s.link} onClick={onGoLogin}>
          Already have an account? Log in
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
