export type Priority = 1 | 2 | 3 | 4

export const PRIORITY_CFG: Record<Priority, { label: string; color: string; bg: string }> = {
  1: { label: 'Urgente',        color: '#ef4444', bg: 'rgba(239,68,68,.15)'  },
  2: { label: 'Alta',           color: '#f97316', bg: 'rgba(249,115,22,.15)' },
  3: { label: 'Normal',         color: '#3b82f6', bg: 'rgba(59,130,246,.15)' },
  4: { label: 'Sem prioridade', color: '#6b7280', bg: 'transparent'           },
}

export interface TaskProject {
  id: string
  user_id: string
  name: string
  color: string
  ordem: number
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  priority: Priority
  project_id: string | null
  parent_id: string | null
  due_date: string | null      // 'YYYY-MM-DD'
  due_time: string | null      // 'HH:MM'
  completed_at: string | null
  ordem: number
  created_at: string
}

export interface TaskRecurrence {
  id: string
  task_id: string
  freq: 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly'
  interval_n: number
  days_of_week: string[] | null
  end_date: string | null
  next_due: string
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
}

export type ViewId = 'inbox' | 'hoje' | 'proximos7' | string // string = project_id
