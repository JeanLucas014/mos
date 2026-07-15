import {
  CheckSquare, Flame, FolderOpen, Target,
  Activity, FileText, BookOpen, Zap,
  ArrowRight, CalendarDays, DollarSign,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
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
  useDashRecorrentes,
} from '../../hooks/useDashboard'
import { greeting, longDate, daysUntil, fmtEventTime } from './utils'
import { Sk, Bar, Widget, BigStat } from './components/shared'
import { LifeScoreSection } from './components/LifeScoreSection'
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
                  <span style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3, flexShrink: 0 }}>●</span>
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
              style={{ borderLeft: `3px solid ${ev.color ?? 'var(--blue)'}` }}
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
    live: '#6ee7b7', pausado: 'var(--text3)',
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
                        color: STATUS_COLOR[p.status] ?? 'var(--text2)',
                        background: (STATUS_COLOR[p.status] ?? 'var(--text2)') + '18',
                      }}
                    >
                      {p.status}
                    </span>
                  </div>
                  <Bar pct={p.progress} color={STATUS_COLOR[p.status] ?? '#0EA5E9'} />
                  <div className="text-right mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--text3)' }}>
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
              <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>
                km no mes
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 800, color: '#0EA5E9' }}>
                {kmMonth.toFixed(1)}
              </div>
            </div>
            <div className="bg-bg rounded-xl px-3 py-2.5">
              <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>
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
              <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>
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
              <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>
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
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 26, color: 'var(--text3)', lineHeight: 1 }}>
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
   WIDGET — FINANCEIRO
══════════════════════════════════════════════════════════════════ */
function FinanceiroWidget() {
  const financas    = useDashFinancas()
  const recorrentes = useDashRecorrentes()

  const saldo     = financas.data?.saldo    ?? 0
  const receitas  = financas.data?.receitas ?? 0
  const despesas  = financas.data?.despesas ?? 0
  const vencidas  = recorrentes.data?.vencidas  ?? []
  const venceHoje = recorrentes.data?.venceHoje ?? []
  const alertas   = [...vencidas, ...venceHoje]

  const today = new Date().getDate()

  return (
    <Link to="/financeiro" className="block rounded-2xl border border-line bg-bg-2 p-[18px] hover:border-line/60 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <DollarSign size={13} className="text-ink-3" />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Financeiro
          </span>
        </div>
        <ArrowRight size={13} className="text-ink-3" />
      </div>

      {/* Saldo */}
      <div className="mb-4">
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>
          {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </div>
        <div style={{
          fontSize: 22,
          fontWeight: 500,
          fontFamily: 'Sora, sans-serif',
          lineHeight: 1,
          color: saldo >= 0 ? 'var(--text)' : '#ef4444',
        }}>
          {saldo < 0 ? '-' : ''}R$ {Math.abs(saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex gap-3 mt-1.5">
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            ↑ R$ {receitas.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            ↓ R$ {despesas.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Alertas — só se houver */}
      {alertas.length > 0 && (
        <>
          <div style={{ height: 1, background: 'var(--bg3)', marginBottom: 12 }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 8 }}>
            Atenção
          </div>
          <div>
            {vencidas.map((r: any, i: number) => (
              <div
                key={r.id}
                className="flex items-center justify-between"
                style={{ padding: '8px 0', borderBottom: i < vencidas.length - 1 || venceHoje.length > 0 ? '1px solid var(--border)' : undefined }}
              >
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)' }}>{r.nome}</div>
                  <div style={{ fontSize: 10.5, color: '#ef4444', marginTop: 1 }}>
                    Venceu há {today - r.dia_previsto} dia(s)
                  </div>
                </div>
                {r.valor > 0 && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
                    R$ {Number(r.valor).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </div>
                )}
              </div>
            ))}
            {venceHoje.map((r: any, i: number) => (
              <div
                key={r.id}
                className="flex items-center justify-between"
                style={{ padding: '8px 0', borderBottom: i < venceHoje.length - 1 ? '1px solid var(--border)' : undefined }}
              >
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)' }}>{r.nome}</div>
                  <div style={{ fontSize: 10.5, color: '#f59e0b', marginTop: 1 }}>Vence hoje</div>
                </div>
                {r.valor > 0 && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
                    R$ {Number(r.valor).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Sem alertas */}
      {alertas.length === 0 && !financas.isLoading && (
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>Nenhuma conta vencida ou com vencimento hoje.</div>
      )}
    </Link>
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
        style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}
      >
        Modulos
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FinanceiroWidget />
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
