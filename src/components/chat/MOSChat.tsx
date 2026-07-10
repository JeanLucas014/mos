import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Como estão minhas finanças esse mês?',
  'Quais tarefas estão atrasadas?',
  'O que tenho na agenda hoje?',
  'Como está meu score de vida?',
  'Hábitos pendentes hoje',
]

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 14px', background: 'var(--bg)', borderRadius: 12, width: 'fit-content' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: 'var(--text3)',
          animation: 'mos-bounce 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  )
}

export function MOSChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  // CMD+J shortcut
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        setOpen(p => !p)
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])

  const send = useCallback(async (text?: string) => {
    const userMsg = (text ?? input).trim()
    if (!userMsg || loading) return
    setInput('')

    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('mos-chat', {
        body: { messages: newMessages },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.detail ?? data.error)
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch (err: any) {
      setMessages([...newMessages, {
        role: 'assistant',
        content: `[DEBUG] ${err?.message ?? String(err)}`,
      }])
    }
    setLoading(false)
  }, [input, messages, loading])

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: 'fixed', bottom: 84, right: 24,
            width: 360, height: 520,
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            display: 'flex', flexDirection: 'column',
            zIndex: 999,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageCircle size={15} color="#ffffff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>MOS Assistente</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Conectado aos seus dados</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, display: 'flex' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <div>
                <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 14 }}>
                  Olá, Jean. O que posso fazer por você?
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Sugestões
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)} style={{
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 10, padding: '8px 12px', textAlign: 'left',
                      cursor: 'pointer', fontSize: 12, color: 'var(--text2)',
                      fontFamily: 'inherit', transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#0ea5e9')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%', padding: '10px 14px', borderRadius: 12,
                  fontSize: 13, lineHeight: 1.65,
                  background: m.role === 'user' ? '#0ea5e9' : 'var(--bg)',
                  color: m.role === 'user' ? '#ffffff' : 'var(--text)',
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <TypingDots />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--bg)', borderRadius: 12, padding: '6px 6px 6px 14px', border: '1px solid var(--border)' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Pergunte algo ou peça uma ação..."
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none',
                  background: input.trim() && !loading ? '#0ea5e9' : 'var(--border)',
                  cursor: input.trim() && !loading ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.15s',
                }}
              >
                <Send size={13} color={input.trim() && !loading ? '#ffffff' : 'var(--text3)'} />
              </button>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', marginTop: 5 }}>
              CMD+J para abrir · Enter para enviar
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 50, height: 50, borderRadius: '50%',
          background: open ? 'var(--bg2)' : '#0ea5e9',
          border: open ? '1px solid var(--border)' : 'none',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open ? 'none' : '0 4px 20px rgba(14,165,233,0.35)',
          transition: 'all 0.2s',
          zIndex: 1000,
        }}
      >
        {open
          ? <X size={18} color="var(--text2)" />
          : <MessageCircle size={20} color="#ffffff" />
        }
      </button>

      <style>{`
        @keyframes mos-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  )
}
