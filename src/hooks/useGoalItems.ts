import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type GoalItem = Database['public']['Tables']['goal_items']['Row']

export function useGoalItems(goalId: string) {
  const qc = useQueryClient()
  const key = ['goal_items', goalId]

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await (supabase.from('goal_items') as any)
        .select('*')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as GoalItem[]
    },
    enabled: !!goalId,
  })

  const addItem = useMutation({
    mutationFn: async (text: string) => {
      const { data, error } = await (supabase.from('goal_items') as any)
        .insert({ goal_id: goalId, text })
        .select().single()
      if (error) throw error
      return data as GoalItem
    },
    onSuccess: (n) => {
      qc.setQueryData<GoalItem[]>(key, (old) => (old ? [...old, n] : [n]))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const toggleItem = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await (supabase.from('goal_items') as any).update({ done }).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<GoalItem[]>(key)
      qc.setQueryData<GoalItem[]>(key, (old) => old?.map((i) => (i.id === id ? { ...i, done } : i)))
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('goal_items') as any).delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<GoalItem[]>(key)
      qc.setQueryData<GoalItem[]>(key, (old) => old?.filter((i) => i.id !== id))
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const doneCount = (query.data ?? []).filter((i) => i.done).length
  const totalCount = (query.data ?? []).length
  /** auto-progress: % of done submetas (0-100), or null if no submetas */
  const autoProgress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : null

  return { ...query, addItem, toggleItem, deleteItem, doneCount, totalCount, autoProgress }
}
