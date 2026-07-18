import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type Project = Database['public']['Tables']['projects']['Row']

export function useProjects() {
  const qc = useQueryClient()
  const key = ['projects']

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Project[]
    },
  })

  const addProject = useMutation({
    mutationFn: async (p: { name: string; meta?: string; status?: string }) => {
      const { data, error } = await supabase.from('projects')
        .insert({
          name: p.name,
          meta: p.meta ?? null,
          status: p.status ?? 'planejamento',
          progress: 0,
          delivered: false,
        })
        .select()
        .single()
      if (error) throw error
      return data as Project
    },
    onSuccess: (n) => {
      qc.setQueryData<Project[]>(key, (old) => (old ? [n, ...old] : [n]))
    },
  })

  const updateProject = useMutation({
    mutationFn: async ({ id, ...fields }: Partial<Project> & { id: string }) => {
      const { error } = await supabase.from('projects').update(fields).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, ...fields }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Project[]>(key)
      qc.setQueryData<Project[]>(key, (old) =>
        old?.map((p) => (p.id === id ? { ...p, ...fields } : p)),
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Project[]>(key)
      qc.setQueryData<Project[]>(key, (old) => old?.filter((p) => p.id !== id))
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, addProject, updateProject, deleteProject }
}
