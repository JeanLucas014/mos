import type { Natureza, SaidaTipo } from '../../types'

export interface AddForm {
  natureza: Natureza
  saida_tipo: SaidaTipo
  nome: string
  valor: string
  categoria_id: string
  cartao_id: string
  is_grupo: boolean
  parent_id: string | null
  repetir: boolean
  repeticao_freq: 'mensal' | 'quinzenal' | 'semanal'
  repeticao_ate: string
}

export function defaultForm(nat: Natureza = 'diario', parentId: string | null = null, st: SaidaTipo = 'fixa'): AddForm {
  return {
    natureza: nat, saida_tipo: st, nome: '', valor: '', categoria_id: '', cartao_id: '',
    is_grupo: false, parent_id: parentId,
    repetir: false, repeticao_freq: 'mensal', repeticao_ate: '',
  }
}
