import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { todayLocal } from '../lib/dates'

export interface NotificationPrefs {
  tarefas_vencidas: boolean
  tarefas_hoje: boolean
  eventos_agenda: boolean
  contas_vencidas: boolean
  contas_hoje: boolean
  habitos_fim_dia: boolean
}

export interface AppNotification {
  id: string
  type: 'tarefa_vencida' | 'tarefa_hoje' | 'evento_agenda' | 'conta_vencida' | 'conta_hoje' | 'habito'
  title: string
  body: string
  link: string
  read: boolean
  createdAt: string
}

const DEFAULT_PREFS: NotificationPrefs = {
  tarefas_vencidas: true,
  tarefas_hoje: true,
  eventos_agenda: true,
  contas_vencidas: true,
  contas_hoje: true,
  habitos_fim_dia: true,
}

// ── Prefs ────────────────────────────────────────────────────────
export function useNotificationPrefs() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['notification_prefs', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('user_settings') as any)
        .select('notification_prefs')
        .eq('user_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return (data?.notification_prefs as NotificationPrefs) ?? DEFAULT_PREFS
    },
    enabled: !!user,
  })

  const update = useMutation({
    mutationFn: async (prefs: NotificationPrefs) => {
      const { error } = await (supabase
        .from('user_settings') as any)
        .update({ notification_prefs: prefs })
        .eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification_prefs'] }),
  })

  return { prefs: query.data ?? DEFAULT_PREFS, update }
}

// ── Notificações geradas localmente com base nos dados reais ─────
export function useAppNotifications() {
  const { user } = useAuth()
  const { prefs } = useNotificationPrefs()

  return useQuery({
    queryKey: ['app_notifications', user?.id],
    queryFn: async () => {
      const today = todayLocal()
      const now = new Date()
      const notifications: AppNotification[] = []

      // Tarefas vencidas
      if (prefs.tarefas_vencidas) {
        const { data } = await (supabase
          .from('tasks') as any)
          .select('id, title, due_date')
          .is('completed_at', null)
          .is('parent_id', null)
          .lt('due_date', today)
          .order('due_date', { ascending: true })
          .limit(10)
        ;(data ?? []).forEach((t: any) => {
          notifications.push({
            id: `tarefa_vencida_${t.id}`,
            type: 'tarefa_vencida',
            title: 'Tarefa vencida',
            body: t.title,
            link: '/tarefas',
            read: false,
            createdAt: t.due_date!,
          })
        })
      }

      // Tarefas para hoje
      if (prefs.tarefas_hoje) {
        const { data } = await (supabase
          .from('tasks') as any)
          .select('id, title, due_date')
          .is('completed_at', null)
          .is('parent_id', null)
          .eq('due_date', today)
          .limit(10)
        ;(data ?? []).forEach((t: any) => {
          notifications.push({
            id: `tarefa_hoje_${t.id}`,
            type: 'tarefa_hoje',
            title: 'Para hoje',
            body: t.title,
            link: '/tarefas',
            read: false,
            createdAt: today,
          })
        })
      }

      // Eventos da agenda (próximas 2 horas)
      if (prefs.eventos_agenda) {
        const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()
        const { data } = await (supabase
          .from('calendar_events') as any)
          .select('id, title, start_at')
          .gte('start_at', now.toISOString())
          .lte('start_at', inTwoHours)
          .order('start_at', { ascending: true })
          .limit(5)
        ;(data ?? []).forEach((e: any) => {
          const mins = Math.round((new Date(e.start_at).getTime() - now.getTime()) / 60000)
          notifications.push({
            id: `evento_${e.id}`,
            type: 'evento_agenda',
            title: 'Evento em breve',
            body: `${e.title} — em ${mins} min`,
            link: '/agenda',
            read: false,
            createdAt: e.start_at,
          })
        })
      }

      // Contas vencidas
      if (prefs.contas_vencidas) {
        const todayDay = now.getDate()
        const { data } = await (supabase
          .from('fin_recorrentes') as any)
          .select('id, nome, valor, dia_previsto')
          .eq('ativo', true)
          .lt('dia_previsto', todayDay)
        ;(data ?? []).forEach((r: any) => {
          notifications.push({
            id: `conta_vencida_${r.id}`,
            type: 'conta_vencida',
            title: 'Conta vencida',
            body: r.valor > 0 ? `${r.nome} — R$ ${r.valor}` : r.nome,
            link: '/financeiro',
            read: false,
            createdAt: today,
          })
        })
      }

      // Contas vencem hoje
      if (prefs.contas_hoje) {
        const todayDay = now.getDate()
        const { data } = await (supabase
          .from('fin_recorrentes') as any)
          .select('id, nome, valor, dia_previsto')
          .eq('ativo', true)
          .eq('dia_previsto', todayDay)
        ;(data ?? []).forEach((r: any) => {
          notifications.push({
            id: `conta_hoje_${r.id}`,
            type: 'conta_hoje',
            title: 'Vence hoje',
            body: r.valor > 0 ? `${r.nome} — R$ ${r.valor}` : r.nome,
            link: '/financeiro',
            read: false,
            createdAt: today,
          })
        })
      }

      // Hábitos não marcados (só mostrar após 18h)
      if (prefs.habitos_fim_dia && now.getHours() >= 18) {
        const { data: habits } = await (supabase
          .from('habits') as any)
          .select('id, name')
        const { data: logs } = await (supabase
          .from('habit_logs') as any)
          .select('habit_id')
          .eq('log_date', today)
        const doneIds = new Set((logs ?? []).map((l: any) => l.habit_id))
        const pending = (habits ?? []).filter((h: any) => !doneIds.has(h.id))
        if (pending.length > 0) {
          notifications.push({
            id: 'habitos_pendentes',
            type: 'habito',
            title: 'Hábitos pendentes',
            body: `${pending.length} hábito(s) não marcado(s) hoje`,
            link: '/habitos',
            read: false,
            createdAt: today,
          })
        }
      }

      return notifications
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  })
}
