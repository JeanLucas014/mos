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
import { initials } from './utils'
import { Step, SectionLabel, Toggle, inputCls, inputH } from './components/shared'
import { ChangePasswordModal } from './components/ChangePasswordModal'
import { AdminSection } from './components/AdminSection'
import { TwoFactorSection } from './components/TwoFactorSection'

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
  const isAdmin     = settings?.is_admin ?? false
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
      <div className="border-b border-line mb-6">
        <div
          className="flex gap-0"
          style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${tab === t.id ? '#0ea5e9' : 'transparent'}`,
                color: tab === t.id ? '#0ea5e9' : 'var(--text3)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
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
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12,
            color: '#ef4444',
            padding: '0 12px',
            height: 32,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <LogOut size={13} />
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
