import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { useUserSettings } from '@/hooks/useUserSettings'
import { initials } from '../utils'
import { SectionLabel, inputCls } from './shared'
import { AdminSection } from './AdminSection'

/* ══════════════════════════════════════════════════════════════════
   PERFIL TAB
══════════════════════════════════════════════════════════════════ */
export function PerfilTab() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { data: profile, isLoading: profileLoading, updateProfile } = useProfile()
  const { data: settings } = useUserSettings()

  const [name,        setName]        = useState('')
  const [editingName, setEditingName] = useState(false)
  const [savingName,  setSavingName]  = useState(false)
  const [nameMsg,     setNameMsg]     = useState('')

  const displayName = profile?.name ?? ''
  const email        = user?.email ?? ''
  const isAdmin       = settings?.is_admin ?? false

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

  return (
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
  )
}
