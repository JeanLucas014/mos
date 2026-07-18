export interface ModuleDef {
  id: string
  label: string
  group: string
  description: string
  core?: boolean
  hidden?: boolean
  /** Jean-only — visível/ativável só com user_settings.is_admin, nunca
   * via enabled_modules sozinho. Ver RequireAdmin.tsx. */
  adminOnly?: boolean
}

export const MODULES: ModuleDef[] = [
  { id: 'dashboard',   label: 'Dashboard',        group: 'Sistema',       description: 'Visão geral de tudo', core: true },
  { id: 'agenda',      label: 'Agenda',           group: 'Produtividade', description: 'Calendário e eventos' },
  { id: 'tarefas',     label: 'Tarefas',          group: 'Produtividade', description: 'To-do list com projetos e prioridades' },
  { id: 'projetos',    label: 'Projetos',         group: 'Produtividade', description: 'Acompanhamento de projetos pessoais' },
  { id: 'metas',       label: 'Metas',            group: 'Produtividade', description: 'Metas de longo prazo com progresso' },
  { id: 'habitos',     label: 'Hábitos',          group: 'Produtividade', description: 'Rastreamento de hábitos diários' },
  { id: 'compras',     label: 'Lista de compras', group: 'Produtividade', description: 'Listas de compras por categoria' },
  { id: 'notas',       label: 'Notas',            group: 'Produtividade', description: 'Bloco de notas rápidas' },
  { id: 'financeiro',  label: 'Financeiro',       group: 'Finanças',      description: 'Controle financeiro pessoal' },
  { id: 'faturamento', label: 'Faturamento',      group: 'Finanças',      description: 'Faturamento de negócio/freelance', hidden: true, adminOnly: true },
  { id: 'estudos',     label: 'Estudos',          group: 'Conhecimento',  description: 'Estudos e biblioteca de livros' },
  { id: 'senhas',      label: 'Senhas',           group: 'Conhecimento',  description: 'Cofre de senhas criptografado' },
  { id: 'sistemas',    label: 'Sistemas',         group: 'Conhecimento',  description: 'Documentação de sistemas/processos', hidden: true, adminOnly: true },
  { id: 'esportes',    label: 'Esportes',         group: 'Vida',          description: 'Treinos, metas esportivas e nutrição' },
  { id: 'integracoes', label: 'Integrações',      group: 'Conexões',      description: 'Conectar serviços externos' },
]

export const DEFAULT_NEW_USER_MODULES = [
  'dashboard', 'agenda', 'tarefas', 'financeiro', 'notas',
  'projetos', 'metas', 'habitos', 'senhas',
]

/**
 * Única fonte de verdade pra decidir se um módulo aparece pro usuário
 * (Sidebar e Módulos em Configurações usam exatamente esta função — não
 * duplicar esta checagem em nenhum outro lugar).
 *
 * Módulos `adminOnly` (Faturamento, Sistemas) NUNCA aparecem sem
 * `isAdmin === true`, mesmo que `enabledModules` os contenha — isso é
 * proposital: `enabled_modules` é um array configurável por
 * usuário/seed (já vazou esses módulos pra uma conta demo por engano no
 * passado), então não pode ser a única barreira pra algo Jean-only. A
 * identidade real (`user_settings.is_admin`) é quem manda.
 */
export function isModuleVisible(
  moduleId: string,
  adminOnly: boolean | undefined,
  enabledModules: string[],
  isAdmin: boolean,
): boolean {
  if (adminOnly) return isAdmin
  return enabledModules.includes(moduleId)
}
