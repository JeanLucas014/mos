import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Activity, Github, ExternalLink, RefreshCw, Unplug, Check, X } from 'lucide-react'
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

/* ── Helpers ──────────────────────────────────────────────────── */
function fmtRelative(iso: string): string {
  const d     = new Date(iso)
  const now   = new Date()
  const diffH = Math.round((now.getTime() - d.getTime()) / 3_600_000)
  if (diffH < 1)   return 'agora'
  if (diffH < 24)  return `${diffH}h atrás`
  const diffD = Math.round(diffH / 24)
  if (diffD < 30)  return `${diffD}d atrás`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function fmtRelativeMs(ms: number): string {
  return fmtRelative(new Date(ms).toISOString())
}

const VERCEL_STATE_CFG: Record<string, { label: string; color: string }> = {
  READY:    { label: 'Ready',    color: C.g },
  ERROR:    { label: 'Error',    color: C.r },
  BUILDING: { label: 'Building', color: C.a },
  CANCELED: { label: 'Canceled', color: C.dm },
  QUEUED:   { label: 'Queued',   color: C.dm },
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
   GITHUB
══════════════════════════════════════════════════════════════════ */
type Repo = { id: number; name: string; full_name: string; url: string; language: string | null; pushed_at: string; stars: number; private: boolean }

function GitHubCard() {
  const qc = useQueryClient()
  const { data: int, isLoading } = useIntegration('github')
  const connected = int?.connected === true

  const [loading, setLoading] = useState(false)
  const [repos,   setRepos]   = useState<Repo[]>([])
  const [fetched, setFetched] = useState(false)
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (connected && !fetched) { fetchRepos(); setFetched(true) }
  }, [connected])

  async function fetchRepos() {
    try {
      const resp = await callFn('github-data')
      const data = await resp.json()
      if (resp.ok) setRepos(data.repos ?? [])
    } catch {}
  }

  async function handleConnect() {
    setLoading(true)
    try {
      const resp = await callFn('github-proxy')
      if (!resp.ok) throw new Error(await resp.text())
      const { url } = await resp.json()
      window.location.href = url
    } catch {
      setToast({ msg: 'Erro ao conectar GitHub.', ok: false })
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    if (!window.confirm('Desconectar GitHub?')) return
    await (supabase.from('integrations') as any)
      .update({ connected: false, access_token_cipher: null })
      .eq('provider', 'github')
    qc.invalidateQueries({ queryKey: ['integration', 'github'] })
    setRepos([])
    setFetched(false)
  }

  const LANG_COLOR: Record<string, string> = {
    TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3572A5',
    Go: '#00add8', Rust: '#dea584', CSS: '#563d7c',
  }

  return (
    <>
      <IntCard
        logo={<Github size={22} style={{ color: C.tx }} />}
        title="GitHub"
        description="Visualize seus repositórios mais recentes diretamente no MOS."
        connected={connected}
      >
        {isLoading ? (
          <div style={{ height: 36, background: C.card2, borderRadius: 8 }} />
        ) : connected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Repos list */}
            {repos.slice(0, 5).map(r => (
              <a
                key={r.id} href={r.url} target="_blank" rel="noreferrer"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: C.card2, borderRadius: 8, border: `1px solid ${C.border}` }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.b, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.name}
                    {r.private && <span style={{ marginLeft: 6, fontSize: 9, color: C.dm }}>private</span>}
                  </div>
                  <div style={{ fontSize: 10, color: C.dm, marginTop: 1 }}>
                    {r.language && (
                      <span>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: LANG_COLOR[r.language] ?? C.dm2, marginRight: 4, verticalAlign: 'middle' }} />
                        {r.language} ·{' '}
                      </span>
                    )}
                    push {fmtRelative(r.pushed_at)}
                  </div>
                </div>
                {r.stars > 0 && <span style={{ fontSize: 10, color: C.a, flexShrink: 0 }}>★{r.stars}</span>}
                <ExternalLink size={11} style={{ color: C.dm2, flexShrink: 0 }} />
              </a>
            ))}
            <button
              onClick={handleDisconnect}
              style={{ alignSelf: 'flex-start', padding: '8px 14px', borderRadius: 9, background: 'transparent', border: `1px solid ${C.border}`, color: C.dm, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <Unplug size={13} /> Desconectar
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect} disabled={loading}
            style={{
              width: '100%', padding: '11px 16px', borderRadius: 9,
              background: 'rgba(255,255,255,.06)', border: `1px solid ${C.border}`,
              color: C.tx, fontSize: 13, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Redirecionando...' : 'Conectar GitHub'}
          </button>
        )}
      </IntCard>
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════
   VERCEL
══════════════════════════════════════════════════════════════════ */
type Deploy = { id: string; name: string; url: string; state: string; createdAt: number }

function VercelCard() {
  const qc = useQueryClient()
  const { data: int, isLoading } = useIntegration('vercel')
  const connected = int?.connected === true

  const [deploys,    setDeploys]    = useState<Deploy[]>([])
  const [fetching,   setFetching]   = useState(false)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    if (connected) fetchDeploys()
  }, [connected])

  async function fetchDeploys() {
    setFetching(true)
    try {
      const resp = await callFn('vercel-data')
      if (resp.ok) { const d = await resp.json(); setDeploys(d.deployments ?? []) }
    } catch {}
    setFetching(false)
  }

  async function handleConnect() {
    setConnecting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setConnecting(false); return }
    await (supabase.from('integrations') as any).upsert(
      { user_id: user.id, provider: 'vercel', connected: true, meta: {}, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,provider' },
    )
    qc.invalidateQueries({ queryKey: ['integration', 'vercel'] })
    setConnecting(false)
  }

  async function handleDisconnect() {
    if (!window.confirm('Desconectar Vercel?')) return
    await (supabase.from('integrations') as any)
      .update({ connected: false })
      .eq('provider', 'vercel')
    qc.invalidateQueries({ queryKey: ['integration', 'vercel'] })
    setDeploys([])
  }

  return (
    <IntCard
      logo={
        <svg viewBox="0 0 76 65" fill="white" height={20} aria-label="Vercel">
          <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
        </svg>
      }
      title="Vercel"
      description="Acompanhe seus deploys mais recentes sem sair do MOS."
      connected={connected}
    >
      {isLoading ? (
        <div style={{ height: 36, background: C.card2, borderRadius: 8 }} />
      ) : connected ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Deploys list */}
          {fetching ? (
            <div style={{ fontSize: 12, color: C.dm, textAlign: 'center', padding: '8px 0' }}>Carregando...</div>
          ) : (
            deploys.slice(0, 5).map(d => {
              const cfg = VERCEL_STATE_CFG[d.state] ?? { label: d.state, color: C.dm }
              return (
                <a
                  key={d.id} href={d.url} target="_blank" rel="noreferrer"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: C.card2, borderRadius: 8, border: `1px solid ${C.border}` }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.tx, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.name}
                    </div>
                    <div style={{ fontSize: 10, color: C.dm, marginTop: 1 }}>{fmtRelativeMs(d.createdAt)}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: cfg.color + '18', color: cfg.color, flexShrink: 0 }}>
                    {cfg.label}
                  </span>
                  <ExternalLink size={11} style={{ color: C.dm2, flexShrink: 0 }} />
                </a>
              )
            })
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={fetchDeploys} disabled={fetching}
              style={{ padding: '8px 14px', borderRadius: 9, background: 'rgba(255,255,255,.05)', border: `1px solid ${C.border}`, color: C.dm, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <RefreshCw size={12} style={{ animation: fetching ? 'spin 1s linear infinite' : 'none' }} /> Atualizar
            </button>
            <button
              onClick={handleDisconnect}
              style={{ padding: '8px 14px', borderRadius: 9, background: 'transparent', border: `1px solid ${C.border}`, color: C.dm, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <Unplug size={13} /> Desconectar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleConnect} disabled={connecting}
          style={{
            width: '100%', padding: '11px 16px', borderRadius: 9,
            background: 'rgba(255,255,255,.06)', border: `1px solid ${C.border}`,
            color: C.tx, fontSize: 13, fontWeight: 600,
            cursor: connecting ? 'not-allowed' : 'pointer',
          }}
        >
          {connecting ? 'Conectando...' : 'Conectar Vercel'}
        </button>
      )}
    </IntCard>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export function IntegrationsPage() {
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()

  /* Handle ?connected=<provider> redirects */
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        <StravaCard />
        <GitHubCard />
        <VercelCard />
      </div>

      {/* TESTE - Open Finance */}
      <div style={{ background: 'red', color: 'white', padding: 20, marginTop: 24 }}>
        OPEN FINANCE AQUI
      </div>
    </div>
  )
}
