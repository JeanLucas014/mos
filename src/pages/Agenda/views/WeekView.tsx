import { useEffect, useRef } from 'react'
import type { CalendarEvent } from '../types'

const HOUR_H  = 60
const TIME_W  = 52
const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface Props {
  events: CalendarEvent[]
  currentDate: Date
  onSelectEvent: (e: Partial<CalendarEvent>) => void
  onSelectSlot: (start: Date) => void
}

function startOfWeek(d: Date): Date {
  const r = new Date(d)
  r.setDate(d.getDate() - d.getDay())
  r.setHours(0, 0, 0, 0)
  return r
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
}

export function WeekView({ events, currentDate, onSelectEvent, onSelectSlot }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const today     = new Date()
  const weekStart = startOfWeek(currentDate)
  const days      = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
  const hours  = Array.from({ length: 24 }, (_, i) => i)
  const now    = new Date()
  const nowTop = now.getHours() * HOUR_H + now.getMinutes()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, nowTop - 120)
    }
  }, [])

  function getEventsByDay(day: Date): CalendarEvent[] {
    return events.filter(e => !e.all_day && isSameDay(new Date(e.start_at), day))
  }

  function getAllDayByDay(day: Date): CalendarEvent[] {
    return events.filter(e => e.all_day && isSameDay(new Date(e.start_at), day))
  }

  function eventTop(ev: CalendarEvent): number {
    const s = new Date(ev.start_at)
    return s.getHours() * HOUR_H + s.getMinutes()
  }

  function eventHeight(ev: CalendarEvent): number {
    const ms = new Date(ev.end_at).getTime() - new Date(ev.start_at).getTime()
    return Math.max(ms / (1000 * 60), 30)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="flex shrink-0 border-b border-[#1f1f1f]" style={{ paddingLeft: TIME_W }}>
        {days.map((day, i) => {
          const isToday = isSameDay(day, today)
          return (
            <div key={i} className="flex-1 text-center py-2 border-l border-[#1f1f1f]">
              <div className={['text-[10px] uppercase tracking-wider mb-1',
                isToday ? 'text-[#0EA5E9]' : 'text-[#555]'].join(' ')}>
                {DAYS_PT[day.getDay()]}
              </div>
              <div className={['text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto',
                isToday ? 'bg-[#0EA5E9] text-black' : 'text-white'].join(' ')}>
                {day.getDate()}
              </div>
              <div className="min-h-[4px]">
                {getAllDayByDay(day).map(ev => (
                  <div key={ev.id} onClick={() => onSelectEvent(ev)}
                    className="text-[10px] text-white rounded px-1 py-0.5 mb-0.5 cursor-pointer truncate mx-1"
                    style={{ background: ev.color }}>
                    {ev.title}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: HOUR_H * 24 }}>
          {/* Time labels */}
          <div className="shrink-0 relative" style={{ width: TIME_W }}>
            {hours.map(h => (
              <div key={h}
                style={{ position: 'absolute', top: h * HOUR_H - 8, left: 0, right: 0 }}
                className="text-[10px] text-[#444] text-right pr-2 select-none">
                {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, di) => (
            <div key={di}
              className="flex-1 relative border-l border-[#1f1f1f]"
              onClick={e => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                const y    = e.clientY - rect.top
                const hour = Math.floor(y / HOUR_H)
                const d    = new Date(day)
                d.setHours(hour, 0, 0, 0)
                onSelectSlot(d)
              }}
            >
              {/* Hour lines */}
              {hours.map(h => (
                <div key={h}
                  style={{ position: 'absolute', top: h * HOUR_H, left: 0, right: 0 }}
                  className="border-t border-[#1a1a1a]" />
              ))}

              {/* Today highlight */}
              {isSameDay(day, today) && (
                <div className="absolute inset-0 bg-[#0EA5E9]/[0.03] pointer-events-none" />
              )}

              {/* Current time indicator */}
              {isSameDay(day, today) && (
                <div style={{ position: 'absolute', top: nowTop, left: 0, right: 0, zIndex: 20 }}
                  className="flex items-center pointer-events-none">
                  <div className="w-2 h-2 rounded-full bg-[#ef4444] -ml-1 shrink-0" />
                  <div className="flex-1 border-t-2 border-[#ef4444]" />
                </div>
              )}

              {/* Events */}
              {getEventsByDay(day).map(ev => (
                <div key={ev.id}
                  onClick={e => { e.stopPropagation(); onSelectEvent(ev) }}
                  className="absolute rounded-lg px-2 py-1 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                  style={{
                    top:         eventTop(ev),
                    height:      eventHeight(ev),
                    left:        2,
                    right:       2,
                    zIndex:      10,
                    background:  ev.color + 'dd',
                    borderLeft:  `3px solid ${ev.color}`,
                  }}
                >
                  <div className="text-white text-[11px] font-semibold truncate">{ev.title}</div>
                  <div className="text-white/70 text-[10px]">
                    {new Date(ev.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
