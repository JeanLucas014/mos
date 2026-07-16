import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Eye, EyeOff, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile, useAllProfiles } from '../hooks/useProfile'
import { useUserSettings } from '../hooks/useUserSettings'
import { supabase } from '../lib/supabase'
import { formatDateBR } from '../lib/dates'

/* ── helpers ──────────────────────────────────────────────────── */
function initials(name: string | null | undefined, email: string | null | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase()
  }
  return (email?.[0] ?? '?').toUpperCase()
}

const inputCls =
  'w-full bg-bg border border-line rounded-input px-3 text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors'
const inputH = { minHeight: 44 }

/* ── Change-password modal ────────────────────────────────────── */
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [next,    setNext]    = useState('')
  const [confirm, setConfirm] = useState('')
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPw,  setShowPw]  = useState(false)
  const { user } = useAuth()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (next.length < 6)   { setError('A nova senha deve ter ao menos 6 caracteres.'); return }
    if (next !== confirm)  { setError('As senhas não conferem.'); return }

    setLoading(true)

    /* Re-authenticate with current password first */
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: current,
    })
    if (signInErr) {
      setLoading(false)
      setError('Senha atual incorreta.')
      return
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: next })
    setLoading(false)
    if (updateErr) {
      console.error('[ChangePasswordModal]', updateErr)
      setError('Não foi possível alterar sua senha. Tente novamente.')
    }
    else setSuccess(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.8)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-line p-6"
        style={{ background: 'var(--bg2)' }}
      >
        {success ? (
          <div className="text-center py-6">
            <div className="flex justify-center mb-3"><CheckCircle size={40} className="text-ok" /></div>
            <p className="text-ok font-semibold" style={{ fontSize: 15 }}>Senha alterada com sucesso!</p>
            <button
              onClick={onClose}
              className="mt-5 bg-bg-3 text-ink-2 rounded-input px-6 text-sm hover:text-ink transition-colors"
              style={inputH}
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 17 }}>
                Alterar senha
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-ink-3 hover:text-ink hover:bg-bg-3 rounded-input transition-colors text-lg"
              >×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Current */}
              <div>
                <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
                  Senha atual
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={inputCls + ' pr-10'}
                    style={inputH}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors text-xs"
                  >{showPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                </div>
              </div>

              {/* New */}
              <div>
                <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
                  Nova senha
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={inputCls}
                  style={inputH}
                />
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
                  Confirmar nova senha
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={inputCls}
                  style={inputH}
                />
              </div>

              {error && <p className="text-red-400" style={{ fontSize: 12.5 }}>{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading || !current || !next || !confirm}
                  className="flex-1 bg-brand text-white rounded-input font-semibold text-sm hover:brightness-110 disabled:opacity-40 transition-all"
                  style={inputH}
                >
                  {loading ? 'Salvando…' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-bg-3 text-ink-2 rounded-input text-sm hover:text-ink transition-colors"
                  style={inputH}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Admin: users section ─────────────────────────────────────── */
function AdminSection() {
  const { data: profiles = [], isLoading } = useAllProfiles()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting,    setInviting]    = useState(false)
  const [inviteMsg,   setInviteMsg]   = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleInvite(e: FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteMsg(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ email: inviteEmail.trim() }),
        },
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao convidar.')
      setInviteMsg({ type: 'ok', text: `Convite enviado para ${inviteEmail}` })
      setInviteEmail('')
    } catch (err: unknown) {
      console.error('[AdminSection]', err)
      setInviteMsg({ type: 'err', text: 'Não foi possível enviar o convite. Tente novamente.' })
    }
    setInviting(false)
  }

  return (
    <div
      className="rounded-xl border border-line p-5 space-y-4"
      style={{ background: 'var(--bg2)' }}
    >
      <div className="flex items-center gap-2">
        <Shield size={15} className="text-ink-2" />
        <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 14 }}>
          Administração
        </h3>
      </div>

      {/* User list */}
      <div>
        <p className="text-ink-2 mb-2" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>
          Usuários cadastrados
        </p>
        {isLoading ? (
          <div className="space-y-1.5">
            {[1, 2].map((i) => <div key={i} className="h-8 bg-bg-3 rounded-input animate-pulse" />)}
          </div>
        ) : profiles.length === 0 ? (
          <p className="text-ink-3 text-sm">Nenhum perfil encontrado.</p>
        ) : (
          <div className="space-y-1">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-input bg-bg-3"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--border)', fontSize: 10, fontWeight: 700, color: '#0EA5E9' }}
                >
                  {initials(p.name, undefined)}
                </div>
                <span className="text-ink text-sm flex-1 truncate">{p.name || '—'}</span>
                <span className="text-ink-3" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>
                  {formatDateBR(p.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite form */}
      <div>
        <p className="text-ink-2 mb-2" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>
          Convidar novo usuário
        </p>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="novo@usuario.com"
            className={inputCls + ' flex-1'}
            style={{ minHeight: 40 }}
          />
          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="bg-brand text-white rounded-input px-4 text-sm font-semibold hover:brightness-110 disabled:opacity-40 transition-all flex-shrink-0"
            style={{ minHeight: 40 }}
          >
            {inviting ? '…' : 'Convidar'}
          </button>
        </form>
        {inviteMsg && (
          <p
            className={inviteMsg.type === 'ok' ? 'text-ok' : 'text-red-400'}
            style={{ fontSize: 12, marginTop: 6 }}
          >
            {inviteMsg.text}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────────── */
export function ProfilePage() {
  const { user, signOut } = useAuth()
  const { data: profile, isLoading, updateProfile } = useProfile()
  const { data: settings } = useUserSettings()
  const navigate = useNavigate()

  const [name,         setName]         = useState('')
  const [editingName,  setEditingName]  = useState(false)
  const [showChangePw, setShowChangePw] = useState(false)
  const [savingName,   setSavingName]   = useState(false)
  const [nameMsg,      setNameMsg]      = useState('')

  /* Sync name from profile when loaded */
  const displayName = profile?.name ?? ''
  const email       = user?.email ?? ''
  const isAdmin     = settings?.is_admin ?? false

  function startEditName() {
    setName(displayName)
    setEditingName(true)
    setNameMsg('')
  }

  async function saveName(e: FormEvent) {
    e.preventDefault()
    setSavingName(true)
    await updateProfile.mutateAsync({ name: name.trim() })
    setSavingName(false)
    setEditingName(false)
    setNameMsg('Nome atualizado!')
    setTimeout(() => setNameMsg(''), 3000)
  }

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  /* Avatar color based on email hash */
  const avatarColor = '#0EA5E9'

  return (
    <div className="max-w-lg">
      {/* Page header */}
      <h1
        className="text-2xl lg:text-[30px] mb-1"
        style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}
      >
        Perfil
      </h1>
      <p className="text-ink-2 text-sm mb-7">Suas informações de conta.</p>

      <div className="space-y-4">
        {/* ── Avatar + basic info ── */}
        <div
          className="rounded-xl border border-line p-6 flex items-center gap-5"
          style={{ background: 'var(--bg2)' }}
        >
          {/* Avatar */}
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full text-white"
            style={{
              width: 72, height: 72,
              background: avatarColor,
              fontFamily: 'Sora, sans-serif',
              fontWeight: 800,
              fontSize: 28,
              letterSpacing: '-0.02em',
            }}
          >
            {initials(displayName, email)}
          </div>

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="space-y-1.5">
                <div className="h-4 bg-bg-3 rounded w-32 animate-pulse" />
                <div className="h-3 bg-bg-3 rounded w-44 animate-pulse" />
              </div>
            ) : (
              <>
                <div
                  className="text-ink font-bold truncate"
                  style={{ fontFamily: 'Sora, sans-serif', fontSize: 17 }}
                >
                  {displayName || 'Sem nome'}
                </div>
                <div className="text-ink-2 text-sm truncate">{email}</div>
              </>
            )}
          </div>
        </div>

        {/* ── Name field ── */}
        <div className="rounded-xl border border-line p-5 space-y-3" style={{ background: 'var(--bg2)' }}>
          <p className="text-ink-2" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Informações pessoais
          </p>

          {/* Name */}
          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
              Nome
            </label>
            {editingName ? (
              <form onSubmit={saveName} className="flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className={inputCls + ' flex-1'}
                  style={{ minHeight: 40 }}
                />
                <button
                  type="submit"
                  disabled={savingName}
                  className="bg-brand text-white rounded-input px-4 text-sm font-semibold hover:brightness-110 disabled:opacity-40 transition-all"
                  style={{ minHeight: 40 }}
                >
                  {savingName ? '…' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  className="bg-bg-3 text-ink-2 rounded-input px-3 text-sm hover:text-ink transition-colors"
                  style={{ minHeight: 40 }}
                >
                  ×
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className="flex-1 bg-bg-3 border border-line rounded-input px-3 flex items-center text-ink text-sm"
                  style={{ minHeight: 40 }}
                >
                  {displayName || <span className="text-ink-3">Não definido</span>}
                </div>
                <button
                  onClick={startEditName}
                  className="bg-bg-3 border border-line text-ink-2 rounded-input px-4 text-sm hover:text-ink hover:border-white/20 transition-colors flex-shrink-0"
                  style={{ minHeight: 40 }}
                >
                  Editar
                </button>
              </div>
            )}
            {nameMsg && <p className="text-ok text-xs mt-1">{nameMsg}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
              E-mail
            </label>
            <div
              className="flex items-center gap-2 bg-bg-3 border border-line rounded-input px-3 text-ink-2 text-sm"
              style={{ minHeight: 40 }}
            >
              <span className="flex-1 truncate">{email}</span>
              <span
                style={{
                  fontSize: 9, fontWeight: 700, fontFamily: 'Manrope, sans-serif',
                  background: 'rgba(255,255,255,.06)', color: 'var(--text3)',
                  padding: '2px 6px', borderRadius: 5, letterSpacing: '.05em', flexShrink: 0,
                }}
              >
                SOMENTE LEITURA
              </span>
            </div>
          </div>
        </div>

        {/* ── Security ── */}
        <div className="rounded-xl border border-line p-5 space-y-3" style={{ background: 'var(--bg2)' }}>
          <p className="text-ink-2" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Segurança
          </p>
          <button
            onClick={() => setShowChangePw(true)}
            className="flex items-center gap-2.5 w-full px-4 rounded-input border border-line text-ink-2 hover:text-ink hover:border-white/20 hover:bg-bg-3 transition-colors text-sm text-left"
            style={{ minHeight: 44 }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <rect x="2.5" y="7" width="11" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
              <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="8" cy="10.3" r="1" fill="currentColor" />
            </svg>
            Alterar senha
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto">
              <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Admin section ── */}
        {isAdmin && <AdminSection />}

        {/* ── Logout ── */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-input border border-red-400/30 text-red-400 hover:bg-red-400/08 transition-colors text-sm font-semibold"
          style={{ minHeight: 48 }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M9 3L4 8L9 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 8h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Sair da conta
        </button>
      </div>

      {/* Modals */}
      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </div>
  )
}
