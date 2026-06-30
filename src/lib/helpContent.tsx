import {
  Calendar, RotateCcw, Flag, Folder, CheckSquare, Target,
  RefreshCw, ShoppingCart, FileText, Activity, BookOpen,
  Lock, Tag, KeyRound,
} from 'lucide-react'
import type { ReactNode } from 'react'

export interface HelpSection {
  icon: ReactNode
  color: string
  title: string
  text: string
}

export interface HelpContent {
  title: string
  subtitle: string
  sections: HelpSection[]
}

export const HELP_CONTENT: Record<string, HelpContent> = {
  agenda: {
    title: 'Como funciona a Agenda',
    subtitle: 'Seus eventos e rotina semanal',
    sections: [
      { icon: <Calendar size={16} />, color: '#0EA5E9', title: 'Visualizações', text: 'Alterne entre Semana, Mês, Dia e Lista no topo. Clique em qualquer horário vazio para criar um evento.' },
      { icon: <RotateCcw size={16} />, color: '#a78bfa', title: 'Eventos recorrentes', text: 'Ao editar ou excluir um evento que se repete, você escolhe se a mudança vale só para aquela ocorrência, dali em diante, ou para todas.' },
      { icon: <Tag size={16} />, color: '#22c55e', title: 'Tags', text: 'Use tags para categorizar eventos (Pessoal, Trabalho...) e identificar rapidamente o tipo de compromisso.' },
      { icon: <RefreshCw size={16} />, color: '#f97316', title: 'Aba Rotina', text: 'Descreva sua rotina semanal típica (horários fixos, dias de treino, trabalho) separado da agenda de eventos pontuais.' },
    ],
  },
  tarefas: {
    title: 'Como funciona o Tarefas',
    subtitle: 'Organize tudo o que precisa fazer',
    sections: [
      { icon: <CheckSquare size={16} />, color: '#0EA5E9', title: 'Inbox, Hoje e Próximos 7 dias', text: 'Inbox guarda tarefas sem data ou projeto. Hoje e Próximos 7 dias mostram automaticamente o que está vencendo.' },
      { icon: <Flag size={16} />, color: '#ef4444', title: 'Prioridades', text: 'P1 é urgente (vermelho), P4 é sem prioridade. Use para saber o que atacar primeiro.' },
      { icon: <Folder size={16} />, color: '#22c55e', title: 'Projetos', text: 'Agrupe tarefas relacionadas em projetos com cor própria. Crie quantos quiser na barra lateral.' },
      { icon: <RotateCcw size={16} />, color: '#a78bfa', title: 'Recorrência', text: 'Tarefas repetitivas (diária, semanal, em dias específicos) recriam automaticamente após serem concluídas.' },
    ],
  },
  projetos: {
    title: 'Como funciona o Projetos',
    subtitle: 'Acompanhe iniciativas pessoais',
    sections: [
      { icon: <Folder size={16} />, color: '#0EA5E9', title: 'Status e progresso', text: 'Cada projeto tem um status (em andamento, concluído) e uma barra de progresso baseada nos itens marcados.' },
      { icon: <CheckSquare size={16} />, color: '#22c55e', title: 'Checklist', text: 'Adicione itens dentro do projeto. Cada item marcado avança automaticamente a barra de progresso.' },
    ],
  },
  metas: {
    title: 'Como funciona o Metas',
    subtitle: 'Defina e acompanhe objetivos',
    sections: [
      { icon: <Target size={16} />, color: '#14b8a6', title: 'Progresso por sub-itens', text: 'Quebre uma meta grande em itens menores (ex: 12 livros = 12 itens). Cada item concluído avança a barra de progresso da meta.' },
      { icon: <Folder size={16} />, color: '#0EA5E9', title: 'Áreas', text: 'Classifique metas por área da vida (Saúde, Finanças, Estudos) para organizar visualmente.' },
    ],
  },
  habitos: {
    title: 'Como funciona o Hábitos',
    subtitle: 'Construa consistência no dia a dia',
    sections: [
      { icon: <RefreshCw size={16} />, color: '#22c55e', title: 'Marcação diária', text: 'Marque cada hábito conforme for cumprindo ao longo do dia. O histórico fica salvo automaticamente.' },
    ],
  },
  compras: {
    title: 'Como funciona a Lista de compras',
    subtitle: 'Organize suas compras por categoria',
    sections: [
      { icon: <ShoppingCart size={16} />, color: '#ec4899', title: 'Categorias', text: 'Itens são organizados em categorias (Açougue, Sacolão, Limpeza...) para facilitar quando estiver no mercado.' },
    ],
  },
  notas: {
    title: 'Como funciona o Notas',
    subtitle: 'Bloco de notas rápido',
    sections: [
      { icon: <FileText size={16} />, color: '#84cc16', title: 'Salvamento automático', text: 'Suas notas são salvas automaticamente enquanto você digita, sem precisar clicar em nada.' },
    ],
  },
  esportes: {
    title: 'Como funciona o Esportes',
    subtitle: 'Treinos, metas e provas',
    sections: [
      { icon: <Activity size={16} />, color: '#f97316', title: 'Adicione seus esportes', text: 'Clique em "Adicionar" para escolher quais esportes você pratica. Cada um vira uma aba com treinos próprios.' },
      { icon: <Target size={16} />, color: '#14b8a6', title: 'Metas e provas', text: 'Registre metas de performance e próximas provas/competições para cada esporte.' },
    ],
  },
  estudos: {
    title: 'Como funciona o Estudos',
    subtitle: 'Cursos e biblioteca de livros',
    sections: [
      { icon: <BookOpen size={16} />, color: '#f97316', title: 'Biblioteca', text: 'A aba Biblioteca, dentro de Estudos, guarda seus livros lidos, lendo e na fila, com avaliação e progresso.' },
      { icon: <Target size={16} />, color: '#0EA5E9', title: 'Cursos e estudos', text: 'Acompanhe cursos e certificações em andamento com barra de progresso.' },
    ],
  },
  senhas: {
    title: 'Como funciona o Senhas',
    subtitle: 'Cofre criptografado',
    sections: [
      { icon: <Lock size={16} />, color: '#f59e0b', title: 'Senha mestra', text: 'Suas credenciais são cifradas com uma senha mestra que só você sabe. Ela nunca é enviada para o servidor.' },
      { icon: <KeyRound size={16} />, color: '#a78bfa', title: 'Senhas e chaves de API', text: 'Guarde tanto senhas de serviços quanto chaves de API (ex: OpenAI, Stripe) no mesmo cofre, organizadas por tipo.' },
      { icon: <FileText size={16} />, color: '#0EA5E9', title: 'Revelar senha', text: 'Toque no nome do serviço para revelar a senha temporariamente. Use o botão de copiar para colar direto onde precisar.' },
    ],
  },
}
