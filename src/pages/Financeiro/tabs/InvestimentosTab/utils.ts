import { todayLocal, formatDateBR } from '@/lib/dates'
import type { Investimento, Taxa } from './types'

// ─── Formatters ──────────────────────────────────────────────────────────────

export const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const PCT = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(2).replace('.', ',') + '%'
export const fmtDate = (s: string) => formatDateBR(s)
export const today = () => todayLocal()

// ─── Cálculos ────────────────────────────────────────────────────────────────

export function calcRentabilidadeRF(inv: Investimento, taxas: Taxa[]): number | null {
  if (!inv.data_compra || !inv.valor_aplicado) return null
  const dias = Math.max(
    0,
    (Date.now() - new Date(inv.data_compra + 'T12:00:00').getTime()) / 86400000,
  )
  const anos = dias / 365

  let taxaAnual = 0
  if (inv.indexador === 'PREFIXADO') {
    taxaAnual = (inv.taxa_adicional ?? 0) / 100
  } else if (inv.indexador === 'CDI') {
    const cdi = taxas.find(t => t.indicador === 'CDI')?.valor_anual ?? 13.65
    taxaAnual = (cdi * (inv.taxa_adicional ?? 100)) / 10000
  } else if (inv.indexador === 'SELIC') {
    const selic = taxas.find(t => t.indicador === 'SELIC')?.valor_anual ?? 13.75
    taxaAnual = (selic + (inv.taxa_adicional ?? 0)) / 100
  } else if (inv.indexador === 'IPCA') {
    const ipca = taxas.find(t => t.indicador === 'IPCA')?.valor_anual ?? 4.83
    taxaAnual = (1 + ipca / 100) * (1 + (inv.taxa_adicional ?? 0) / 100) - 1
  }

  const valorCalculado = inv.valor_aplicado * Math.pow(1 + taxaAnual, anos)
  return ((valorCalculado - inv.valor_aplicado) / inv.valor_aplicado) * 100
}

export function valorEstimadoRF(inv: Investimento, taxas: Taxa[]): number {
  if (!inv.valor_aplicado) return 0
  if (!inv.data_compra) return inv.valor_aplicado
  const pct = calcRentabilidadeRF(inv, taxas) ?? 0
  return inv.valor_aplicado * (1 + pct / 100)
}

export function rentabilidadeVariavel(inv: Investimento): number | null {
  if (!inv.valor_atual || !inv.valor_aplicado || inv.valor_aplicado === 0) return null
  return ((inv.valor_atual - inv.valor_aplicado) / inv.valor_aplicado) * 100
}

export function valorPosicao(inv: Investimento): number {
  if (inv.tipo === 'renda_fixa' || inv.tipo === 'previdencia') return 0
  if (inv.valor_atual) return inv.valor_atual
  if (inv.quantidade && inv.preco_medio) return inv.quantidade * inv.preco_medio
  return inv.valor_aplicado ?? 0
}
