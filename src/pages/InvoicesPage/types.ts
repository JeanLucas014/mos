import type { Database } from '../../types/db'

export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type MotoRecord = Database['public']['Tables']['moto_revenue']['Row']

export type Status = 'enviado' | 'em dev' | 'aprovado' | 'recorrente' | 'pago'
