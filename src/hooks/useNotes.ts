import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database, Json } from '../types/db'
import { emptyDoc } from '../lib/tiptapContent'

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
      const { data, error } = await supabase
        .from('notes')
        .insert({ title: 'Sem título', body: '', body_json: emptyDoc() as unknown as Json })
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
    mutationFn: async ({ id, title, body, bodyJson }: { id: string; title?: string; body?: string; bodyJson?: Json }) => {
      const updates: { title?: string; body?: string; body_json?: Json } = {}
      if (title !== undefined) updates.title = title
      if (body !== undefined) updates.body = body
      if (bodyJson !== undefined) updates.body_json = bodyJson
      const { error } = await supabase.from('notes').update(updates).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, title, body, bodyJson }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Note[]>(key)
      qc.setQueryData<Note[]>(key, (old) =>
        old?.map((n) =>
          n.id === id
            ? {
                ...n,
                ...(title !== undefined ? { title } : {}),
                ...(body !== undefined ? { body } : {}),
                ...(bodyJson !== undefined ? { body_json: bodyJson } : {}),
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
