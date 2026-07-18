import type { CalendarEvent } from '../types'
import { monthGridOffset, weekdayHeaders, type WeekStart } from '../../../lib/dates'

interface Props {
  events: CalendarEvent[]
  currentDate: Date
  weekStartsOn: WeekStart
  onSelectEvent: (e: Partial<CalendarEvent>) => void
  onSelectSlot: (start: Date) => void
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
}

export function MonthView({ events, currentDate, weekStartsOn, onSelectEvent, onSelectSlot }: Props) {
  const today   = new Date()
  const year    = currentDate.getFullYear()
  const month   = currentDate.getMonth()
  const first   = new Date(year, month, 1)
  const last    = new Date(year, month + 1, 0)
  const offset  = monthGridOffset(first, weekStartsOn)
  const DAYS_PT = weekdayHeaders(weekStartsOn)

  const cells: (Date | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: last.getDate() }, (_, i) => new Date(year, month, i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function dayEvents(day: Date): CalendarEvent[] {
    return events.filter(e => isSameDay(new Date(e.start_at), day))
  }

  return (
    <div className="flex flex-col h-full p-2">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_PT.map(d => (
          <div key={d} className="text-center text-[10px] text-ink-3 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1 gap-px bg-[#1a1a1a] border border-[#1a1a1a] rounded-xl overflow-hidden">
        {cells.map((day, i) => {
          const isToday = day && isSameDay(day, today)
          const dayEvs  = day ? dayEvents(day) : []
          return (
            <div key={i}
              onClick={() => day && onSelectSlot(day)}
              className={['bg-[#0a0a0a] p-1 cursor-pointer transition-colors hover:bg-[#111111] min-h-[60px] sm:min-h-[80px]',
                !day ? 'opacity-0 pointer-events-none' : '',
              ].join(' ')}>
              {day && (
                <>
                  <div className={['rounded-full flex items-center justify-center font-bold mb-0.5',
                    'text-[10px] sm:text-xs w-5 h-5 sm:w-6 sm:h-6',
                    isToday ? 'bg-brand text-black' : 'text-[#888]',
                  ].join(' ')}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvs.slice(0, window.innerWidth < 640 ? 1 : 3).map(ev => (
                      <div key={ev.id}
                        onClick={e => { e.stopPropagation(); onSelectEvent(ev) }}
                        className="text-[9px] sm:text-[10px] text-white rounded px-0.5 sm:px-1 py-0.5 cursor-pointer truncate max-w-full"
                        style={{ background: ev.color + 'cc' }}>
                        {ev.title}
                      </div>
                    ))}
                    {dayEvs.length > (window.innerWidth < 640 ? 1 : 3) && (
                      <div className="text-[9px] text-ink-3">+{dayEvs.length - (window.innerWidth < 640 ? 1 : 3)} mais</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
