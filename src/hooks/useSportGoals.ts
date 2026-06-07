import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type SportGoal = Database['public']['Tables']['sport_goals']['Row']

export function useSportGoals(sport: string) {
  const qc = useQueryClient()
  const key = ['sport_goals', sport]

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await (supabase.from('sport_goals') as any)
        .select('*')
        .eq('sport', sport)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as SportGoal[]
    },
  })

  const addGoal = useMutation({
    mutationFn: async (g: { name: string; target?: string; target_date?: string }) => {
      const { data, error } = await (supabase.from('sport_goals') as any)
        .insert({ sport, name: g.name, target: g.target ?? null, target_date: g.target_date ?? null, done: false })
        .select()
        .single()
      if (error) throw error
      return data as SportGoal
    },
    onSuccess: (n) => {
      qc.setQueryData<SportGoal[]>(key, (old) => (old ? [n, ...old] : [n]))
    },
  })

  const toggleGoal = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await (supabase.from('sport_goals') as any).update({ done }).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<SportGoal[]>(key)
      qc.setQueryData<SportGoal[]>(key, (old) => old?.map((g) => g.id === id ? { ...g, done } : g))
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('sport_goals') as any).delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<SportGoal[]>(key)
      qc.setQueryData<SportGoal[]>(key, (old) => old?.filter((g) => g.id !== id))
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, addGoal, toggleGoal, deleteGoal }
}
