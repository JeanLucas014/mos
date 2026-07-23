import { useState, useEffect, useRef, useCallback } from 'react'
import {
  DndContext, useDraggable,
  MouseSensor, TouchSensor, useSensor, useSensors,
  type DragStartEvent, type DragMoveEvent, type DragEndEvent,
} from '@dnd-kit/core'
import type { CalendarEvent } from '../types'
import { startOfWeek, type WeekStart } from '../../../lib/dates'
import { SNAP_MINUTES } from '../utils/snap'

const DAYS_PT    = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

interface Props {
  events: CalendarEvent[]
  currentDate: Date
  weekStartsOn: WeekStart
  onSelectEvent: (e: Partial<CalendarEvent>) => void
  onSelectSlot: (start: Date) => void
  onMoveEvent: (event: CalendarEvent, newStart: Date, newEnd: Date) => void
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
}

/** Pedaço de um evento visível dentro de UM dia específico. Um evento cujo
 * start_at/end_at caem em dias diferentes vira um EventSegment por dia que
 * ele atravessa — puramente pra exibição, o registro no banco continua
 * sendo um único evento com um start_at/end_at. */
interface EventSegment {
  ev: CalendarEvent
  segStart: Date
  segEnd: Date
  /** Diferença entre o início deste pedaço e o start_at real do evento —
   * usada pra reconstruir o horário correto ao arrastar qualquer pedaço. */
  segmentOffsetMs: number
}

/** Recorta um evento nos limites de um dia (00:00–23:59:59.999). Retorna
 * null se o evento não passa por esse dia. */
function daySegment(ev: CalendarEvent, day: Date): EventSegment | null {
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const evStart = new Date(ev.start_at)
  const evEnd   = new Date(ev.end_at)

  const segStart = evStart > dayStart ? evStart : dayStart
  const segEnd   = evEnd   < dayEnd   ? evEnd   : dayEnd
  if (segStart.getTime() >= segEnd.getTime()) return null

  return { ev, segStart, segEnd, segmentOffsetMs: segStart.getTime() - evStart.getTime() }
}

interface EventLayout {
  seg: EventSegment
  left: number
  width: number
  zIndex: number
}

function layoutEvents(segments: EventSegment[]): EventLayout[] {
  if (segments.length === 0) return []

  const sorted = [...segments].sort((a, b) => {
    const startDiff = a.segStart.getTime() - b.segStart.getTime()
    if (startDiff !== 0) return startDiff
    const durA = a.segEnd.getTime() - a.segStart.getTime()
    const durB = b.segEnd.getTime() - b.segStart.getTime()
    return durB - durA
  })

  function overlaps(a: EventSegment, b: EventSegment): boolean {
    return a.segStart.getTime() < b.segEnd.getTime() &&
           a.segEnd.getTime()   > b.segStart.getTime()
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

  const numCols: number[] = sorted.map((seg, i) => {
    let max = cols[i] + 1
    for (let j = 0; j < sorted.length; j++) {
      if (i !== j && overlaps(seg, sorted[j])) max = Math.max(max, cols[j] + 1)
    }
    return max
  })

  return sorted.map((seg, i) => {
    const n      = numCols[i]
    const col    = cols[i]
    const baseW  = 100 / n
    const bonusW = n > 1 ? Math.min(12, baseW * 0.3) : 0
    const width  = Math.min(baseW + bonusW, 100 - col * baseW)
    const left   = col * baseW
    return { seg, left, width, zIndex: 10 + col }
  })
}

const SNAP_MIN = SNAP_MINUTES

/* ── Um evento arrastável na grade ─────────────────────────────── */
interface EventPillProps {
  seg: EventSegment
  dayIndex: number
  left: number
  width: number
  zIndex: number
  top: number
  height: number
  isMobile: boolean
  isBeingDragged: boolean
  onSelectEvent: (e: Partial<CalendarEvent>) => void
}

function EventPill({ seg, dayIndex, left, width, zIndex, top, height, isMobile, isBeingDragged, onSelectEvent }: EventPillProps) {
  const { ev, segStart, segEnd, segmentOffsetMs } = seg
  // id único por pedaço (o mesmo evento pode ter um segmento em cada dia
  // que ele atravessa) — dnd-kit exige ids únicos por draggable. O drag
  // sempre opera sobre o evento inteiro (data.event), preservando duração.
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `${ev.id}::${dayIndex}`,
    data: { event: ev, dayIndex, segStart, segEnd, segmentOffsetMs },
  })

  const dragTransform = isBeingDragged && transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={e => { e.stopPropagation(); if (!isBeingDragged) onSelectEvent(ev) }}
      className="absolute cursor-pointer overflow-hidden transition-colors hover:brightness-110"
      style={{
        top, height,
        left:         `calc(${left}% + 1px)`,
        width:        `calc(${width}% - 2px)`,
        zIndex:       isBeingDragged ? 999 : zIndex,
        borderRadius: 6,
        background:   ev.color + 'e8',
        borderLeft:   `3px solid ${ev.color}`,
        boxShadow:    isBeingDragged ? '0 6px 20px rgba(0,0,0,0.5)' : (zIndex > 10 ? '0 1px 4px rgba(0,0,0,0.4)' : 'none'),
        opacity:      isBeingDragged ? 0.6 : 1,
        transform:    dragTransform,
        touchAction:  'none',
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
        {height > 35 && !isMobile && (
          <div className="text-white/75 truncate" style={{ fontSize: 10 }}>
            {segStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {' – '}
            {segEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        {height <= 35 && (
          <div className="text-white/75 truncate" style={{ fontSize: 9 }}>
            {segStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  )
}

interface DragPreview {
  dayIndex: number
  top: number
  height: number
  color: string
}

interface DayColumnProps {
  day: Date
  dayIndex: number
  today: Date
  hours: number[]
  HOUR_H: number
  nowTop: number
  widthStyle: React.CSSProperties
  segments: EventSegment[]
  isMobile: boolean
  draggingEventId: string | null
  dragPreview: DragPreview | null
  onSelectEvent: (e: Partial<CalendarEvent>) => void
  onSelectSlot: (start: Date) => void
  segTop: (seg: EventSegment) => number
  segHeight: (seg: EventSegment) => number
}

function DayColumn({
  day, dayIndex, today, hours, HOUR_H, nowTop, widthStyle, segments, isMobile,
  draggingEventId, dragPreview, onSelectEvent, onSelectSlot, segTop, segHeight,
}: DayColumnProps) {
  return (
    <div
      className="relative border-l border-[#1f1f1f]"
      style={widthStyle}
      onClick={e => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
        const y = e.clientY - rect.top
        const rawMinutes = (y / HOUR_H) * 60
        const snappedMinutes = Math.round(rawMinutes / SNAP_MIN) * SNAP_MIN
        const d = new Date(day)
        d.setHours(0, snappedMinutes, 0, 0)
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

      {/* Indicador de onde o evento vai encaixar ao soltar */}
      {dragPreview && dragPreview.dayIndex === dayIndex && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: dragPreview.top,
            height: dragPreview.height,
            left: 1, right: 1,
            borderRadius: 6,
            border: `2px dashed ${dragPreview.color}`,
            background: dragPreview.color + '22',
            zIndex: 15,
          }}
        />
      )}

      {/* Events */}
      {layoutEvents(segments).map(({ seg, left, width, zIndex }) => (
        <EventPill
          key={`${seg.ev.id}::${dayIndex}`}
          seg={seg}
          dayIndex={dayIndex}
          left={left}
          width={width}
          zIndex={zIndex}
          top={segTop(seg)}
          height={segHeight(seg)}
          isMobile={isMobile}
          isBeingDragged={draggingEventId === seg.ev.id}
          onSelectEvent={onSelectEvent}
        />
      ))}
    </div>
  )
}

export function WeekView({ events, currentDate, weekStartsOn, onSelectEvent, onSelectSlot, onMoveEvent }: Props) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const scrollRef  = useRef<HTMLDivElement>(null)
  const rowRef     = useRef<HTMLDivElement>(null)
  const colWidthRef = useRef(0)
  const today      = new Date()

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const HOUR_H = isMobile ? 48 : 60
  const TIME_W = isMobile ? 44 : 52
  const DAY_W  = 88 // mobile — sugestão de 84-96px por coluna

  const weekStart = startOfWeek(currentDate, weekStartsOn)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const hours  = Array.from({ length: 24 }, (_, i) => i)
  const now    = new Date()
  const nowTop = now.getHours() * HOUR_H + now.getMinutes() * (HOUR_H / 60)

  // Scroll inicial: vertical perto da hora atual, horizontal (mobile) no dia atual/currentDate.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = Math.max(0, nowTop - 120)
    if (isMobile) {
      const idx = days.findIndex(d => isSameDay(d, currentDate))
      if (idx >= 0) el.scrollLeft = Math.max(0, idx * DAY_W)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, weekStart.getTime()])

  // Eventos que passam da meia-noite viram um EventSegment por dia que
  // atravessam — cada dia da grade só recebe o pedaço (segStart/segEnd)
  // recortado dentro dele, nunca o evento inteiro fora dos limites do dia.
  function getEventsByDay(day: Date): EventSegment[] {
    return events
      .filter(e => !e.all_day)
      .map(e => daySegment(e, day))
      .filter((s): s is EventSegment => s !== null)
  }

  function getAllDayByDay(day: Date): CalendarEvent[] {
    return events.filter(e => e.all_day && isSameDay(new Date(e.start_at), day))
  }

  function segTop(seg: EventSegment): number {
    return seg.segStart.getHours() * HOUR_H + seg.segStart.getMinutes() * (HOUR_H / 60)
  }

  function segHeight(seg: EventSegment): number {
    const ms = seg.segEnd.getTime() - seg.segStart.getTime()
    // Só um piso mínimo pra evitar altura zero/negativa em dado degenerado
    // — a duração real (inclusive 15min) deve ficar proporcionalmente
    // correta, sem um floor artificial inflando eventos curtos.
    return Math.max(ms / (1000 * 60) * (HOUR_H / 60), 4)
  }

  /* ── Drag-and-drop ────────────────────────────────────────────── */
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,  { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const [dragOrigin, setDragOrigin] = useState<{ event: CalendarEvent; dayIndex: number; top: number; height: number; segmentOffsetMs: number } | null>(null)
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null)

  function computeSnap(deltaX: number, deltaY: number) {
    if (!dragOrigin || !colWidthRef.current) return null
    const minutesPerPx = 60 / HOUR_H
    const rawMinutesDelta = deltaY * minutesPerPx
    const snappedMinutesDelta = Math.round(rawMinutesDelta / SNAP_MIN) * SNAP_MIN
    const maxTop = 24 * HOUR_H - dragOrigin.height
    const newTop = Math.min(Math.max(0, dragOrigin.top + snappedMinutesDelta * (HOUR_H / 60)), Math.max(0, maxTop))

    const dayDelta = Math.round(deltaX / colWidthRef.current)
    const newDayIndex = Math.min(Math.max(0, dragOrigin.dayIndex + dayDelta), days.length - 1)

    return { newTop, newDayIndex }
  }

  const handleDragStart = useCallback((e: DragStartEvent) => {
    const data = e.active.data.current as { event: CalendarEvent; dayIndex: number; segStart: Date; segEnd: Date; segmentOffsetMs: number } | undefined
    if (!data) return
    colWidthRef.current = rowRef.current ? rowRef.current.clientWidth / days.length : 0
    const top = data.segStart.getHours() * HOUR_H + data.segStart.getMinutes() * (HOUR_H / 60)
    const height = Math.max((data.segEnd.getTime() - data.segStart.getTime()) / (1000 * 60) * (HOUR_H / 60), 4)
    setDragOrigin({ event: data.event, dayIndex: data.dayIndex, top, height, segmentOffsetMs: data.segmentOffsetMs })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.length, isMobile])

  const handleDragMove = useCallback((e: DragMoveEvent) => {
    if (!dragOrigin) return
    const snap = computeSnap(e.delta.x, e.delta.y)
    if (!snap) return
    setDragPreview({ dayIndex: snap.newDayIndex, top: snap.newTop, height: dragOrigin.height, color: dragOrigin.event.color })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragOrigin])

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    if (!dragOrigin) return
    const snap = computeSnap(e.delta.x, e.delta.y)
    setDragOrigin(null)
    setDragPreview(null)
    if (!snap) return

    const { newTop, newDayIndex } = snap
    if (newDayIndex === dragOrigin.dayIndex && newTop === dragOrigin.top) return // não moveu de fato

    // newTop/newDayIndex descrevem a nova posição do PEDAÇO arrastado —
    // subtrai o offset desse pedaço em relação ao início real do evento
    // pra sempre mover o evento inteiro preservando a duração original,
    // não importa qual segmento (dia) foi de fato arrastado.
    const minutesSinceMidnight = newTop * (60 / HOUR_H)
    const newSegStart = new Date(days[newDayIndex])
    newSegStart.setHours(0, minutesSinceMidnight, 0, 0)
    const newStart = new Date(newSegStart.getTime() - dragOrigin.segmentOffsetMs)
    const durationMs = new Date(dragOrigin.event.end_at).getTime() - new Date(dragOrigin.event.start_at).getTime()
    const newEnd = new Date(newStart.getTime() + durationMs)

    onMoveEvent(dragOrigin.event, newStart, newEnd)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragOrigin, days, onMoveEvent])

  const draggingEventId = dragOrigin?.event.id ?? null

  const sharedColumnProps = {
    today, hours, HOUR_H, nowTop, isMobile, draggingEventId, dragPreview,
    onSelectEvent, onSelectSlot, segTop, segHeight,
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full">
        {isMobile ? (
          /* ── Mobile: 7 dias sempre, scroll horizontal + vertical no mesmo container,
             time gutter e cabeçalho sticky (estilo Google Agenda) ── */
          <div ref={scrollRef} className="flex-1 overflow-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div style={{ minWidth: TIME_W + DAY_W * 7, position: 'relative' }}>
              {/* Header (sticky top) */}
              <div className="flex border-b border-[#1f1f1f]" style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg)' }}>
                <div style={{ width: TIME_W, flexShrink: 0, position: 'sticky', left: 0, zIndex: 21, background: 'var(--bg)' }} />
                {days.map((day, i) => {
                  const isToday = isSameDay(day, today)
                  return (
                    <div key={i} className="text-center py-2 border-l border-[#1f1f1f]" style={{ width: DAY_W, flexShrink: 0 }}>
                      <div className={['uppercase tracking-wider mb-1 text-[9px]',
                        isToday ? 'text-brand' : 'text-ink-3'].join(' ')}>
                        {DAYS_SHORT[day.getDay()]}
                      </div>
                      <div className={[
                        'rounded-full flex items-center justify-center mx-auto font-bold text-sm w-6 h-6',
                        isToday ? 'bg-brand text-black' : 'text-white',
                      ].join(' ')}>
                        {day.getDate()}
                      </div>
                      <div className="min-h-[4px]">
                        {getAllDayByDay(day).map(ev => (
                          <div key={ev.id} onClick={() => onSelectEvent(ev)}
                            className="text-[10px] text-white rounded px-1 py-0.5 mb-0.5 cursor-pointer truncate mx-0.5"
                            style={{ background: ev.color }} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Grade */}
              <div className="flex" style={{ height: HOUR_H * 24 }}>
                <div
                  className="shrink-0 relative"
                  style={{ width: TIME_W, position: 'sticky', left: 0, zIndex: 10, background: 'var(--bg)' }}
                >
                  {hours.map(h => (
                    <div key={h}
                      style={{ position: 'absolute', top: h * HOUR_H - 8, left: 0, right: 0 }}
                      className="text-[9px] text-[#444] text-right pr-1.5 select-none">
                      {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
                    </div>
                  ))}
                </div>

                <div ref={rowRef} className="flex">
                  {days.map((day, di) => (
                    <DayColumn
                      key={di}
                      day={day}
                      dayIndex={di}
                      widthStyle={{ width: DAY_W, flexShrink: 0 }}
                      segments={getEventsByDay(day)}
                      {...sharedColumnProps}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Desktop: layout original, 7 colunas fluidas, sem scroll horizontal ── */
          <>
            <div className="flex shrink-0 border-b border-[#1f1f1f]" style={{ paddingLeft: TIME_W }}>
              {days.map((day, i) => {
                const isToday = isSameDay(day, today)
                return (
                  <div key={i} className="flex-1 text-center py-2 border-l border-[#1f1f1f]">
                    <div className={['uppercase tracking-wider mb-1 text-[10px]',
                      isToday ? 'text-brand' : 'text-ink-3'].join(' ')}>
                      {DAYS_PT[day.getDay()]}
                    </div>
                    <div className={[
                      'rounded-full flex items-center justify-center mx-auto font-bold text-lg w-8 h-8',
                      isToday ? 'bg-brand text-black' : 'text-white',
                    ].join(' ')}>
                      {day.getDate()}
                    </div>
                    <div className="min-h-[4px]">
                      {getAllDayByDay(day).map(ev => (
                        <div key={ev.id} onClick={() => onSelectEvent(ev)}
                          className="text-[10px] text-white rounded px-1 py-0.5 mb-0.5 cursor-pointer truncate mx-0.5"
                          style={{ background: ev.color }}>
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              <div className="flex" style={{ height: HOUR_H * 24 }}>
                <div className="shrink-0 relative" style={{ width: TIME_W }}>
                  {hours.map(h => (
                    <div key={h}
                      style={{ position: 'absolute', top: h * HOUR_H - 8, left: 0, right: 0 }}
                      className="text-[9px] text-[#444] text-right pr-1.5 select-none">
                      {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
                    </div>
                  ))}
                </div>

                <div ref={rowRef} className="flex flex-1">
                  {days.map((day, di) => (
                    <DayColumn
                      key={di}
                      day={day}
                      dayIndex={di}
                      widthStyle={{ flex: 1 }}
                      segments={getEventsByDay(day)}
                      {...sharedColumnProps}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DndContext>
  )
}
