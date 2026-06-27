import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, ChevronLeft, ChevronRight, Calendar, List, Grid3x3, CalendarDays } from 'lucide-react'
import type { CalendarEvent, CalendarView, Rotina } from './types'
import { WeekView }   from './views/WeekView'
import { MonthView }  from './views/MonthView'
import { DayView }    from './views/DayView'
import { ListView }   from './views/ListView'
import { EventModal } from './components/EventModal'
import { RotinaTab }  from './components/RotinaTab'
import { expandRecurringEvents } from './utils/expandRecurrence'

type Tab = 'agenda' | 'rotina'

const VIEWS: { id: CalendarView; label: string; icon: React.ReactNode }[] = [
  { id: 'dia',    label: 'Dia',    icon: <CalendarDays size={14} /> },
  { id: 'semana', label: 'Semana', icon: <Calendar     size={14} /> },
  { id: 'mes',    label: 'Mês',    icon: <Grid3x3      size={14} /> },
  { id: 'lista',  label: 'Lista',  icon: <List         size={14} /> },
]

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function headerLabel(view: CalendarView, d: Date): string {
  if (view === 'mes') {
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }
  if (view === 'semana') {
    const start = new Date(d)
    start.setDate(d.getDate() - d.getDay())
    const end = addDays(start, 6)
    return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
  }
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

function navStep(view: CalendarView): number {
  if (view === 'mes')    return 30
  if (view === 'semana') return 7
  return 1
}

export default function AgendaPage() {
  const [tab,         setTab]         = useState<Tab>('agenda')
  const [view,        setView]        = useState<CalendarView>('semana')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events,      setEvents]      = useState<CalendarEvent[]>([])
  const [rotinas,     setRotinas]     = useState<Rotina[]>([])
  const [modal,       setModal]       = useState<Partial<CalendarEvent> | null>(null)

  const loadEvents = useCallback(async () => {
    // Determine visible range (±90 days from today as a safe window)
    const from = new Date(); from.setDate(from.getDate() - 7)
    const to   = new Date(); to.setDate(to.getDate() + 90)

    // Query 1: non-recurring events in the range
    const { data: normalEvents } = await (supabase as any)
      .from('calendar_events')
      .select('*')
      .gte('start_at', from.toISOString())
      .lte('start_at', to.toISOString())
      .is('recurrence_rule', null)
      .order('start_at')

    // Query 2: recurring events (may have started before the range)
    const { data: recurringEvents } = await (supabase as any)
      .from('calendar_events')
      .select('*')
      .not('recurrence_rule', 'is', null)
      .lte('start_at', to.toISOString())
      .order('start_at')

    const all      = [...(normalEvents ?? []), ...(recurringEvents ?? [])] as CalendarEvent[]
    const expanded = expandRecurringEvents(all, from, to)
    setEvents(expanded)
  }, [])

  const loadRotinas = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('calendar_rotinas')
      .select('*')
      .order('ordem')
    if (data) setRotinas(data as Rotina[])
  }, [])

  useEffect(() => {
    loadEvents()
    loadRotinas()
  }, [loadEvents, loadRotinas])

  function navigate(dir: 1 | -1) {
    setCurrentDate(d => addDays(d, dir * navStep(view)))
  }

  function goToday() {
    setCurrentDate(new Date())
  }

  async function handleSave(ev: Partial<CalendarEvent>) {
    // Expanded recurring events have synthetic IDs like "uuid_2024-01-01" — strip the suffix
    const realId = ev.id?.includes('_') && ev.id.length > 40
      ? ev.id.slice(0, ev.id.lastIndexOf('_'))
      : ev.id
    if (realId) {
      await (supabase as any).from('calendar_events').update({ ...ev, id: realId }).eq('id', realId)
    } else {
      await (supabase as any).from('calendar_events').insert(ev)
    }
    setModal(null)
    loadEvents()
  }

  async function handleDelete() {
    if (!modal?.id) return
    if (!window.confirm('Excluir este evento?')) return
    const realId = modal.id.includes('_') && modal.id.length > 40
      ? modal.id.slice(0, modal.id.lastIndexOf('_'))
      : modal.id
    await (supabase as any).from('calendar_events').delete().eq('id', realId)
    setModal(null)
    loadEvents()
  }

  function openNewEvent(start: Date) {
    const end = new Date(start)
    end.setHours(start.getHours() + 1)
    setModal({
      title:    '',
      start_at: start.toISOString(),
      end_at:   end.toISOString(),
      all_day:  false,
      color:    '#0EA5E9',
    })
  }

  const sharedViewProps = {
    events,
    currentDate,
    onSelectEvent: (ev: Partial<CalendarEvent>) => setModal(ev),
    onSelectSlot:  (start: Date) => openNewEvent(start),
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -mx-4 lg:-mx-7 -mt-4 lg:-mt-7 overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-3 lg:px-6 py-2.5 border-b border-[#1f1f1f]">
        {/* Row 1: Tabs + nav controls + new event */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex gap-0 border border-[#1f1f1f] rounded-lg overflow-hidden shrink-0">
            {(['agenda', 'rotina'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={['px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                  tab === t ? 'bg-[#1f1f1f] text-white' : 'text-[#555] hover:text-white',
                ].join(' ')}>
                {t === 'agenda' ? 'Agenda' : 'Rotina'}
              </button>
            ))}
          </div>

          {tab === 'agenda' && (
            <>
              {/* Today */}
              <button onClick={goToday}
                className="px-2.5 py-1.5 text-xs text-[#555] border border-[#1f1f1f] rounded-lg hover:text-white transition-colors shrink-0">
                Hoje
              </button>

              {/* Nav arrows */}
              <button onClick={() => navigate(-1)} className="text-[#555] hover:text-white transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => navigate(1)} className="text-[#555] hover:text-white transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center">
                <ChevronRight size={16} />
              </button>

              {/* Period label */}
              <span className="text-xs sm:text-sm font-semibold text-white capitalize truncate min-w-0">
                {headerLabel(view, currentDate)}
              </span>

              <div className="flex-1" />

              {/* New event */}
              <button
                onClick={() => openNewEvent(new Date())}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0EA5E9] text-black rounded-lg hover:bg-[#38bdf8] transition-colors shrink-0"
              >
                <Plus size={13} />
                <span className="hidden sm:inline">Evento</span>
              </button>
            </>
          )}
        </div>

        {/* Row 2 on mobile: view switcher (full width) */}
        {tab === 'agenda' && (
          <div className="flex items-center gap-0 border border-[#1f1f1f] rounded-lg overflow-hidden w-full sm:w-auto justify-center sm:justify-start">
            {VIEWS.map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                title={v.label}
                className={['flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors flex-1 sm:flex-none justify-center',
                  view === v.id ? 'bg-[#1f1f1f] text-white' : 'text-[#555] hover:text-white',
                ].join(' ')}>
                {v.icon}
                <span className="hidden md:inline">{v.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {tab === 'rotina' ? (
          <div className="h-full overflow-y-auto px-4 lg:px-6 py-5">
            <RotinaTab rotinas={rotinas} onReload={loadRotinas} />
          </div>
        ) : view === 'semana' ? (
          <WeekView {...sharedViewProps} />
        ) : view === 'mes' ? (
          <MonthView {...sharedViewProps} />
        ) : view === 'dia' ? (
          <DayView {...sharedViewProps} />
        ) : (
          <ListView {...sharedViewProps} />
        )}
      </div>

      {/* Modal */}
      {modal && (
        <EventModal
          event={modal}
          onSave={handleSave}
          onDelete={modal.id ? handleDelete : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
