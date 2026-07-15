export interface FinPrevisaoConfig { id: string; nome: string; valor: number; ordem: number }

export type ImportState = 'idle' | 'reading' | 'preview' | 'importing' | 'done' | 'error'

export interface PreviewData {
  format: 'mos-v1' | 'legacy'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any
  counts: { lancamentos: number; metas: number; investimentos: number; extras?: string }
}
