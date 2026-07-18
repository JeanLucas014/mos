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

/**
 * Semana começa no domingo (0) ou na segunda (1) — configurável em
 * Configurações > Aparência, padrão segunda. Usado pela Agenda (WeekView,
 * MonthView, label de intervalo da semana) pra todo cálculo de início de
 * semana ficar consistente com a preferência do usuário.
 */
export type WeekStart = 0 | 1

export function startOfWeek(d: Date, weekStartsOn: WeekStart = 1): Date {
  const r = new Date(d)
  const day = d.getDay() // 0=Dom .. 6=Sáb
  const diff = (day - weekStartsOn + 7) % 7
  r.setDate(d.getDate() - diff)
  r.setHours(0, 0, 0, 0)
  return r
}

/** Posição (0-6) do primeiro dia do mês na grade do MonthView, dado o dia
 * em que a semana começa. */
export function monthGridOffset(firstOfMonth: Date, weekStartsOn: WeekStart): number {
  return (firstOfMonth.getDay() - weekStartsOn + 7) % 7
}

/** Cabeçalho de dias da semana (abreviado, pt-BR) na ordem certa pro
 * weekStartsOn escolhido. */
export function weekdayHeaders(weekStartsOn: WeekStart): string[] {
  const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  return weekStartsOn === 0 ? labels : [...labels.slice(1), labels[0]]
}
