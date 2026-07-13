import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Eye, EyeOff, Shield, Monitor, Moon, Sun, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile, useAllProfiles } from '@/hooks/useProfile'
import { useUserSettings } from '@/hooks/useUserSettings'
import { MODULES } from '@/lib/modules'
import { supabase } from '@/lib/supabase'
import { useNotificationPrefs } from '@/hooks/useNotifications'
import type { NotificationPrefs } from '@/hooks/useNotifications'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeOption } from '@/hooks/useTheme'

const ADMIN_EMAIL = 'jl.jean13@gmail.com'

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-[#0EA5E9]/15 text-[#0EA5E9] text-xs font-bold flex items-center justify-center shrink-0">
        {n}
      </div>
      <p className="text-sm text-[#ccc] leading-relaxed pt-0.5">{text}</p>
    </div>
  )
}

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

/* ── Section label ────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-ink-2" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>
      {children}
    </p>
  )
}

/* ── Toggle switch ────────────────────────────────────────────── */
function Toggle({ on, disabled, onClick }: { on: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative shrink-0 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        width: 44, height: 26, borderRadius: 999,
        background: on ? '#0EA5E9' : '#222222',
        border: '1px solid',
        borderColor: on ? '#0EA5E9' : '#2a2a2a',
      }}
    >
      <span
        className="absolute top-1/2 rounded-full bg-white shadow-md transition-all duration-200"
        style={{ width: 18, height: 18, left: on ? 22 : 4, transform: 'translateY(-50%)' }}
      />
    </button>
  )
}

/* ══════════════════════════════════════════════════════════════════
   CHANGE PASSWORD MODAL
══════════════════════════════════════════════════════════════════ */
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
    if (next.length < 6)  { setError('A nova senha deve ter ao menos 6 caracteres.'); return }
    if (next !== confirm) { setError('As senhas não conferem.'); return }
    setLoading(true)
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user!.email!, password: current })
    if (signInErr) { setLoading(false); setError('Senha atual incorreta.'); return }
    const { error: updateErr } = await supabase.auth.updateUser({ password: next })
    setLoading(false)
    if (updateErr) setError(updateErr.message)
    else setSuccess(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.8)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-line p-6" style={{ background: 'var(--bg2)' }}>
        {success ? (
          <div className="text-center py-6">
            <div className="flex justify-center mb-3"><CheckCircle size={40} className="text-ok" /></div>
            <p className="text-ok font-semibold" style={{ fontSize: 15 }}>Senha alterada com sucesso!</p>
            <button onClick={onClose} className="mt-5 bg-bg-3 text-ink-2 rounded-input px-6 text-sm hover:text-ink transition-colors" style={inputH}>Fechar</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 17 }}>Alterar senha</h3>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-ink-3 hover:text-ink hover:bg-bg-3 rounded-input transition-colors text-lg">×</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Senha atual</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" required className={inputCls + ' pr-10'} style={inputH} />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Nova senha</label>
                <input type={showPw ? 'text' : 'password'} value={next} onChange={(e) => setNext(e.target.value)} placeholder="••••••••" required className={inputCls} style={inputH} />
              </div>
              <div>
                <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Confirmar nova senha</label>
                <input type={showPw ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required className={inputCls} style={inputH} />
              </div>
              {error && <p className="text-red-400" style={{ fontSize: 12.5 }}>{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading || !current || !next || !confirm} className="flex-1 bg-brand text-white rounded-input font-semibold text-sm hover:brightness-110 disabled:opacity-40 transition-all" style={inputH}>{loading ? 'Salvando…' : 'Salvar'}</button>
                <button type="button" onClick={onClose} className="flex-1 bg-bg-3 text-ink-2 rounded-input text-sm hover:text-ink transition-colors" style={inputH}>Cancelar</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   ADMIN SECTION
══════════════════════════════════════════════════════════════════ */
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
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao convidar.')
      setInviteMsg({ type: 'ok', text: `Convite enviado para ${inviteEmail}` })
      setInviteEmail('')
    } catch (err: unknown) {
      setInviteMsg({ type: 'err', text: (err as Error).message })
    }
    setInviting(false)
  }

  return (
    <div className="rounded-xl border border-line p-5 space-y-4" style={{ background: 'var(--bg2)' }}>
      <div className="flex items-center gap-2">
        <Shield size={15} className="text-ink-2" />
        <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 14 }}>Administração</h3>
      </div>
      <div>
        <SectionLabel>Usuários cadastrados</SectionLabel>
        <div className="mt-2">
          {isLoading ? (
            <div className="space-y-1.5">{[1, 2].map(i => <div key={i} className="h-8 bg-bg-3 rounded-input animate-pulse" />)}</div>
          ) : profiles.length === 0 ? (
            <p className="text-ink-3 text-sm">Nenhum perfil encontrado.</p>
          ) : (
            <div className="space-y-1">
              {profiles.map(p => (
                <div key={p.id} className="flex items-center gap-2.5 px-3 py-2 rounded-input bg-bg-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--border)', fontSize: 10, fontWeight: 700, color: '#0EA5E9' }}>
                    {initials(p.name, undefined)}
                  </div>
                  <span className="text-ink text-sm flex-1 truncate">{p.name || '—'}</span>
                  <span className="text-ink-3" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div>
        <SectionLabel>Convidar novo usuário</SectionLabel>
        <form onSubmit={handleInvite} className="flex gap-2 mt-2">
          <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="novo@usuario.com" className={inputCls + ' flex-1'} style={{ minHeight: 40 }} />
          <button type="submit" disabled={inviting || !inviteEmail.trim()} className="bg-brand text-white rounded-input px-4 text-sm font-semibold hover:brightness-110 disabled:opacity-40 transition-all flex-shrink-0" style={{ minHeight: 40 }}>
            {inviting ? '…' : 'Convidar'}
          </button>
        </form>
        {inviteMsg && <p className={inviteMsg.type === 'ok' ? 'text-ok' : 'text-red-400'} style={{ fontSize: 12, marginTop: 6 }}>{inviteMsg.text}</p>}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   SUPORTE TAB
══════════════════════════════════════════════════════════════════ */
function SuporteTab() {
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
      setError(e instanceof Error ? e.message : 'Erro ao enviar')
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

/* ══════════════════════════════════════════════════════════════════
   TWO FACTOR SECTION
══════════════════════════════════════════════════════════════════ */
function TwoFactorSection() {
  const [factors, setFactors] = useState<Array<{ id: string; status: string }>>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<'totp' | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => { loadFactors() }, [])

  async function loadFactors() {
    setLoading(true)
    const { data } = await supabase.auth.mfa.listFactors()
    setFactors(data?.totp ?? [])
    setLoading(false)
  }

  async function startEnrollTotp() {
    setError(null)
    setSuccess(null)
    setEnrolling('totp')
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error || !data) { setError(error?.message ?? 'Erro ao iniciar configuração'); setEnrolling(null); return }
    setQrCode(data.totp.qr_code)
    setSecret(data.totp.secret)
    setFactorId(data.id)
  }

  async function verifyTotp() {
    if (!factorId || verifyCode.length !== 6) return
    setError(null)
    const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeErr || !challengeData) { setError(challengeErr?.message ?? 'Erro'); return }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: verifyCode,
    })
    if (verifyErr) { setError('Código inválido. Tente novamente.'); return }

    setSuccess('Autenticador configurado com sucesso.')
    setEnrolling(null)
    setQrCode(null)
    setVerifyCode('')
    loadFactors()
  }

  async function unenroll(id: string) {
    setError(null)
    setSuccess(null)
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id })
    if (error) { setError(error.message); return }
    setSuccess('Autenticador removido.')
    loadFactors()
  }

  const activeFactor = factors.find(f => f.status === 'verified')

  return (
    <div className="flex flex-col gap-4 mt-2">
      <SectionLabel>Dupla verificação (2FA)</SectionLabel>
      <p className="text-ink-3 text-xs -mt-2">Adicione uma camada extra de segurança exigindo um código do app autenticador ao entrar.</p>

      {loading && <div style={{ fontSize: 13, color: 'var(--text3)' }}>Carregando...</div>}

      {!loading && !enrolling && (
        <>
          {activeFactor ? (
            <div className="rounded-xl border border-line bg-bg-2 p-4 flex items-center justify-between">
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                  App autenticador
                </div>
                <div style={{ fontSize: 12, color: '#22c55e' }}>Ativo</div>
              </div>
              <button
                onClick={() => unenroll(activeFactor.id)}
                style={{ fontSize: 12, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Remover
              </button>
            </div>
          ) : (
            <button
              onClick={startEnrollTotp}
              className="rounded-xl border border-line bg-bg-2 p-4 text-left transition-colors hover:border-brand w-full"
              style={{ cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
                App autenticador
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                Google Authenticator, Authy ou similar
              </div>
            </button>
          )}
        </>
      )}

      {enrolling === 'totp' && qrCode && (
        <div className="flex flex-col gap-4">
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>
            Escaneie o QR Code com seu app autenticador:
          </p>
          <div className="flex justify-center">
            <img src={qrCode} alt="QR Code 2FA" style={{ width: 180, height: 180, borderRadius: 12 }} />
          </div>
          {secret && (
            <div className="rounded-xl border border-line bg-bg p-3 text-center">
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>
                Ou insira o código manualmente:
              </div>
              <div style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--text)', letterSpacing: '0.1em' }}>
                {secret}
              </div>
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 8 }}>
              Código de verificação
            </label>
            <input
              value={verifyCode}
              onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-center outline-none focus:border-brand"
              style={{ fontSize: 24, fontFamily: 'monospace', letterSpacing: '0.3em', color: 'var(--text)' }}
            />
          </div>
          {error && <div style={{ fontSize: 13, color: '#f87171' }}>{error}</div>}
          <div className="flex gap-2">
            <button
              onClick={verifyTotp}
              disabled={verifyCode.length !== 6}
              className="flex-1 rounded-xl py-3 text-sm font-semibold"
              style={{
                background: verifyCode.length === 6 ? '#0ea5e9' : 'var(--bg3)',
                color: verifyCode.length === 6 ? '#0a0a0a' : 'var(--text3)',
                border: 'none', cursor: verifyCode.length === 6 ? 'pointer' : 'default',
                fontFamily: 'inherit',
              }}
            >
              Verificar e ativar
            </button>
            <button
              onClick={() => { setEnrolling(null); setQrCode(null); setVerifyCode('') }}
              className="rounded-xl px-4 py-3 text-sm border border-line"
              style={{ background: 'transparent', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {success && <div style={{ fontSize: 13, color: '#22c55e' }}>{success}</div>}
      {!enrolling && error && <div style={{ fontSize: 13, color: '#f87171' }}>{error}</div>}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   APARÊNCIA TAB
══════════════════════════════════════════════════════════════════ */
function AparenciaTab() {
  const { theme, setTheme } = useTheme()

  const options: { value: ThemeOption; label: string; desc: string; Icon: React.ElementType }[] = [
    { value: 'system', label: 'Automático', desc: 'Segue a preferência do seu sistema operacional', Icon: Monitor },
    { value: 'dark',   label: 'Escuro',     desc: 'Interface escura sempre ativa',                  Icon: Moon    },
    { value: 'light',  label: 'Claro',      desc: 'Interface clara sempre ativa',                   Icon: Sun     },
  ]

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
        Escolha como o MOS deve aparecer para você.
      </p>
      <div className="space-y-2">
        {options.map(opt => {
          const active = theme === opt.value
          const { Icon } = opt
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className="w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
              style={{
                background: active ? 'var(--bg2)' : 'transparent',
                borderColor: active ? 'var(--blue)' : 'var(--border)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Icon size={16} color={active ? '#0EA5E9' : 'var(--text3)'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: active ? 'var(--text)' : 'var(--text3)' }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>
                  {opt.desc}
                </div>
              </div>
              {active && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#0EA5E9', flexShrink: 0,
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   NOTIFICAÇÕES TAB
══════════════════════════════════════════════════════════════════ */
function NotificacoesTab() {
  const { prefs, update } = useNotificationPrefs()
  const [local, setLocal] = useState<NotificationPrefs>(prefs)

  useEffect(() => { setLocal(prefs) }, [prefs])

  function toggle(key: keyof NotificationPrefs) {
    const next = { ...local, [key]: !local[key] }
    setLocal(next)
    update.mutate(next)
  }

  const items: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
    { key: 'tarefas_vencidas', label: 'Tarefas vencidas',      desc: 'Tarefas com prazo já ultrapassado' },
    { key: 'tarefas_hoje',     label: 'Tarefas para hoje',     desc: 'Tarefas com prazo para o dia atual' },
    { key: 'eventos_agenda',   label: 'Eventos da agenda',     desc: 'Eventos que começam nas próximas 2 horas' },
    { key: 'contas_vencidas',  label: 'Contas vencidas',       desc: 'Pagamentos recorrentes em atraso' },
    { key: 'contas_hoje',      label: 'Contas vencem hoje',    desc: 'Pagamentos recorrentes com vencimento hoje' },
    { key: 'habitos_fim_dia',  label: 'Hábitos pendentes',     desc: 'Hábitos não marcados (exibido após 18h)' },
  ]

  return (
    <div className="space-y-2">
      <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
        Escolha quais alertas aparecem no sino de notificações.
      </p>
      {items.map(item => (
        <div
          key={item.key}
          className="flex items-center justify-between rounded-xl border border-line bg-bg-2 px-4 py-3"
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{item.desc}</div>
          </div>
          <button
            onClick={() => toggle(item.key)}
            style={{
              width: 40, height: 22, borderRadius: 11,
              background: local[item.key] ? '#0ea5e9' : 'var(--border)',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute', top: 3,
              left: local[item.key] ? 21 : 3,
              width: 16, height: 16, borderRadius: '50%',
              background: '#fff', transition: 'left 0.2s',
            }} />
          </button>
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { data: profile, isLoading: profileLoading, updateProfile } = useProfile()
  const { data: settings, isLoading: settingsLoading, toggleModule } = useUserSettings()

  const [tab,          setTab]          = useState<'perfil' | 'seguranca' | 'modulos' | 'notificacoes' | 'aparencia' | 'instalar' | 'suporte'>('perfil')
  const [name,         setName]         = useState('')
  const [editingName,  setEditingName]  = useState(false)
  const [savingName,   setSavingName]   = useState(false)
  const [nameMsg,      setNameMsg]      = useState('')
  const [showChangePw, setShowChangePw] = useState(false)

  const displayName = profile?.name ?? ''
  const email       = user?.email ?? ''
  const isAdmin     = email === ADMIN_EMAIL
  const enabled     = settings?.enabled_modules ?? []

  const visibleModules = MODULES.filter(m => !m.hidden || enabled.includes(m.id))
  const groups = Array.from(new Set(visibleModules.map(m => m.group)))

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

  const TABS = [
    { id: 'perfil',        label: 'Perfil' },
    { id: 'seguranca',     label: 'Segurança' },
    { id: 'modulos',       label: 'Módulos' },
    { id: 'notificacoes',  label: 'Notificações' },
    { id: 'aparencia',     label: 'Aparência' },
    { id: 'instalar',      label: 'Instalar app' },
    { id: 'suporte',       label: 'Suporte' },
  ] as const

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl lg:text-[30px]" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
          Configurações
        </h1>
        <p className="text-ink-2 mt-1 text-sm">Perfil, módulos e preferências.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[#1f1f1f]">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
            style={{
              color: tab === t.id ? '#0EA5E9' : 'var(--text3)',
              borderColor: tab === t.id ? '#0EA5E9' : 'transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PERFIL tab ── */}
      {tab === 'perfil' && (
        <>
        <section className="space-y-3">
          {/* Avatar + name display */}
          <div className="rounded-xl border border-line p-5 flex items-center gap-5" style={{ background: 'var(--bg2)' }}>
            <div className="flex-shrink-0 flex items-center justify-center rounded-full text-white" style={{ width: 64, height: 64, background: '#0EA5E9', fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 24 }}>
              {initials(displayName, email)}
            </div>
            <div className="flex-1 min-w-0">
              {profileLoading ? (
                <div className="space-y-1.5">
                  <div className="h-4 bg-bg-3 rounded w-32 animate-pulse" />
                  <div className="h-3 bg-bg-3 rounded w-44 animate-pulse" />
                </div>
              ) : (
                <>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16 }}>{displayName || 'Sem nome'}</div>
                  <div className="text-ink-2 text-sm truncate">{email}</div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-line p-5 space-y-4" style={{ background: 'var(--bg2)' }}>
            <SectionLabel>Informações pessoais</SectionLabel>
            <div>
              <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Nome</label>
              {editingName ? (
                <form onSubmit={saveName} className="flex gap-2">
                  <input value={name} onChange={e => setName(e.target.value)} autoFocus className={inputCls + ' flex-1'} style={{ minHeight: 40 }} />
                  <button type="submit" disabled={savingName} className="bg-brand text-white rounded-input px-4 text-sm font-semibold hover:brightness-110 disabled:opacity-40 transition-all" style={{ minHeight: 40 }}>{savingName ? '…' : 'Salvar'}</button>
                  <button type="button" onClick={() => setEditingName(false)} className="bg-bg-3 text-ink-2 rounded-input px-3 text-sm hover:text-ink transition-colors" style={{ minHeight: 40 }}>×</button>
                </form>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-bg-3 border border-line rounded-input px-3 flex items-center text-ink text-sm" style={{ minHeight: 40 }}>
                    {displayName || <span className="text-ink-3">Não definido</span>}
                  </div>
                  <button onClick={startEditName} className="bg-bg-3 border border-line text-ink-2 rounded-input px-4 text-sm hover:text-ink hover:border-white/20 transition-colors flex-shrink-0" style={{ minHeight: 40 }}>Editar</button>
                </div>
              )}
              {nameMsg && <p className="text-ok text-xs mt-1">{nameMsg}</p>}
            </div>
            <div>
              <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>E-mail</label>
              <div className="flex items-center gap-2 bg-bg-3 border border-line rounded-input px-3 text-ink-2 text-sm" style={{ minHeight: 40 }}>
                <span className="flex-1 truncate">{email}</span>
                <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(255,255,255,.06)', color: 'var(--text3)', padding: '2px 6px', borderRadius: 5, letterSpacing: '.05em', flexShrink: 0 }}>SOMENTE LEITURA</span>
              </div>
            </div>
          </div>
        </section>
        {isAdmin && <AdminSection />}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-input border border-red-400/30 text-red-400 hover:bg-red-400/08 transition-colors text-sm font-semibold"
          style={{ minHeight: 48 }}
        >
          <LogOut size={15} />
          Sair da conta
        </button>
        </>
      )}

      {/* ── SEGURANÇA tab ── */}
      {tab === 'seguranca' && (
        <section className="space-y-3">
          <div className="rounded-xl border border-line p-5 space-y-3" style={{ background: 'var(--bg2)' }}>
            <SectionLabel>Segurança da conta</SectionLabel>
            <p className="text-ink-3 text-xs">Sua senha nunca é armazenada em texto puro. Para alterá-la, informe a senha atual e defina uma nova.</p>
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
            <TwoFactorSection />
          </div>
        </section>
      )}

      {/* ── MÓDULOS tab ── */}
      {tab === 'modulos' && (
        <section className="space-y-4">
          <p className="text-ink-3 text-xs">Ative ou desative módulos do MOS. Módulos essenciais não podem ser removidos.</p>
          {settingsLoading ? (
            <div className="text-ink-3 text-sm py-4">Carregando...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {groups.map(group => (
                <div key={group}>
                  <div className="text-[10px] text-[#555] uppercase tracking-wider font-[Sora] mb-1.5 px-0.5">{group}</div>
                  <div className="bg-bg-2 border border-line rounded-xl overflow-hidden">
                    {visibleModules.filter(m => m.group === group).map(mod => {
                      const isOn = enabled.includes(mod.id)
                      return (
                        <div key={mod.id} className="flex items-center justify-between px-4 py-3.5 border-b border-line last:border-0">
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="text-sm font-medium text-white">{mod.label}</div>
                            <div className="text-xs text-[#555] mt-0.5">{mod.description}</div>
                          </div>
                          <Toggle
                            on={isOn}
                            disabled={mod.core}
                            onClick={() => !mod.core && toggleModule.mutate(mod.id)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── NOTIFICAÇÕES tab ── */}
      {tab === 'notificacoes' && <NotificacoesTab />}

      {/* ── APARÊNCIA tab ── */}
      {tab === 'aparencia' && <AparenciaTab />}

      {/* ── SUPORTE tab ── */}
      {tab === 'suporte' && <SuporteTab />}

      {/* ── INSTALAR APP tab ── */}
      {tab === 'instalar' && (
        <div className="max-w-xl space-y-4">
          <p className="text-xs text-ink-3">Instale o MOS como um app nativo na tela inicial — sem precisar de loja de aplicativos.</p>

          <div className="bg-bg-2 border border-line rounded-xl p-5 space-y-3">
            <div className="text-[10px] text-ink-3 font-[Sora] uppercase tracking-wider">iPhone / Safari</div>
            <Step n={1} text='No Safari, toque no ícone de Compartilhar (quadrado com seta para cima) na barra inferior.' />
            <Step n={2} text='Role para baixo e toque em "Adicionar à Tela de Início".' />
            <Step n={3} text='Toque em "Adicionar" no canto superior direito.' />
            <p className="text-[11px] text-ink-3 mt-1">Funciona apenas no Safari — outros navegadores no iPhone não suportam essa opção.</p>
          </div>

          <div className="bg-bg-2 border border-line rounded-xl p-5 space-y-3">
            <div className="text-[10px] text-ink-3 font-[Sora] uppercase tracking-wider">Android / Chrome</div>
            <Step n={1} text='No Chrome, toque nos três pontinhos no canto superior direito.' />
            <Step n={2} text='Toque em "Instalar app" ou "Adicionar à tela inicial".' />
            <Step n={3} text='Confirme tocando em "Instalar".' />
          </div>

          <div className="bg-bg-2 border border-line rounded-xl p-5 space-y-3">
            <div className="text-[10px] text-ink-3 font-[Sora] uppercase tracking-wider">Desktop</div>
            <Step n={1} text='No Chrome ou Edge, clique no ícone de instalação na barra de endereço (ícone de tela com seta).' />
            <Step n={2} text='Clique em "Instalar".' />
            <p className="text-[11px] text-ink-3 mt-1">Você também pode acessar pelo celular — acesse app.jlmos.com.br no navegador do seu telefone.</p>
          </div>
        </div>
      )}

      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </div>
  )
}
