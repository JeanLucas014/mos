import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type ShoppingItem = Database['public']['Tables']['shopping_items']['Row']

export function useShopping() {
  const qc = useQueryClient()
  const key = ['shopping']

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ShoppingItem[]
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const addItem = useMutation({
    mutationFn: async ({ title, category }: { title: string; category: string }) => {
      const { data, error } = await (supabase.from('shopping_items') as any)
        .insert({ title, category })
        .select()
        .single()
      if (error) throw error
      return data as ShoppingItem
    },
    onSuccess: (n) => {
      qc.setQueryData<ShoppingItem[]>(key, (old) => (old ? [n, ...old] : [n]))
    },
  })

  const toggleItem = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await (supabase.from('shopping_items') as any)
        .update({ done })
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<ShoppingItem[]>(key)
      qc.setQueryData<ShoppingItem[]>(key, (old) =>
        old?.map((i) => (i.id === id ? { ...i, done } : i)),
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('shopping_items') as any).delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<ShoppingItem[]>(key)
      qc.setQueryData<ShoppingItem[]>(key, (old) => old?.filter((i) => i.id !== id))
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const clearDone = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!ids.length) return
      const { error } = await (supabase.from('shopping_items') as any)
        .delete()
        .in('id', ids)
      if (error) throw error
    },
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<ShoppingItem[]>(key)
      qc.setQueryData<ShoppingItem[]>(key, (old) =>
        old?.filter((i) => !ids.includes(i.id)),
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, addItem, toggleItem, deleteItem, clearDone }
}
