import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type Book = Database['public']['Tables']['books']['Row']

export function useBooks() {
  const qc = useQueryClient()
  const key = ['books']

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Book[]
    },
  })

  const addBook = useMutation({
    mutationFn: async (book: { title: string; author?: string; status: string }) => {
      const { data, error } = await (supabase.from('books') as any)
        .insert({ title: book.title, author: book.author ?? null, status: book.status, progress: 0 })
        .select()
        .single()
      if (error) throw error
      return data as Book
    },
    onSuccess: (newBook) => {
      qc.setQueryData<Book[]>(key, (old) => (old ? [newBook, ...old] : [newBook]))
    },
  })

  const updateBook = useMutation({
    mutationFn: async ({ id, ...fields }: Partial<Book> & { id: string }) => {
      const { error } = await (supabase.from('books') as any).update(fields).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, ...fields }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Book[]>(key)
      qc.setQueryData<Book[]>(key, (old) =>
        old?.map((b) => (b.id === id ? { ...b, ...fields } : b)),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const deleteBook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('books').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Book[]>(key)
      qc.setQueryData<Book[]>(key, (old) => old?.filter((b) => b.id !== id))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, addBook, updateBook, deleteBook }
}
