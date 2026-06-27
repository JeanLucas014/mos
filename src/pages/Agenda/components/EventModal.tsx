import { useState } from 'react'
import { X, Trash2, MapPin, AlignLeft, Clock } from 'lucide-react'
import type { CalendarEvent } from '../types'
import { EVENT_COLORS } from '../types'

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

export function EventModal({ event, onSave, onDelete, onClose }: Props) {
  const isNew = !event.id

  const [title,    setTitle]    = useState(event.title ?? '')
  const [desc,     setDesc]     = useState(event.description ?? '')
  const [startAt,  setStartAt]  = useState(event.start_at ? toLocalInput(event.start_at) : '')
  const [endAt,    setEndAt]    = useState(event.end_at   ? toLocalInput(event.end_at)   : '')
  const [allDay,   setAllDay]   = useState(event.all_day  ?? false)
  const [color,    setColor]    = useState(event.color    ?? '#0EA5E9')
  const [location, setLocation] = useState(event.location ?? '')
  const [saving,   setSaving]   = useState(false)

  async function handleSave() {
    if (!title.trim() || !startAt) return
    setSaving(true)
    onSave({
      ...event,
      title:       title.trim(),
      description: desc.trim() || null,
      start_at:    fromLocalInput(startAt),
      end_at:      endAt ? fromLocalInput(endAt) : fromLocalInput(startAt),
      all_day:     allDay,
      color,
      location:    location.trim() || null,
    })
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111111] border border-[#1f1f1f] rounded-xl w-full max-w-md"
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
