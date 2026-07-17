import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { FinAno, FinLancamento, FinCategoria } from '../../../types'
import type { AddForm } from '../types'
import type { EditFormState } from '../components/EditModal'

interface UseMesActionsParams {
  ano: FinAno
  month: number
  reload: () => Promise<void>
}

/**
 * As mutations do mês (insert/update/delete em fin_lancamentos e
 * fin_categorias). Cada uma recarrega os dados via `reload` depois de
 * concluir — o mesmo padrão de refetch total já usado no resto do app,
 * sem alteração de comportamento.
 */
export function useMesActions({ ano, month, reload }: UseMesActionsParams) {
  const queryClient = useQueryClient()

  async function addLancamento(form: AddForm, dia: number) {
    const nome = form.nome.trim()
    if (!nome) return

    const baseDate = new Date(`${ano.ano}-${String(month).padStart(2,'0')}-${String(dia).padStart(2,'0')}`)
    const datas: string[] = []

    if (!form.repetir || !form.repeticao_ate) {
      datas.push(baseDate.toISOString().slice(0, 10))
    } else {
      const ateDate = new Date(form.repeticao_ate)
      let current = new Date(baseDate)
      while (current <= ateDate) {
        datas.push(current.toISOString().slice(0, 10))
        if (form.repeticao_freq === 'mensal') {
          current = new Date(current.getFullYear(), current.getMonth() + 1, current.getDate())
        } else if (form.repeticao_freq === 'quinzenal') {
          current = new Date(current.getTime() + 14 * 24 * 60 * 60 * 1000)
        } else {
          current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      }
    }

    const inserts = datas.map(data => ({
      ano_id:      ano.id,
      parent_id:   form.parent_id || null,
      data,
      natureza:    form.natureza,
      nome,
      valor:       form.is_grupo ? null : (parseFloat(form.valor.replace(',', '.')) || 0),
      is_grupo:    form.is_grupo,
      is_previsao: false,
      categoria_id: form.categoria_id || null,
      cartao_id:   form.natureza === 'saida' && form.saida_tipo === 'cartao' ? form.cartao_id || null : null,
      saida_tipo:  form.natureza === 'saida' ? form.saida_tipo : null,
    }))

    await supabase.from('fin_lancamentos').insert(inserts)
    await reload()
  }

  async function saveEdit(item: FinLancamento, form: EditFormState) {
    const update: Partial<FinLancamento> = {
      nome:         form.nome.trim(),
      data:         form.data,
      categoria_id: form.categoria_id || null,
      is_previsao:  false,
    }
    if (!item.is_grupo) {
      update.valor = parseFloat(form.valor.replace(',', '.')) || 0
    }
    if (!item.parent_id) {
      update.natureza = form.natureza
    }
    if (form.natureza === 'saida') {
      update.saida_tipo = form.saida_tipo
      update.cartao_id  = form.saida_tipo === 'cartao' ? form.cartao_id || null : null
    } else {
      update.saida_tipo = null
      update.cartao_id  = null
    }
    await supabase.from('fin_lancamentos').update(update).eq('id', item.id)
    await reload()
  }

  async function deleteLancamento(id: string) {
    if (!confirm('Excluir este lançamento e todos os seus subitens?')) return
    await supabase.from('fin_lancamentos').delete().eq('id', id)
    await reload()
  }

  async function saveDiarioValue(id: string, valor: number) {
    await supabase.from('fin_lancamentos').update({
      valor,
      is_previsao: false,
      nome: 'Diário',
    }).eq('id', id)
    await reload()
  }

  async function togglePago(id: string, pago: boolean) {
    await supabase.from('fin_lancamentos').update({ pago }).eq('id', id)
    await reload()
    queryClient.invalidateQueries({ queryKey: ['dash_recorrentes'] })
  }

  async function quickLaunch(dia: number, cat: FinCategoria, nome: string, valor: string) {
    const v = parseFloat(valor.replace(',', '.'))
    if (!v || !nome.trim()) return
    const data = `${ano.ano}-${String(month).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    await supabase.from('fin_lancamentos').insert({
      ano_id: ano.id, data, natureza: 'diario', nome: nome.trim(),
      valor: v, is_grupo: false, categoria_id: cat.id,
    })
    await reload()
  }

  async function addQuickCat(nome: string, cor: string | undefined, ordem: number) {
    if (!nome.trim()) return
    await supabase.from('fin_categorias').insert({
      nome: nome.trim(), natureza: 'diario', cor: cor || null, rapida: true,
      ordem,
    })
    await reload()
  }

  return {
    addLancamento,
    saveEdit,
    deleteLancamento,
    saveDiarioValue,
    togglePago,
    quickLaunch,
    addQuickCat,
  }
}
