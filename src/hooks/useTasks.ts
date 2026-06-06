import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type Task = Database['public']['Tables']['tasks']['Row']

export function useTasks() {
  const qc = useQueryClient()
  const key = ['tasks']

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Task[]
    },
  })

  const addTask = useMutation({
    mutationFn: async (task: { title: string; project: string | null }) => {
      const { data, error } = await (supabase
        .from('tasks') as any)
        .insert({ title: task.title, project: task.project })
        .select()
        .single()
      if (error) throw error
      return data as Task
    },
    onSuccess: (newTask) => {
      qc.setQueryData<Task[]>(key, (old) => (old ? [newTask, ...old] : [newTask]))
    },
  })

  const toggleTask = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await (supabase.from('tasks') as any).update({ done }).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Task[]>(key)
      qc.setQueryData<Task[]>(key, (old) =>
        old?.map((t) => (t.id === id ? { ...t, done } : t)),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Task[]>(key)
      qc.setQueryData<Task[]>(key, (old) => old?.filter((t) => t.id !== id))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, addTask, toggleTask, deleteTask }
}
