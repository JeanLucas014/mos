import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type Habit = Database['public']['Tables']['habits']['Row']
type HabitLog = Database['public']['Tables']['habit_logs']['Row']

export interface HabitWithLogs extends Habit {
  logs: HabitLog[]
  streak: number
}

function calcStreak(logs: HabitLog[]): number {
  if (!logs.length) return 0
  const dates = logs.map((l) => l.log_date).sort().reverse()
  const uniqueDates = [...new Set(dates)]

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const firstDate = uniqueDates[0]
  if (firstDate !== fmt(today) && firstDate !== fmt(yesterday)) return 0

  let streak = 0
  const cursor = new Date(firstDate + 'T00:00:00')
  for (const d of uniqueDates) {
    if (d === fmt(cursor)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export function useHabits() {
  const qc = useQueryClient()
  const habitsKey = ['habits']
  const logsKey = ['habit_logs']

  const habitsQuery = useQuery({
    queryKey: habitsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Habit[]
    },
  })

  const logsQuery = useQuery({
    queryKey: logsKey,
    queryFn: async () => {
      const { data, error } = await supabase.from('habit_logs').select('*')
      if (error) throw error
      return data as HabitLog[]
    },
  })

  const habits: HabitWithLogs[] = (habitsQuery.data ?? []).map((h) => {
    const logs = (logsQuery.data ?? []).filter((l) => l.habit_id === h.id)
    return { ...h, logs, streak: calcStreak(logs) }
  })

  const toggleDay = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      const existing = (logsQuery.data ?? []).find(
        (l) => l.habit_id === habitId && l.log_date === date,
      )
      if (existing) {
        const { error } = await supabase.from('habit_logs').delete().eq('id', existing.id)
        if (error) throw error
        return { action: 'deleted' as const, id: existing.id }
      } else {
        const { data, error } = await (supabase
          .from('habit_logs') as any)
          .insert({ habit_id: habitId, log_date: date })
          .select()
          .single()
        if (error) throw error
        return { action: 'inserted' as const, log: data as HabitLog }
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: logsKey })
    },
  })

  const addHabit = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await (supabase
        .from('habits') as any)
        .insert({ name })
        .select()
        .single()
      if (error) throw error
      return data as Habit
    },
    onSuccess: (newHabit) => {
      qc.setQueryData<Habit[]>(habitsKey, (old) => (old ? [...old, newHabit] : [newHabit]))
    },
  })

  const deleteHabit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('habits').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: habitsKey })
      const prev = qc.getQueryData<Habit[]>(habitsKey)
      qc.setQueryData<Habit[]>(habitsKey, (old) => old?.filter((h) => h.id !== id))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(habitsKey, ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: habitsKey })
      qc.invalidateQueries({ queryKey: logsKey })
    },
  })

  return {
    habits,
    isLoading: habitsQuery.isLoading || logsQuery.isLoading,
    isError: habitsQuery.isError || logsQuery.isError,
    error: habitsQuery.error || logsQuery.error,
    toggleDay,
    addHabit,
    deleteHabit,
  }
}
