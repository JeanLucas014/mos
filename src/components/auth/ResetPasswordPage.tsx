import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { CheckCircle, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export function ResetPasswordPage() {
  const [ready,    setReady]    = useState(false)
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [showPw,   setShowPw]   = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    /* Supabase JS v2 auto-reads the hash on page load.
       We listen for PASSWORD_RECOVERY (or SIGNED_IN via recovery link). */
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
      if (event === 'SIGNED_IN' && session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não conferem.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) setError(error.message)
    else {
      setSuccess(true)
      setTimeout(() => navigate('/'), 2500)
    }
  }

  /* ── Loading while waiting for recovery session ── */
  if (!ready) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center">
          <div
            className="inline-block w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin mb-4"
          />
          <p className="text-ink-2 text-sm">Verificando link de recuperação…</p>
        </div>
      </div>
    )
  }

  /* ── Success ── */
  if (success) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="w-full max-w-[360px] text-center">
          <div className="flex justify-center mb-4"><CheckCircle size={40} className="text-ok" /></div>
          <h2
            className="mb-2"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 22 }}
          >
            Senha alterada!
          </h2>
          <p className="text-ink-2 text-sm">Redirecionando para o dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[360px]">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10">
          <img src="/logo.png" alt="MOS" className="h-12 w-auto" />
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17, color: '#fff' }}>MOS</span>
        </div>

        <h1
          className="mb-1"
          style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em', lineHeight: 1.05 }}
        >
          Nova senha
        </h1>
        <p className="text-ink-2 mb-8" style={{ fontSize: 13.5 }}>
          Escolha uma senha segura para sua conta.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* New password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-ink-2" style={{ fontSize: 12, fontWeight: 500 }}>
              Nova senha
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                className="w-full bg-bg-3 border border-line rounded-input px-3 py-2.5 pr-10 text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
                style={{ fontSize: 13.5 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors"
                style={{ fontSize: 12 }}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div className="flex flex-col gap-1.5">
            <label className="text-ink-2" style={{ fontSize: 12, fontWeight: 500 }}>
              Confirmar senha
            </label>
            <input
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-bg-3 border border-line rounded-input px-3 py-2.5 text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
              style={{ fontSize: 13.5 }}
            />
          </div>

          {error && <p className="text-red-400" style={{ fontSize: 12.5 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="mt-1 bg-ink text-bg rounded-input font-semibold py-[11px] hover:bg-[#e9e9e9] active:scale-[.97] transition-all disabled:opacity-50"
            style={{ fontSize: 13.5 }}
          >
            {loading ? 'Salvando…' : 'Definir nova senha'}
          </button>

          <Link
            to="/login"
            className="text-center text-ink-2 hover:text-ink transition-colors"
            style={{ fontSize: 12.5 }}
          >
            ← Voltar ao login
          </Link>
        </form>
      </div>
    </div>
  )
}
