import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type Goal = Database['public']['Tables']['goals']['Row']

export function useGoals() {
  const qc = useQueryClient()
  const key = ['goals']

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Goal[]
    },
  })

  const addGoal = useMutation({
    mutationFn: async (g: { name: string; label?: string; progress?: number; area?: string | null }) => {
      const { data, error } = await (supabase.from('goals') as any)
        .insert({ name: g.name, label: g.label ?? null, progress: g.progress ?? 0, area: g.area ?? null })
        .select()
        .single()
      if (error) throw error
      return data as Goal
    },
    onSuccess: (n) => {
      qc.setQueryData<Goal[]>(key, (old) => (old ? [n, ...old] : [n]))
    },
  })

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...fields }: Partial<Goal> & { id: string }) => {
      const { error } = await (supabase.from('goals') as any).update(fields).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, ...fields }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Goal[]>(key)
      qc.setQueryData<Goal[]>(key, (old) =>
        old?.map((g) => (g.id === id ? { ...g, ...fields } : g)),
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('goals') as any).delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Goal[]>(key)
      qc.setQueryData<Goal[]>(key, (old) => old?.filter((g) => g.id !== id))
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, addGoal, updateGoal, deleteGoal }
}
