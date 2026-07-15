import type { Invoice } from './types'

/* ── Helpers ─────────────────────────────────────────────────────── */
export function fmt(cents: number): string {
  const v = cents / 100
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function fmtDate(d: string | null): string | null {
  if (!d) return null
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export function isPaid(inv: Invoice) {
  return inv.status === 'pago'
}
