import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type Note = Database['public']['Tables']['notes']['Row']

export function useNotes() {
  const qc = useQueryClient()
  const key = ['notes']

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data as Note[]
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const addNote = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase
        .from('notes') as any)
        .insert({ title: 'Sem título', body: '' })
        .select()
        .single()
      if (error) throw error
      return data as Note
    },
    onSuccess: (newNote) => {
      qc.setQueryData<Note[]>(key, (old) => (old ? [newNote, ...old] : [newNote]))
    },
  })

  const updateNote = useMutation({
    mutationFn: async ({ id, title, body }: { id: string; title?: string; body?: string }) => {
      const updates: Record<string, string> = {}
      if (title !== undefined) updates.title = title
      if (body !== undefined) updates.body = body
      const { error } = await (supabase.from('notes') as any).update(updates).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, title, body }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Note[]>(key)
      qc.setQueryData<Note[]>(key, (old) =>
        old?.map((n) =>
          n.id === id
            ? {
                ...n,
                ...(title !== undefined ? { title } : {}),
                ...(body !== undefined ? { body } : {}),
                updated_at: new Date().toISOString(),
              }
            : n,
        ),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Note[]>(key)
      qc.setQueryData<Note[]>(key, (old) => old?.filter((n) => n.id !== id))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, addNote, updateNote, deleteNote }
}
