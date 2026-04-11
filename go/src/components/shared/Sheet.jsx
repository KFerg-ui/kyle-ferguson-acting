import { useEffect, useRef } from 'react'

export default function Sheet({ open, onClose, title, children, height = '92dvh' }) {
  const sheetRef = useRef(null)

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div style={s.backdrop} onClick={handleBackdrop}>
      <div
        ref={sheetRef}
        style={{ ...s.sheet, maxHeight: height }}
      >
        <div style={s.handle} />
        {title && (
          <div style={s.header}>
            <span style={s.title}>{title}</span>
            <button style={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>
          </div>
        )}
        <div style={s.body}>
          {children}
        </div>
      </div>
    </div>
  )
}

const s = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'flex-end',
  },
  sheet: {
    width: '100%',
    background: 'var(--surface)',
    borderRadius: '20px 20px 0 0',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'slideUp 0.25s ease-out',
  },
  handle: {
    width: '36px',
    height: '4px',
    background: 'var(--border)',
    borderRadius: '99px',
    margin: '12px auto 0',
    flexShrink: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px 12px',
    flexShrink: 0,
    borderBottom: '1px solid var(--border)',
  },
  title: {
    fontSize: '16px',
    fontWeight: 800,
    letterSpacing: '-0.3px',
  },
  closeBtn: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    color: 'var(--muted)',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 700,
  },
  body: {
    overflowY: 'auto',
    flex: 1,
    padding: '20px',
    paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
  },
}

// Add keyframe once
if (typeof document !== 'undefined' && !document.getElementById('sheet-style')) {
  const style = document.createElement('style')
  style.id = 'sheet-style'
  style.textContent = `@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`
  document.head.appendChild(style)
}
