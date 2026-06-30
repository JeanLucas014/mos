import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Activity, RefreshCw, Unplug, Check, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PluggyConnect } from '@/components/PluggyConnect'

/* ── Palette ──────────────────────────────────────────────────── */
const C = {
  bg:     '#0a0a0a',
  card:   '#111111',
  card2:  '#161616',
  border: '#1f1f1f',
  tx:     '#ffffff',
  dm:     '#888888',
  dm2:    '#444444',
  b:      '#0EA5E9',
  g:      '#34d399',
  r:      '#f87171',
  a:      '#fbbf24',
  p:      '#a78bfa',
}


/* ── Hook: check integration status ─────────────────────────────── */
function useIntegration(provider: string) {
  return useQuery({
    queryKey: ['integration', provider],
    queryFn: async () => {
      const { data, error } = await (supabase.from('integrations') as any)
        .select('connected, meta, updated_at')
        .eq('provider', provider)
        .maybeSingle()
      if (error) throw error
      return data as { connected: boolean; meta: Record<string, unknown>; updated_at: string } | null
    },
  })
}

/* ── call edge function helper ───────────────────────────────────── */
async function callFn(fnName: string, body?: unknown) {
  const { data: { session } } = await supabase.auth.getSession()
  const resp = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fnName}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token ?? ''}`,
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  )
  return resp
}

/* ── Toast ────────────────────────────────────────────────────── */
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [])
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 600,
      background: ok ? '#1a2a1a' : '#2a1010',
      border: `1px solid ${ok ? C.g + '40' : C.r + '40'}`,
      borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,.5)',
    }}>
      {ok ? <Check size={14} style={{ color: C.g, flexShrink: 0 }} /> : <X size={14} style={{ color: C.r, flexShrink: 0 }} />}
      <span style={{ color: C.tx, fontSize: 13 }}>{msg}</span>
    </div>
  )
}

/* ── Card shell ───────────────────────────────────────────────── */
function IntCard({
  logo, title, description, connected, children,
}: {
  logo: React.ReactNode
  title: string
  description: string
  connected: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${connected ? C.g + '30' : C.border}`,
      borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: C.card2, border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {logo}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, color: C.tx }}>{title}</span>
            {connected && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: C.g + '18', color: C.g, letterSpacing: '.06em' }}>
                CONECTADO
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: C.dm, lineHeight: 1.5, margin: 0 }}>{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   STRAVA
══════════════════════════════════════════════════════════════════ */
function StravaCard() {
  const qc = useQueryClient()
  const { data: int, isLoading } = useIntegration('strava')
  const connected = int?.connected === true

  const [loading,  setLoading]  = useState(false)
  const [syncing,  setSyncing]  = useState(false)
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null)

  async function handleConnect() {
    setLoading(true)
    try {
      const resp = await callFn('strava-auth-url')
      if (!resp.ok) throw new Error(await resp.text())
      const { url } = await resp.json()
      window.location.href = url
    } catch (e) {
      setToast({ msg: 'Erro ao conectar Strava.', ok: false })
      setLoading(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const resp = await callFn('strava-sync')
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error)
      setToast({ msg: `${data.imported} treino${data.imported !== 1 ? 's' : ''} importado${data.imported !== 1 ? 's' : ''}!`, ok: true })
      qc.invalidateQueries({ queryKey: ['workouts'] })
    } catch (e) {
      setToast({ msg: 'Erro ao sincronizar com Strava.', ok: false })
    }
    setSyncing(false)
  }

  async function handleDisconnect() {
    if (!window.confirm('Desconectar Strava?')) return
    await (supabase.from('integrations') as any)
      .update({ connected: false, access_token_cipher: null, refresh_token_cipher: null })
      .eq('provider', 'strava')
    qc.invalidateQueries({ queryKey: ['integration', 'strava'] })
  }

  return (
    <>
      <IntCard
        logo={<Activity size={22} style={{ color: '#FC4C02' }} />}
        title="Strava"
        description="Importe treinos de corrida e triathlon automaticamente."
        connected={connected}
      >
        {isLoading ? (
          <div style={{ height: 36, background: C.card2, borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
        ) : connected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {int?.meta?.athlete ? (
              <div style={{ fontSize: 12, color: C.dm }}>
                Atleta: <span style={{ color: C.tx }}>
                  {(int.meta.athlete as { firstname?: string; lastname?: string }).firstname}{' '}
                  {(int.meta.athlete as { firstname?: string; lastname?: string }).lastname}
                </span>
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSync} disabled={syncing}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 9,
                  background: 'rgba(252,76,2,.12)', border: '1px solid rgba(252,76,2,.3)',
                  color: '#FC4C02', fontSize: 12, fontWeight: 600,
                  cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                {syncing ? 'Sincronizando...' : 'Sincronizar treinos'}
              </button>
              <button
                onClick={handleDisconnect}
                style={{ padding: '10px 14px', borderRadius: 9, background: 'transparent', border: `1px solid ${C.border}`, color: C.dm, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <Unplug size={13} /> Desconectar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleConnect} disabled={loading}
            style={{
              width: '100%', padding: '11px 16px', borderRadius: 9,
              background: loading ? 'rgba(252,76,2,.3)' : 'rgba(252,76,2,.15)',
              border: '1px solid rgba(252,76,2,.4)',
              color: '#FC4C02', fontSize: 13, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Redirecionando...' : 'Conectar Strava'}
          </button>
        )}
      </IntCard>
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export function IntegrationsPage() {
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()

  useEffect(() => {
    const connected = searchParams.get('connected')
    if (connected) {
      qc.invalidateQueries({ queryKey: ['integration', connected] })
      window.history.replaceState({}, '', '/integracoes')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ fontFamily: 'Manrope,sans-serif' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>

      <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', marginBottom: 6 }}>
        Integrações
      </h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 28 }}>
        Conecte seus serviços e importe dados automaticamente.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StravaCard />
      </div>

      <div className="mt-6 bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
          <span className="text-sm font-semibold font-[Sora] text-white">Open Finance</span>
        </div>
        <p className="text-xs text-[#555] mb-4">
          Transações automáticas no Financeiro · Pluggy
        </p>
        <PluggyConnect />
      </div>
    </div>
  )
}
