import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export function LoginPage() {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[360px]">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10">
          <div
            className="w-9 h-9 rounded-[9px] bg-brand flex items-center justify-center flex-shrink-0"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 14, color: '#fff' }}
          >
            M
          </div>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17, color: '#fff' }}>
            MOS
          </span>
        </div>

        <h1
          className="mb-1"
          style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em', lineHeight: 1.05 }}
        >
          Bem-vindo de volta
        </h1>
        <p className="text-ink-2 mb-8" style={{ fontSize: 13.5 }}>
          Entre com sua conta para continuar.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-ink-2" style={{ fontSize: 12, fontWeight: 500 }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jean@exemplo.com"
              required
              className="bg-bg-3 border border-line rounded-input px-3 py-2.5 text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
              style={{ fontSize: 13.5 }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-ink-2" style={{ fontSize: 12, fontWeight: 500 }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-bg-3 border border-line rounded-input px-3 py-2.5 text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
              style={{ fontSize: 13.5 }}
            />
          </div>

          {error && (
            <p className="text-red-400" style={{ fontSize: 12.5 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 bg-ink text-bg rounded-input font-semibold py-[11px] hover:bg-[#e9e9e9] active:scale-[.97] transition-all disabled:opacity-50"
            style={{ fontSize: 13.5 }}
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
