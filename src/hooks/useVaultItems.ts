import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type _VaultItem = Database['public']['Tables']['vault_items']['Row']
export type VaultItem = _VaultItem & { kind?: string }

export function useVaultItems() {
  const qc = useQueryClient()
  const key = ['vault_items']

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('vault_items')
        .select('*')
        .order('service', { ascending: true })
      if (error) throw error
      return data as VaultItem[]
    },
  })

  const addItem = useMutation({
    mutationFn: async (item: {
      service: string
      username: string | null
      password_cipher: string
      password_iv: string
      kind?: string
    }) => {
      const { data, error } = await supabase.from('vault_items')
        .insert(item)
        .select()
        .single()
      if (error) throw error
      return data as VaultItem
    },
    onSuccess: (newItem) => {
      qc.setQueryData<VaultItem[]>(key, (old) =>
        old
          ? [...old, newItem].sort((a, b) => a.service.localeCompare(b.service))
          : [newItem],
      )
    },
  })

  const updateItem = useMutation({
    mutationFn: async ({
      id,
      ...fields
    }: Partial<VaultItem> & { id: string }) => {
      const { error } = await supabase.from('vault_items')
        .update(fields)
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, ...fields }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<VaultItem[]>(key)
      qc.setQueryData<VaultItem[]>(key, (old) =>
        old?.map((v) => (v.id === id ? { ...v, ...fields } : v)),
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vault_items')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<VaultItem[]>(key)
      qc.setQueryData<VaultItem[]>(key, (old) => old?.filter((v) => v.id !== id))
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, addItem, updateItem, deleteItem }
}
