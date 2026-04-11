const TABS = [
  {
    id: 'train',
    label: 'Train',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5h11M6.5 17.5h11M4 12h16M2 9l2 3-2 3M22 9l-2 3 2 3" />
      </svg>
    ),
  },
  {
    id: 'eat',
    label: 'Eat',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 20h18M7 20V10M12 20V4M17 20v-7" />
      </svg>
    ),
  },
  {
    id: 'admin',
    label: 'Admin',
    adminOnly: true,
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
]

export default function BottomNav({ tab, setTab, isAdmin }) {
  const visibleTabs = isAdmin ? TABS : TABS.filter(t => !t.adminOnly)

  return (
    <nav style={s.nav}>
      {visibleTabs.map(t => {
        const active = tab === t.id
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{ ...s.tab, ...(active ? s.tabActive : {}) }}
          >
            <span style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}>
              {t.icon(active)}
            </span>
            <span style={{ ...s.label, color: active ? 'var(--accent)' : 'var(--muted)' }}>
              {t.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

const s = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
    background: 'var(--surface)',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'flex-start',
    paddingTop: '4px',
    zIndex: 100,
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    padding: '8px 0',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.1s',
  },
  tabActive: {},
  label: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.3px',
  },
}
