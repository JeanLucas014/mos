import { useState, useEffect } from 'react'
import { X, Trash2, MapPin, AlignLeft, Clock, Tag } from 'lucide-react'
import type { CalendarEvent, CalendarTag } from '../types'
import { EVENT_COLORS } from '../types'
import { supabase } from '../../../lib/supabase'

interface Props {
  event: Partial<CalendarEvent>
  onSave: (e: Partial<CalendarEvent>) => void
  onDelete?: () => void
  onClose: () => void
}

function toLocalInput(iso: string): string {
  const d   = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(local: string): string {
  return new Date(local).toISOString()
}

const RECURRENCE_OPTIONS = [
  { id: '',         label: 'Não se repete' },
  { id: 'DAILY',    label: 'Todos os dias' },
  { id: 'WEEKLY',   label: 'Semanalmente' },
  { id: 'WEEKDAYS', label: 'Dias úteis (seg a sex)' },
  { id: 'MONTHLY',  label: 'Mensalmente' },
  { id: 'YEARLY',   label: 'Anualmente' },
  { id: 'CUSTOM',   label: 'Personalizar...' },
]

const WEEK_DAYS = [
  { id: 'MO', label: 'S' },
  { id: 'TU', label: 'T' },
  { id: 'WE', label: 'Q' },
  { id: 'TH', label: 'Q' },
  { id: 'FR', label: 'S' },
  { id: 'SA', label: 'S' },
  { id: 'SU', label: 'D' },
]

export function EventModal({ event, onSave, onDelete, onClose }: Props) {
  const isNew = !event.id

  const [title,       setTitle]       = useState(event.title ?? '')
  const [desc,        setDesc]        = useState(event.description ?? '')
  const [startAt,     setStartAt]     = useState(event.start_at ? toLocalInput(event.start_at) : '')
  const [endAt,       setEndAt]       = useState(event.end_at   ? toLocalInput(event.end_at)   : '')
  const [allDay,      setAllDay]      = useState(event.all_day  ?? false)
  const [color,       setColor]       = useState(event.color    ?? '#0EA5E9')
  const [location,    setLocation]    = useState(event.location ?? '')
  const [saving,      setSaving]      = useState(false)
  const [tags,        setTags]        = useState<string[]>(event.tags ?? [])
  const [allTags,     setAllTags]     = useState<CalendarTag[]>([])

  // Recurrence
  const [rrule,       setRrule]       = useState(event.recurrence_rule ?? '')
  const [showCustom,  setShowCustom]  = useState(false)
  const [recFreq,     setRecFreq]     = useState('WEEKLY')
  const [recInterval, setRecInterval] = useState(1)
  const [recDays,     setRecDays]     = useState<string[]>([])
  const [recEnd,      setRecEnd]      = useState<'never' | 'date'>('never')
  const [recEndDate,  setRecEndDate]  = useState('')

  useEffect(() => {
    ;(supabase as any).from('calendar_tags').select('*').order('name')
      .then(({ data }: { data: CalendarTag[] | null }) => setAllTags(data ?? []))
  }, [])

  function buildRrule(): string {
    if (!rrule && !showCustom) return ''
    if (rrule === 'CUSTOM' || showCustom) {
      let rule = `FREQ=${recFreq};INTERVAL=${recInterval}`
      if (recFreq === 'WEEKLY' && recDays.length > 0) {
        rule += `;BYDAY=${recDays.join(',')}`
      }
      if (recEnd === 'date' && recEndDate) {
        rule += `;UNTIL=${recEndDate.replace(/-/g, '')}T235959Z`
      }
      return rule
    }
    const MAP: Record<string, string> = {
      'DAILY':    'FREQ=DAILY;INTERVAL=1',
      'WEEKLY':   `FREQ=WEEKLY;INTERVAL=1${startAt ? `;BYDAY=${['SU','MO','TU','WE','TH','FR','SA'][new Date(startAt).getDay()]}` : ''}`,
      'WEEKDAYS': 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
      'MONTHLY':  'FREQ=MONTHLY;INTERVAL=1',
      'YEARLY':   'FREQ=YEARLY;INTERVAL=1',
    }
    return MAP[rrule] ?? ''
  }

  async function handleSave() {
    if (!title.trim() || !startAt) return
    setSaving(true)
    onSave({
      ...event,
      title:            title.trim(),
      description:      desc.trim() || null,
      start_at:         fromLocalInput(startAt),
      end_at:           endAt ? fromLocalInput(endAt) : fromLocalInput(startAt),
      all_day:          allDay,
      color,
      location:         location.trim() || null,
      tags,
      recurrence_rule:  buildRrule() || null,
    })
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111111] border border-[#1f1f1f] rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1f1f1f]">
          <div className="flex gap-1.5 flex-wrap">
            {EVENT_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                style={{
                  background:    c,
                  outline:       color === c ? `2px solid ${c}` : 'none',
                  outlineOffset: 2,
                }} />
            ))}
          </div>
          <div className="flex-1" />
          {!isNew && onDelete && (
            <button onClick={onDelete} className="text-[#555] hover:text-[#ef4444] transition-colors">
              <Trash2 size={14} />
            </button>
          )}
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Title */}
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
            placeholder="Título do evento"
            className="w-full bg-transparent text-white text-base font-medium outline-none placeholder:text-[#333]"
          />

          {/* All day */}
          <label className="flex items-center gap-2 text-xs text-[#555] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allDay}
              onChange={e => setAllDay(e.target.checked)}
              className="accent-[#0EA5E9]"
            />
            Dia inteiro
          </label>

          {/* Start / End */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[#555] shrink-0" />
              <input
                type={allDay ? 'date' : 'datetime-local'}
                value={allDay ? startAt.slice(0, 10) : startAt}
                onChange={e => setStartAt(allDay ? e.target.value + 'T00:00' : e.target.value)}
                className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#0EA5E9]/60"
              />
            </div>
            {!allDay && (
              <div className="flex items-center gap-2">
                <div className="w-[14px]" />
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={e => setEndAt(e.target.value)}
                  className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#0EA5E9]/60"
                />
              </div>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-[#555] shrink-0" />
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Local (opcional)"
              className="flex-1 bg-transparent text-sm text-[#aaa] outline-none placeholder:text-[#2a2a2a]"
            />
          </div>

          {/* Recorrência */}
          <div className="flex items-start gap-2">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[#555] shrink-0 mt-0.5">
              <path d="M2 8a6 6 0 1 0 6-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M2 4v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="flex-1 space-y-2">
              <select
                value={rrule}
                onChange={e => {
                  setRrule(e.target.value)
                  setShowCustom(e.target.value === 'CUSTOM')
                }}
                className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-2.5 py-1.5
                           text-xs text-white outline-none focus:border-[#0EA5E9]/60"
              >
                {RECURRENCE_OPTIONS.map(o => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>

              {/* Painel de personalização inline */}
              {showCustom && (
                <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-3 space-y-3">
                  {/* Repetir a cada N */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#555]">Repetir a cada</span>
                    <input
                      type="number" min={1} max={99}
                      value={recInterval}
                      onChange={e => setRecInterval(Number(e.target.value))}
                      className="w-14 bg-[#111111] border border-[#1f1f1f] rounded-lg px-2 py-1
                                 text-xs text-white text-center outline-none focus:border-[#0EA5E9]/60"
                    />
                    <select
                      value={recFreq}
                      onChange={e => setRecFreq(e.target.value)}
                      className="flex-1 bg-[#111111] border border-[#1f1f1f] rounded-lg px-2 py-1
                                 text-xs text-white outline-none focus:border-[#0EA5E9]/60"
                    >
                      <option value="DAILY">dia(s)</option>
                      <option value="WEEKLY">semana(s)</option>
                      <option value="MONTHLY">mês(es)</option>
                      <option value="YEARLY">ano(s)</option>
                    </select>
                  </div>

                  {/* Dias da semana (só quando freq=WEEKLY) */}
                  {recFreq === 'WEEKLY' && (
                    <div>
                      <div className="text-[11px] text-[#555] mb-1.5">Repetir:</div>
                      <div className="flex gap-1">
                        {WEEK_DAYS.map(d => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setRecDays(prev =>
                              prev.includes(d.id)
                                ? prev.filter(x => x !== d.id)
                                : [...prev, d.id]
                            )}
                            className="w-8 h-8 text-xs rounded-full border transition-colors font-semibold"
                            style={{
                              borderColor: recDays.includes(d.id) ? '#0EA5E9' : 'var(--border)',
                              background:  recDays.includes(d.id) ? 'rgba(14,165,233,.2)' : 'transparent',
                              color:       recDays.includes(d.id) ? '#0EA5E9' : '#555',
                            }}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Termina em */}
                  <div>
                    <div className="text-[11px] text-[#555] mb-1.5">Termina em</div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-xs text-[#aaa] cursor-pointer">
                        <input type="radio" name="recEnd" value="never"
                          checked={recEnd === 'never'}
                          onChange={() => setRecEnd('never')}
                          className="accent-[#0EA5E9]" />
                        Nunca
                      </label>
                      <label className="flex items-center gap-2 text-xs text-[#aaa] cursor-pointer">
                        <input type="radio" name="recEnd" value="date"
                          checked={recEnd === 'date'}
                          onChange={() => setRecEnd('date')}
                          className="accent-[#0EA5E9]" />
                        Em
                        {recEnd === 'date' && (
                          <input
                            type="date"
                            value={recEndDate}
                            onChange={e => setRecEndDate(e.target.value)}
                            className="ml-1 bg-[#111111] border border-[#1f1f1f] rounded-lg px-2 py-0.5
                                       text-xs text-white outline-none focus:border-[#0EA5E9]/60"
                          />
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Label descritiva */}
              {rrule && rrule !== 'CUSTOM' && (
                <div className="text-[11px] text-[#0EA5E9]">
                  {RECURRENCE_OPTIONS.find(o => o.id === rrule)?.label}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex items-start gap-2">
            <AlignLeft size={14} className="text-[#555] shrink-0 mt-0.5" />
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Descrição (opcional)"
              rows={2}
              className="flex-1 bg-transparent text-sm text-[#aaa] outline-none resize-none placeholder:text-[#2a2a2a]"
            />
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="flex items-start gap-2">
              <Tag size={14} className="text-[#555] shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(t => {
                  const active = tags.includes(t.id)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTags(prev =>
                        active ? prev.filter(id => id !== t.id) : [...prev, t.id]
                      )}
                      className="px-2.5 py-0.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: active ? t.color + '33' : 'var(--border)',
                        color:      active ? t.color : '#555',
                        border:     `1px solid ${active ? t.color + '66' : '#2a2a2a'}`,
                      }}
                    >
                      {t.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#1f1f1f]">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-[#555] hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-4 py-1.5 text-sm font-semibold bg-[#0EA5E9] text-black rounded-lg hover:bg-[#38bdf8] disabled:opacity-40 transition-colors"
          >
            {saving ? 'Salvando…' : isNew ? 'Criar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
