import React, { useState, useRef, useEffect, useCallback } from 'react'
import './ChatBot.css'

const CHAT_LIMIT = 5

const SUGGESTIONS = [
  { label: 'What is this?', msg: 'What is this?' },
  { label: 'Lead scores?', msg: 'How do lead scores work?' },
  { label: 'Outreach?', msg: 'How do outreach strategies work?' },
  { label: 'Export CSV', msg: 'How do I export my leads?' },
]

const IconChat = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

const IconSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

const IconBot = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7B8CFF" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
  </svg>
)

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm **LeadBot** — your SmartLead guide. Ask me anything about the app — how to fill in the form, what lead scores mean, or how to export your leads." }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [msgCount, setMsgCount] = useState(0)
  const [limitHit, setLimitHit] = useState(false)
  const [closing, setClosing] = useState(false)
  const historyRef = useRef([])
  const messagesRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    if (messagesRef.current) {
      setTimeout(() => { messagesRef.current.scrollTop = messagesRef.current.scrollHeight }, 40)
    }
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, isTyping, scrollToBottom])

  useEffect(() => {
    if (isOpen && inputRef.current && !limitHit) inputRef.current.focus()
  }, [isOpen, limitHit])

  const toggle = () => {
    if (isOpen) {
      setClosing(true)
      setTimeout(() => { setIsOpen(false); setClosing(false) }, 200)
    } else {
      setIsOpen(true)
    }
  }

  const remaining = Math.max(0, CHAT_LIMIT - msgCount)

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg || isTyping || limitHit) return
    if (msgCount >= CHAT_LIMIT) { setLimitHit(true); return }

    setMsgCount(c => c + 1)
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    historyRef.current.push({ role: 'user', content: msg })
    setIsTyping(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: historyRef.current.slice(-8) }),
        signal: AbortSignal.timeout(7000)
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.reply) throw new Error('chat unavailable')

      historyRef.current.push({ role: 'assistant', content: data.reply })
      setIsTyping(false)
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }])
    } catch {
      setIsTyping(false)
      setMessages(prev => [...prev, {
        role: 'bot',
        text: "Sorry, I'm having trouble connecting. Please try again.",
        blocked: true
      }])
    }

    if (msgCount + 1 >= CHAT_LIMIT) setTimeout(() => setLimitHit(true), 600)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const formatText = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')
  }

  return (
    <>
      <button className="chat-fab" onClick={toggle} aria-label="Open SmartLead Assistant">
        <IconChat />
      </button>

      {isOpen && (
        <div className={`chat-panel ${closing ? 'closing' : ''}`}>
          <div className="chat-header">
            <div className="chat-avatar"><IconBot /></div>
            <div className="chat-header-info">
              <div className="chat-name">LeadBot</div>
              <div className="chat-status"><span className="chat-status-dot" /> SmartLead Assistant</div>
            </div>
            <div className={`chat-limit-badge ${remaining === 0 ? 'out' : remaining <= 2 ? 'warn' : ''}`}>
              {remaining === 0 ? 'Limit reached' : `${remaining} msg${remaining !== 1 ? 's' : ''} left`}
            </div>
          </div>

          <div className="chat-messages" ref={messagesRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <div className="msg-avatar">{m.role === 'bot' ? 'SL' : 'YOU'}</div>
                <div className={`msg-bubble ${m.blocked ? 'blocked' : ''}`} dangerouslySetInnerHTML={{ __html: formatText(m.text) }} />
              </div>
            ))}
            {isTyping && (
              <div className="chat-msg bot">
                <div className="msg-avatar">SL</div>
                <div className="typing-bubble">
                  <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                </div>
              </div>
            )}
          </div>

          {!limitHit && (
            <div className="chat-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="chat-suggestion" onClick={() => sendMessage(s.msg)}>{s.label}</button>
              ))}
            </div>
          )}

          {limitHit ? (
            <div className="chat-limit-wall">
              <div className="limit-wall-title">Message Limit Reached</div>
              <div className="limit-wall-sub">You've used all {CHAT_LIMIT} messages.<br/>Refresh the page to start a new session.</div>
            </div>
          ) : (
            <div className="chat-input-area">
              <textarea
                ref={inputRef}
                className="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about SmartLead..."
                rows="1"
                disabled={limitHit}
              />
              <button className="chat-send" onClick={() => sendMessage()} disabled={!input.trim() || isTyping || limitHit}>
                <IconSend />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
