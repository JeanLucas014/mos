import { supabase } from '@/lib/supabase'
import type { Investimento } from '../types'

/**
 * Mutations de investimentos: salvar (insert/update) e arquivar
 * (soft delete via ativo=false). Cada uma recarrega os dados via
 * `reload` depois de concluir, mesmo padrao usado no resto do app.
 */
export function useInvestimentoActions(reload: () => Promise<void>) {
  async function saveInvestimento(data: Partial<Investimento>) {
    if (!data.nome || !data.tipo) return
    const { id, ...rest } = data as Investimento & { id?: string }
    if (id) {
      await supabase.from('fin_investimentos')
        .update(rest)
        .eq('id', id)
    } else {
      await supabase.from('fin_investimentos').insert({ ...data, nome: data.nome, tipo: data.tipo })
    }
    reload()
  }

  async function archiveInvestimento(inv: Investimento) {
    if (!confirm(`Arquivar "${inv.nome}"?`)) return
    await supabase.from('fin_investimentos')
      .update({ ativo: false })
      .eq('id', inv.id)
    reload()
  }

  return { saveInvestimento, archiveInvestimento }
}
