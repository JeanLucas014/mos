import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Investimento, Taxa } from '../types'
import { valorEstimadoRF, valorPosicao } from '../utils'

/**
 * Camada de leitura da Carteira: busca investimentos ativos + taxas
 * economicas, e deriva os agregados por classe (porTipo) e os totais
 * de patrimonio/aplicado/rentabilidade.
 */
export function useInvestimentosData() {
  const [items, setItems]     = useState<Investimento[]>([])
  const [taxas, setTaxas]     = useState<Taxa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: inv }, { data: tax }] = await Promise.all([
      (supabase.from('fin_investimentos') as any)
        .select('*')
        .eq('ativo', true)
        .order('criado_em'),
      (supabase.from('fin_taxas_economicas') as any).select('*'),
    ])
    setItems((inv ?? []) as Investimento[])
    setTaxas((tax ?? []) as Taxa[])
    setLoading(false)
  }

  const porTipo = useMemo(() => {
    const m: Record<string, number> = {}
    for (const inv of items) {
      const isRF = inv.tipo === 'renda_fixa' || inv.tipo === 'previdencia'
      const val = isRF ? valorEstimadoRF(inv, taxas) : valorPosicao(inv)
      m[inv.tipo] = (m[inv.tipo] ?? 0) + val
    }
    return m
  }, [items, taxas])

  const patrimonioTotal = Object.values(porTipo).reduce((a, b) => a + b, 0)
  const totalAplicado   = items.reduce((a, i) => a + (i.valor_aplicado ?? 0), 0)
  const rentTotal       =
    totalAplicado > 0 ? ((patrimonioTotal - totalAplicado) / totalAplicado) * 100 : 0

  return {
    items,
    taxas,
    loading,
    porTipo,
    patrimonioTotal,
    totalAplicado,
    rentTotal,
    reload: load,
  }
}
