/**
 * Local-calendar-day date helpers.
 *
 * `Date#toISOString()` always serializes in UTC. In Brazil (UTC-3), any local
 * time from 21:00 to 23:59 already belongs to the *next* UTC day, so
 * `new Date().toISOString().slice(0, 10)` silently returns tomorrow's date
 * during those hours. These helpers use the local getters (`getFullYear`,
 * `getMonth`, `getDate`) instead, so "today" always means the user's actual
 * calendar day regardless of timezone offset.
 */

export function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function todayLocal(): string {
  return formatLocalDate(new Date())
}

export function addDaysLocal(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return formatLocalDate(d)
}

export function daysAgoLocal(days: number): string {
  return addDaysLocal(todayLocal(), -days)
}

/**
 * pt-BR formatters. Accept either a Date or an ISO string. Plain
 * 'YYYY-MM-DD' strings get a noon local time appended before parsing —
 * otherwise `new Date('YYYY-MM-DD')` parses as UTC midnight, which can
 * roll back to the previous day once rendered in Brazil's timezone.
 */
function toDate(date: string | Date): Date {
  if (date instanceof Date) return date
  return new Date(date.length === 10 ? date + 'T12:00:00' : date)
}

export function formatDateBR(date: string | Date): string {
  return toDate(date).toLocaleDateString('pt-BR')
}

export function formatDateTimeBR(date: string | Date): string {
  const d = toDate(date)
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

export function formatMonthYearBR(date: string | Date): string {
  return toDate(date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}
