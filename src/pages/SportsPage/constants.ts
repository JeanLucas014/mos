/* ── Sport catalog ─────────────────────────────────────────────── */
export const SPORT_CATALOG: { key: string; label: string }[] = [
  { key: 'corrida',    label: 'Corrida' },
  { key: 'triathlon',  label: 'Triathlon' },
  { key: 'musculacao', label: 'Musculação' },
  { key: 'natacao',    label: 'Natação' },
  { key: 'ciclismo',   label: 'Ciclismo' },
  { key: 'yoga',       label: 'Yoga' },
  { key: 'crossfit',   label: 'Crossfit' },
  { key: 'futebol',    label: 'Futebol' },
  { key: 'tenis',      label: 'Tênis' },
  { key: 'volei',      label: 'Vôlei' },
  { key: 'caminhada',  label: 'Caminhada' },
  { key: 'escalada',   label: 'Escalada' },
]

export const SPORT_LABEL_BY_KEY: Record<string, string> = Object.fromEntries(
  SPORT_CATALOG.map(c => [c.key, c.label]),
)

/* ── Sport config ──────────────────────────────────────────────── */
export const SPORT_KINDS: Record<string, string[]> = {
  corrida:    ['easy', 'long', 'tempo', 'interval'],
  caminhada:  ['easy', 'long', 'tempo', 'interval'],
  ciclismo:   ['easy', 'long', 'tempo', 'interval'],
  natacao:    ['easy', 'long', 'tempo', 'interval'],
  triathlon:  ['natação', 'bike', 'corrida', 'tijolo'],
  musculacao: ['superior', 'inferior', 'full_body', 'cardio', 'alongamento'],
}
export const KIND_LABELS: Record<string, string> = {
  easy: 'Fácil', long: 'Longo', tempo: 'Tempo', interval: 'Intervalo',
  natação: 'Natação', bike: 'Bike', corrida: 'Corrida', tijolo: 'Tijolo',
  superior: 'Superior', inferior: 'Inferior', full_body: 'Full Body',
  cardio: 'Cardio', alongamento: 'Alongamento', geral: 'Geral',
}

/* ── Modality tabs (WorkoutsSection) ──────────────────────────────── */
export const MODALITY_TABS = [
  { key: 'todos',      label: 'Todos' },
  { key: 'corrida',    label: 'Corrida' },
  { key: 'caminhada',  label: 'Caminhada' },
  { key: 'ciclismo',   label: 'Ciclismo' },
  { key: 'natacao',    label: 'Natação' },
  { key: 'musculacao', label: 'Musculação' },
  { key: 'triathlon',  label: 'Triathlon' },
] as const
export type ModalityTab = typeof MODALITY_TABS[number]['key']
