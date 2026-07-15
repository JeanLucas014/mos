import { useState } from 'react'
import { supabase } from '@/lib/supabase'

/* ══════════════════════════════════════════════════════════════════
   SUPORTE TAB
══════════════════════════════════════════════════════════════════ */
export function SuporteTab() {
  const [tipo, setTipo] = useState<'Sugestão' | 'Problema' | 'Bug'>('Sugestão')
  const [assunto, setAssunto] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!mensagem.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.functions.invoke('send-support', {
        body: { tipo, assunto, mensagem },
      })
      if (error) throw error
      setSent(true)
      setAssunto('')
      setMensagem('')
    } catch (e: unknown) {
      console.error('[SuporteTab]', e)
      setError('Não foi possível enviar sua mensagem. Tente novamente.')
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center py-8">
        <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
          Mensagem enviada
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
          Obrigado pelo contato. Responderei em breve.
        </div>
        <button
          onClick={() => setSent(false)}
          style={{ fontSize: 13, color: '#0ea5e9', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Enviar outra mensagem
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p style={{ fontSize: 13, color: 'var(--text3)', margin: 0 }}>
        Dúvidas, sugestões ou problemas? Envie uma mensagem.
      </p>

      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 8 }}>
          Tipo
        </label>
        <div className="flex gap-2">
          {(['Sugestão', 'Problema', 'Bug'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 10,
                border: `1px solid ${tipo === t ? '#0ea5e9' : 'var(--border)'}`,
                background: tipo === t ? '#0ea5e913' : 'transparent',
                color: tipo === t ? '#0ea5e9' : 'var(--text3)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 8 }}>
          Assunto (opcional)
        </label>
        <input
          value={assunto}
          onChange={e => setAssunto(e.target.value)}
          placeholder="Ex: Sugestão para o módulo de tarefas"
          className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm outline-none focus:border-brand"
          style={{ color: 'var(--text)', fontFamily: 'inherit' }}
        />
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 8 }}>
          Mensagem
        </label>
        <textarea
          value={mensagem}
          onChange={e => setMensagem(e.target.value)}
          placeholder="Descreva sua sugestão, problema ou bug..."
          rows={5}
          className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-brand resize-none"
          style={{ color: 'var(--text)', fontFamily: 'inherit' }}
        />
      </div>

      {error && (
        <div style={{ fontSize: 13, color: '#f87171' }}>{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !mensagem.trim()}
        className="rounded-xl py-3 text-sm font-semibold transition-colors"
        style={{
          background: loading || !mensagem.trim() ? 'var(--bg3)' : '#0ea5e9',
          color: loading || !mensagem.trim() ? 'var(--text3)' : '#0a0a0a',
          border: 'none', cursor: loading || !mensagem.trim() ? 'default' : 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {loading ? 'Enviando...' : 'Enviar mensagem'}
      </button>
    </div>
  )
}
