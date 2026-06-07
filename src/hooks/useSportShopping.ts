import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type SportShoppingItem = Database['public']['Tables']['sport_shopping']['Row']

export function useSportShopping(sport: string) {
  const qc = useQueryClient()
  const key = ['sport_shopping', sport]

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await (supabase.from('sport_shopping') as any)
        .select('*')
        .eq('sport', sport)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as SportShoppingItem[]
    },
  })

  const addItem = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await (supabase.from('sport_shopping') as any)
        .insert({ sport, name, done: false })
        .select()
        .single()
      if (error) throw error
      return data as SportShoppingItem
    },
    onSuccess: (n) => {
      qc.setQueryData<SportShoppingItem[]>(key, (old) => (old ? [n, ...old] : [n]))
    },
  })

  const toggleItem = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await (supabase.from('sport_shopping') as any).update({ done }).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<SportShoppingItem[]>(key)
      qc.setQueryData<SportShoppingItem[]>(key, (old) => old?.map((i) => i.id === id ? { ...i, done } : i))
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('sport_shopping') as any).delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<SportShoppingItem[]>(key)
      qc.setQueryData<SportShoppingItem[]>(key, (old) => old?.filter((i) => i.id !== id))
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, addItem, toggleItem, deleteItem }
}
