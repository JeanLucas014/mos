export type Natureza = 'entrada' | 'saida' | 'diario'
export type SaidaTipo = 'fixa' | 'cartao'

export interface FinAno {
  id: string
  user_id: string
  ano: number
  saldo_inicial: number
  created_at: string
}

export interface FinCategoria {
  id: string
  user_id: string
  nome: string
  natureza: Natureza
  cor: string | null
  rapida: boolean
  ordem: number
}

export interface FinCartao {
  id: string
  user_id: string
  nome: string
  cor: string | null
}

export interface FinLancamento {
  id: string
  user_id: string
  ano_id: string
  parent_id: string | null
  data: string            // ISO date 'YYYY-MM-DD'
  natureza: Natureza
  nome: string
  valor: number | null    // null para grupos; calculado recursivamente
  is_grupo: boolean
  categoria_id: string | null
  cartao_id: string | null
  saida_tipo: SaidaTipo | null
  ordem: number
  is_previsao?: boolean
  pago?: boolean
  created_at: string
}

export interface FinLancamentoTree extends FinLancamento {
  children: FinLancamentoTree[]
  valorTotal: number      // calculado client-side
}

export interface DiaTotais {
  dia: number
  entrada: number
  saida: number
  diario: number
  saldo: number           // saldo acumulado até este dia
}

export interface FinMeta {
  id: string
  user_id: string
  nome: string
  alvo: number
  atual: number
  ordem: number
}

export interface FinInvestimento {
  id: string
  user_id: string
  nome: string
  tipo: string
  subtipo?: string
  ticker?: string
  instituicao?: string
  cor: string
  quantidade?: number
  preco_medio?: number
  valor_atual?: number
  valor_aplicado?: number
  data_atualizacao?: string
  indexador?: string
  taxa_adicional?: number
  data_compra?: string
  data_vencimento?: string
  liquidez?: string
  ativo: boolean
  notas?: string
  criado_em: string
}

export interface FinRecorrente {
  id: string
  user_id: string
  nome: string
  valor: number
  dia_previsto: number
  natureza: string
  saida_tipo: string
  categoria_id: string | null
  ativo: boolean
}
