import { CalendarDays } from 'lucide-react'
import { useDashEvents } from '../../../hooks/useDashboard'
import { fmtEventTime } from '../utils'
import { Sk, Widget } from './shared'

/* ══════════════════════════════════════════════════════════════════
   WIDGET — AGENDA (próximos eventos)
══════════════════════════════════════════════════════════════════ */
export function AgendaWidget() {
  const { data, isLoading } = useDashEvents()
  const events = data ?? []

  return (
    <Widget icon={<CalendarDays size={14} />} title="Agenda" to="/agenda">
      {isLoading ? (
        <div className="space-y-2.5">
          <Sk w="w-full" h="h-10" />
          <Sk w="w-4/5" h="h-10" />
          <Sk w="w-full" h="h-10" />
        </div>
      ) : events.length === 0 ? (
        <p className="text-ink-3 text-xs mt-1">Nenhum evento próximo.</p>
      ) : (
        <ul className="space-y-2">
          {events.map(ev => (
            <li
              key={ev.id}
              className="rounded-xl px-3 py-2 bg-bg"
              style={{ borderLeft: `3px solid ${ev.color ?? 'var(--blue)'}` }}
            >
              <div
                className="text-ink text-xs font-semibold truncate mb-0.5"
                style={{ fontFamily: 'Sora, sans-serif' }}
              >
                {ev.title}
              </div>
              <div className="text-ink-3" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                {fmtEventTime(ev.start_at)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  )
}
