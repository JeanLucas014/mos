import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import type { MotoRecord } from '../types'

export function useMotoRevenue(year: number, month: number) {
  const qc  = useQueryClient()
  const pad = (n: number) => String(n).padStart(2, '0')
  const lastDay = new Date(year, month + 1, 0).getDate()
  const from = `${year}-${pad(month + 1)}-01`
  const to   = `${year}-${pad(month + 1)}-${pad(lastDay)}`
  const key  = ['moto_revenue', year, month]

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('moto_revenue')
        .select('*')
        .gte('revenue_date', from)
        .lte('revenue_date', to)
        .order('revenue_date', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as MotoRecord[]
    },
  })

  const addRecord = useMutation({
    mutationFn: async (r: { revenue_date: string; kind: string; category: string; description: string; amount_cents: number; notes?: string }) => {
      const { error } = await supabase.from('moto_revenue').insert(r).select().single()
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('moto_revenue').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<MotoRecord[]>(key)
      qc.setQueryData<MotoRecord[]>(key, old => old?.filter(r => r.id !== id))
      return { prev }
    },
    onError: (_e, _v, ctx: any) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, addRecord, deleteRecord }
}
