export default function CoachFAB({ onClick }) {
  return (
    <button onClick={onClick} style={s.fab} aria-label="Open Coach">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.06L2 22l4.94-1.38A9.955 9.955 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
        <path d="M8 10h.01M12 10h.01M16 10h.01" strokeWidth="2.5" />
      </svg>
    </button>
  )
}

const s = {
  fab: {
    position: 'fixed',
    bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
    right: '16px',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    color: 'var(--muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 99,
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    transition: 'all 0.15s',
  },
}
