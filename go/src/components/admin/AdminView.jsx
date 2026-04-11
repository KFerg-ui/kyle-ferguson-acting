import { useState, useEffect } from 'react'
import { adminGetUsers, adminGetInviteCodes, adminCreateInviteCodes } from '../../lib/api'

export default function AdminView() {
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    Promise.all([adminGetUsers(), adminGetInviteCodes()])
      .then(([u, c]) => { setUsers(u); setCodes(c) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleGenerate() {
    try {
      const { codes: newCodes } = await adminCreateInviteCodes(3)
      const fresh = await adminGetInviteCodes()
      setCodes(fresh)
    } catch {}
  }

  const appUrl = typeof location !== 'undefined'
    ? `${location.origin}/go/`
    : 'https://creative.kyleferguson.studio/go/'

  function copyCode(code) {
    const text = `Join me on GymShred — AI-powered training + nutrition tracker.\n\n${appUrl}\nInvite code: ${code}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(code)
      setTimeout(() => setCopied(null), 2000)
    }).catch(() => {})
  }

  if (loading) return <div className="view" style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>

  return (
    <div className="view" style={{ padding: '16px 16px 100px' }}>
      <div style={s.header}>
        <h1 style={s.title}>Admin</h1>
      </div>

      {/* Tab selector */}
      <div style={s.tabs}>
        <button onClick={() => setTab('users')} style={{ ...s.tabBtn, ...(tab === 'users' ? s.tabActive : {}) }}>
          Users ({users.length})
        </button>
        <button onClick={() => setTab('codes')} style={{ ...s.tabBtn, ...(tab === 'codes' ? s.tabActive : {}) }}>
          Invite Codes
        </button>
      </div>

      {/* Users */}
      {tab === 'users' && (
        <div style={s.list}>
          {users.map(u => (
            <div key={u.id} style={s.card}>
              <div style={s.cardMain}>
                <div style={s.name}>
                  {u.display_name}
                  {u.role === 'admin' && <span style={s.badge}>admin</span>}
                </div>
                <div style={s.meta}>@{u.username}</div>
                <div style={s.meta}>
                  {u.onboarding_complete ? (
                    <span style={{ color: 'var(--green)' }}>{u.experience || 'onboarded'} · {u.days_per_week || '?'}d/wk</span>
                  ) : (
                    <span style={{ color: 'var(--orange)' }}>onboarding pending</span>
                  )}
                </div>
              </div>
              <div style={s.cardDate}>
                {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Codes */}
      {tab === 'codes' && (
        <div>
          <button className="btn btn-accent btn-block" onClick={handleGenerate} style={{ marginBottom: '16px' }}>
            Generate 3 Codes
          </button>
          <div style={s.list}>
            {codes.map(c => (
              <div key={c.id} style={s.codeCard}>
                <div style={s.codeMain}>
                  <span style={{ ...s.codeText, color: c.used_by ? 'var(--muted)' : 'var(--accent)', textDecoration: c.used_by ? 'line-through' : 'none' }}>
                    {c.code}
                  </span>
                  {c.used_by_username && (
                    <span style={s.codeMeta}>used by @{c.used_by_username}</span>
                  )}
                </div>
                {!c.used_by && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => copyCode(c.code)}
                    style={{ fontSize: '11px', flexShrink: 0 }}
                  >
                    {copied === c.code ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  header: {
    marginBottom: '16px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 900,
    letterSpacing: '-0.5px',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '16px',
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
  },
  tabActive: {
    background: 'var(--surface)',
    color: 'var(--text)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 14px',
    gap: '10px',
  },
  cardMain: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: '14px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  badge: {
    fontSize: '10px',
    fontWeight: 800,
    color: 'var(--accent)',
    background: 'rgba(232,255,71,0.12)',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  meta: {
    fontSize: '12px',
    color: 'var(--muted)',
    marginTop: '2px',
  },
  cardDate: {
    fontSize: '11px',
    color: 'var(--muted)',
    fontWeight: 600,
    flexShrink: 0,
  },
  codeCard: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 14px',
    gap: '10px',
  },
  codeMain: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  codeText: {
    fontSize: '15px',
    fontWeight: 800,
    letterSpacing: '2px',
    fontFamily: 'monospace',
  },
  codeMeta: {
    fontSize: '11px',
    color: 'var(--muted)',
  },
}
