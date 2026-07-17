import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type Book = Database['public']['Tables']['books']['Row']

export type AddBookInput = {
  title: string
  author?: string | null
  status: string
  favorite?: boolean | null
  category?: string | null
  total_pages?: number | null
  pages_read?: number | null
  started_at?: string | null
  finished_at?: string | null
  rating?: number | null
  format?: string | null
  coverFile?: File | null
}

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
    mutationFn: async (input: AddBookInput) => {
      const { coverFile, ...fields } = input

      /* 1. Insert book to get the id */
      const { data, error } = await supabase.from('books')
        .insert({
          title: fields.title,
          author: fields.author ?? null,
          status: fields.status,
          progress: 0,
          favorite: fields.favorite ?? false,
          category: fields.category ?? null,
          total_pages: fields.total_pages ?? null,
          pages_read: fields.pages_read ?? null,
          started_at: fields.started_at ?? null,
          finished_at: fields.finished_at ?? null,
          rating: fields.rating ?? null,
          format: fields.format ?? null,
          cover_url: null,
        })
        .select()
        .single()
      if (error) throw error
      const book = data as Book

      /* 2. Upload cover if provided */
      if (coverFile) {
        const ext = coverFile.name.split('.').pop() ?? 'jpg'
        const path = `${book.id}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('covers')
          .upload(path, coverFile, { upsert: true })
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('covers').getPublicUrl(path)
          await supabase.from('books')
            .update({ cover_url: urlData.publicUrl })
            .eq('id', book.id)
          return { ...book, cover_url: urlData.publicUrl } as Book
        }
      }

      return book
    },
    onSuccess: (newBook) => {
      qc.setQueryData<Book[]>(key, (old) => (old ? [newBook, ...old] : [newBook]))
    },
  })

  const updateBook = useMutation({
    mutationFn: async ({ id, ...fields }: Partial<Book> & { id: string; coverFile?: File | null }) => {
      const { coverFile, ...rest } = fields
      if (coverFile) {
        const ext = coverFile.name.split('.').pop() ?? 'jpg'
        const path = `${id}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('covers')
          .upload(path, coverFile, { upsert: true })
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('covers').getPublicUrl(path)
          rest.cover_url = urlData.publicUrl
        }
      }
      const { error } = await supabase.from('books').update(rest).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, ...fields }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Book[]>(key)
      const { coverFile: _cf, ...safeFields } = fields
      qc.setQueryData<Book[]>(key, (old) =>
        old?.map((b) => (b.id === id ? { ...b, ...safeFields } : b)),
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
