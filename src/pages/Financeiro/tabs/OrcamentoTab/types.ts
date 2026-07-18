export type OrcamentoGrupoTipo = 'fixo' | 'variavel'
export type MetaGuardarTipo = 'percentual' | 'valor_fixo'
export type OverrideTipoReferencia = 'grupo' | 'entrada' | 'meta_guardar'

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

export interface OrcamentoMesOverride {
  id: string
  user_id: string
  mes_ref: string // 'YYYY-MM-DD', sempre dia 1
  tipo_referencia: OverrideTipoReferencia
  referencia_id: string | null
  valor_override: number
  created_at: string
}
