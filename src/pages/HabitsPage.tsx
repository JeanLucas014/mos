import { useState, type FormEvent } from 'react'
import { useHabits } from '../hooks/useHabits'

function getWeekDays(): { label: string; date: string; isToday: boolean }[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((day + 6) % 7))

  const labels = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']
  return labels.map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    return { label, date: dateStr, isToday: dateStr === today.toISOString().slice(0, 10) }
  })
}

export function HabitsPage() {
  const { habits, isLoading, isError, error, toggleDay, addHabit, deleteHabit } = useHabits()
  const [name, setName] = useState('')
  const week = getWeekDays()
  const todayStr = new Date().toISOString().slice(0, 10)

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    addHabit.mutate(trimmed)
    setName('')
  }

  return (
    <div>
      <h1
        style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 800,
          fontSize: 30,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
        }}
      >
        Hábitos
      </h1>
      <p className="text-ink-2 mt-1" style={{ fontSize: 13.5 }}>
        {isLoading ? 'Carregando...' : 'Acompanhe seus hábitos diários esta semana.'}
      </p>

      {isError && (
        <p className="text-red-400 text-sm mt-3">Erro: {(error as Error).message}</p>
      )}

      <div className="bg-bg-2 border border-line rounded-card p-5 mt-5">
        <h2
          className="mb-5"
          style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15 }}
        >
          Hábitos diários · esta semana
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-bg-3 rounded-input animate-pulse" />
            ))}
          </div>
        ) : habits.length === 0 ? (
          <p className="text-ink-3 text-sm py-6 text-center">
            Nenhum hábito cadastrado — adicione o primeiro.
          </p>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => {
              const logDates = new Set(habit.logs.map((l) => l.log_date))
              const isDoneToday = logDates.has(todayStr)

              return (
                <div
                  key={habit.id}
                  className="group flex items-center gap-4 px-2 py-2 rounded-input hover:bg-bg-3 transition-colors"
                >
                  {/* Name + streak */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink font-medium truncate">
                      {habit.name}
                    </div>
                    <div className="text-ink-3" style={{ fontSize: 11 }}>
                      <span className="text-brand font-semibold">{habit.streak}</span>{' '}
                      dia{habit.streak !== 1 ? 's' : ''} seguido{habit.streak !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Week squares */}
                  <div className="flex gap-1">
                    {week.map((d) => {
                      const filled = logDates.has(d.date)
                      return (
                        <div
                          key={d.date}
                          className={[
                            'w-[17px] h-[17px] rounded-[3px] transition-colors',
                            filled ? 'bg-brand' : 'bg-bg-3',
                            d.isToday ? 'ring-[1.5px] ring-brand ring-offset-1 ring-offset-bg-2' : '',
                          ].join(' ')}
                          title={`${d.label} ${d.date}`}
                        />
                      )
                    })}
                  </div>

                  {/* Toggle today */}
                  <button
                    onClick={() => toggleDay.mutate({ habitId: habit.id, date: todayStr })}
                    className={[
                      'w-[30px] h-[30px] rounded-input flex items-center justify-center flex-shrink-0 transition-colors',
                      isDoneToday
                        ? 'bg-brand text-white'
                        : 'bg-bg-3 text-ink-3 hover:text-ink',
                    ].join(' ')}
                    title={isDoneToday ? 'Desmarcar hoje' : 'Marcar hoje'}
                  >
                    {isDoneToday ? (
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2.5 6L5 8.5L9.5 3.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M6 3v6M3 6h6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteHabit.mutate(habit.id)}
                    className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red-400 transition-all text-sm"
                    title="Excluir hábito"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add form */}
        <form onSubmit={handleAdd} className="flex gap-2 mt-5 pt-4 border-t border-line">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Novo hábito..."
            className="flex-1 bg-bg border border-line rounded-input px-3 py-2 text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
          />
          <button
            type="submit"
            disabled={!name.trim() || addHabit.isPending}
            className="bg-brand text-white rounded-input px-4 py-2 text-sm font-semibold hover:brightness-110 active:scale-[.97] transition-all disabled:opacity-40"
          >
            Adicionar
          </button>
        </form>
      </div>
    </div>
  )
}
