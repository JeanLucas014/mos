import { useState, useEffect, useRef } from 'react'
import type { CalendarEvent } from '../types'

const DAYS_PT    = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

interface Props {
  events: CalendarEvent[]
  currentDate: Date
  onSelectEvent: (e: Partial<CalendarEvent>) => void
  onSelectSlot: (start: Date) => void
}

function startOfWeek(d: Date): Date {
  const r = new Date(d)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  r.setDate(d.getDate() + diff)
  r.setHours(0, 0, 0, 0)
  return r
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
}

interface EventLayout {
  ev: CalendarEvent
  left: number
  width: number
  zIndex: number
}

function layoutEvents(events: CalendarEvent[]): EventLayout[] {
  if (events.length === 0) return []

  const sorted = [...events].sort((a, b) => {
    const startDiff = new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    if (startDiff !== 0) return startDiff
    const durA = new Date(a.end_at).getTime() - new Date(a.start_at).getTime()
    const durB = new Date(b.end_at).getTime() - new Date(b.start_at).getTime()
    return durB - durA
  })

  function overlaps(a: CalendarEvent, b: CalendarEvent): boolean {
    return new Date(a.start_at).getTime() < new Date(b.end_at).getTime() &&
           new Date(a.end_at).getTime()   > new Date(b.start_at).getTime()
  }

  const cols: number[] = new Array(sorted.length).fill(0)
  for (let i = 0; i < sorted.length; i++) {
    const usedCols = new Set<number>()
    for (let j = 0; j < i; j++) {
      if (overlaps(sorted[i], sorted[j])) usedCols.add(cols[j])
    }
    let c = 0
    while (usedCols.has(c)) c++
    cols[i] = c
  }

  const numCols: number[] = sorted.map((ev, i) => {
    let max = cols[i] + 1
    for (let j = 0; j < sorted.length; j++) {
      if (i !== j && overlaps(ev, sorted[j])) max = Math.max(max, cols[j] + 1)
    }
    return max
  })

  return sorted.map((ev, i) => {
    const n      = numCols[i]
    const col    = cols[i]
    const baseW  = 100 / n
    const bonusW = n > 1 ? Math.min(12, baseW * 0.3) : 0
    const width  = Math.min(baseW + bonusW, 100 - col * baseW)
    const left   = col * baseW
    return { ev, left, width, zIndex: 10 + col }
  })
}

export function WeekView({ events, currentDate, onSelectEvent, onSelectSlot }: Props) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const scrollRef = useRef<HTMLDivElement>(null)
  const today     = new Date()

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const HOUR_H = isMobile ? 48 : 60
  const TIME_W = isMobile ? 36 : 52

  const weekStart = startOfWeek(currentDate)
  const days      = isMobile
    ? Array.from({ length: 3 }, (_, i) => {
        const d = new Date(currentDate)
        d.setDate(currentDate.getDate() + i)
        return d
      })
    : Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart)
        d.setDate(weekStart.getDate() + i)
        return d
      })

  const hours  = Array.from({ length: 24 }, (_, i) => i)
  const now    = new Date()
  const nowTop = now.getHours() * HOUR_H + now.getMinutes() * (HOUR_H / 60)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, nowTop - 120)
    }
  }, [isMobile])

  function getEventsByDay(day: Date): CalendarEvent[] {
    return events.filter(e => !e.all_day && isSameDay(new Date(e.start_at), day))
  }

  function getAllDayByDay(day: Date): CalendarEvent[] {
    return events.filter(e => e.all_day && isSameDay(new Date(e.start_at), day))
  }

  function eventTop(ev: CalendarEvent): number {
    const s = new Date(ev.start_at)
    return s.getHours() * HOUR_H + s.getMinutes() * (HOUR_H / 60)
  }

  function eventHeight(ev: CalendarEvent): number {
    const ms = new Date(ev.end_at).getTime() - new Date(ev.start_at).getTime()
    return Math.max(ms / (1000 * 60) * (HOUR_H / 60), isMobile ? 24 : 30)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="flex shrink-0 border-b border-[#1f1f1f]" style={{ paddingLeft: TIME_W }}>
        {days.map((day, i) => {
          const isToday = isSameDay(day, today)
          return (
            <div key={i} className="flex-1 text-center py-2 border-l border-[#1f1f1f]">
              <div className={['uppercase tracking-wider mb-1',
                isMobile ? 'text-[9px]' : 'text-[10px]',
                isToday ? 'text-brand' : 'text-ink-3'].join(' ')}>
                {isMobile ? DAYS_SHORT[day.getDay()] : DAYS_PT[day.getDay()]}
              </div>
              <div className={[
                'rounded-full flex items-center justify-center mx-auto font-bold',
                isMobile ? 'text-sm w-6 h-6' : 'text-lg w-8 h-8',
                isToday ? 'bg-brand text-black' : 'text-white',
              ].join(' ')}>
                {day.getDate()}
              </div>
              <div className="min-h-[4px]">
                {getAllDayByDay(day).map(ev => (
                  <div key={ev.id} onClick={() => onSelectEvent(ev)}
                    className="text-[10px] text-white rounded px-1 py-0.5 mb-0.5 cursor-pointer truncate mx-0.5"
                    style={{ background: ev.color }}>
                    {!isMobile && ev.title}
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
                className="text-[9px] text-[#444] text-right pr-1.5 select-none">
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
                <div className="absolute inset-0 bg-brand/[0.03] pointer-events-none" />
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
              {layoutEvents(getEventsByDay(day)).map(({ ev, left, width, zIndex }) => (
                <div
                  key={ev.id}
                  onClick={e => { e.stopPropagation(); onSelectEvent(ev) }}
                  className="absolute cursor-pointer overflow-hidden transition-all hover:brightness-110"
                  style={{
                    top:          eventTop(ev),
                    height:       eventHeight(ev),
                    left:         `calc(${left}% + 1px)`,
                    width:        `calc(${width}% - 2px)`,
                    zIndex,
                    borderRadius: 6,
                    background:   ev.color + 'e8',
                    borderLeft:   `3px solid ${ev.color}`,
                    boxShadow:    zIndex > 10 ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
                  }}
                >
                  <div style={{ padding: '3px 5px' }}>
                    <div
                      className="text-white font-semibold truncate flex items-center gap-1"
                      style={{ fontSize: isMobile ? 9 : 11 }}
                    >
                      <span className="truncate">{ev.title}</span>
                      {ev.recurrence_rule && (
                        <span style={{ fontSize: 8, opacity: 0.8, flexShrink: 0 }}>↻</span>
                      )}
                    </div>
                    {eventHeight(ev) > 35 && !isMobile && (
                      <div className="text-white/75 truncate" style={{ fontSize: 10 }}>
                        {new Date(ev.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(ev.end_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    {eventHeight(ev) <= 35 && (
                      <div className="text-white/75 truncate" style={{ fontSize: 9 }}>
                        {new Date(ev.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
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
