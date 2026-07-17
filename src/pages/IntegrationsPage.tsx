import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Activity, Landmark, RefreshCw, Check, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PluggyConnect } from '@/components/PluggyConnect'

/* ── Hook: check integration status ─────────────────────────────── */
function useIntegration(provider: string) {
  return useQuery({
    queryKey: ['integration', provider],
    queryFn: async () => {
      const { data, error } = await supabase.from('integrations')
        .select('connected, meta, updated_at')
        .eq('provider', provider)
        .maybeSingle()
      if (error) throw error
      return data as { connected: boolean; meta: Record<string, unknown>; updated_at: string } | null
    },
  })
}

/* ── Toast ────────────────────────────────────────────────────── */
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [])
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 600,
      background: ok ? '#1a2a1a' : '#2a1010',
      border: `1px solid ${ok ? '#34d39940' : '#f8717140'}`,
      borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,.5)',
    }}>
      {ok
        ? <Check size={14} style={{ color: '#34d399', flexShrink: 0 }} />
        : <X size={14} style={{ color: '#f87171', flexShrink: 0 }} />}
      <span style={{ color: 'var(--text)', fontSize: 13 }}>{msg}</span>
    </div>
  )
}

type Status = 'connected' | 'sandbox' | 'disconnected'

const BTN_PRIMARY: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8,
  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  border: '1px solid #0ea5e9', color: '#0ea5e9', background: 'transparent',
}
const BTN_SECONDARY: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8,
  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  border: '1px solid var(--border)', color: 'var(--text3)', background: 'transparent',
}

/* ── IntCard ─────────────────────────────────────────────────────── */
function IntCard({
  icon, nome, infoExtra, status, descricao, erro, children,
}: {
  icon: React.ReactNode
  nome: string
  infoExtra?: string | null
  status: Status
  descricao: string
  erro?: string | null
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-line bg-bg-2 p-5 flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl bg-bg-3 flex-shrink-0"
            style={{ width: 40, height: 40 }}
          >
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              {nome}
            </div>
            {infoExtra && (
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                {infoExtra}
              </div>
            )}
          </div>
        </div>

        {/* Badge de status */}
        <div style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
          background: status === 'connected' ? '#0d2818'
            : status === 'sandbox' ? '#2a2410' : 'var(--bg3)',
          border: `1px solid ${status === 'connected' ? '#1a5c38'
            : status === 'sandbox' ? '#5c4d1a' : 'var(--border)'}`,
          color: status === 'connected' ? '#4ade80'
            : status === 'sandbox' ? '#fbbf24' : 'var(--text3)',
          flexShrink: 0,
        }}>
          {status === 'connected' ? 'Conectado'
            : status === 'sandbox' ? 'Sandbox' : 'Desconectado'}
        </div>
      </div>

      {/* Descrição */}
      <p style={{ fontSize: 13, color: 'var(--text3)', margin: 0, lineHeight: 1.6 }}>
        {descricao}
      </p>

      {/* Erro */}
      {erro && (
        <div style={{ fontSize: 12, color: '#f87171' }}>{erro}</div>
      )}

      {/* Ações */}
      <div className="flex gap-2 flex-wrap mt-auto pt-1">
        {children}
      </div>

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
  const status: Status = connected ? 'connected' : 'disconnected'

  const [loading,   setLoading]   = useState(false)
  const [syncing,   setSyncing]   = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null)

  async function handleConnect() {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('strava-auth-url')
      if (error) throw error
      window.location.href = data.url
    } catch {
      setToast({ msg: 'Erro ao conectar Strava.', ok: false })
      setLoading(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setSyncError(null)
    try {
      const { data, error } = await supabase.functions.invoke('strava-sync')
      if (error) throw error
      const n = data?.imported ?? 0
      setToast({ msg: `${n} treino${n !== 1 ? 's' : ''} importado${n !== 1 ? 's' : ''}!`, ok: true })
      qc.invalidateQueries({ queryKey: ['workouts', 'corrida'] })
    } catch (e: unknown) {
      console.error('[IntegrationsPage]', e)
      setSyncError('Erro ao sincronizar')
      setToast({ msg: 'Erro ao sincronizar com Strava.', ok: false })
    }
    setSyncing(false)
  }

  async function handleDisconnect() {
    if (!window.confirm('Desconectar Strava?')) return
    await supabase.from('integrations')
      .update({ connected: false, access_token_cipher: null, refresh_token_cipher: null })
      .eq('provider', 'strava')
    qc.invalidateQueries({ queryKey: ['integration', 'strava'] })
  }

  const athlete = int?.meta?.athlete as { firstname?: string; lastname?: string } | undefined
  const infoExtra = athlete
    ? `${athlete.firstname ?? ''} ${athlete.lastname ?? ''}`.trim() || null
    : null

  const erro = syncError
    ? `Conexão expirada. `
    : null

  return (
    <>
      <IntCard
        icon={<Activity size={18} color="#6b7280" />}
        nome="Strava"
        infoExtra={infoExtra}
        status={status}
        descricao="Importe treinos de corrida, triathlon e musculação automaticamente via OAuth."
        erro={erro}
      >
        {isLoading ? (
          <div style={{ height: 32, width: 120, background: 'var(--bg3)', borderRadius: 8, opacity: 0.5 }} />
        ) : connected ? (
          <>
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{ ...BTN_PRIMARY, opacity: syncing ? 0.6 : 1, cursor: syncing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <RefreshCw size={12} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
            <button onClick={handleDisconnect} style={BTN_SECONDARY}>
              Desconectar
            </button>
            {syncError && (
              <button
                onClick={handleConnect}
                style={{ ...BTN_PRIMARY, fontSize: 11 }}
              >
                Reconectar
              </button>
            )}
          </>
        ) : (
          <button
            onClick={handleConnect}
            disabled={loading}
            style={{ ...BTN_PRIMARY, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Redirecionando...' : 'Conectar'}
          </button>
        )}
      </IntCard>
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════
   OPEN FINANCE
══════════════════════════════════════════════════════════════════ */
function OpenFinanceCard() {
  const { data: int } = useIntegration('pluggy')

  const status: Status = int?.connected === true
    ? 'connected'
    : int != null
    ? 'sandbox'
    : 'disconnected'

  return (
    <IntCard
      icon={<Landmark size={18} color="#6b7280" />}
      nome="Open Finance"
      status={status}
      descricao="Conecte suas contas bancárias e cartões para importar transações. Aguardando aprovação para produção."
    >
      <PluggyConnect />
    </IntCard>
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
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', marginBottom: 6 }}>
        Integrações
      </h1>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 28 }}>
        Conecte seus serviços e importe dados automaticamente.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StravaCard />
        <OpenFinanceCard />
      </div>
    </div>
  )
}
