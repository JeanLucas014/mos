import { formatLocalDate } from '../../lib/dates'

/* ══════════════════════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════════════════════ */
export function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function longDate(): string {
  const s = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function daysUntil(dateStr: string): number {
  const t = new Date(); t.setHours(0, 0, 0, 0)
  const d = new Date(dateStr + 'T12:00:00')
  return Math.ceil((d.getTime() - t.getTime()) / 86_400_000)
}

export function fmtEventTime(iso: string): string {
  const ev       = new Date(iso)
  const now      = new Date()
  const todayStr = formatLocalDate(now)
  const evStr    = formatLocalDate(ev)
  const tmw      = new Date(now); tmw.setDate(now.getDate() + 1)
  const tmwStr   = formatLocalDate(tmw)
  const hhmm     = `${String(ev.getHours()).padStart(2,'0')}:${String(ev.getMinutes()).padStart(2,'0')}`
  if (evStr === todayStr) return `Hoje, ${hhmm}`
  if (evStr === tmwStr)   return `Amanhã, ${hhmm}`
  const weekday = ev.toLocaleDateString('pt-BR', { weekday: 'short' })
    .replace('.', '').replace(/^\w/, c => c.toUpperCase())
  const day   = String(ev.getDate()).padStart(2, '0')
  const month = String(ev.getMonth() + 1).padStart(2, '0')
  return `${weekday}, ${day}/${month}, ${hhmm}`
}
