// ─── Types ───────────────────────────────────────────────────────────────────

export type TipoInv =
  | 'renda_fixa'
  | 'acoes'
  | 'fiis'
  | 'etfs'
  | 'fundos'
  | 'cripto'
  | 'previdencia'
  | 'outros'

export const TIPO_CFG: Record<TipoInv, { label: string; color: string }> = {
  renda_fixa:  { label: 'Renda Fixa',   color: '#22c55e' },
  acoes:       { label: 'Ações',        color: '#0EA5E9' },
  fiis:        { label: 'FIIs',         color: '#f97316' },
  etfs:        { label: 'ETFs',         color: '#a78bfa' },
  fundos:      { label: 'Fundos',       color: '#f59e0b' },
  cripto:      { label: 'Criptomoedas', color: '#ec4899' },
  previdencia: { label: 'Previdência',  color: '#14b8a6' },
  outros:      { label: 'Outros',       color: 'var(--text3)' },
}

export const CORES = [
  '#22c55e', '#0EA5E9', '#f97316', '#a78bfa',
  '#f59e0b', '#ec4899', '#14b8a6', 'var(--text3)',
  '#ef4444', '#64748b',
]

export const INDEXADORES = ['CDI', 'SELIC', 'IPCA', 'IGPM', 'PREFIXADO', 'OUTRO']

export const SUBTIPOS: Record<string, string[]> = {
  renda_fixa:  ['Tesouro Selic', 'Tesouro IPCA+', 'Tesouro Prefixado', 'CDB', 'LCI', 'LCA', 'LC', 'CRI', 'CRA', 'Debênture', 'Poupança'],
  acoes:       ['Ação Ordinária (ON)', 'Ação Preferencial (PN)', 'BDR'],
  fiis:        ['FII Tijolo', 'FII Papel', 'FII Híbrido', 'FOF (Fundo de Fundos)'],
  etfs:        ['ETF Renda Variável', 'ETF Renda Fixa', 'ETF Internacional', 'ETF Cripto'],
  fundos:      ['Fundo de Ações', 'Fundo Multimercado', 'Fundo Renda Fixa', 'Fundo Cambial', 'Fundo Internacional'],
  cripto:      ['Bitcoin (BTC)', 'Ethereum (ETH)', 'Stablecoin', 'Altcoin'],
  previdencia: ['PGBL', 'VGBL'],
  outros:      ['Ouro', 'Dólar', 'Prata', 'Imóvel', 'Outro'],
}

export interface Investimento {
  id: string
  user_id: string
  nome: string
  tipo: TipoInv
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

export interface Taxa {
  indicador: string
  valor_anual: number
  valor_mensal: number
  data_referencia: string
  atualizado_em: string
}

export type MainTab = 'carteira' | 'simulador' | 'taxas'
