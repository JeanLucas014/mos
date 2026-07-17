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
      if (error) {
        console.error('[LoginPage]', error)
        setError('E-mail ou senha incorretos.')
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) {
        console.error('[LoginPage]', error)
        setError('Não foi possível criar sua conta. Tente novamente.')
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

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) {
      setError('Não foi possível conectar com o Google. Tente novamente.')
    }
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
                mode === m ? 'bg-[#1f1f1f] text-white' : 'text-ink-3 hover:text-white',
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

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-line bg-bg-2 hover:border-[#0EA5E9]/40 transition-colors"
          style={{ cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            Continuar com Google
          </span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>ou</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

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
            className="w-full py-2.5 text-sm text-ink-3 hover:text-white border border-[#1f1f1f] rounded-xl transition-colors hover:border-brand/40 flex items-center justify-center gap-2"
          >
            <Eye size={14} color="var(--text3)" />
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
