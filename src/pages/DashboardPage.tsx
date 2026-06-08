import {
  CheckSquare, Flame, FolderOpen, Target,
  Receipt, Activity, FileText, BookOpen, Zap,
  ArrowRight, CalendarDays,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import {
  useDashTasks,
  useDashHabits,
  useDashProjects,
  useDashGoals,
  useDashInvoices,
  useDashSports,
  useDashNotes,
  useDashBooks,
  useDashEvents,
} from '../hooks/useDashboard'

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

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function daysUntil(dateStr: string): number {
  const t = new Date(); t.setHours(0, 0, 0, 0)
  const d = new Date(dateStr + 'T12:00:00')
  return Math.ceil((d.getTime() - t.getTime()) / 86_400_000)
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
  const pending = data ?? []
  const top3    = pending.slice(0, 3)

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

const EVENT_CAT_COLOR: Record<string, string> = {
  treino:  '#22c55e',
  reuniao: '#0EA5E9',
  estudo:  '#f59e0b',
  geral:   '#71717a',
}

const EVENT_CAT_LABEL: Record<string, string> = {
  treino:  'Treino',
  reuniao: 'Reunião',
  estudo:  'Estudo',
  geral:   'Geral',
}

function fmtEventTime(iso: string): string {
  const ev   = new Date(iso)
  const now  = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const evStr    = ev.toISOString().slice(0, 10)
  const tmw = new Date(now); tmw.setDate(now.getDate() + 1)
  const tmwStr   = tmw.toISOString().slice(0, 10)
  const hhmm = `${String(ev.getHours()).padStart(2,'0')}:${String(ev.getMinutes()).padStart(2,'0')}`
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
          {events.map(ev => {
            const color = EVENT_CAT_COLOR[ev.category] ?? EVENT_CAT_COLOR.geral
            const label = EVENT_CAT_LABEL[ev.category] ?? 'Geral'
            return (
              <li
                key={ev.id}
                className="rounded-xl px-3 py-2 bg-bg"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                <div
                  className="text-ink text-xs font-semibold truncate mb-1"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  {ev.title}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 7px',
                      borderRadius: 20, background: color + '20', color,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </span>
                  <span className="text-ink-3" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                    {fmtEventTime(ev.starts_at)}
                  </span>
                </div>
              </li>
            )
          })}
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
   WIDGET 6 — FATURAMENTO
══════════════════════════════════════════════════════════════════ */
function InvoicesWidget() {
  const { data, isLoading } = useDashInvoices()

  return (
    <Widget icon={<Receipt size={14} />} title="Faturamento" to="/faturamento">
      {isLoading ? (
        <div className="space-y-2"><Sk w="w-32" h="h-6" /><Sk w="w-24" /></div>
      ) : (
        <>
          <BigStat value={fmtBRL(data?.total ?? 0)} label="a receber" color="#0EA5E9" />
          <div className="mt-2 flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: (data?.count ?? 0) > 0 ? '#fbbf24' : '#34d399' }}
            />
            <span className="text-ink-3" style={{ fontSize: 11 }}>
              {data?.count ?? 0} fatura{(data?.count ?? 0) !== 1 ? 's' : ''} pendente{(data?.count ?? 0) !== 1 ? 's' : ''}
            </span>
          </div>
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

      {/* Widget grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <TasksWidget />
        <HabitsWidget />
        <AgendaWidget />
        <ProjectsWidget />
        <GoalsWidget />
        <InvoicesWidget />
        <SportsWidget />
        <NotesWidget />
        <LibraryWidget />
        <StreakWidget />
      </div>
    </div>
  )
}
