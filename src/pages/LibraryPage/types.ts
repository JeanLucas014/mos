import type { Database } from '../../types/db'

export type Book = Database['public']['Tables']['books']['Row']
export type BookStatus = 'lendo' | 'lido' | 'quero_ler' | 'nao_finalizado'
