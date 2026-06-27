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
    const { data } = await (supabase as any)
      .from('calendar_events')
      .select('*')
      .order('start_at')
    if (data) setEvents(data as CalendarEvent[])
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
    if (ev.id) {
      await (supabase as any).from('calendar_events').update(ev).eq('id', ev.id)
    } else {
      await (supabase as any).from('calendar_events').insert(ev)
    }
    setModal(null)
    loadEvents()
  }

  async function handleDelete() {
    if (!modal?.id) return
    if (!window.confirm('Excluir este evento?')) return
    await (supabase as any).from('calendar_events').delete().eq('id', modal.id)
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
      <div className="shrink-0 flex items-center gap-3 px-4 lg:px-6 py-3 border-b border-[#1f1f1f]">
        {/* Tabs */}
        <div className="flex gap-0 border border-[#1f1f1f] rounded-lg overflow-hidden">
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
              className="px-3 py-1.5 text-xs text-[#555] border border-[#1f1f1f] rounded-lg hover:text-white transition-colors">
              Hoje
            </button>

            {/* Nav arrows */}
            <button onClick={() => navigate(-1)} className="text-[#555] hover:text-white transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => navigate(1)} className="text-[#555] hover:text-white transition-colors">
              <ChevronRight size={16} />
            </button>

            {/* Period label */}
            <span className="text-sm font-semibold text-white capitalize hidden sm:block">
              {headerLabel(view, currentDate)}
            </span>

            <div className="flex-1" />

            {/* View switcher */}
            <div className="flex gap-0 border border-[#1f1f1f] rounded-lg overflow-hidden">
              {VIEWS.map(v => (
                <button key={v.id} onClick={() => setView(v.id)}
                  title={v.label}
                  className={['flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors',
                    view === v.id ? 'bg-[#1f1f1f] text-white' : 'text-[#555] hover:text-white',
                  ].join(' ')}>
                  {v.icon}
                  <span className="hidden md:inline">{v.label}</span>
                </button>
              ))}
            </div>

            {/* New event */}
            <button
              onClick={() => openNewEvent(new Date())}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0EA5E9] text-black rounded-lg hover:bg-[#38bdf8] transition-colors"
            >
              <Plus size={13} /> Evento
            </button>
          </>
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
