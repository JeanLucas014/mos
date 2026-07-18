/**
 * Status de projeto — genéricos o suficiente pra cobrir projetos de
 * desenvolvimento, de empresa, ou qualquer outra iniciativa pessoal.
 * Fonte única de verdade: ProjectsPage.tsx e ProjectsWidget.tsx (Dashboard)
 * usam este arquivo em vez de duplicar a config.
 */
export type ProjectStatus = 'planejamento' | 'em_andamento' | 'pausado' | 'concluido' | 'cancelado'

export interface ProjectStatusCfg {
  label: string
  color: string
  bg: string
}

export const PROJECT_STATUS_CFG: Record<ProjectStatus, ProjectStatusCfg> = {
  planejamento: { label: 'Planejamento', color: 'var(--text2)', bg: 'rgba(255,255,255,.06)' },
  em_andamento: { label: 'Em andamento', color: 'var(--blue)',  bg: 'rgba(14,165,233,.14)' },
  pausado:      { label: 'Pausado',      color: '#fbbf24',      bg: 'rgba(251,191,36,.12)' },
  concluido:    { label: 'Concluído',    color: '#34d399',      bg: 'rgba(52,211,153,.12)' },
  cancelado:    { label: 'Cancelado',    color: '#ef4444',      bg: 'rgba(239,68,68,.12)' },
}

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  'planejamento', 'em_andamento', 'pausado', 'concluido', 'cancelado',
]

export function projectStatusCfg(status: string): ProjectStatusCfg {
  return PROJECT_STATUS_CFG[status as ProjectStatus] ?? PROJECT_STATUS_CFG.planejamento
}
