import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { formatLocalDate } from '../lib/dates'
import type { Database } from '../types/db'

type Habit          = Database['public']['Tables']['habits']['Row']
type HabitLog       = Database['public']['Tables']['habit_logs']['Row']
type HabitException = Database['public']['Tables']['habit_exceptions']['Row']

export interface HabitWithLogs extends Habit {
  logs: HabitLog[]
  exceptions: HabitException[]
  streak: number
}

function calcStreak(logs: HabitLog[], exceptions: HabitException[]): number {
  if (!logs.length) return 0
  const exSet = new Set(exceptions.map((e) => e.exception_date))
  const dates = logs.map((l) => l.log_date).sort().reverse()
  const uniqueDates = [...new Set(dates)]

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const fmt = formatLocalDate
  const firstDate = uniqueDates[0]
  if (firstDate !== fmt(today) && firstDate !== fmt(yesterday)) return 0

  let streak = 0
  const cursor = new Date(firstDate + 'T00:00:00')
  const seenDates = new Set(uniqueDates)

  for (let i = 0; i < 365; i++) {
    const ds = fmt(cursor)
    if (seenDates.has(ds)) {
      streak++
    } else if (exSet.has(ds)) {
      // exception day: skip without breaking streak
    } else {
      // no log and no exception — streak ends
      break
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function useHabits() {
  const qc = useQueryClient()
  const habitsKey    = ['habits']
  const logsKey      = ['habit_logs']
  const exceptionsKey = ['habit_exceptions']

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

  const exceptionsQuery = useQuery({
    queryKey: exceptionsKey,
    queryFn: async () => {
      const { data, error } = await (supabase.from('habit_exceptions') as any).select('*')
      if (error) throw error
      return data as HabitException[]
    },
  })

  const habits: HabitWithLogs[] = (habitsQuery.data ?? []).map((h) => {
    const logs       = (logsQuery.data ?? []).filter((l) => l.habit_id === h.id)
    const exceptions = (exceptionsQuery.data ?? []).filter((e) => e.habit_id === h.id)
    return { ...h, logs, exceptions, streak: calcStreak(logs, exceptions) }
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
        const { data, error } = await (supabase.from('habit_logs') as any)
          .insert({ habit_id: habitId, log_date: date })
          .select().single()
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
      const { data, error } = await (supabase.from('habits') as any)
        .insert({ name }).select().single()
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

  /** Mark/unmark a day as exception ("Não se aplica hoje") */
  const toggleException = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      const existing = (exceptionsQuery.data ?? []).find(
        (e) => e.habit_id === habitId && e.exception_date === date,
      )
      if (existing) {
        const { error } = await (supabase.from('habit_exceptions') as any).delete().eq('id', existing.id)
        if (error) throw error
        return { action: 'deleted' as const }
      } else {
        const { error } = await (supabase.from('habit_exceptions') as any)
          .insert({ habit_id: habitId, exception_date: date })
        if (error) throw error
        return { action: 'inserted' as const }
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: exceptionsKey })
    },
  })

  const isException = (habitId: string, date: string) =>
    (exceptionsQuery.data ?? []).some((e) => e.habit_id === habitId && e.exception_date === date)

  return {
    habits,
    isLoading: habitsQuery.isLoading || logsQuery.isLoading || exceptionsQuery.isLoading,
    isError: habitsQuery.isError || logsQuery.isError,
    error: habitsQuery.error || logsQuery.error,
    toggleDay,
    addHabit,
    deleteHabit,
    toggleException,
    isException,
  }
}
