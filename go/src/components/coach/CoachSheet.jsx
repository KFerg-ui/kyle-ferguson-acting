import { useState, useRef, useEffect } from 'react'
import { askCoach } from '../../lib/api'
import { QUICK_QS } from '../../lib/training-data'
import Sheet from '../shared/Sheet'

export default function CoachSheet({ open, onClose, ctx = {} }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        _local: true,
        content: ctx.context === 'nutrition'
          ? `I can see you've logged ${ctx.totals?.calories || 0} cal and ${ctx.totals?.protein || 0}g protein today. What do you want to know?`
          : ctx.day
          ? `You're on ${ctx.day}, Week ${ctx.week}. What's on your mind?`
          : 'Ask me anything about your training or nutrition.',
      }])
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(text) {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')

    // Only include actual conversation turns (not the local greeting)
    const history = messages.filter(m => m._local !== true)
    const next = [...messages, { role: 'user', content: msg }]
    const apiMessages = [...history.filter(m => m._local !== true), { role: 'user', content: msg }]
    setMessages(next)
    setLoading(true)

    try {
      const reply = await askCoach(apiMessages, ctx)
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages([...next, { role: 'assistant', content: 'Something went wrong. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setMessages([])
    onClose()
  }

  return (
    <Sheet open={open} onClose={handleClose} title="Coach" height="88dvh">
      {/* Quick questions */}
      {messages.length <= 1 && (
        <div style={s.quickWrap}>
          {QUICK_QS.map(q => (
            <button key={q} style={s.quickBtn} onClick={() => handleSend(q)}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={s.messages}>
        {messages.map((m, i) => (
          <div key={i} style={{ ...s.bubble, ...(m.role === 'user' ? s.bubbleUser : s.bubbleAI) }}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{ ...s.bubble, ...s.bubbleAI, color: 'var(--muted)' }}>…</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={s.inputRow}>
        <input
          type="text"
          placeholder="Ask anything…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          style={{ ...s.chatInput }}
          disabled={loading}
        />
        <button
          className="btn btn-accent"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          style={{ flexShrink: 0, padding: '12px 16px' }}
        >
          Send
        </button>
      </div>
    </Sheet>
  )
}

const s = {
  quickWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  },
  quickBtn: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '11px 14px',
    textAlign: 'left',
    fontSize: '13px',
    color: 'var(--text)',
    cursor: 'pointer',
    lineHeight: 1.4,
  },
  messages: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
  },
  bubble: {
    padding: '12px 14px',
    borderRadius: 'var(--radius)',
    fontSize: '14px',
    lineHeight: 1.6,
    maxWidth: '88%',
  },
  bubbleUser: {
    background: 'var(--accent)',
    color: '#000',
    alignSelf: 'flex-end',
    borderRadius: '14px 14px 4px 14px',
    fontWeight: 600,
  },
  bubbleAI: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    alignSelf: 'flex-start',
    borderRadius: '4px 14px 14px 14px',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    position: 'sticky',
    bottom: 0,
    background: 'var(--surface)',
    paddingTop: '12px',
  },
  chatInput: {
    flex: 1,
    textAlign: 'left',
    padding: '12px 14px',
    fontSize: '15px',
  },
}
