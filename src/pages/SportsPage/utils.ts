import type { Sport } from './types'

/* ── Helpers ───────────────────────────────────────────────────── */
export function fmtDuration(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

export function parseDuration(str: string): number {
  const parts = str.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

export function calcPace(distance_m: number, duration_s: number): string {
  if (!distance_m || !duration_s) return '—'
  const secPerKm = duration_s / (distance_m / 1000)
  return `${Math.floor(secPerKm / 60)}:${String(Math.round(secPerKm % 60)).padStart(2, '0')}/km`
}

export function fmtDate(d: string): string {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T12:00:00')
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}


export function fmtDurationShort(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m}min`
}

export function fmtKm(m: number | null): string | null {
  if (!m) return null
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
}

export function fmtMonthLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function fmtDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const wd = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
  return `${wd}, ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
}

export function calcAvgPace(workouts: Sport[]): string | null {
  const runs = workouts.filter(w => w.sport !== 'musculacao' && w.distance_m && w.duration_s)
  if (!runs.length) return null
  const totalDist = runs.reduce((s, w) => s + (w.distance_m ?? 0), 0)
  const totalTime = runs.reduce((s, w) => s + (w.duration_s ?? 0), 0)
  const secPerKm = totalTime / (totalDist / 1000)
  return `${Math.floor(secPerKm / 60)}:${String(Math.round(secPerKm % 60)).padStart(2, '0')}/km`
}

export function groupByMonth(workouts: Sport[]): [string, Sport[]][] {
  const groups: Record<string, Sport[]> = {}
  workouts.forEach(w => {
    const key = w.sport_date.slice(0, 7)
    if (!groups[key]) groups[key] = []
    groups[key].push(w)
  })
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
}

/* ── Pace calculator helpers (GoalsSection) ──────────────────────── */
export function paceToSec(pace: string): number {
  const m = pace.match(/^(\d+):(\d{2})/)
  if (!m) return 0
  return parseInt(m[1]) * 60 + parseInt(m[2])
}
export function secToPace(s: number): string {
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}/km`
}
