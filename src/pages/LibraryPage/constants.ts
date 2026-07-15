import type { BookStatus } from './types'

/* ── Status config ──────────────────────────────────────────────────── */
export const STATUS_CFG: Record<BookStatus, { label: string; color: string; bg: string }> = {
  lendo:     { label: 'Lendo',     color: '#0EA5E9', bg: 'rgba(14,165,233,.14)' },
  lido:      { label: 'Lido',      color: '#34d399', bg: 'rgba(52,211,153,.12)' },
  quero_ler:      { label: 'Quero ler',      color: 'var(--text2)',    bg: 'rgba(255,255,255,.06)' },
  nao_finalizado: { label: 'Não finalizado', color: '#f97316', bg: 'rgba(249,115,22,.14)' },
}

export const SECTIONS: { key: BookStatus; label: string; color: string }[] = [
  { key: 'lendo',     label: 'Lendo',     color: '#0EA5E9' },
  { key: 'quero_ler',      label: 'Quero ler',     color: 'var(--text2)' },
  { key: 'nao_finalizado', label: 'Não finalizados', color: '#f97316' },
  { key: 'lido',           label: 'Lidos',          color: '#34d399' },
]

export const FORMAT_OPTIONS = ['Físico', 'Kindle', 'PDF', 'Audiobook']
export const CATEGORY_OPTIONS = ['Ficção', 'Não-ficção', 'Técnico', 'Autoajuda', 'Biogr.', 'Ciência', 'Filosofia', 'Outro']
export const SORT_OPTIONS = [
  { value: 'created_at', label: 'Adicionado' },
  { value: 'title', label: 'Título A-Z' },
  { value: 'rating', label: 'Avaliação' },
  { value: 'finished_at', label: 'Concluído' },
]

export const GRADIENTS = [
  'linear-gradient(145deg,#0EA5E9,#0369a1)',
  'linear-gradient(145deg,#a78bfa,#6d28d9)',
  'linear-gradient(145deg,#34d399,#047857)',
  'linear-gradient(145deg,#f59e0b,#b45309)',
  'linear-gradient(145deg,#f87171,#b91c1c)',
  'linear-gradient(145deg,#818cf8,#3730a3)',
]
