export interface ModuleDef {
  id: string
  label: string
  group: string
  description: string
  core?: boolean
  hidden?: boolean
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
  { id: 'faturamento', label: 'Faturamento',      group: 'Finanças',      description: 'Faturamento de negócio/freelance', hidden: true },
  { id: 'estudos',     label: 'Estudos',          group: 'Conhecimento',  description: 'Estudos e biblioteca de livros' },
  { id: 'senhas',      label: 'Senhas',           group: 'Conhecimento',  description: 'Cofre de senhas criptografado' },
  { id: 'sistemas',    label: 'Sistemas',         group: 'Conhecimento',  description: 'Documentação de sistemas/processos', hidden: true },
  { id: 'esportes',    label: 'Esportes',         group: 'Vida',          description: 'Treinos, metas esportivas e nutrição' },
  { id: 'integracoes', label: 'Integrações',      group: 'Conexões',      description: 'Conectar serviços externos' },
]

export const DEFAULT_NEW_USER_MODULES = ['dashboard', 'agenda', 'tarefas', 'financeiro', 'notas']
