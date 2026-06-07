import { useState, useRef } from 'react'
import { useHabits } from '../hooks/useHabits'

/* ── date helpers ─────────────────────────────────────────────── */
function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
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

/* ── main component ───────────────────────────────────────────── */
export function HabitsPage() {
  const { habits, isLoading, isError, error, toggleDay, addHabit, deleteHabit } = useHabits()

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
          <h1
            className="text-2xl lg:text-[30px]"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}
          >
            Hábitos
          </h1>
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
                              <button
                                onClick={() => toggleDay.mutate({ habitId: habit.id, date: ds })}
                                className={[
                                  'w-4 h-4 rounded-[3px] border flex-shrink-0 flex items-center justify-center transition-colors',
                                  done
                                    ? 'bg-brand border-brand'
                                    : 'border-ink-3 hover:border-ink-2',
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

                              {/* name */}
                              <span
                                className={[
                                  'flex-1 truncate leading-tight',
                                  done ? 'text-ink-3 line-through' : 'text-ink',
                                ].join(' ')}
                                style={{ fontSize: 12 }}
                              >
                                {habit.name}
                              </span>

                              {/* delete — only show for first day (avoids 7 × repeat) */}
                              {di === 0 && (
                                <button
                                  onClick={() => deleteHabit.mutate(habit.id)}
                                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-ink-3 hover:text-red-400 transition-all flex items-center justify-center"
                                  style={{ width: 18, height: 18, fontSize: 14, lineHeight: 1 }}
                                  title="Excluir hábito"
                                >
                                  ×
                                </button>
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
                            className="flex-1 bg-bg border border-line rounded-[5px] px-2 py-1 text-ink text-xs placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
                            style={{ minHeight: 28 }}
                            onKeyDown={e => { if (e.key === 'Escape') { setAddingDay(null); setNewName('') } }}
                          />
                          <button
                            type="submit"
                            disabled={!newName.trim() || addHabit.isPending}
                            className="bg-brand text-white rounded-[5px] px-2 text-xs font-semibold disabled:opacity-40"
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
                              background: pct === 100 ? '#34d399' : pct >= 50 ? '#0EA5E9' : '#fbbf24',
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
                    {h.streak}🔥
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
                          background: pct === 1 ? '#34d399' : pct >= 0.5 ? '#0EA5E9' : '#fbbf24',
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
                  {modalHabits.map(h => (
                    <div
                      key={h.id}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-input hover:bg-bg-3 transition-colors"
                    >
                      <button
                        onClick={() => toggleDay.mutate({ habitId: h.id, date: modalDay })}
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
                      <span className={['flex-1 text-sm', h.done ? 'text-ink-3 line-through' : 'text-ink'].join(' ')}>
                        {h.name}
                      </span>
                      <span className="text-brand text-xs font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {h.streak > 0 ? `${h.streak}🔥` : ''}
                      </span>
                    </div>
                  ))}
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
    </div>
  )
}
