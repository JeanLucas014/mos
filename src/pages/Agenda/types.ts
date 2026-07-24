export interface CalendarTag {
  id: string
  user_id: string
  name: string
  color: string
}

export interface Agenda {
  id: string
  user_id: string
  nome: string
  cor: string
  eh_padrao: boolean
  ordem: number
  created_at: string
}

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description: string | null
  start_at: string
  end_at: string
  all_day: boolean
  /** Sempre resolvida no load (nunca null em runtime) — se o evento não tem
   * cor própria, herda a cor da agenda; ver resolveEventColor em index.tsx. */
  color: string
  agenda_id: string | null
  location: string | null
  recurrence_rule: string | null
  tags?: string[]
  created_at: string
}

/** Payload do formulário de evento — cor pode ser null explicitamente
 * ("Automático": herda a cor da agenda), diferente de CalendarEvent.color
 * (sempre uma string já resolvida, usado pra exibição na grade). */
export type EventFormPayload = Omit<Partial<CalendarEvent>, 'color'> & { color?: string | null }

export interface Rotina {
  id: string
  user_id: string
  titulo: string
  descricao: string | null
  hora_inicio: string | null
  hora_fim: string | null
  dias_semana: string[]
  cor: string
  ativa: boolean
  ordem: number
}

export type CalendarView = 'semana' | 'mes' | 'dia' | 'lista'

export const EVENT_COLORS = [
  '#0EA5E9', '#22c55e', '#ef4444', '#f97316',
  '#a78bfa', '#f59e0b', '#ec4899', '#14b8a6',
]

export const DIAS_SEMANA = [
  { id: 'dom', label: 'Dom' },
  { id: 'seg', label: 'Seg' },
  { id: 'ter', label: 'Ter' },
  { id: 'qua', label: 'Qua' },
  { id: 'qui', label: 'Qui' },
  { id: 'sex', label: 'Sex' },
  { id: 'sab', label: 'Sáb' },
]
