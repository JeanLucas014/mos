import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type ShoppingCategory = Database['public']['Tables']['shopping_categories']['Row']

/** Paleta de cores pra auto-atribuir a novas categorias, na ordem —
 * cicla se o usuário criar mais categorias do que cores aqui. */
const PALETTE = ['#eab308', '#ec4899', '#14b8a6', '#6366f1', '#f43f5e', '#84cc16', '#06b6d4', '#0EA5E9']

export function useShoppingCategories() {
  const qc = useQueryClient()
  const key = ['shopping_categories']

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_categories')
        .select('*')
        .order('ordem')
        .order('created_at')
      if (error) throw error
      return data as ShoppingCategory[]
    },
  })

  const addCategory = useMutation({
    mutationFn: async (nome: string) => {
      const atuais = qc.getQueryData<ShoppingCategory[]>(key) ?? []
      const cor = PALETTE[atuais.length % PALETTE.length]
      const ordem = atuais.length
      const { data, error } = await supabase
        .from('shopping_categories')
        .insert({ nome, cor, ordem })
        .select()
        .single()
      if (error) throw error
      return data as ShoppingCategory
    },
    onSuccess: (nova) => {
      qc.setQueryData<ShoppingCategory[]>(key, (old) => (old ? [...old, nova] : [nova]))
    },
  })

  return { ...query, addCategory }
}
