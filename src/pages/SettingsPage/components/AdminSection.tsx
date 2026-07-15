import { useState, type FormEvent } from 'react'
import { Shield } from 'lucide-react'
import { useAllProfiles } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'
import { initials } from '../utils'
import { SectionLabel, inputCls } from './shared'

/* ══════════════════════════════════════════════════════════════════
   ADMIN SECTION
══════════════════════════════════════════════════════════════════ */
export function AdminSection() {
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
