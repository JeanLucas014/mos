import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { formatMonthYearBR, startOfWeek, type WeekStart } from '@/lib/dates'
import { Plus, ChevronLeft, ChevronRight, Calendar, List, Grid3x3, CalendarDays, Check, X } from 'lucide-react'
import type { CalendarEvent, CalendarView, Rotina } from './types'
import { WeekView }   from './views/WeekView'
import { MonthView }  from './views/MonthView'
import { DayView }    from './views/DayView'
import { ListView }   from './views/ListView'
import { EventModal } from './components/EventModal'
import { RotinaTab }  from './components/RotinaTab'
import { RecurrenceDialog, type RecurrenceScope } from './components/RecurrenceDialog'
import { expandRecurringEvents } from './utils/expandRecurrence'
import { snapDateToQuarterHour } from './utils/snap'
import { HelpButton } from '@/components/help/HelpButton'
import { useRealtimeStore } from '@/stores/useRealtimeStore'
import { useWeekStart } from '@/hooks/useWeekStart'

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

function headerLabel(view: CalendarView, d: Date, weekStartsOn: WeekStart): string {
  if (view === 'mes') {
    return formatMonthYearBR(d)
  }
  if (view === 'semana') {
    const start = startOfWeek(d, weekStartsOn)
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

/* ── Helpers de manipulação de recurrence_rule pro drag-and-drop ── */
const RRULE_WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function parseRruleParts(rule: string): Record<string, string> {
  const map: Record<string, string> = {}
  rule.split(';').forEach(part => {
    const idx = part.indexOf('=')
    if (idx > 0) map[part.slice(0, idx)] = part.slice(idx + 1)
  })
  return map
}

/** Scope "all": move o horário-base da série inteira. Se o dia da semana
 * mudou (arraste horizontal), substitui o dia antigo pelo novo no BYDAY —
 * sem isso, ocorrências futuras continuariam caindo no dia de semana
 * original (expandRecurringEvents usa BYDAY, ou getDay() do start_at
 * quando não há BYDAY explícito). */
function moveWeeklyByday(rule: string, oldWeekday: number, newWeekday: number): string {
  const parts  = parseRruleParts(rule)
  const oldCode = RRULE_WEEKDAYS[oldWeekday]
  const newCode = RRULE_WEEKDAYS[newWeekday]
  let byDay = parts['BYDAY'] ? parts['BYDAY'].split(',').filter(Boolean) : []

  if (byDay.length === 0) {
    byDay = [newCode]
  } else if (byDay.includes(oldCode)) {
    byDay = byDay.map(d => d === oldCode ? newCode : d)
  } else if (!byDay.includes(newCode)) {
    byDay = [...byDay, newCode]
  }
  // dedupe preservando ordem
  byDay = [...new Set(byDay)]

  const segments = rule.split(';').filter(Boolean).filter(p => !p.startsWith('BYDAY='))
  segments.push(`BYDAY=${byDay.join(',')}`)
  return segments.join(';')
}

/* ── Toast (mesmo padrão usado em IntegrationsPage.tsx) ──────────── */
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [])
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 600,
      background: ok ? '#1a2a1a' : '#2a1010',
      border: `1px solid ${ok ? '#34d39940' : '#f8717140'}`,
      borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,.5)',
    }}>
      {ok
        ? <Check size={14} style={{ color: '#34d399', flexShrink: 0 }} />
        : <X size={14} style={{ color: '#f87171', flexShrink: 0 }} />}
      <span style={{ color: 'var(--text)', fontSize: 13 }}>{msg}</span>
    </div>
  )
}

export default function AgendaPage() {
  const { weekStartsOn } = useWeekStart()
  const [tab,               setTab]               = useState<Tab>('agenda')
  const [view,              setView]              = useState<CalendarView>('semana')
  const [currentDate,       setCurrentDate]       = useState(new Date())
  const [events,            setEvents]            = useState<CalendarEvent[]>([])
  const [rotinas,           setRotinas]           = useState<Rotina[]>([])
  const [modal,             setModal]             = useState<Partial<CalendarEvent> | null>(null)
  const [recurrenceDialog,  setRecurrenceDialog]  = useState<{ mode: 'edit' | 'delete' | 'move'; event: Partial<CalendarEvent> } | null>(null)
  const [pendingSaveEvent,  setPendingSaveEvent]  = useState<Partial<CalendarEvent> | null>(null)
  const [pendingMove,       setPendingMove]       = useState<{ event: CalendarEvent; newStart: Date; newEnd: Date } | null>(null)
  const [toast,             setToast]             = useState<{ msg: string; ok: boolean } | null>(null)

  const loadEvents = useCallback(async () => {
    const from = new Date(); from.setDate(from.getDate() - 7)
    const to   = new Date(); to.setDate(to.getDate() + 90)

    const { data: normalEvents } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('start_at', from.toISOString())
      .lte('start_at', to.toISOString())
      .is('recurrence_rule', null)
      .order('start_at')

    const { data: recurringEvents } = await supabase
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
    const { data } = await supabase
      .from('calendar_rotinas')
      .select('*')
      .order('ordem')
    if (data) setRotinas(data as Rotina[])
  }, [])

  useEffect(() => {
    loadEvents()
    loadRotinas()
  }, [loadEvents, loadRotinas])

  // Recarrega quando outra aba/dispositivo muda calendar_events (useRealtimeSync).
  // Pula a primeira execução — o mount acima já carrega os dados.
  const eventsVersion = useRealtimeStore(s => s.versions.calendar_events)
  const skipFirstSync = useRef(true)
  useEffect(() => {
    if (skipFirstSync.current) { skipFirstSync.current = false; return }
    loadEvents()
  }, [eventsVersion, loadEvents])

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
        const { data: parent } = await supabase
          .from('calendar_events').select('recurrence_rule').eq('id', originalId).maybeSingle()
        if (parent) {
          const dateKey = instanceDate.replace(/-/g, '')
          const newRule = addExdate(parent.recurrence_rule, dateKey)
          await supabase.from('calendar_events').update({
            recurrence_rule: newRule,
          }).eq('id', originalId)
        }
      } else {
        await supabase.from('calendar_events').delete().eq('id', originalId)
      }
    } else if (scope === 'this_and_following') {
      if (instanceDate) {
        const until = new Date(instanceDate)
        until.setDate(until.getDate() - 1)
        const untilStr = until.toISOString().slice(0, 10).replace(/-/g, '') + 'T235959Z'
        const { data: parent } = await supabase
          .from('calendar_events').select('recurrence_rule').eq('id', originalId).maybeSingle()
        if (parent) {
          const rule = (parent.recurrence_rule ?? '')
            .split(';').filter((p: string) => !p.startsWith('UNTIL')).join(';')
          await supabase.from('calendar_events').update({
            recurrence_rule: rule + `;UNTIL=${untilStr}`,
          }).eq('id', originalId)
        }
      }
    } else if (scope === 'all') {
      await supabase.from('calendar_events').delete().eq('id', originalId)
    }

    setModal(null)
    setRecurrenceDialog(null)
    loadEvents()
  }

  /* ── Save ───────────────────────────────────────────────────── */
  async function saveEvent(ev: Partial<CalendarEvent>, scope?: RecurrenceScope) {
    if (!ev.title || !ev.start_at || !ev.end_at) return

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
      await supabase.from('calendar_events').insert(payload)
    } else if (!instanceDate || !scope || scope === 'all') {
      // Edit the master event
      await supabase.from('calendar_events')
        .update(payload).eq('id', originalId!)
    } else if (scope === 'this') {
      // Create a standalone event for this date, exclude from parent
      await supabase.from('calendar_events').insert({ ...payload, recurrence_rule: null })
      if (originalId && instanceDate) {
        const { data: parent } = await supabase
          .from('calendar_events').select('recurrence_rule').eq('id', originalId).maybeSingle()
        if (parent) {
          const dateKey = instanceDate.replace(/-/g, '')
          const newRule = addExdate(parent.recurrence_rule, dateKey)
          await supabase.from('calendar_events').update({
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
        const { data: parent } = await supabase
          .from('calendar_events').select('recurrence_rule').eq('id', originalId).maybeSingle()
        if (parent) {
          const rule = (parent.recurrence_rule ?? '')
            .split(';').filter((p: string) => !p.startsWith('UNTIL')).join(';')
          await supabase.from('calendar_events').update({
            recurrence_rule: rule + `;UNTIL=${untilStr}`,
          }).eq('id', originalId)
        }
        // Create new series from this date
        await supabase.from('calendar_events').insert(payload)
      }
    }

    setModal(null)
    setRecurrenceDialog(null)
    loadEvents()
  }

  /* ── Move (drag-and-drop) ───────────────────────────────────── */
  async function moveEvent(ev: CalendarEvent, newStart: Date, newEnd: Date, scope?: RecurrenceScope) {
    const originalId   = getOriginalId(ev.id)
    const instanceDate = getInstanceDate(ev.id)
    const isRecurring  = !!ev.recurrence_rule || !!instanceDate

    if (!isRecurring) {
      // Evento avulso: move direto, sem diálogo.
      await supabase.from('calendar_events').update({
        start_at: newStart.toISOString(),
        end_at:   newEnd.toISOString(),
      }).eq('id', ev.id)
      return
    }

    if (scope === 'this') {
      // Cria evento avulso na nova data/horário, exclui a data original da série.
      await supabase.from('calendar_events').insert({
        title:           ev.title,
        description:     ev.description,
        start_at:        newStart.toISOString(),
        end_at:           newEnd.toISOString(),
        all_day:         ev.all_day,
        color:           ev.color,
        location:        ev.location,
        recurrence_rule: null,
        tags:            ev.tags,
      })
      const dateKey = (instanceDate ?? ev.start_at.slice(0, 10)).replace(/-/g, '')
      const { data: parent } = await supabase
        .from('calendar_events').select('recurrence_rule').eq('id', originalId).maybeSingle()
      if (parent) {
        const newRule = addExdate(parent.recurrence_rule, dateKey)
        await supabase.from('calendar_events').update({ recurrence_rule: newRule }).eq('id', originalId)
      }
    } else if (scope === 'this_and_following') {
      const originalDateStr = instanceDate ?? ev.start_at.slice(0, 10)
      const until    = new Date(originalDateStr)
      until.setDate(until.getDate() - 1)
      const untilStr = until.toISOString().slice(0, 10).replace(/-/g, '') + 'T235959Z'
      const { data: parent } = await supabase
        .from('calendar_events').select('recurrence_rule').eq('id', originalId).maybeSingle()
      if (parent) {
        const cappedRule = (parent.recurrence_rule ?? '')
          .split(';').filter((p: string) => !p.startsWith('UNTIL')).join(';')
        await supabase.from('calendar_events').update({
          recurrence_rule: cappedRule + `;UNTIL=${untilStr}`,
        }).eq('id', originalId)

        // Nova série a partir da nova data/horário, mesmo padrão de repetição
        // (sem UNTIL herdado da série anterior).
        const newSeriesRule = parent.recurrence_rule
          ? parent.recurrence_rule.split(';').filter((p: string) => !p.startsWith('UNTIL') && !p.startsWith('EXDATE')).join(';')
          : null
        await supabase.from('calendar_events').insert({
          title:           ev.title,
          description:     ev.description,
          start_at:        newStart.toISOString(),
          end_at:           newEnd.toISOString(),
          all_day:         ev.all_day,
          color:           ev.color,
          location:        ev.location,
          recurrence_rule: newSeriesRule,
          tags:            ev.tags,
        })
      }
    } else if (scope === 'all') {
      const { data: parent } = await supabase
        .from('calendar_events').select('start_at, end_at, recurrence_rule').eq('id', originalId).maybeSingle()
      if (parent) {
        const oldWeekday = new Date(ev.start_at).getDay()
        const newWeekday = newStart.getDay()
        const duration   = new Date(parent.end_at).getTime() - new Date(parent.start_at).getTime()

        // Só o horário do dia muda no anchor — o dia-da-semana da série é
        // controlado pelo BYDAY (ajustado abaixo quando necessário), não
        // pela data literal do evento raiz.
        const masterStart = new Date(parent.start_at)
        masterStart.setHours(newStart.getHours(), newStart.getMinutes(), 0, 0)
        const masterEnd = new Date(masterStart.getTime() + duration)

        let rule = parent.recurrence_rule ?? ''
        const freq = parseRruleParts(rule)['FREQ'] ?? 'WEEKLY'
        if (freq === 'WEEKLY' && oldWeekday !== newWeekday) {
          rule = moveWeeklyByday(rule, oldWeekday, newWeekday)
        } else if (freq !== 'WEEKLY') {
          // Sem BYDAY relevante — desloca a data-âncora inteira.
          masterStart.setTime(newStart.getTime())
          masterEnd.setTime(newStart.getTime() + duration)
        }

        await supabase.from('calendar_events').update({
          start_at:        masterStart.toISOString(),
          end_at:           masterEnd.toISOString(),
          recurrence_rule: rule || null,
        }).eq('id', originalId)
      }
    }
  }

  async function handleMoveEvent(ev: CalendarEvent, newStart: Date, newEnd: Date) {
    const isRecurring = !!ev.recurrence_rule || isSyntheticId(ev.id)

    if (isRecurring) {
      setPendingMove({ event: ev, newStart, newEnd })
      setRecurrenceDialog({ mode: 'move', event: ev })
      return
    }

    // Não recorrente: atualização otimista + reverte em caso de erro.
    const prevEvents = events
    setEvents(prev => prev.map(e => e.id === ev.id
      ? { ...e, start_at: newStart.toISOString(), end_at: newEnd.toISOString() }
      : e))
    try {
      await moveEvent(ev, newStart, newEnd)
      loadEvents()
    } catch {
      setEvents(prevEvents)
      setToast({ msg: 'Não foi possível mover o evento. Tente novamente.', ok: false })
    }
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
    const snappedStart = snapDateToQuarterHour(start)
    const end = new Date(snappedStart)
    end.setHours(snappedStart.getHours() + 1)
    setModal({
      title:    '',
      start_at: snappedStart.toISOString(),
      end_at:   end.toISOString(),
      all_day:  false,
      color:    '#0EA5E9',
    })
  }

  const sharedViewProps = {
    events,
    currentDate,
    weekStartsOn,
    onSelectEvent: handleSelectEvent,
    onSelectSlot:  (start: Date) => openNewEvent(start),
    onMoveEvent:   handleMoveEvent,
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
                  tab === t ? 'bg-[#1f1f1f] text-white' : 'text-ink-3 hover:text-white',
                ].join(' ')}>
                {t === 'agenda' ? 'Agenda' : 'Rotina'}
              </button>
            ))}
          </div>

          <HelpButton pageId="agenda" />

          {tab === 'agenda' && (
            <>
              <button onClick={goToday}
                className="px-2.5 py-1.5 text-xs text-ink-3 border border-[#1f1f1f] rounded-lg hover:text-white transition-colors shrink-0">
                Hoje
              </button>
              <button onClick={() => navigate(-1)} className="text-ink-3 hover:text-white transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => navigate(1)} className="text-ink-3 hover:text-white transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center">
                <ChevronRight size={16} />
              </button>
              <span className="text-xs sm:text-sm font-semibold text-white capitalize truncate min-w-0">
                {headerLabel(view, currentDate, weekStartsOn)}
              </span>
              <div className="flex-1" />
              <button
                onClick={() => openNewEvent(new Date())}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand text-black rounded-lg hover:bg-[#38bdf8] transition-colors shrink-0"
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
                  view === v.id ? 'bg-[#1f1f1f] text-white' : 'text-ink-3 hover:text-white',
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
            } else if (recurrenceDialog.mode === 'move') {
              if (pendingMove) {
                try {
                  await moveEvent(pendingMove.event, pendingMove.newStart, pendingMove.newEnd, scope)
                  loadEvents()
                } catch {
                  setToast({ msg: 'Não foi possível mover o evento. Tente novamente.', ok: false })
                }
              }
              setPendingMove(null)
              setRecurrenceDialog(null)
            } else {
              if (pendingSaveEvent) {
                await saveEvent(pendingSaveEvent, scope)
              }
              setPendingSaveEvent(null)
              setRecurrenceDialog(null)
            }
          }}
          onClose={() => { setRecurrenceDialog(null); setPendingSaveEvent(null); setPendingMove(null) }}
        />
      )}

      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
    </div>
  )
}
