import { useState } from 'react'
import {
  CheckSquare, Flame, FolderOpen, Target,
  Activity, FileText, BookOpen, Zap,
  ArrowRight, CalendarDays, Info, ChevronDown, ChevronUp,
  Sparkles, RefreshCw,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import {
  useDashTasks,
  useDashHabits,
  useDashProjects,
  useDashGoals,
  useDashSports,
  useDashNotes,
  useDashBooks,
  useDashEvents,
  useDashFinancas,
  useDashTasksScore,
  useDashEstudos,
} from '../hooks/useDashboard'
import { useDailyBriefing } from '../hooks/useDailyBriefing'

/* ══════════════════════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════════════════════ */
function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function longDate(): string {
  const s = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}


function daysUntil(dateStr: string): number {
  const t = new Date(); t.setHours(0, 0, 0, 0)
  const d = new Date(dateStr + 'T12:00:00')
  return Math.ceil((d.getTime() - t.getTime()) / 86_400_000)
}

/* ══════════════════════════════════════════════════════════════════
   SCORE HELPERS
══════════════════════════════════════════════════════════════════ */
function calcFinancasScore(receitas: number, despesas: number): number {
  if (receitas === 0) return 50
  const saldo = receitas - despesas
  if (saldo >= 0) return Math.min(95, 70 + Math.round((saldo / receitas) * 30))
  return Math.max(15, 60 - Math.round((Math.abs(saldo) / receitas) * 60))
}
function calcSaudeScore(
  countWeek: number,
  weekGoal: number,
  lastWorkoutDate: string | null,
): number {
  const weekScore = Math.min(70, Math.round((countWeek / weekGoal) * 70))

  let consistencyScore = 0
  if (lastWorkoutDate) {
    const daysSince = Math.floor(
      (Date.now() - new Date(lastWorkoutDate).getTime()) / 86400000,
    )
    if (daysSince <= 2)      consistencyScore = 30
    else if (daysSince <= 4) consistencyScore = 15
    else if (daysSince <= 6) consistencyScore = 5
  }

  return Math.max(10, weekScore + consistencyScore)
}
function calcTarefasScore(total: number, overdue: number): number {
  if (total === 0) return 85
  if (overdue === 0) return 90
  return Math.max(30, 90 - Math.round((overdue / total) * 80))
}
function calcHabitosScore(doneToday: number, total: number): number {
  if (total === 0) return 50
  return Math.round((doneToday / total) * 100)
}
function calcEstudosScore(activeStudies: number, readingBooks: number, avgProgress: number): number {
  if (activeStudies === 0 && readingBooks === 0) return 20
  return Math.min(95, Math.min(70, (activeStudies + readingBooks) * 20) + Math.round(avgProgress * 0.25))
}
function calcMetasScore(goals: { progress: number }[]): number {
  if (!goals.length) return 50
  return Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
}
function scoreColor(s: number): string {
  if (s >= 80) return '#22c55e'
  if (s >= 60) return '#f59e0b'
  return '#ef4444'
}
function scoreLabel(s: number): string {
  if (s >= 80) return 'Excelente'
  if (s >= 60) return 'Bom'
  if (s >= 40) return 'Atencao'
  return 'Critico'
}

/* ── Score Gauge SVG ────────────────────────────────────────────── */
function ScoreGauge({ score, size = 148 }: { score: number; size?: number }) {
  const center = size / 2
  const r      = size * 0.32
  const sw     = size * 0.085
  const color  = scoreColor(score)
  const toRad  = (deg: number) => (deg * Math.PI) / 180
  const pt     = (deg: number) => ({
    x: center + r * Math.cos(toRad(deg)),
    y: center + r * Math.sin(toRad(deg)),
  })
  const arc = (from: number, to: number) => {
    const s  = pt(from); const e = pt(to)
    const la = to - from > 180 ? 1 : 0
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${la} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
  }
  const end = 135 + Math.min((score / 100) * 270, 270)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={arc(135, 405)} fill="none" stroke="#262626" strokeWidth={sw} strokeLinecap="round" />
      {score > 0 && (
        <path d={arc(135, end)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      )}
      <text x={center} y={center - 12} textAnchor="middle" fill={color}
        fontSize={size * 0.23} fontWeight="800" fontFamily="Sora, sans-serif">{score}</text>
      <text x={center} y={center + 12} textAnchor="middle" fill="#9ca3af"
        fontSize={size * 0.09} fontWeight="600" fontFamily="Manrope, sans-serif">{scoreLabel(score)}</text>
      <text x={center} y={center + 28} textAnchor="middle" fill="#4b5563"
        fontSize={size * 0.075} fontFamily="Manrope, sans-serif">Score de Vida</text>
    </svg>
  )
}

/* ── Life Score Section ─────────────────────────────────────────── */
function LifeScoreSection() {
  const [showCalc, setShowCalc] = useState(false)

  const financas   = useDashFinancas()
  const tasksScore = useDashTasksScore()
  const { total: habitTotal, doneToday } = useDashHabits()
  const sportsData = useDashSports()
  const estudos    = useDashEstudos()
  const { data: goals = [] } = useDashGoals()

  const scores = {
    financas: calcFinancasScore(financas.data?.receitas ?? 0, financas.data?.despesas ?? 0),
    saude:    calcSaudeScore(sportsData.countWeek ?? 0, sportsData.weekGoal ?? 5, sportsData.lastWorkoutDate ?? null),
    tarefas:  calcTarefasScore(tasksScore.data?.total ?? 0, tasksScore.data?.overdue ?? 0),
    habitos:  calcHabitosScore(doneToday, habitTotal),
    estudos:  calcEstudosScore(estudos.activeStudies, estudos.readingBooks, estudos.avgProgress),
    metas:    calcMetasScore((goals as any[]) ?? []),
  }

  const AREAS = [
    { id: 'financas', label: 'Financas', score: scores.financas, weight: 25 },
    { id: 'saude',    label: 'Saude',    score: scores.saude,    weight: 25 },
    { id: 'tarefas',  label: 'Tarefas',  score: scores.tarefas,  weight: 20 },
    { id: 'habitos',  label: 'Habitos',  score: scores.habitos,  weight: 15 },
    { id: 'estudos',  label: 'Estudos',  score: scores.estudos,  weight: 10 },
    { id: 'metas',    label: 'Metas',    score: scores.metas,    weight:  5 },
  ]

  const overall = Math.round(
    AREAS.reduce((s, a) => s + a.score * a.weight, 0) / 100,
  )

  const radarData = AREAS.map((a) => ({ subject: a.label, score: a.score }))
  const focus = [...AREAS].sort((a, b) => a.score - b.score).slice(0, 3).filter((a) => a.score < 70)

  return (
    <div className="mb-8">
      {/* Score + Radar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="w-full lg:w-auto rounded-2xl border border-line bg-bg-2 p-5 flex flex-col items-center justify-center gap-3">
          <ScoreGauge score={overall} size={120} />
          <div className="flex gap-3">
            {[{ l: '0-59', c: '#ef4444' }, { l: '60-79', c: '#f59e0b' }, { l: '80+', c: '#22c55e' }].map((x) => (
              <div key={x.l} className="flex items-center gap-1">
                <div className="rounded-full" style={{ width: 7, height: 7, background: x.c }} />
                <span style={{ fontSize: 11, color: '#6b7280' }}>{x.l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0 rounded-2xl border border-line bg-bg-2 p-5">
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Visao por area
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <RadarChart data={radarData} margin={{ top: 10, right: 28, bottom: 10, left: 28 }}>
              <PolarGrid stroke="#1f1f1f" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'Manrope' }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#0ea5e9"
                fill="#0ea5e9"
                fillOpacity={0.12}
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', r: 3 } as any}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mini score bars */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        {AREAS.map((a) => (
          <div key={a.id} className="rounded-xl border border-line bg-bg-2 px-3 py-2.5">
            <div className="flex justify-between items-center mb-1.5">
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{a.label}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor(a.score), fontFamily: 'Sora, sans-serif' }}>{a.score}</span>
            </div>
            <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: '#1f1f1f' }}>
              <div style={{ width: `${a.score}%`, height: '100%', background: scoreColor(a.score), borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Foco de hoje */}
      {focus.length > 0 && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={13} color="#0ea5e9" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Foco de hoje
            </span>
          </div>
          <div className="space-y-2">
            {focus.map((a, i) => (
              <div key={a.id} className="flex items-center gap-2.5 overflow-hidden">
                <span style={{ color: '#0ea5e9', fontWeight: 700, fontSize: 12, minWidth: 16 }}>{i + 1}.</span>
                <span style={{ fontSize: 13, color: '#e5e5e5', fontWeight: 600 }}>{a.label}</span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Score atual: {a.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Como e calculado */}
      <div
        className="rounded-2xl border border-line bg-bg-2 px-4 py-3 cursor-pointer flex items-center justify-between"
        onClick={() => setShowCalc((p) => !p)}
      >
        <div className="flex items-center gap-2">
          <Info size={13} color="#6b7280" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Como o score e calculado
          </span>
        </div>
        {showCalc ? <ChevronUp size={14} color="#6b7280" /> : <ChevronDown size={14} color="#6b7280" />}
      </div>
      {showCalc && (
        <div className="rounded-b-2xl border border-t-0 border-line bg-bg-2 px-4 pb-4">
          <div className="flex flex-wrap gap-2 pt-3">
            {AREAS.map((a) => (
              <div key={a.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-line bg-bg" style={{ fontSize: 12 }}>
                <div className="rounded-full" style={{ width: 6, height: 6, background: scoreColor(a.score) }} />
                <span className="text-ink-2">{a.label}</span>
                <span className="text-ink font-bold">{a.weight}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
══════════════════════════════════════════════════════════════════ */

function Sk({ w = 'w-full', h = 'h-3' }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} bg-bg-3 rounded animate-pulse`} />
}

function Bar({ pct, color = '#0EA5E9' }: { pct: number; color?: string }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: '#1f1f1f' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
      />
    </div>
  )
}

function Widget({
  icon,
  title,
  to,
  children,
  className = '',
}: {
  icon: React.ReactNode
  title: string
  to: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      to={to}
      className={`block rounded-2xl border border-line bg-bg-2 p-5 hover:border-white/12 hover:bg-bg-3 transition-all group ${className}`}
      style={{ textDecoration: 'none' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-ink-2">{icon}</span>
          <span
            className="text-ink-2 group-hover:text-ink transition-colors"
            style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}
          >
            {title}
          </span>
        </div>
        <ArrowRight size={12} className="text-ink-3 group-hover:text-ink-2 transition-colors" />
      </div>
      {children}
    </Link>
  )
}

function BigStat({ value, label, color = '#fff' }: { value: string | number; label?: string; color?: string }) {
  return (
    <div className="mb-1">
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 26, color, lineHeight: 1 }}>
        {value}
      </div>
      {label && <div className="text-ink-3 mt-0.5" style={{ fontSize: 11 }}>{label}</div>}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   WIDGET 1 — TAREFAS
══════════════════════════════════════════════════════════════════ */
function TasksWidget() {
  const { data, isLoading } = useDashTasks()
  const tasks = (data ?? []) as {
    id: string; title: string; priority: number
    due_date: string | null; project_id: string | null
  }[]
  const pending = tasks
  const top3    = tasks.slice(0, 3)

  return (
    <Widget icon={<CheckSquare size={14} />} title="Tarefas" to="/tarefas">
      {isLoading ? (
        <div className="space-y-2">
          <Sk w="w-16" h="h-6" />
          <Sk w="w-full" />
          <Sk w="w-4/5" />
          <Sk w="w-3/4" />
        </div>
      ) : (
        <>
          <BigStat
            value={pending.length}
            label={`pendente${pending.length !== 1 ? 's' : ''}`}
            color={pending.length > 5 ? '#fbbf24' : '#34d399'}
          />
          {top3.length === 0 ? (
            <p className="text-ink-3 text-xs mt-2">Tudo em dia!</p>
          ) : (
            <ul className="space-y-1.5 mt-3">
              {top3.map((t) => (
                <li key={t.id} className="flex items-start gap-2">
                  <span style={{ fontSize: 10, color: '#444', marginTop: 3, flexShrink: 0 }}>●</span>
                  <span className="text-ink-2 text-xs leading-snug line-clamp-1">{t.title}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Widget>
  )
}

/* ══════════════════════════════════════════════════════════════════
   WIDGET 2 — HABITOS (hoje)
══════════════════════════════════════════════════════════════════ */
function HabitsWidget() {
  const { isLoading, total, doneToday } = useDashHabits()
  const pct   = total > 0 ? (doneToday / total) * 100 : 0
  const color = pct >= 80 ? '#34d399' : pct >= 50 ? '#0EA5E9' : '#fbbf24'

  return (
    <Widget icon={<Flame size={14} />} title="Habitos" to="/habitos">
      {isLoading ? (
        <div className="space-y-2"><Sk w="w-20" h="h-6" /><Sk /></div>
      ) : (
        <>
          <BigStat value={`${doneToday}/${total}`} label="concluidos hoje" color={color} />
          <div className="mt-3">
            <Bar pct={pct} color={color} />
            <div className="text-right mt-1" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color }}>
              {Math.round(pct)}%
            </div>
          </div>
        </>
      )}
    </Widget>
  )
}

/* ══════════════════════════════════════════════════════════════════
   WIDGET — AGENDA (próximos eventos)
══════════════════════════════════════════════════════════════════ */

function fmtEventTime(iso: string): string {
  const ev       = new Date(iso)
  const now      = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const evStr    = ev.toISOString().slice(0, 10)
  const tmw      = new Date(now); tmw.setDate(now.getDate() + 1)
  const tmwStr   = tmw.toISOString().slice(0, 10)
  const hhmm     = `${String(ev.getHours()).padStart(2,'0')}:${String(ev.getMinutes()).padStart(2,'0')}`
  if (evStr === todayStr) return `Hoje, ${hhmm}`
  if (evStr === tmwStr)   return `Amanhã, ${hhmm}`
  const weekday = ev.toLocaleDateString('pt-BR', { weekday: 'short' })
    .replace('.', '').replace(/^\w/, c => c.toUpperCase())
  const day   = String(ev.getDate()).padStart(2, '0')
  const month = String(ev.getMonth() + 1).padStart(2, '0')
  return `${weekday}, ${day}/${month}, ${hhmm}`
}

function AgendaWidget() {
  const { data, isLoading } = useDashEvents()
  const events = data ?? []

  return (
    <Widget icon={<CalendarDays size={14} />} title="Agenda" to="/agenda">
      {isLoading ? (
        <div className="space-y-2.5">
          <Sk w="w-full" h="h-10" />
          <Sk w="w-4/5" h="h-10" />
          <Sk w="w-full" h="h-10" />
        </div>
      ) : events.length === 0 ? (
        <p className="text-ink-3 text-xs mt-1">Nenhum evento próximo.</p>
      ) : (
        <ul className="space-y-2">
          {events.map(ev => (
            <li
              key={ev.id}
              className="rounded-xl px-3 py-2 bg-bg"
              style={{ borderLeft: `3px solid ${ev.color ?? '#0EA5E9'}` }}
            >
              <div
                className="text-ink text-xs font-semibold truncate mb-0.5"
                style={{ fontFamily: 'Sora, sans-serif' }}
              >
                {ev.title}
              </div>
              <div className="text-ink-3" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                {fmtEventTime(ev.start_at)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  )
}

/* ══════════════════════════════════════════════════════════════════
   WIDGET 3 — PROJETOS
══════════════════════════════════════════════════════════════════ */
function ProjectsWidget() {
  const { data, isLoading } = useDashProjects()
  const active = (data ?? []).filter((p) => !p.delivered)
  const top2   = [...active].sort((a, b) => b.progress - a.progress).slice(0, 2)

  const STATUS_COLOR: Record<string, string> = {
    'em dev': '#60a5fa', inicio: '#fbbf24', ativo: '#34d399',
    live: '#6ee7b7', pausado: '#555',
  }

  return (
    <Widget icon={<FolderOpen size={14} />} title="Projetos" to="/projetos">
      {isLoading ? (
        <div className="space-y-2"><Sk w="w-12" h="h-6" /><Sk /><Sk w="w-4/5" /></div>
      ) : (
        <>
          <BigStat value={active.length} label="em andamento" color="#0EA5E9" />
          {top2.length === 0 ? (
            <p className="text-ink-3 text-xs mt-2">Nenhum projeto ativo.</p>
          ) : (
            <ul className="space-y-2.5 mt-3">
              {top2.map((p) => (
                <li key={p.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-ink text-xs font-semibold truncate flex-1 mr-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {p.name}
                    </span>
                    <span
                      className="flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{
                        fontSize: 9, fontWeight: 700,
                        color: STATUS_COLOR[p.status] ?? '#888',
                        background: (STATUS_COLOR[p.status] ?? '#888') + '18',
                      }}
                    >
                      {p.status}
                    </span>
                  </div>
                  <Bar pct={p.progress} color={STATUS_COLOR[p.status] ?? '#0EA5E9'} />
                  <div className="text-right mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#555' }}>
                    {p.progress}%
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Widget>
  )
}

/* ══════════════════════════════════════════════════════════════════
   WIDGET 4 — METAS
══════════════════════════════════════════════════════════════════ */
function GoalsWidget() {
  const { data, isLoading } = useDashGoals()
  const goals  = data ?? []
  const avgPct = goals.length
    ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
    : 0
  const top2     = [...goals].sort((a, b) => b.progress - a.progress).slice(0, 2)
  const colorAvg = avgPct >= 75 ? '#34d399' : avgPct >= 40 ? '#0EA5E9' : '#fbbf24'

  return (
    <Widget icon={<Target size={14} />} title="Metas" to="/metas">
      {isLoading ? (
        <div className="space-y-2"><Sk w="w-14" h="h-6" /><Sk /><Sk w="w-4/5" /></div>
      ) : (
        <>
          <BigStat value={`${avgPct}%`} label="progresso medio" color={colorAvg} />
          <div className="mt-2 mb-3">
            <Bar pct={avgPct} color={colorAvg} />
          </div>
          {top2.length === 0 ? (
            <p className="text-ink-3 text-xs">Nenhuma meta cadastrada.</p>
          ) : (
            <ul className="space-y-1.5">
              {top2.map((g) => (
                <li key={g.id} className="flex items-center justify-between">
                  <span className="text-ink-2 text-xs truncate flex-1 mr-2">{g.name}</span>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, flexShrink: 0,
                      color: g.progress >= 75 ? '#34d399' : g.progress >= 40 ? '#0EA5E9' : '#fbbf24',
                    }}
                  >
                    {g.label ?? `${g.progress}%`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Widget>
  )
}

/* ══════════════════════════════════════════════════════════════════
   WIDGET 7 — ESPORTES
══════════════════════════════════════════════════════════════════ */
function SportsWidget() {
  const { isLoading, kmMonth, countMonth, nextRace } = useDashSports()

  return (
    <Widget icon={<Activity size={14} />} title="Esportes" to="/esportes">
      {isLoading ? (
        <div className="space-y-2"><Sk w="w-20" h="h-6" /><Sk /><Sk w="w-4/5" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-bg rounded-xl px-3 py-2.5">
              <div style={{ fontSize: 9, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>
                km no mes
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 800, color: '#0EA5E9' }}>
                {kmMonth.toFixed(1)}
              </div>
            </div>
            <div className="bg-bg rounded-xl px-3 py-2.5">
              <div style={{ fontSize: 9, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>
                treinos
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 800, color: '#a78bfa' }}>
                {countMonth}
              </div>
            </div>
          </div>

          {nextRace ? (
            <div className="bg-bg rounded-xl px-3 py-2.5 flex items-center gap-2.5">
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-lg"
                style={{ width: 36, height: 36, background: 'rgba(251,191,36,.1)' }}
              >
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 800, color: '#fbbf24' }}>
                  {daysUntil(nextRace.race_date)}d
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-ink text-xs font-semibold truncate" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {nextRace.name}
                </div>
                {nextRace.location && (
                  <div className="text-ink-3" style={{ fontSize: 10 }}>{nextRace.location}</div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-ink-3 text-xs">Nenhuma prova cadastrada.</p>
          )}
        </>
      )}
    </Widget>
  )
}

/* ══════════════════════════════════════════════════════════════════
   WIDGET 8 — NOTAS
══════════════════════════════════════════════════════════════════ */
function NotesWidget() {
  const { data, isLoading } = useDashNotes()
  const notes  = data ?? []
  const latest = notes[0]

  return (
    <Widget icon={<FileText size={14} />} title="Notas" to="/notas">
      {isLoading ? (
        <div className="space-y-2"><Sk w="w-12" h="h-6" /><Sk w="w-full" /></div>
      ) : (
        <>
          <BigStat value={notes.length} label={`nota${notes.length !== 1 ? 's' : ''} salva${notes.length !== 1 ? 's' : ''}`} color="#a78bfa" />
          {latest ? (
            <div className="mt-3 bg-bg rounded-xl px-3 py-2">
              <div style={{ fontSize: 9, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>
                Mais recente
              </div>
              <div className="text-ink-2 text-xs line-clamp-2" style={{ lineHeight: 1.5 }}>
                {latest.title || 'Sem titulo'}
              </div>
            </div>
          ) : (
            <p className="text-ink-3 text-xs mt-2">Nenhuma nota ainda.</p>
          )}
        </>
      )}
    </Widget>
  )
}

/* ══════════════════════════════════════════════════════════════════
   WIDGET 9 — BIBLIOTECA
══════════════════════════════════════════════════════════════════ */
function LibraryWidget() {
  const { data, isLoading } = useDashBooks()
  const books   = data ?? []
  const reading = books.filter((b) => b.status === 'lendo')
  const readCnt = books.filter((b) => b.status === 'lido').length
  const current = reading[0]

  return (
    <Widget icon={<BookOpen size={14} />} title="Biblioteca" to="/biblioteca">
      {isLoading ? (
        <div className="space-y-2"><Sk w="w-16" h="h-6" /><Sk /><Sk w="w-4/5" /></div>
      ) : (
        <>
          <BigStat value={readCnt} label="lidos" color="#34d399" />
          {current ? (
            <div className="mt-3 bg-bg rounded-xl px-3 py-2.5">
              <div style={{ fontSize: 9, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>
                Lendo agora
              </div>
              <div className="text-ink text-xs font-semibold truncate mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                {current.title}
              </div>
              {current.author && (
                <div className="text-ink-3 truncate mb-1.5" style={{ fontSize: 10 }}>{current.author}</div>
              )}
              {current.total_pages && current.pages_read ? (
                <>
                  <Bar pct={(current.pages_read / current.total_pages) * 100} color="#0EA5E9" />
                  <div className="text-right mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#0EA5E9' }}>
                    {current.pages_read}/{current.total_pages}p
                  </div>
                </>
              ) : current.progress ? (
                <>
                  <Bar pct={current.progress} color="#0EA5E9" />
                  <div className="text-right mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#0EA5E9' }}>
                    {current.progress}%
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <p className="text-ink-3 text-xs mt-2">
              {books.length === 0 ? 'Nenhum livro cadastrado.' : 'Nenhum livro em leitura.'}
            </p>
          )}
        </>
      )}
    </Widget>
  )
}

/* ══════════════════════════════════════════════════════════════════
   WIDGET 10 — STREAK
══════════════════════════════════════════════════════════════════ */
function StreakWidget() {
  const { isLoading, topStreak } = useDashHabits()
  const color = topStreak.streak >= 14 ? '#f59e0b' : topStreak.streak >= 7 ? '#fbbf24' : '#0EA5E9'

  return (
    <Widget icon={<Zap size={14} />} title="Maior Streak" to="/habitos">
      {isLoading ? (
        <div className="space-y-2"><Sk w="w-16" h="h-8" /><Sk w="w-3/4" /></div>
      ) : topStreak.streak === 0 ? (
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 26, color: '#444', lineHeight: 1 }}>
            —
          </div>
          <p className="text-ink-3 text-xs mt-1">Marque habitos para iniciar streak.</p>
        </div>
      ) : (
        <>
          <div className="flex items-end gap-1.5 mb-1">
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 32, color, lineHeight: 1 }}>
              {topStreak.streak}
            </div>
            <div className="text-ink-2 pb-0.5" style={{ fontSize: 12 }}>dias</div>
          </div>
          <div className="text-ink-2 text-xs truncate mb-2">{topStreak.name}</div>
          <div>
            {[...Array(Math.min(topStreak.streak, 14))].map((_, i) => (
              <span
                key={i}
                className="inline-block rounded-sm mr-0.5 mb-0.5"
                style={{ width: 8, height: 8, background: color, opacity: 0.3 + (i / Math.max(topStreak.streak - 1, 1)) * 0.7 }}
              />
            ))}
          </div>
        </>
      )}
    </Widget>
  )
}

/* ══════════════════════════════════════════════════════════════════
   BRIEFING CARD
══════════════════════════════════════════════════════════════════ */
function BriefingCard() {
  const { data, isLoading, isError, refetch, isFetching } = useDailyBriefing()

  return (
    <div className="rounded-2xl border border-line bg-bg-2 overflow-hidden mb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-line">
        <div className="flex items-center gap-2.5">
          <Sparkles size={15} color="#0EA5E9" />
          <span
            style={{
              fontFamily: 'Sora, sans-serif',
              fontSize: 13,
              fontWeight: 700,
              color: '#0EA5E9',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Briefing do dia
          </span>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-ink-3 hover:text-ink transition-colors"
          style={{ fontSize: 12, background: 'none', border: 'none', cursor: isFetching ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {isLoading || isFetching ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded bg-bg-3"
                style={{ height: 14, width: i === 3 ? '60%' : '100%' }}
              />
            ))}
          </div>
        ) : isError ? (
          <p style={{ fontSize: 13, color: '#f87171' }}>
            Não foi possível gerar o briefing. Tente novamente.
          </p>
        ) : (
          <div>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.75,
                color: '#d4d4d4',
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {data?.briefing}
            </p>
            {data?.generatedAt && (
              <p style={{ fontSize: 11, color: '#4b5563', marginTop: 12 }}>
                Gerado às{' '}
                {new Date(data.generatedAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export function DashboardPage() {
  const { user } = useAuth()
  const { data: profile } = useProfile()

  const displayName = profile?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'voce'

  return (
    <div>
      {/* Greeting */}
      <div className="mb-7">
        <h1
          style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(22px, 4vw, 34px)',
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
          }}
        >
          {greeting()},{' '}
          <span style={{ color: '#0EA5E9' }}>{displayName}</span>
        </h1>
        <p className="text-ink-2 mt-1.5" style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13 }}>
          {longDate()}
        </p>
      </div>

      <LifeScoreSection />

      {/* Widget grid */}
      <div
        style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}
      >
        Modulos
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <TasksWidget />
        <NotesWidget />
        <AgendaWidget />
        <ProjectsWidget />
        <GoalsWidget />
        <SportsWidget />
        <HabitsWidget />
        <LibraryWidget />
        <StreakWidget />
      </div>
    </div>
  )
}
