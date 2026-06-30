import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type Task = Database['public']['Tables']['tasks']['Row']

const PRIORITY_ORDER: Record<string, number> = { alta: 0, media: 1, baixa: 2 }

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority ?? 'media'] ?? 1
    const pb = PRIORITY_ORDER[b.priority ?? 'media'] ?? 1
    if (pa !== pb) return pa - pb
    // then by due_date ascending (nulls last)
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    if (a.due_date) return -1
    if (b.due_date) return 1
    return 0
  })
}

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
      return sortTasks(data as Task[])
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const addTask = useMutation({
    mutationFn: async (task: { title: string; project: string | null; priority?: string | null; due_date?: string | null }) => {
      const { data, error } = await (supabase.from('tasks') as any)
        .insert({ title: task.title, project: task.project, priority: task.priority ?? 'media', due_date: task.due_date ?? null })
        .select()
        .single()
      if (error) throw error
      return data as Task
    },
    onSuccess: (newTask) => {
      qc.setQueryData<Task[]>(key, (old) => sortTasks(old ? [newTask, ...old] : [newTask]))
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
      qc.setQueryData<Task[]>(key, (old) => old?.map((t) => (t.id === id ? { ...t, done } : t)))
      return { prev }
    },
    onError: (_err, _vars, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const updateTask = useMutation({
    mutationFn: async ({ id, ...fields }: Partial<Task> & { id: string }) => {
      const { error } = await (supabase.from('tasks') as any).update(fields).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, ...fields }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Task[]>(key)
      qc.setQueryData<Task[]>(key, (old) => sortTasks(old?.map((t) => t.id === id ? { ...t, ...fields } : t) ?? []))
      return { prev }
    },
    onError: (_err, _vars, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
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
    onError: (_err, _vars, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, addTask, toggleTask, updateTask, deleteTask }
}
