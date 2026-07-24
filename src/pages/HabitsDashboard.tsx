import { useMemo } from 'react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { Target, ListChecks, Trophy, Flame, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import type { HabitWithLogs } from '../hooks/useHabits'
import { formatLocalDate, todayLocal } from '../lib/dates'

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

/* ── date helpers (locais a este arquivo — não reaproveitam os de
 * HabitsPage.tsx pra não mexer em nada da tela existente) ─────── */
function createdLocalDateStr(habit: HabitWithLogs): string {
  return formatLocalDate(new Date(habit.created_at))
}

/** Conta dias no intervalo [fromDs, toDs] em que o hábito já existia
 * (created_at) — `toDs` já deve vir clampado a "hoje" pelo chamador,
 * nunca conta dia futuro como "possível". */
function countPossibleDays(habit: HabitWithLogs, fromDs: string, toDs: string): number {
  const createdDs = createdLocalDateStr(habit)
  const start = fromDs > createdDs ? fromDs : createdDs
  if (start > toDs) return 0
  const startD = new Date(start + 'T00:00:00')
  const endD   = new Date(toDs + 'T00:00:00')
  return Math.round((endD.getTime() - startD.getTime()) / 86_400_000) + 1
}

function countDoneDays(habit: HabitWithLogs, fromDs: string, toDs: string): number {
  return habit.logs.filter(l => l.log_date >= fromDs && l.log_date <= toDs).length
}

/** Maior sequência de dias consecutivos já alcançada na história do
 * hábito (não é o streak atual — é o recorde). Dias de exceção não
 * quebram a sequência, mesma regra do streak atual em useHabits.ts. */
function calcRecordStreak(habit: HabitWithLogs): { days: number; endDate: string | null } {
  const doneDates = [...new Set(habit.logs.map(l => l.log_date))].sort()
  if (doneDates.length === 0) return { days: 0, endDate: null }
  const exSet = new Set(habit.exceptions.map(e => e.exception_date))

  let best = 1
  let bestEnd = doneDates[0]
  let current = 1
  for (let i = 1; i < doneDates.length; i++) {
    const prevD = new Date(doneDates[i - 1] + 'T00:00:00')
    const currD = new Date(doneDates[i] + 'T00:00:00')
    const gapDays = Math.round((currD.getTime() - prevD.getTime()) / 86_400_000)

    let exceptionsInGap = 0
    const cursor = new Date(prevD)
    for (let d = 1; d < gapDays; d++) {
      cursor.setDate(cursor.getDate() + 1)
      if (exSet.has(formatLocalDate(cursor))) exceptionsInGap++
    }
    const brokenDays = gapDays - 1 - exceptionsInGap
    current = brokenDays === 0 ? current + 1 : 1
    if (current > best) { best = current; bestEnd = doneDates[i] }
  }
  return { days: best, endDate: bestEnd }
}

function mondayOfDs(ds: string): string {
  const d = new Date(ds + 'T00:00:00')
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return formatLocalDate(d)
}

interface WeekPoint { weekStart: string; pct: number; hadAnyHabit: boolean }

function monthLabel(ds: string): string {
  return MONTH_NAMES[new Date(ds + 'T12:00:00').getMonth()]
}

/* ── card genérico ────────────────────────────────────────────── */
function StatCard({
  icon, label, value, sub, subColor,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  subColor?: string
}) {
  return (
    <div className="bg-bg-2 border border-line rounded-card p-4">
      <div className="flex items-center gap-1.5 text-ink-3 mb-2" style={{ fontSize: 11 }}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="font-bold text-white" style={{ fontFamily: 'Sora, sans-serif', fontSize: 24 }}>
        {value}
      </div>
      {sub && (
        <div className="mt-1 truncate" style={{ fontSize: 11, color: subColor ?? 'var(--text3)' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

/* ── dashboard ─────────────────────────────────────────────────── */
export function HabitsDashboard({ habits }: { habits: HabitWithLogs[] }) {
  const todayDs = todayLocal()
  const now = new Date()

  const monthStartDs = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1))
  const daysElapsedInMonth = now.getDate()
  const monthLabelFull = `${MONTH_NAMES[now.getMonth()][0].toUpperCase()}${MONTH_NAMES[now.getMonth()].slice(1)} de ${now.getFullYear()}`

  const monthStats = useMemo(() => {
    let done = 0, possible = 0
    for (const h of habits) {
      possible += countPossibleDays(h, monthStartDs, todayDs)
      done     += countDoneDays(h, monthStartDs, todayDs)
    }
    const pct = possible > 0 ? (done / possible) * 100 : null
    return { done, possible, pct }
  }, [habits, monthStartDs, todayDs])

  const prevMonthStats = useMemo(() => {
    const prevMonthStartDs = formatLocalDate(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    const prevMonthEndDs   = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 0))
    let done = 0, possible = 0
    for (const h of habits) {
      possible += countPossibleDays(h, prevMonthStartDs, prevMonthEndDs)
      done     += countDoneDays(h, prevMonthStartDs, prevMonthEndDs)
    }
    return { pct: possible > 0 ? (done / possible) * 100 : null, label: monthLabel(prevMonthStartDs) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, now.getFullYear(), now.getMonth()])

  const recordInfo = useMemo(() => {
    let best = { days: 0, habitName: '', endDate: null as string | null }
    for (const h of habits) {
      const r = calcRecordStreak(h)
      if (r.days > best.days) best = { days: r.days, habitName: h.name, endDate: r.endDate }
    }
    return best
  }, [habits])

  const activeStreakInfo = useMemo(() => {
    let best = { days: 0, habitName: '' }
    for (const h of habits) {
      if (h.streak > best.days) best = { days: h.streak, habitName: h.name }
    }
    return best
  }, [habits])

  const weeklySeries = useMemo<WeekPoint[]>(() => {
    const thisMonday = mondayOfDs(todayDs)
    const raw: WeekPoint[] = []
    for (let i = 11; i >= 0; i--) {
      const weekStartD = new Date(thisMonday + 'T00:00:00')
      weekStartD.setDate(weekStartD.getDate() - i * 7)
      const weekStartDs = formatLocalDate(weekStartD)
      const weekEndD = new Date(weekStartD)
      weekEndD.setDate(weekEndD.getDate() + 6)
      const weekEndDs = formatLocalDate(weekEndD) > todayDs ? todayDs : formatLocalDate(weekEndD)

      let done = 0, possible = 0
      for (const h of habits) {
        possible += countPossibleDays(h, weekStartDs, weekEndDs)
        done     += countDoneDays(h, weekStartDs, weekEndDs)
      }
      raw.push({ weekStart: weekStartDs, pct: possible > 0 ? Math.round((done / possible) * 100) : 0, hadAnyHabit: possible > 0 })
    }
    // Corta semanas iniciais em que nenhum hábito existia ainda — "o
    // máximo disponível" em vez de sempre forçar 12 pontos com zeros falsos.
    const firstReal = raw.findIndex(w => w.hadAnyHabit)
    return firstReal === -1 ? raw.slice(-1) : raw.slice(firstReal)
  }, [habits, todayDs])

  const trend = useMemo<'up' | 'down' | 'neutral'>(() => {
    const arr = weeklySeries
    if (arr.length < 2) return 'neutral'
    const n = Math.min(4, Math.floor(arr.length / 2))
    if (n === 0) return 'neutral'
    const recent = arr.slice(-n)
    const older  = arr.slice(-n * 2, -n)
    if (older.length === 0) return 'neutral'
    const avg = (xs: WeekPoint[]) => xs.reduce((s, w) => s + w.pct, 0) / xs.length
    const recentAvg = avg(recent), olderAvg = avg(older)
    if (recentAvg > olderAvg) return 'up'
    if (recentAvg < olderAvg) return 'down'
    return 'neutral'
  }, [weeklySeries])

  const habitCards = useMemo(() => {
    return habits
      .map(h => {
        const possible = countPossibleDays(h, monthStartDs, todayDs)
        const done     = countDoneDays(h, monthStartDs, todayDs)
        const pct      = possible > 0 ? (done / possible) * 100 : 0
        return { habit: h, pct, done, possible, record: calcRecordStreak(h).days }
      })
      .sort((a, b) => b.pct - a.pct)
  }, [habits, monthStartDs, todayDs])

  const deltaPct = monthStats.pct !== null && prevMonthStats.pct !== null
    ? Math.round(monthStats.pct - prevMonthStats.pct)
    : null

  return (
    <div className="mt-10">
      {/* Cabeçalho */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
          Progresso
        </h2>
        <p className="text-ink-3 mt-0.5" style={{ fontSize: 12 }}>
          {monthLabelFull} · {daysElapsedInMonth} dia{daysElapsedInMonth !== 1 ? 's' : ''}
        </p>
      </div>

      {/* 4 cards de visão geral */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard
          icon={<Target size={12} />}
          label="Conclusão do mês"
          value={monthStats.pct !== null ? `${Math.round(monthStats.pct)}%` : '—'}
          sub={
            deltaPct === null ? 'sem dado do mês anterior'
              : deltaPct === 0 ? `= vs ${prevMonthStats.label}`
              : `${deltaPct > 0 ? '↑' : '↓'} ${Math.abs(deltaPct)}% vs ${prevMonthStats.label}`
          }
          subColor={deltaPct === null || deltaPct === 0 ? 'var(--text3)' : deltaPct > 0 ? '#34d399' : '#E24B4A'}
        />
        <StatCard
          icon={<ListChecks size={12} />}
          label="Total no mês"
          value={`${monthStats.done} / ${monthStats.possible}`}
          sub="marcações"
        />
        <StatCard
          icon={<Trophy size={12} />}
          label="Melhor sequência"
          value={recordInfo.days > 0 ? `${recordInfo.days}d` : '—'}
          sub={recordInfo.days > 0 ? `${recordInfo.habitName} · em ${monthLabel(recordInfo.endDate!)}` : undefined}
        />
        <StatCard
          icon={<Flame size={12} />}
          label="Streak ativo"
          value={activeStreakInfo.days > 0 ? `${activeStreakInfo.days}d` : '—'}
          sub={activeStreakInfo.days > 0 ? activeStreakInfo.habitName : undefined}
        />
      </div>

      {/* Evolução */}
      <div className="bg-bg-2 border border-line rounded-card p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Evolução</div>
            <div className="text-ink-3" style={{ fontSize: 11 }}>Taxa de conclusão por semana</div>
          </div>
          <div
            className="flex items-center gap-1"
            style={{ fontSize: 11, color: trend === 'up' ? '#34d399' : trend === 'down' ? '#EF9F27' : 'var(--text3)' }}
          >
            {trend === 'up' ? <ArrowUp size={12} /> : trend === 'down' ? <ArrowDown size={12} /> : <Minus size={12} />}
            <span>tendência</span>
          </div>
        </div>
        <div style={{ height: 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklySeries}>
              <defs>
                <linearGradient id="habitsEvolFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                dataKey="pct"
                type="monotone"
                stroke="#0EA5E9"
                strokeWidth={2}
                fill="url(#habitsEvolFill)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cards por hábito */}
      {habitCards.length === 0 ? (
        <p className="text-ink-3 text-sm text-center py-6">Nenhum hábito cadastrado.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {habitCards.map(({ habit, pct, done, possible, record }) => {
            const color = pct >= 60 ? 'var(--blue)' : '#EF9F27'
            return (
              <div key={habit.id} className="bg-bg-2 border border-line rounded-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />
                    <span className="text-white font-medium truncate" style={{ fontSize: 13 }}>{habit.name}</span>
                  </div>
                  <span className="font-bold flex-shrink-0" style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, color }}>
                    {Math.round(pct)}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div>
                    <div className="text-ink-3" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Streak</div>
                    <div className="text-white font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{habit.streak}d</div>
                  </div>
                  <div>
                    <div className="text-ink-3" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recorde</div>
                    <div className="text-white font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{record}d</div>
                  </div>
                  <div>
                    <div className="text-ink-3" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>No mês</div>
                    <div className="text-white font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{done}/{possible}</div>
                  </div>
                </div>
                <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
