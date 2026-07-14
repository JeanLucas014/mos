import { useState } from 'react'
import { Calendar, X } from 'lucide-react'
import { formatLocalDate } from '@/lib/dates'

const DAYS_PT   = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

function toISO(d: Date): string { return formatLocalDate(d) }

interface Props {
  value: string | null
  onChange: (v: string | null) => void
}

export function DatePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)

  const today = new Date(); today.setHours(0, 0, 0, 0)

  const [viewDate, setViewDate] = useState(() => {
    const d = value ? new Date(value + 'T00:00:00') : new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  function prevMonth() { setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)) }
  function nextMonth() { setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)) }

  function selectDate(d: Date) { onChange(toISO(d)); setOpen(false) }

  const saturday = addDays(today, ((6 - today.getDay() + 7) % 7) || 7)
  const nextMonday = addDays(today, ((8 - today.getDay()) % 7) || 7)

  const shortcuts = [
    { label: 'Hoje',               date: today },
    { label: 'Amanhã',             date: addDays(today, 1) },
    { label: 'Este fim de semana', date: saturday },
    { label: 'Próxima semana',     date: nextMonday },
  ]

  const firstDay     = viewDate.getDay()
  const daysInMonth  = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const display = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : 'Sem data'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={[
          'flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg border transition-colors',
          value
            ? 'border-[#0EA5E9]/40 text-[#0EA5E9]'
            : 'border-[#1f1f1f] text-[#555] hover:text-white',
        ].join(' ')}
      >
        <Calendar size={12} />
        {display}
        {value && (
          <span
            onClick={e => { e.stopPropagation(); onChange(null) }}
            className="text-[#555] hover:text-[#ef4444] cursor-pointer"
          >
            <X size={10} />
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-50 bg-[#111111] border border-[#1f1f1f] rounded-xl shadow-xl p-3 w-64"
          onClick={e => e.stopPropagation()}
        >
          {/* Shortcuts */}
          <div className="space-y-0.5 mb-3">
            {shortcuts.map(s => (
              <button
                key={s.label}
                onClick={() => selectDate(s.date)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg hover:bg-[#1f1f1f] text-[#aaa] hover:text-white transition-colors"
              >
                <span>{s.label}</span>
                <span className="text-[#555]">{DAYS_PT[s.date.getDay()]}</span>
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div className="border-t border-[#1f1f1f] pt-3">
            <div className="flex items-center justify-between mb-2">
              <button onClick={prevMonth} className="text-[#555] hover:text-white px-1 text-base leading-none">‹</button>
              <span className="text-xs font-semibold text-white">
                {MONTHS_PT[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <button onClick={nextMonth} className="text-[#555] hover:text-white px-1 text-base leading-none">›</button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DAYS_PT.map(d => (
                <div key={d} className="text-center text-[9px] text-[#444] py-1">{d[0]}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />
                const d        = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
                const isToday  = toISO(d) === toISO(today)
                const selected = value === toISO(d)
                const past     = d < today
                return (
                  <button
                    key={i}
                    onClick={() => selectDate(d)}
                    className={[
                      'text-[11px] py-1 rounded-lg transition-colors font-medium',
                      selected ? 'bg-[#0EA5E9] text-black' :
                      isToday  ? 'border border-[#0EA5E9] text-[#0EA5E9]' :
                      past     ? 'text-[#444] hover:bg-[#1f1f1f]' :
                                 'text-[#aaa] hover:bg-[#1f1f1f]',
                    ].join(' ')}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
