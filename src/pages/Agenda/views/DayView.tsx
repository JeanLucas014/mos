import { useEffect, useRef } from 'react'
import type { CalendarEvent } from '../types'

const HOUR_H  = 60
const TIME_W  = 52

interface Props {
  events: CalendarEvent[]
  currentDate: Date
  onSelectEvent: (e: Partial<CalendarEvent>) => void
  onSelectSlot: (start: Date) => void
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
}

export function DayView({ events, currentDate, onSelectEvent, onSelectSlot }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const today     = new Date()
  const now       = new Date()
  const nowTop    = now.getHours() * HOUR_H + now.getMinutes()
  const hours     = Array.from({ length: 24 }, (_, i) => i)
  const isToday   = isSameDay(currentDate, today)

  const dayEvents    = events.filter(e => !e.all_day && isSameDay(new Date(e.start_at), currentDate))
  const allDayEvents = events.filter(e => e.all_day  && isSameDay(new Date(e.start_at), currentDate))

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, nowTop - 120)
    }
  }, [])

  function eventTop(ev: CalendarEvent): number {
    const s = new Date(ev.start_at)
    return s.getHours() * HOUR_H + s.getMinutes()
  }

  function eventHeight(ev: CalendarEvent): number {
    const ms = new Date(ev.end_at).getTime() - new Date(ev.start_at).getTime()
    return Math.max(ms / (1000 * 60), 30)
  }

  const dayLabel = currentDate.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })

  return (
    <div className="flex flex-col h-full">
      {/* Day header */}
      <div className="shrink-0 border-b border-[#1f1f1f] px-4 py-3" style={{ paddingLeft: TIME_W + 16 }}>
        <div className={['text-sm font-semibold capitalize', isToday ? 'text-[#0EA5E9]' : 'text-white'].join(' ')}>
          {dayLabel}
        </div>
        {allDayEvents.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {allDayEvents.map(ev => (
              <div key={ev.id} onClick={() => onSelectEvent(ev)}
                className="text-[11px] text-white rounded px-2 py-0.5 cursor-pointer"
                style={{ background: ev.color }}>
                {ev.title}
              </div>
            ))}
          </div>
        )}
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

          {/* Single day column */}
          <div className="flex-1 relative border-l border-[#1f1f1f]"
            onClick={e => {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
              const y    = e.clientY - rect.top
              const hour = Math.floor(y / HOUR_H)
              const d    = new Date(currentDate)
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
            {isToday && (
              <div className="absolute inset-0 bg-[#0EA5E9]/[0.03] pointer-events-none" />
            )}

            {/* Current time indicator */}
            {isToday && (
              <div style={{ position: 'absolute', top: nowTop, left: 0, right: 0, zIndex: 20 }}
                className="flex items-center pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-[#ef4444] -ml-1 shrink-0" />
                <div className="flex-1 border-t-2 border-[#ef4444]" />
              </div>
            )}

            {/* Events */}
            {dayEvents.map(ev => (
              <div key={ev.id}
                onClick={e => { e.stopPropagation(); onSelectEvent(ev) }}
                className="absolute rounded-lg px-3 py-1.5 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                style={{
                  top:        eventTop(ev),
                  height:     eventHeight(ev),
                  left:       4,
                  right:      4,
                  zIndex:     10,
                  background: ev.color + 'dd',
                  borderLeft: `3px solid ${ev.color}`,
                }}
              >
                <div className="text-white text-sm font-semibold truncate">{ev.title}</div>
                <div className="text-white/70 text-xs mt-0.5">
                  {new Date(ev.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  {' – '}
                  {new Date(ev.end_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {ev.location && (
                  <div className="text-white/50 text-xs mt-0.5 truncate">📍 {ev.location}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
