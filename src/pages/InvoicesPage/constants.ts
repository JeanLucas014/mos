import type { Status } from './types'

/* ── Palette ─────────────────────────────────────────────────────── */
export const C = {
  bg:     'var(--bg)',
  card:   'var(--bg2)',
  card2:  'var(--bg3)',
  border: 'var(--border)',
  tx:     'var(--text)',
  dm:     'var(--text2)',
  dm2:    'var(--text3)',
  b:      '#0EA5E9',
  g:      '#34d399',
  r:      '#f87171',
  a:      '#fbbf24',
  p:      '#a78bfa',
}

/* ── Status config ───────────────────────────────────────────────── */
export const STATUS_CFG: Record<Status, { label: string; color: string; bg: string }> = {
  'enviado':    { label: 'Enviado',    color: '#7dd3fc', bg: '#0c1e2b' },
  'em dev':     { label: 'Em dev',     color: '#fcd34d', bg: '#1f1508' },
  'aprovado':   { label: 'Aprovado',   color: '#6ee7b7', bg: '#0a1f14' },
  'recorrente': { label: 'Recorrente', color: '#c4b5fd', bg: '#14112a' },
  'pago':       { label: 'Pago',       color: 'var(--text2)', bg: 'var(--bg3)' },
}

export const ALL_STATUSES: Status[] = ['enviado', 'em dev', 'aprovado', 'recorrente', 'pago']

/* ── Moto tab ────────────────────────────────────────────────────── */
export const ENTRADA_CATS = ['Corrida', 'Entrega', 'Outros']
export const GASTO_CATS   = ['Gasolina', 'Manutenção', 'Alimentação', 'Multa', 'Outros']
export const MONTH_NAMES  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
