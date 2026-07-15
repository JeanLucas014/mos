import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import type { Invoice } from '../types'

/* ── useInvoices ─────────────────────────────────────────────────── */
export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('invoices') as any)
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Invoice[]
    },
  })
}
