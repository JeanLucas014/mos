import { useState, useRef, useEffect, useCallback } from 'react'
import { useHabits, type HabitWithLogs } from '../hooks/useHabits'
import { HelpButton } from '@/components/help/HelpButton'
import { formatLocalDate } from '../lib/dates'
import { NameModal } from './Estudos/components/NameModal'

/* ── Context menu ─────────────────────────────────────────────── */
interface CtxMenuState { x: number; y: number; habitId: string; date: string }

function CtxMenu({
  state, onException, onClose,
}: {
  state: CtxMenuState
  onException: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={ref}
        className="fixed z-50 rounded-xl border border-line overflow-hidden"
        style={{ top: state.y, left: state.x, background: 'var(--bg3)', minWidth: 200, boxShadow: '0 8px 24px rgba(0,0,0,.6)' }}
      >
        <button
          onClick={() => { onException(); onClose() }}
          className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-ink-2 hover:text-ink hover:bg-bg-3 transition-colors text-left"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="#fbbf24" strokeWidth="1.4" />
            <path d="M7 4.5V7.5" stroke="#fbbf24" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="7" cy="9.5" r=".7" fill="#fbbf24" />
          </svg>
          <span>Não se aplica hoje</span>
        </button>
      </div>
    </>
  )
}

/* ── date helpers ─────────────────────────────────────────────── */
function toDateStr(d: Date) {
  return formatLocalDate(d)
}
function todayStr() {
  return toDateStr(new Date())
}
function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}
/** Monday of the week that contains `d` */
function mondayOf(d: Date) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  const dow = c.getDay() // 0=Sun
  c.setDate(c.getDate() - ((dow + 6) % 7))
  return c
}
/** 7 days starting from monday */
function weekDays(monday: Date) {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const DAY_LABELS_SHORT = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

/* ── monthly calendar helpers ─────────────────────────────────── */
function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
/** 0-based day-of-week for 1st of month, adjusted so Mon=0 */
function firstDayOffset(year: number, month: number) {
  const dow = new Date(year, month, 1).getDay()
  return (dow + 6) % 7
}

/* ── grid mensal (visão adicional) ──────────────────────────────
 * Agrupa os dias do mês em semanas Seg–Dom, sem preencher com dias de
 * outro mês — a primeira/última semana pode ter menos de 7 dias, e as
 * iniciais mostradas em cima de cada grupo já nascem alinhadas ao dia
 * real (não é um cabeçalho estático D S T Q Q S S sobre 7 colunas).
 */
interface GridDay { date: Date; ds: string; weekday: number }

function groupMonthByWeeks(year: number, month: number): GridDay[][] {
  const total = daysInMonth(year, month)
  const weeks: GridDay[][] = []
  let current: GridDay[] = []

  for (let d = 1; d <= total; d++) {
    const date = new Date(year, month, d)
    const weekday = (date.getDay() + 6) % 7 // 0=Seg..6=Dom
    if (weekday === 0 && current.length > 0) {
      weeks.push(current)
      current = []
    }
    current.push({ date, ds: formatLocalDate(date), weekday })
  }
  if (current.length > 0) weeks.push(current)
  return weeks
}

function squareState(ds: string, isDone: boolean, todayDs: string): 'done' | 'today' | 'future' | 'past' {
  if (isDone) return 'done'
  if (ds === todayDs) return 'today'
  if (ds > todayDs) return 'future'
  return 'past'
}

function MonthGridRow({
  habit, weeks, todayDs, currentWeekDs, onToggle,
}: {
  habit: HabitWithLogs
  weeks: GridDay[][]
  todayDs: string
  currentWeekDs: string[]
  onToggle: (habitId: string, ds: string) => void
}) {
  const doneSet = new Set(habit.logs.map(l => l.log_date))

  // % da semana atual (real, independe do mês navegado na grade) —
  // só conta dias já ocorridos (hoje incluso) como denominador, senão a
  // % começaria artificialmente baixa no início da semana.
  const elapsedThisWeek = currentWeekDs.filter(ds => ds <= todayDs)
  const doneThisWeek     = elapsedThisWeek.filter(ds => doneSet.has(ds))
  const weekPct = elapsedThisWeek.length > 0 ? Math.round((doneThisWeek.length / elapsedThisWeek.length) * 100) : 0

  // % do mês inteiro navegado na grade (denominador = todos os dias do mês)
  const allDaysInGrid = weeks.flat()
  const doneInGrid     = allDaysInGrid.filter(d => doneSet.has(d.ds))
  const monthPct = allDaysInGrid.length > 0 ? Math.round((doneInGrid.length / allDaysInGrid.length) * 100) : 0

  return (
    <div className="flex items-center gap-2 sm:gap-3 py-1.5">
      {/* Nome do hábito */}
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ width: 90 }}>
        <span className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />
        <span className="text-ink text-xs leading-tight" style={{ wordBreak: 'break-word' }}>{habit.name}</span>
      </div>
      {/* % do mês — empilhado abaixo do nome no mobile (ver coluna fixa oculta) */}
      <span className="sm:hidden text-[10px] font-semibold text-ink-3 flex-shrink-0" style={{ width: 28, fontFamily: 'JetBrains Mono, monospace' }}>
        {monthPct}%
      </span>

      {/* Dias do mês, agrupados por semana */}
      <div className="flex-1 flex items-center gap-[3px] overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex gap-[2px] flex-shrink-0">
            {week.map(day => {
              const state = squareState(day.ds, doneSet.has(day.ds), todayDs)
              const clickable = state !== 'future'
              return (
                <button
                  key={day.ds}
                  onClick={() => clickable && onToggle(habit.id, day.ds)}
                  disabled={!clickable}
                  aria-label={`${habit.name} — ${day.ds}`}
                  className="rounded-[3px] flex-shrink-0 transition-colors"
                  style={{
                    width: 11, height: 11,
                    cursor: clickable ? 'pointer' : 'default',
                    background: state === 'done' ? 'var(--blue)' : '#1f1f1f',
                    opacity: state === 'future' ? 0.4 : 1,
                    border: state === 'today' ? '1px solid var(--blue)' : '1px solid transparent',
                    boxSizing: 'border-box',
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Semana atual (%) */}
      <div className="flex-shrink-0 flex flex-col items-center" style={{ width: 46 }}>
        <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full" style={{ width: `${weekPct}%`, background: 'var(--blue)', transition: 'width 0.3s' }} />
        </div>
        <span className="text-[9px] text-ink-3 mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{weekPct}%</span>
      </div>

      {/* % do mês — coluna fixa (oculta no mobile, vira badge acima) */}
      <div className="hidden sm:block flex-shrink-0 text-right" style={{ width: 44 }}>
        <span className="font-bold text-white" style={{ fontSize: 15, fontFamily: 'Sora, sans-serif' }}>{monthPct}%</span>
      </div>
    </div>
  )
}

function MonthGridSection({
  habits, toggleDay,
}: {
  habits: HabitWithLogs[]
  toggleDay: (habitId: string, ds: string) => void
}) {
  const now = new Date()
  const [gy, setGy] = useState(now.getFullYear())
  const [gm, setGm] = useState(now.getMonth())

  const weeks   = groupMonthByWeeks(gy, gm)
  const todayDs = todayStr()
  const currentWeekDs = weekDays(mondayOf(new Date())).map(toDateStr)

  function prevMonth() { setGm(m => { if (m === 0) { setGy(y => y - 1); return 11 } return m - 1 }) }
  function nextMonth() { setGm(m => { if (m === 11) { setGy(y => y + 1); return 0 } return m + 1 }) }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 className="text-base font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
          Hábitos — visão mensal
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            aria-label="Mês anterior"
            className="w-7 h-7 flex items-center justify-center rounded-input bg-bg-2 border border-line text-ink-2 hover:text-ink transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="text-sm font-medium text-ink" style={{ minWidth: 110, textAlign: 'center' }}>
            {MONTH_NAMES[gm]} {gy}
          </span>
          <button
            onClick={nextMonth}
            aria-label="Próximo mês"
            className="w-7 h-7 flex items-center justify-center rounded-input bg-bg-2 border border-line text-ink-2 hover:text-ink transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="bg-bg-2 border border-line rounded-card p-3 sm:p-4">
        {habits.length === 0 ? (
          <p className="text-ink-3 text-sm text-center py-6">Nenhum hábito cadastrado.</p>
        ) : (
          <>
            {/* Cabeçalho da grade de dias — iniciais alinhadas ao dia real de cada semana */}
            <div className="flex items-center gap-2 sm:gap-3 pb-1.5 mb-1 border-b border-line">
              <div className="flex-shrink-0" style={{ width: 90 }} />
              <div className="sm:hidden flex-shrink-0" style={{ width: 28 }} />
              <div className="flex-1 flex items-center gap-[3px] overflow-x-auto">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex gap-[2px] flex-shrink-0">
                    {week.map(day => (
                      <div
                        key={day.ds}
                        className="text-center flex-shrink-0"
                        style={{ width: 11, fontSize: 9, color: '#666' }}
                      >
                        {DAY_LABELS_SHORT[day.weekday]}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex-shrink-0" style={{ width: 46 }} />
              <div className="hidden sm:block flex-shrink-0" style={{ width: 44 }} />
            </div>

            {/* Linhas — uma por hábito */}
            <div className="divide-y divide-[#171717]">
              {habits.map(h => (
                <MonthGridRow
                  key={h.id}
                  habit={h}
                  weeks={weeks}
                  todayDs={todayDs}
                  currentWeekDs={currentWeekDs}
                  onToggle={toggleDay}
                />
              ))}
            </div>
          </>
        )}

        {/* Legenda */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-line">
          {[
            { style: { background: 'var(--blue)' }, label: 'Concluído' },
            { style: { background: '#1f1f1f' }, label: 'Não feito' },
            { style: { background: '#1f1f1f', border: '1px solid var(--blue)', boxSizing: 'border-box' as const }, label: 'Hoje' },
            { style: { background: '#1f1f1f', opacity: 0.4 }, label: 'Futuro' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className="rounded-[3px] flex-shrink-0" style={{ width: 11, height: 11, ...item.style }} />
              <span className="text-[11px] text-ink-3">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── main component ───────────────────────────────────────────── */
export function HabitsPage() {
  const { habits, isLoading, isError, error, toggleDay, addHabit, updateHabit, deleteHabit, toggleException, isException } = useHabits()
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null)
  const [editingHabit, setEditingHabit] = useState<HabitWithLogs | null>(null)

  function handleDeleteHabit(habit: HabitWithLogs) {
    if (window.confirm(`Excluir hábito "${habit.name}"? Todos os registros históricos serão perdidos.`)) {
      deleteHabit.mutate(habit.id)
    }
  }
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent, habitId: string, date: string) => {
    e.preventDefault()
    setCtxMenu({ x: Math.min(e.clientX, window.innerWidth - 220), y: Math.min(e.clientY, window.innerHeight - 80), habitId, date })
  }, [])

  const startLongPress = useCallback((habitId: string, date: string, e: React.TouchEvent) => {
    const touch = e.touches[0]
    longPressTimer.current = setTimeout(() => {
      setCtxMenu({ x: Math.min(touch.clientX, window.innerWidth - 220), y: Math.min(touch.clientY, window.innerHeight - 80), habitId, date })
    }, 500)
  }, [])

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
  }, [])

  // view: 'week' | 'month'
  const [view, setView] = useState<'week' | 'month'>('week')

  // week navigation: offset in weeks from current week
  const [weekOffset, setWeekOffset] = useState(0)
  const currentMonday = mondayOf(addDays(new Date(), weekOffset * 7))
  const days = weekDays(currentMonday)
  const today = todayStr()

  // month navigation
  const now = new Date()
  const [monthYear, setMonthYear] = useState({ y: now.getFullYear(), m: now.getMonth() })

  // add habit state
  const [addingDay, setAddingDay] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const addInputRef = useRef<HTMLInputElement>(null)

  // day detail modal (monthly view)
  const [modalDay, setModalDay] = useState<string | null>(null)

  function handleAddHabit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return
    addHabit.mutate(trimmed, { onSuccess: () => { setNewName(''); setAddingDay(null) } })
  }

  /* ── progress for a single day ─────────────────────────────── */
  function progressForDay(dateStr: string) {
    if (habits.length === 0) return 0
    const done = habits.filter(h => h.logs.some(l => l.log_date === dateStr)).length
    return done / habits.length
  }

  /* ── monthly calendar grid ──────────────────────────────────── */
  const { y: mY, m: mM } = monthYear
  const totalDays = daysInMonth(mY, mM)
  const offset = firstDayOffset(mY, mM)
  // pad to 7-col grid
  const calCells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  while (calCells.length % 7 !== 0) calCells.push(null)

  /* ── modal habits for a day ─────────────────────────────────── */
  const modalDateStr = modalDay
  const modalHabits = habits.map(h => ({
    ...h,
    done: !!h.logs.find(l => l.log_date === modalDateStr),
  }))

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1
              className="text-2xl lg:text-[30px]"
              style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}
            >
              Hábitos
            </h1>
            <HelpButton pageId="habitos" />
          </div>
          <p className="text-ink-2 mt-1 text-sm">
            {isLoading ? 'Carregando…' : `${habits.length} hábito${habits.length !== 1 ? 's' : ''} cadastrado${habits.length !== 1 ? 's' : ''}.`}
          </p>
        </div>

        {/* view toggle */}
        <div className="flex items-center gap-1 bg-bg-2 border border-line rounded-input p-1" style={{ height: 36 }}>
          {(['week', 'month'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={[
                'px-3 h-full rounded-[4px] text-xs font-medium transition-colors',
                view === v ? 'bg-bg-3 text-ink' : 'text-ink-3 hover:text-ink-2',
              ].join(' ')}
            >
              {v === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <p className="text-red-400 text-sm mb-4">Erro: {(error as Error).message}</p>
      )}

      {/* ── Navigation bar ── */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => view === 'week' ? setWeekOffset(o => o - 1) : setMonthYear(({ y, m }) => m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 })}
          className="w-8 h-8 flex items-center justify-center rounded-input bg-bg-2 border border-line text-ink-2 hover:text-ink hover:bg-bg-3 transition-colors"
          aria-label="Anterior"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* label */}
        <span className="flex-1 text-center text-sm font-medium text-ink" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {view === 'week' ? (
            weekOffset === 0
              ? 'Esta semana'
              : weekOffset === -1
              ? 'Semana passada'
              : weekOffset === 1
              ? 'Próxima semana'
              : `${DAY_LABELS[0]} ${days[0].getDate()}/${days[0].getMonth() + 1} – ${DAY_LABELS[6]} ${days[6].getDate()}/${days[6].getMonth() + 1}`
          ) : (
            `${MONTH_NAMES[mM]} ${mY}`
          )}
        </span>

        <button
          onClick={() => {
            if (view === 'week') setWeekOffset(0)
            else setMonthYear({ y: now.getFullYear(), m: now.getMonth() })
          }}
          className="px-2.5 h-8 rounded-input bg-bg-2 border border-line text-xs font-medium text-ink-2 hover:text-ink hover:bg-bg-3 transition-colors"
        >
          Hoje
        </button>

        <button
          onClick={() => view === 'week' ? setWeekOffset(o => o + 1) : setMonthYear(({ y, m }) => m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 })}
          className="w-8 h-8 flex items-center justify-center rounded-input bg-bg-2 border border-line text-ink-2 hover:text-ink hover:bg-bg-3 transition-colors"
          aria-label="Próximo"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* ══════════════════════ WEEK VIEW ══════════════════════ */}
      {view === 'week' && (
        <div className="bg-bg-2 border border-line rounded-card overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-10 bg-bg-3 rounded-input animate-pulse" />)}
            </div>
          ) : (
            /* horizontal scroll wrapper — on mobile shows ~2 cols, desktop all 7 */
            <div className="overflow-x-auto">
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(7, minmax(120px, 1fr))`,
                  minWidth: 840,
                }}
              >
                {days.map((day, di) => {
                  const ds = toDateStr(day)
                  const isToday = ds === today
                  const doneCount = habits.filter(h => h.logs.some(l => l.log_date === ds)).length
                  const pct = habits.length > 0 ? (doneCount / habits.length) * 100 : 0

                  return (
                    <div
                      key={ds}
                      className={[
                        'flex flex-col border-r border-line last:border-r-0',
                        isToday ? 'bg-[rgba(14,165,233,0.04)]' : '',
                      ].join(' ')}
                      style={{ minHeight: 220 }}
                    >
                      {/* Day header */}
                      <div
                        className={[
                          'px-3 py-2.5 border-b border-line flex items-center justify-between gap-1',
                          isToday ? 'border-brand/30' : '',
                        ].join(' ')}
                      >
                        <div>
                          <div
                            className={[
                              'text-xs font-semibold uppercase tracking-wide',
                              isToday ? 'text-brand' : 'text-ink-2',
                            ].join(' ')}
                            style={{ fontSize: 10, letterSpacing: '0.08em' }}
                          >
                            {DAY_LABELS[di]}
                          </div>
                          <div
                            className={[
                              'font-semibold leading-tight mt-0.5',
                              isToday ? 'text-brand' : 'text-ink',
                            ].join(' ')}
                            style={{ fontSize: 15, fontFamily: 'JetBrains Mono, monospace' }}
                          >
                            {day.getDate()}
                            <span
                              className="text-ink-3 ml-0.5"
                              style={{ fontSize: 10, fontFamily: 'Manrope, sans-serif', fontWeight: 400 }}
                            >
                              /{day.getMonth() + 1}
                            </span>
                          </div>
                        </div>
                        {isToday && (
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0"
                          />
                        )}
                      </div>

                      {/* Habit list */}
                      <div className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto" style={{ maxHeight: 260 }}>
                        {habits.length === 0 && (
                          <p className="text-ink-3 text-center py-4" style={{ fontSize: 11 }}>
                            Nenhum hábito
                          </p>
                        )}
                        {habits.map(habit => {
                          const done = habit.logs.some(l => l.log_date === ds)
                          return (
                            <div
                              key={habit.id}
                              className="group flex items-center gap-1.5 px-1 py-1 rounded-[5px] hover:bg-bg-3 transition-colors"
                            >
                              {/* checkbox */}
                              {isException(habit.id, ds) ? (
                                <button
                                  onContextMenu={(e) => handleContextMenu(e, habit.id, ds)}
                                  onTouchStart={(e) => startLongPress(habit.id, ds, e)}
                                  onTouchEnd={cancelLongPress}
                                  onClick={() => toggleException.mutate({ habitId: habit.id, date: ds })}
                                  className="w-4 h-4 rounded-[3px] border flex-shrink-0 flex items-center justify-center transition-colors border-amber-500/40"
                                  style={{ minWidth: 16, background: 'rgba(251,191,36,.1)' }}
                                  title="Exceção — clique para remover"
                                >
                                  <span style={{ fontSize: 8, color: '#fbbf24', lineHeight: 1 }}>—</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => toggleDay.mutate({ habitId: habit.id, date: ds })}
                                  onContextMenu={(e) => handleContextMenu(e, habit.id, ds)}
                                  onTouchStart={(e) => startLongPress(habit.id, ds, e)}
                                  onTouchEnd={cancelLongPress}
                                  className={[
                                    'w-4 h-4 rounded-[3px] border flex-shrink-0 flex items-center justify-center transition-colors',
                                    done ? 'bg-brand border-brand' : 'border-ink-3 hover:border-ink-2',
                                  ].join(' ')}
                                  style={{ minWidth: 16 }}
                                  aria-label={done ? 'Desmarcar' : 'Marcar'}
                                >
                                  {done && (
                                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                                      <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </button>
                              )}

                              {/* name */}
                              <span
                                className={[
                                  'flex-1 truncate leading-tight',
                                  done ? 'text-ink-3 line-through' : isException(habit.id, ds) ? 'text-ink-3 italic' : 'text-ink',
                                ].join(' ')}
                                style={{ fontSize: 12 }}
                              >
                                {habit.name}
                              </span>

                              {/* editar/excluir — só aparecem no 1º dia (evita repetir 7×) */}
                              {di === 0 && (
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                                  <button
                                    onClick={() => setEditingHabit(habit)}
                                    className="text-ink-3 hover:text-ink flex items-center justify-center"
                                    style={{ width: 18, height: 18 }}
                                    title="Editar hábito"
                                  >
                                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                                      <path d="M9.5 2.5l2 2L4.5 11.5l-2.5.5.5-2.5 7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteHabit(habit)}
                                    className="text-ink-3 hover:text-red-400 flex items-center justify-center"
                                    style={{ width: 18, height: 18, fontSize: 14, lineHeight: 1 }}
                                    title="Excluir hábito"
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Add habit inline */}
                      {addingDay === ds ? (
                        <form
                          onSubmit={handleAddHabit}
                          className="px-2 pb-2 flex gap-1"
                        >
                          <input
                            ref={addInputRef}
                            autoFocus
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Nome…"
                            className="flex-1 min-w-0 bg-bg border border-line rounded-[5px] px-2 py-1 text-ink text-xs placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
                            style={{ minHeight: 28 }}
                            onKeyDown={e => { if (e.key === 'Escape') { setAddingDay(null); setNewName('') } }}
                          />
                          <button
                            type="submit"
                            disabled={!newName.trim() || addHabit.isPending}
                            className="flex-shrink-0 bg-brand text-white rounded-[5px] px-2 text-xs font-semibold disabled:opacity-40"
                            style={{ minHeight: 28 }}
                          >
                            OK
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => { setAddingDay(ds); setNewName('') }}
                          className="mx-2 mb-2 flex items-center gap-1 text-ink-3 hover:text-ink-2 transition-colors"
                          style={{ fontSize: 11 }}
                        >
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          Hábito
                        </button>
                      )}

                      {/* Progress bar */}
                      <div className="px-2 pb-2.5">
                        <div
                          className="h-[3px] rounded-full overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.06)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              background: pct === 100 ? '#34d399' : pct >= 50 ? 'var(--blue)' : '#fbbf24',
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-1" style={{ fontSize: 9 }}>
                          <span className="text-ink-3">
                            {doneCount}/{habits.length}
                          </span>
                          <span className={pct === 100 ? 'text-ok' : 'text-ink-3'}>
                            {Math.round(pct)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Streak summary row */}
          {!isLoading && habits.length > 0 && (
            <div className="border-t border-line px-4 py-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {habits.map(h => (
                <div key={h.id} className="flex items-center gap-1.5">
                  <span className="text-ink-2" style={{ fontSize: 11 }}>{h.name}</span>
                  <span className="text-brand font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                    {h.streak > 0 ? `${h.streak}d` : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════ MONTH VIEW ══════════════════════ */}
      {view === 'month' && (
        <div className="bg-bg-2 border border-line rounded-card overflow-hidden">
          {/* Day-of-week header */}
          <div className="grid grid-cols-7 border-b border-line">
            {DAY_LABELS_SHORT.map((l, i) => (
              <div
                key={i}
                className="py-2 text-center text-ink-3 font-semibold uppercase"
                style={{ fontSize: 10, letterSpacing: '0.08em' }}
              >
                {l}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calCells.map((day, idx) => {
              if (day === null) {
                return (
                  <div
                    key={`e-${idx}`}
                    className="border-r border-b border-line last:border-r-0"
                    style={{ minHeight: 64 }}
                  />
                )
              }
              const ds = `${mY}-${String(mM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isToday = ds === today
              const pct = progressForDay(ds)
              const doneCount = habits.filter(h => h.logs.some(l => l.log_date === ds)).length
              const isLastInRow = (idx + 1) % 7 === 0

              return (
                <button
                  key={ds}
                  onClick={() => setModalDay(prev => prev === ds ? null : ds)}
                  className={[
                    'text-left p-2 border-b border-line transition-colors hover:bg-bg-3',
                    !isLastInRow ? 'border-r' : '',
                    isToday ? 'bg-[rgba(14,165,233,0.06)]' : '',
                    modalDay === ds ? 'bg-bg-3' : '',
                  ].join(' ')}
                  style={{ minHeight: 64 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={[
                        'font-semibold',
                        isToday ? 'text-brand' : 'text-ink',
                      ].join(' ')}
                      style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {day}
                    </span>
                    {habits.length > 0 && (
                      <span
                        className={[
                          'text-[9px] font-medium',
                          pct === 1 ? 'text-ok' : pct > 0 ? 'text-brand' : 'text-ink-3',
                        ].join(' ')}
                      >
                        {doneCount}/{habits.length}
                      </span>
                    )}
                  </div>

                  {/* mini progress bar */}
                  {habits.length > 0 && (
                    <div
                      className="h-[3px] rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct * 100}%`,
                          background: pct === 1 ? '#34d399' : pct >= 0.5 ? 'var(--blue)' : '#fbbf24',
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Day detail modal */}
          {modalDay && (
            <div className="border-t border-line px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-ink" style={{ fontFamily: 'Sora, sans-serif', fontSize: 13 }}>
                  {(() => {
                    const d = new Date(modalDay + 'T12:00:00')
                    return `${DAY_LABELS[(d.getDay() + 6) % 7]}, ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`
                  })()}
                </h3>
                <button
                  onClick={() => setModalDay(null)}
                  className="text-ink-3 hover:text-ink transition-colors"
                  style={{ fontSize: 18, lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
              {habits.length === 0 ? (
                <p className="text-ink-3 text-sm text-center py-4">Nenhum hábito cadastrado.</p>
              ) : (
                <div className="space-y-1">
                  {modalHabits.map(h => {
                    const isExc = isException(h.id, modalDay!)
                    return (
                    <div
                      key={h.id}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-input hover:bg-bg-3 transition-colors"
                      onContextMenu={(e) => handleContextMenu(e, h.id, modalDay!)}
                    >
                      {isExc ? (
                        <button
                          onClick={() => toggleException.mutate({ habitId: h.id, date: modalDay! })}
                          className="w-[18px] h-[18px] rounded-[4px] border flex-shrink-0 flex items-center justify-center"
                          style={{ borderColor: 'rgba(251,191,36,.4)', background: 'rgba(251,191,36,.1)' }}
                          title="Exceção"
                        >
                          <span style={{ fontSize: 10, color: '#fbbf24', lineHeight: 1 }}>—</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleDay.mutate({ habitId: h.id, date: modalDay! })}
                          className={[
                            'w-[18px] h-[18px] rounded-[4px] border flex-shrink-0 flex items-center justify-center transition-colors',
                            h.done ? 'bg-brand border-brand' : 'border-ink-3 hover:border-ink-2',
                          ].join(' ')}
                        >
                          {h.done && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      )}
                      <span className={['flex-1 text-sm', h.done ? 'text-ink-3 line-through' : isExc ? 'text-ink-3 italic' : 'text-ink'].join(' ')}>
                        {h.name}
                      </span>
                      <span className="text-brand text-xs font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {h.streak > 0 ? `${h.streak}d` : ''}
                      </span>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Add habit strip */}
          <div className="border-t border-line px-4 py-3">
            {addingDay === 'month' ? (
              <form onSubmit={handleAddHabit} className="flex gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Novo hábito…"
                  className="flex-1 bg-bg border border-line rounded-input px-3 text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
                  style={{ minHeight: 40 }}
                  onKeyDown={e => { if (e.key === 'Escape') { setAddingDay(null); setNewName('') } }}
                />
                <button
                  type="submit"
                  disabled={!newName.trim() || addHabit.isPending}
                  className="bg-brand text-white rounded-input px-4 text-sm font-semibold hover:brightness-110 disabled:opacity-40 transition-all"
                  style={{ minHeight: 40 }}
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => { setAddingDay(null); setNewName('') }}
                  className="text-ink-3 hover:text-ink px-2 transition-colors"
                  style={{ minHeight: 40 }}
                >
                  ×
                </button>
              </form>
            ) : (
              <button
                onClick={() => setAddingDay('month')}
                className="flex items-center gap-2 text-ink-2 hover:text-ink transition-colors text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Novo hábito
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ VISÃO ADICIONAL — GRADE MENSAL (comparação de UX) ══════════════
          Coexiste com a tela acima pra testar as duas em uso real antes de decidir
          qual manter — não substitui nem esconde nada do que já existe. */}
      <MonthGridSection
        habits={habits}
        toggleDay={(habitId, ds) => toggleDay.mutate({ habitId, date: ds })}
      />

      {/* Context menu */}
      {ctxMenu && (
        <CtxMenu
          state={ctxMenu}
          onException={() => toggleException.mutate({ habitId: ctxMenu.habitId, date: ctxMenu.date })}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* Editar hábito */}
      {editingHabit && (
        <NameModal
          title="Editar hábito"
          initialValue={editingHabit.name}
          confirmLabel="Salvar"
          onSave={(name) => { updateHabit.mutate({ id: editingHabit.id, name }); setEditingHabit(null) }}
          onClose={() => setEditingHabit(null)}
        />
      )}
    </div>
  )
}
