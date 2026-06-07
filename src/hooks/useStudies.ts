import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type Study = Database['public']['Tables']['studies']['Row']
type StudyFile = Database['public']['Tables']['study_files']['Row']

export function useStudies() {
  const qc = useQueryClient()
  const studiesKey = ['studies']
  const filesKey = ['study_files']

  const studiesQuery = useQuery({
    queryKey: studiesKey,
    queryFn: async () => {
      const { data, error } = await (supabase.from('studies') as any)
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Study[]
    },
  })

  const filesQuery = useQuery({
    queryKey: filesKey,
    queryFn: async () => {
      const { data, error } = await (supabase.from('study_files') as any)
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data as StudyFile[]
    },
  })

  const addStudy = useMutation({
    mutationFn: async (s: { name: string; meta?: string; status?: string }) => {
      const { data, error } = await (supabase.from('studies') as any)
        .insert({ name: s.name, meta: s.meta ?? null, status: s.status ?? 'ativo', progress: 0 })
        .select()
        .single()
      if (error) throw error
      return data as Study
    },
    onSuccess: (newStudy) => {
      qc.setQueryData<Study[]>(studiesKey, (old) => (old ? [newStudy, ...old] : [newStudy]))
    },
  })

  const updateStudy = useMutation({
    mutationFn: async ({ id, ...fields }: Partial<Study> & { id: string }) => {
      const { error } = await (supabase.from('studies') as any).update(fields).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, ...fields }) => {
      await qc.cancelQueries({ queryKey: studiesKey })
      const prev = qc.getQueryData<Study[]>(studiesKey)
      qc.setQueryData<Study[]>(studiesKey, (old) =>
        old?.map((s) => (s.id === id ? { ...s, ...fields } : s)),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(studiesKey, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: studiesKey }),
  })

  const deleteStudy = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('studies') as any).delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: studiesKey })
      const prev = qc.getQueryData<Study[]>(studiesKey)
      qc.setQueryData<Study[]>(studiesKey, (old) => old?.filter((s) => s.id !== id))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(studiesKey, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: studiesKey }),
  })

  const addFile = useMutation({
    mutationFn: async (f: {
      study_id: string
      name: string
      kind?: string
      source?: string
      external_url?: string
    }) => {
      const { data, error } = await (supabase.from('study_files') as any)
        .insert({
          study_id: f.study_id,
          name: f.name,
          kind: f.kind ?? 'PDF',
          source: f.source ?? 'drive',
          external_url: f.external_url ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as StudyFile
    },
    onSuccess: (newFile) => {
      qc.setQueryData<StudyFile[]>(filesKey, (old) => (old ? [newFile, ...old] : [newFile]))
    },
  })

  const deleteFile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('study_files') as any).delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: filesKey })
      const prev = qc.getQueryData<StudyFile[]>(filesKey)
      qc.setQueryData<StudyFile[]>(filesKey, (old) => old?.filter((f) => f.id !== id))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(filesKey, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: filesKey }),
  })

  return {
    studies: studiesQuery,
    files: filesQuery,
    addStudy,
    updateStudy,
    deleteStudy,
    addFile,
    deleteFile,
  }
}
