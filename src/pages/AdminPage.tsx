import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Users, TrendingUp, Activity, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react'

interface AdminStats {
  totalUsers: number
  newThisWeek: number
  newLastWeek: number
  activeThisWeek: number
  activeThisMonth: number
  onboardingCompleted: number
  onboardingRate: number
  dailySignups: { date: string; count: number }[]
  moduleAdoption: { module: string; count: number; pct: number }[]
  recentSignups: {
    email: string
    created_at: string
    last_sign_in_at: string | null
    email_confirmed: boolean
  }[]
}

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', agenda: 'Agenda', tarefas: 'Tarefas',
  financeiro: 'Financeiro', notas: 'Notas', projetos: 'Projetos',
  metas: 'Metas', habitos: 'Habitos', senhas: 'Senhas',
  esportes: 'Esportes', estudos: 'Estudos', compras: 'Compras',
}

function StatCard({
  label, value, sub, Icon, color,
}: {
  label: string; value: string | number; sub?: string; Icon: React.ElementType; color: string
}) {
  return (
    <div className="rounded-2xl border border-line bg-bg-2 p-5">
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
      </div>
      <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 32, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function timeAgo(iso: string | null) {
  if (!iso) return 'Nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Hoje'
  if (d === 1) return 'Ontem'
  return `${d}d atrás`
}

export function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { supabase } = await import('../lib/supabase')
      const { data, error: fnError } = await supabase.functions.invoke('admin-stats', {
        method: 'POST',
      })
      if (fnError) throw fnError
      setStats(data as AdminStats)
      setLastUpdate(new Date())
    } catch (e: unknown) {
      console.error('[AdminPage]', e)
      setError('Não foi possível carregar as estatísticas. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            Painel Admin
          </h1>
          {lastUpdate && (
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
              Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-line bg-bg-2 text-ink-2 hover:text-ink transition-colors"
          style={{ fontSize: 13, fontWeight: 600 }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border mb-6 p-4 flex items-center gap-3"
          style={{ background: '#2a1210', borderColor: '#5c241a' }}>
          <AlertCircle size={16} color="#f87171" />
          <span style={{ fontSize: 14, color: '#fca5a5' }}>{error}</span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl border border-line bg-bg-2 p-5 h-28 animate-pulse" />
          ))}
        </div>
      )}

      {stats && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total usuários"
              value={stats.totalUsers}
              sub="Excluindo conta demo"
              Icon={Users}
              color="#0ea5e9"
            />
            <StatCard
              label="Ativos esta semana"
              value={stats.activeThisWeek}
              sub={`${stats.activeThisMonth} no mês`}
              Icon={Activity}
              color="#22c55e"
            />
            <StatCard
              label="Novos esta semana"
              value={stats.newThisWeek}
              sub={stats.newLastWeek > 0
                ? `${stats.newThisWeek >= stats.newLastWeek ? '+' : ''}${stats.newThisWeek - stats.newLastWeek} vs semana passada`
                : 'Primeira semana'}
              Icon={TrendingUp}
              color="#a78bfa"
            />
            <StatCard
              label="Onboarding completo"
              value={`${stats.onboardingRate}%`}
              sub={`${stats.onboardingCompleted} de ${stats.totalUsers} usuários`}
              Icon={CheckCircle2}
              color="#34d399"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Signups chart */}
            <div className="rounded-2xl border border-line bg-bg-2 p-5">
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
                Cadastros — últimos 30 dias
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats.dailySignups} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtDateShort}
                    tick={{ fill: 'var(--text2)', fontSize: 10 }}
                    tickLine={false}
                    interval={6}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text2)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    labelFormatter={(v) => fmtDate(v as string)}
                    formatter={(v) => [v, 'Cadastros']}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#0ea5e9' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Module adoption */}
            <div className="rounded-2xl border border-line bg-bg-2 p-5">
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
                Adoção de módulos
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={stats.moduleAdoption.slice(0, 10).map(m => ({ ...m, label: MODULE_LABELS[m.module] ?? m.module }))}
                  layout="vertical"
                  margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
                >
                  <XAxis type="number" tick={{ fill: 'var(--text2)', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="label" tick={{ fill: 'var(--text2)', fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v, _, p) => [`${v} usuários (${p.payload.pct}%)`, 'Ativos']}
                  />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent signups table */}
          <div className="rounded-2xl border border-line bg-bg-2 overflow-hidden">
            <div className="px-5 py-4 border-b border-line">
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Cadastros recentes
              </span>
            </div>
            <div className="divide-y divide-line">
              {stats.recentSignups.map((u, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>
                      {u.email?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{u.email}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>Cadastro: {fmtDate(u.created_at)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>Último acesso</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>{timeAgo(u.last_sign_in_at)}</div>
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                      background: u.email_confirmed ? '#0d2818' : '#2a1210',
                      border: `1px solid ${u.email_confirmed ? '#1a5c38' : '#5c241a'}`,
                      color: u.email_confirmed ? '#4ade80' : '#f87171',
                    }}>
                      {u.email_confirmed ? 'Confirmado' : 'Pendente'}
                    </div>
                  </div>
                </div>
              ))}
              {stats.recentSignups.length === 0 && (
                <div className="px-5 py-8 text-center" style={{ fontSize: 14, color: 'var(--text3)' }}>
                  Nenhum cadastro ainda
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
