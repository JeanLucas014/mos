import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const REDIRECT_URL = 'https://app.jlmos.com.br/nova-senha'

export function ForgotPasswordPage() {
  const [email, setEmail]       = useState('')
  const [sent, setSent]         = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: REDIRECT_URL,
    })
    setLoading(false)
    if (error) {
      console.error('[ForgotPasswordPage]', error)
      setError('Não foi possível enviar o e-mail de recuperação. Tente novamente.')
    }
    else setSent(true)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[360px]">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10">
          <img src="/logo.png" alt="MOS" className="h-12 w-auto" />
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17, color: '#fff' }}>
            MOS
          </span>
        </div>

        <h1
          className="mb-1"
          style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em', lineHeight: 1.05 }}
        >
          Recuperar senha
        </h1>
        <p className="text-ink-2 mb-8" style={{ fontSize: 13.5 }}>
          Informe seu e-mail e enviaremos um link de redefinição.
        </p>

        {sent ? (
          <div
            className="rounded-xl border border-ok/30 p-5 text-center"
            style={{ background: 'rgba(52,211,153,.07)' }}
          >
            <div className="flex justify-center mb-3"><Mail size={32} className="text-ok" /></div>
            <p className="text-ok font-semibold" style={{ fontSize: 14 }}>
              E-mail enviado!
            </p>
            <p className="text-ink-2 mt-1" style={{ fontSize: 12.5 }}>
              Verifique sua caixa de entrada e clique no link para redefinir sua senha.
            </p>
            <Link
              to="/login"
              className="block mt-4 text-brand text-sm hover:brightness-110 transition-all"
            >
              ← Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-ink-2" style={{ fontSize: 12, fontWeight: 500 }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoFocus
                className="bg-bg-3 border border-line rounded-input px-3 py-2.5 text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
                style={{ fontSize: 13.5 }}
              />
            </div>

            {error && (
              <p className="text-red-400" style={{ fontSize: 12.5 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="mt-1 bg-ink text-bg rounded-input font-semibold py-[11px] hover:bg-[#e9e9e9] active:scale-[.97] transition-all disabled:opacity-50"
              style={{ fontSize: 13.5 }}
            >
              {loading ? 'Enviando…' : 'Enviar link'}
            </button>

            <Link
              to="/login"
              className="text-center text-ink-2 hover:text-ink transition-colors"
              style={{ fontSize: 12.5 }}
            >
              ← Voltar ao login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
