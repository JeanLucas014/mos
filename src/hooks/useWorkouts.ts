import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type Workout = Database['public']['Tables']['sports']['Row']

export function useWorkouts(sport: string) {
  const qc = useQueryClient()
  const key = ['sports', sport]

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await (supabase.from('sports') as any)
        .select('*')
        .eq('sport', sport)
        .order('sport_date', { ascending: false })
      if (error) throw error
      return data as Workout[]
    },
  })

  const addWorkout = useMutation({
    mutationFn: async (w: Omit<Workout, 'id' | 'user_id' | 'created_at'>) => {
      console.log('[sports_insert] payload:', w)
      const { data, error } = await (supabase.from('sports') as any)
        .insert(w)
        .select()
        .single()
      console.log('[sports_insert] result:', data, error)
      if (error) throw error
      return data as Workout
    },
    onSuccess: (n) => {
      qc.setQueryData<Workout[]>(key, (old) => (old ? [n, ...old] : [n]))
    },
  })

  const deleteWorkout = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('sports') as any).delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Workout[]>(key)
      qc.setQueryData<Workout[]>(key, (old) => old?.filter((w) => w.id !== id))
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, addWorkout, deleteWorkout }
}
