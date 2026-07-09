import { useState, type FormEvent } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export function LoginPage() {
  const { session, loading } = useAuth()
  const [mode,       setMode]       = useState<'login' | 'signup'>('login')
  const [name,       setName]       = useState('')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Conta criada! Verifique seu email para confirmar.')
        setMode('login')
        setName('')
        setPassword('')
      }
    }

    setSubmitting(false)
  }

  async function handleDemo() {
    await supabase.auth.signInWithPassword({
      email: 'demo@jlmos.com.br',
      password: 'MosDemo2026',
    })
  }

  const isSignup = mode === 'signup'

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[360px]">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10">
          <img src="/logo.png" alt="MOS" className="h-12 w-auto" />
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border border-[#1f1f1f] rounded-xl overflow-hidden mb-6">
          {(['login', 'signup'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(''); setSuccess('') }}
              className={[
                'flex-1 py-2.5 text-sm font-medium transition-colors',
                mode === m ? 'bg-[#1f1f1f] text-white' : 'text-[#555] hover:text-white',
              ].join(' ')}
            >
              {m === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          ))}
        </div>

        <h1
          className="mb-1"
          style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em', lineHeight: 1.05 }}
        >
          {isSignup ? 'Criar sua conta' : 'Bem-vindo de volta'}
        </h1>
        <p className="text-ink-2 mb-8" style={{ fontSize: 13.5 }}>
          {isSignup ? 'Preencha os dados para se cadastrar.' : 'Entre com sua conta para continuar.'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignup && (
            <div className="flex flex-col gap-1.5">
              <label className="text-ink-2" style={{ fontSize: 12, fontWeight: 500 }}>
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome"
                required
                className="bg-bg-3 border border-line rounded-input px-3 py-2.5 text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
                style={{ fontSize: 13.5 }}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-ink-2" style={{ fontSize: 12, fontWeight: 500 }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jean@exemplo.com"
              required
              className="bg-bg-3 border border-line rounded-input px-3 py-2.5 text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
              style={{ fontSize: 13.5 }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-ink-2" style={{ fontSize: 12, fontWeight: 500 }}>
                Senha
              </label>
              {!isSignup && (
                <Link
                  to="/recuperar-senha"
                  className="text-ink-3 hover:text-brand transition-colors"
                  style={{ fontSize: 11.5 }}
                >
                  Esqueci minha senha
                </Link>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-bg-3 border border-line rounded-input px-3 py-2.5 text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
              style={{ fontSize: 13.5 }}
            />
          </div>

          {error && (
            <p className="text-red-400" style={{ fontSize: 12.5 }}>{error}</p>
          )}
          {success && (
            <p className="text-green-400" style={{ fontSize: 12.5 }}>{success}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 bg-ink text-bg rounded-input font-semibold py-[11px] hover:bg-[#e9e9e9] active:scale-[.97] transition-all disabled:opacity-50"
            style={{ fontSize: 13.5 }}
          >
            {submitting
              ? (isSignup ? 'Criando…' : 'Entrando…')
              : (isSignup ? 'Criar conta' : 'Entrar')}
          </button>
        </form>

        {/* Demo */}
        <div className="mt-4 pt-4 border-t border-[#1f1f1f]">
          <button
            onClick={handleDemo}
            className="w-full py-2.5 text-sm text-[#555] hover:text-white border border-[#1f1f1f] rounded-xl transition-colors hover:border-[#0EA5E9]/40 flex items-center justify-center gap-2"
          >
            <Eye size={14} color="#6b7280" />
            Explorar versão demo
          </button>
          <p className="text-[10px] text-[#444] text-center mt-2">
            Dados fictícios · somente leitura recomendada
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Link to="/privacidade" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>
            Política de Privacidade
          </Link>
          <Link to="/termos" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>
            Termos de Uso
          </Link>
        </div>
      </div>
    </div>
  )
}
