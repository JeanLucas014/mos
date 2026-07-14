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
import { RecurrenceDialog, type RecurrenceScope } from './components/RecurrenceDialog'
import { expandRecurringEvents } from './utils/expandRecurrence'
import { HelpButton } from '@/components/help/HelpButton'

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

/* ── Helpers para IDs sintéticos de instâncias recorrentes ── */
function getOriginalId(eventId: string): string {
  // Synthetic IDs look like "uuid_YYYY-MM-DD"
  const match = eventId.match(/^(.+)_(\d{4}-\d{2}-\d{2})$/)
  return match ? match[1] : eventId
}

function getInstanceDate(eventId: string): string | null {
  const match = eventId.match(/^.+_(\d{4}-\d{2}-\d{2})$/)
  return match ? match[1] : null
}

function isSyntheticId(eventId: string): boolean {
  return /^.+_\d{4}-\d{2}-\d{2}$/.test(eventId)
}

function addExdate(currentRule: string | null, dateKey: string): string {
  // dateKey no formato YYYYMMDD
  const parts = (currentRule ?? '').split(';').filter(Boolean)
  const exIdx = parts.findIndex(p => p.startsWith('EXDATE='))
  if (exIdx >= 0) {
    const existing = parts[exIdx].slice('EXDATE='.length).split(',').filter(Boolean)
    if (!existing.includes(dateKey)) existing.push(dateKey)
    parts[exIdx] = `EXDATE=${existing.join(',')}`
  } else {
    parts.push(`EXDATE=${dateKey}`)
  }
  return parts.join(';')
}

export default function AgendaPage() {
  const [tab,               setTab]               = useState<Tab>('agenda')
  const [view,              setView]              = useState<CalendarView>('semana')
  const [currentDate,       setCurrentDate]       = useState(new Date())
  const [events,            setEvents]            = useState<CalendarEvent[]>([])
  const [rotinas,           setRotinas]           = useState<Rotina[]>([])
  const [modal,             setModal]             = useState<Partial<CalendarEvent> | null>(null)
  const [recurrenceDialog,  setRecurrenceDialog]  = useState<{ mode: 'edit' | 'delete'; event: Partial<CalendarEvent> } | null>(null)
  const [pendingSaveEvent,  setPendingSaveEvent]  = useState<Partial<CalendarEvent> | null>(null)

  const loadEvents = useCallback(async () => {
    const from = new Date(); from.setDate(from.getDate() - 7)
    const to   = new Date(); to.setDate(to.getDate() + 90)

    const { data: normalEvents } = await (supabase as any)
      .from('calendar_events')
      .select('*')
      .gte('start_at', from.toISOString())
      .lte('start_at', to.toISOString())
      .is('recurrence_rule', null)
      .order('start_at')

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

  /* ── Delete ─────────────────────────────────────────────────── */
  async function deleteEvent(id: string, scope?: RecurrenceScope) {
    const originalId   = getOriginalId(id)
    const instanceDate = getInstanceDate(id)

    if (!scope || scope === 'this') {
      if (instanceDate) {
        // Add EXDATE to parent to skip this occurrence
        const { data: parent } = await (supabase as any)
          .from('calendar_events').select('recurrence_rule').eq('id', originalId).maybeSingle()
        if (parent) {
          const dateKey = instanceDate.replace(/-/g, '')
          const newRule = addExdate(parent.recurrence_rule, dateKey)
          await (supabase as any).from('calendar_events').update({
            recurrence_rule: newRule,
          }).eq('id', originalId)
        }
      } else {
        await (supabase as any).from('calendar_events').delete().eq('id', originalId)
      }
    } else if (scope === 'this_and_following') {
      if (instanceDate) {
        const until = new Date(instanceDate)
        until.setDate(until.getDate() - 1)
        const untilStr = until.toISOString().slice(0, 10).replace(/-/g, '') + 'T235959Z'
        const { data: parent } = await (supabase as any)
          .from('calendar_events').select('recurrence_rule').eq('id', originalId).maybeSingle()
        if (parent) {
          const rule = (parent.recurrence_rule ?? '')
            .split(';').filter((p: string) => !p.startsWith('UNTIL')).join(';')
          await (supabase as any).from('calendar_events').update({
            recurrence_rule: rule + `;UNTIL=${untilStr}`,
          }).eq('id', originalId)
        }
      }
    } else if (scope === 'all') {
      await (supabase as any).from('calendar_events').delete().eq('id', originalId)
    }

    setModal(null)
    setRecurrenceDialog(null)
    loadEvents()
  }

  /* ── Save ───────────────────────────────────────────────────── */
  async function saveEvent(ev: Partial<CalendarEvent>, scope?: RecurrenceScope) {
    const originalId   = ev.id ? getOriginalId(ev.id) : null
    const instanceDate = ev.id ? getInstanceDate(ev.id) : null
    const isNew        = !ev.id || (!originalId && !instanceDate)

    const payload = {
      title:           ev.title,
      description:     ev.description,
      start_at:        ev.start_at,
      end_at:          ev.end_at,
      all_day:         ev.all_day,
      color:           ev.color,
      location:        ev.location,
      recurrence_rule: ev.recurrence_rule,
      tags:            ev.tags,
    }

    if (isNew) {
      await (supabase as any).from('calendar_events').insert(payload)
    } else if (!instanceDate || !scope || scope === 'all') {
      // Edit the master event
      await (supabase as any).from('calendar_events')
        .update(payload).eq('id', originalId)
    } else if (scope === 'this') {
      // Create a standalone event for this date, exclude from parent
      await (supabase as any).from('calendar_events').insert({ ...payload, recurrence_rule: null })
      if (originalId && instanceDate) {
        const { data: parent } = await (supabase as any)
          .from('calendar_events').select('recurrence_rule').eq('id', originalId).maybeSingle()
        if (parent) {
          const dateKey = instanceDate.replace(/-/g, '')
          const newRule = addExdate(parent.recurrence_rule, dateKey)
          await (supabase as any).from('calendar_events').update({
            recurrence_rule: newRule,
          }).eq('id', originalId)
        }
      }
    } else if (scope === 'this_and_following') {
      if (originalId && instanceDate) {
        // Cap parent recurrence before this date
        const until    = new Date(instanceDate)
        until.setDate(until.getDate() - 1)
        const untilStr = until.toISOString().slice(0, 10).replace(/-/g, '') + 'T235959Z'
        const { data: parent } = await (supabase as any)
          .from('calendar_events').select('recurrence_rule').eq('id', originalId).maybeSingle()
        if (parent) {
          const rule = (parent.recurrence_rule ?? '')
            .split(';').filter((p: string) => !p.startsWith('UNTIL')).join(';')
          await (supabase as any).from('calendar_events').update({
            recurrence_rule: rule + `;UNTIL=${untilStr}`,
          }).eq('id', originalId)
        }
        // Create new series from this date
        await (supabase as any).from('calendar_events').insert(payload)
      }
    }

    setModal(null)
    setRecurrenceDialog(null)
    loadEvents()
  }

  /* ── Handlers ───────────────────────────────────────────────── */
  function handleSelectEvent(ev: Partial<CalendarEvent>) {
    setModal(ev)
  }

  function handleDeleteFromModal() {
    if (!modal?.id) return
    if (isSyntheticId(modal.id) || modal.recurrence_rule) {
      setRecurrenceDialog({ mode: 'delete', event: modal })
      setModal(null)
    } else {
      deleteEvent(modal.id)
    }
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
    onSelectEvent: handleSelectEvent,
    onSelectSlot:  (start: Date) => openNewEvent(start),
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -mx-4 lg:-mx-7 -mt-4 lg:-mt-7 overflow-y-hidden">
      {/* Top bar */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-3 lg:px-6 py-2.5 border-b border-[#1f1f1f]">
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

          <HelpButton pageId="agenda" />

          {tab === 'agenda' && (
            <>
              <button onClick={goToday}
                className="px-2.5 py-1.5 text-xs text-[#555] border border-[#1f1f1f] rounded-lg hover:text-white transition-colors shrink-0">
                Hoje
              </button>
              <button onClick={() => navigate(-1)} className="text-[#555] hover:text-white transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => navigate(1)} className="text-[#555] hover:text-white transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center">
                <ChevronRight size={16} />
              </button>
              <span className="text-xs sm:text-sm font-semibold text-white capitalize truncate min-w-0">
                {headerLabel(view, currentDate)}
              </span>
              <div className="flex-1" />
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
      <div className={`flex-1 overflow-hidden${view === 'semana' && tab === 'agenda' ? ' overflow-x-auto' : ''}`}>
        {tab === 'rotina' ? (
          <div className="h-full overflow-y-auto px-4 lg:px-6 py-5">
            <RotinaTab rotinas={rotinas} onReload={loadRotinas} />
          </div>
        ) : view === 'semana' ? (
          <div className="min-w-[640px] h-full">
            <WeekView {...sharedViewProps} />
          </div>
        ) : view === 'mes' ? (
          <MonthView {...sharedViewProps} />
        ) : view === 'dia' ? (
          <DayView {...sharedViewProps} />
        ) : (
          <ListView {...sharedViewProps} />
        )}
      </div>

      {/* Event modal */}
      {modal && (
        <EventModal
          event={modal}
          onSave={(ev) => {
            const isRecurringInstance = modal?.id && (isSyntheticId(modal.id) || !!modal.recurrence_rule)
            if (isRecurringInstance) {
              setPendingSaveEvent(ev)
              setRecurrenceDialog({ mode: 'edit', event: ev })
              setModal(null)
            } else {
              saveEvent(ev)
            }
          }}
          onDelete={modal.id ? handleDeleteFromModal : undefined}
          onClose={() => setModal(null)}
        />
      )}

      {/* Recurrence scope dialog */}
      {recurrenceDialog && (
        <RecurrenceDialog
          mode={recurrenceDialog.mode}
          onConfirm={async (scope) => {
            if (recurrenceDialog.mode === 'delete') {
              await deleteEvent(recurrenceDialog.event.id!, scope)
            } else {
              if (pendingSaveEvent) {
                await saveEvent(pendingSaveEvent, scope)
              }
              setPendingSaveEvent(null)
              setRecurrenceDialog(null)
            }
          }}
          onClose={() => { setRecurrenceDialog(null); setPendingSaveEvent(null) }}
        />
      )}
    </div>
  )
}
