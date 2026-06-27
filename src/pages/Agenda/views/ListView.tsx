import type { CalendarEvent } from '../types'

interface Props {
  events: CalendarEvent[]
  currentDate: Date
  onSelectEvent: (e: Partial<CalendarEvent>) => void
  onSelectSlot: (start: Date) => void
}

export function ListView({ events, onSelectEvent }: Props) {
  const grouped = events.reduce((acc, ev) => {
    const key = ev.start_at.slice(0, 10)
    if (!acc[key]) acc[key] = []
    acc[key].push(ev)
    return acc
  }, {} as Record<string, CalendarEvent[]>)

  const sortedDates = Object.keys(grouped).sort()

  if (sortedDates.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#555] text-sm">
        Nenhum evento nos próximos 90 dias.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto h-full px-6 py-4 space-y-6">
      {sortedDates.map(dateKey => {
        const d = new Date(dateKey + 'T00:00:00')
        return (
          <div key={dateKey}>
            <div className="text-xs text-[#555] uppercase tracking-wider font-[Sora] mb-2 sticky top-0 bg-[#0a0a0a] py-1 capitalize">
              {d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </div>
            <div className="space-y-2">
              {grouped[dateKey].map(ev => (
                <div key={ev.id} onClick={() => onSelectEvent(ev)}
                  className="flex items-start gap-3 bg-[#111111] border border-[#1f1f1f] rounded-xl p-3 cursor-pointer hover:border-[#0EA5E9]/30 transition-colors">
                  <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5" style={{ background: ev.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{ev.title}</div>
                    {!ev.all_day && (
                      <div className="text-[11px] text-[#555] mt-0.5">
                        {new Date(ev.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(ev.end_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    {ev.location && (
                      <div className="text-[11px] text-[#555] mt-0.5">📍 {ev.location}</div>
                    )}
                    {ev.description && (
                      <div className="text-[11px] text-[#444] mt-1 truncate">{ev.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
