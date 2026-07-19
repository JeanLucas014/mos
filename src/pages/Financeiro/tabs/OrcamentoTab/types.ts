export type OrcamentoGrupoTipo = 'fixo' | 'variavel'
export type OrcamentoGrupoModo = 'manual' | 'categoria'
export type MetaGuardarTipo = 'percentual' | 'valor_fixo'

export interface OrcamentoConfig {
  id: string
  user_id: string
  meta_guardar_tipo: MetaGuardarTipo
  meta_guardar_valor: number
  created_at: string
  updated_at: string
}

export interface OrcamentoGrupo {
  id: string
  user_id: string
  nome: string
  tipo: OrcamentoGrupoTipo
  modo: OrcamentoGrupoModo
  categorias_vinculadas: string[]
  valor_previsto_padrao: number
  ordem: number
  created_at: string
}

export interface OrcamentoEntrada {
  id: string
  user_id: string
  nome: string
  valor_previsto_padrao: number
  ordem: number
  created_at: string
}
