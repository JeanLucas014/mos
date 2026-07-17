import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type CheckItem = Database['public']['Tables']['project_checklist']['Row']

export function useProjectChecklist(projectId: string) {
  const qc = useQueryClient()
  const key = ['project_checklist', projectId]

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('project_checklist')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true })
      if (error) throw error
      return data as CheckItem[]
    },
    enabled: !!projectId,
  })

  const addItem = useMutation({
    mutationFn: async (title: string) => {
      const position = (query.data?.length ?? 0)
      const { data, error } = await supabase.from('project_checklist')
        .insert({ project_id: projectId, title, done: false, position })
        .select().single()
      if (error) throw error
      return data as CheckItem
    },
    onSuccess: (n) => {
      qc.setQueryData<CheckItem[]>(key, (old) => (old ? [...old, n] : [n]))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const toggleItem = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from('project_checklist').update({ done }).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<CheckItem[]>(key)
      qc.setQueryData<CheckItem[]>(key, (old) => old?.map((i) => (i.id === id ? { ...i, done } : i)))
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('project_checklist').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<CheckItem[]>(key)
      qc.setQueryData<CheckItem[]>(key, (old) => old?.filter((i) => i.id !== id))
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const doneCount = (query.data ?? []).filter((i) => i.done).length
  const totalCount = (query.data ?? []).length
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return { ...query, addItem, toggleItem, deleteItem, doneCount, totalCount, progress }
}
