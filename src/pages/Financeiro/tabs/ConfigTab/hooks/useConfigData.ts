import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { todayLocal } from '@/lib/dates'
import type { FinCategoria, FinCartao } from '../../../types'
import type { FinPrevisaoConfig } from '../types'

/**
 * Dados e mutations das sub-abas Categorias/Cartoes/Anos/Previsao.
 * updateFuturePrevisoes recalcula o valor diario das previsoes futuras
 * ja lancadas (is_previsao=true, data >= hoje) sempre que a config de
 * previsao muda — chamado apos add/edit/delete de item, na mesma ordem
 * do original.
 */
export function useConfigData(onReload: () => void) {
  const [categorias, setCategorias] = useState<FinCategoria[]>([])
  const [cartoes, setCartoes] = useState<FinCartao[]>([])
  const [loading, setLoading] = useState(true)
  const [previsaoItems, setPrevisaoItems] = useState<FinPrevisaoConfig[]>([])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: c }, { data: cr }] = await Promise.all([
      supabase.from('fin_categorias').select('*').order('ordem'),
      supabase.from('fin_cartoes').select('*').order('nome'),
    ])
    setCategorias((c ?? []) as FinCategoria[])
    setCartoes((cr ?? []) as FinCartao[])
    const { data: prev } = await supabase
      .from('fin_previsao_config').select('*').order('ordem')
    setPrevisaoItems((prev ?? []) as FinPrevisaoConfig[])
    setLoading(false)
  }

  async function addCategoria(nome: string, natureza: string, cor: string, rapida: boolean) {
    if (!nome.trim()) return
    await (supabase.from('fin_categorias') as any).insert({
      nome: nome.trim(), natureza,
      cor: cor || null, rapida,
      ordem: categorias.filter(c => c.natureza === natureza).length,
    })
    loadAll()
  }

  async function delCat(id: string) {
    await (supabase.from('fin_categorias') as any).delete().eq('id', id)
    loadAll()
  }

  async function addCartao(nome: string, cor: string) {
    if (!nome.trim()) return
    await (supabase.from('fin_cartoes') as any).insert({ nome: nome.trim(), cor: cor || null })
    loadAll()
  }

  async function delCartao(id: string) {
    await (supabase.from('fin_cartoes') as any).delete().eq('id', id)
    loadAll()
  }

  async function addAno(anoStr: string, saldoInicialStr: string) {
    const a = parseInt(anoStr)
    const s = parseFloat(saldoInicialStr.replace(',', '.')) || 0
    if (!a || a < 2020 || a > 2100) return alert('Ano inválido.')
    await (supabase.from('fin_anos') as any).insert({ ano: a, saldo_inicial: s })
    onReload()
    loadAll()
  }

  async function updateSaldoInicial(id: string, v: number) {
    await (supabase.from('fin_anos') as any).update({ saldo_inicial: v }).eq('id', id)
    onReload()
  }

  async function addPrevisaoItem(nome: string, valorStr: string) {
    const v = parseFloat(valorStr.replace(',', '.')) || 0
    if (!nome.trim() || !v) return
    await (supabase.from('fin_previsao_config') as any).insert({
      nome: nome.trim(), valor: v,
      ordem: previsaoItems.length,
    })
    loadAll()
    await updateFuturePrevisoes()
  }

  async function delPrevisaoItem(id: string) {
    await (supabase.from('fin_previsao_config') as any).delete().eq('id', id)
    loadAll()
    await updateFuturePrevisoes()
  }

  async function updatePrevisaoValor(id: string, valor: number) {
    await (supabase.from('fin_previsao_config') as any).update({ valor }).eq('id', id)
    loadAll()
    await updateFuturePrevisoes()
  }

  async function updateFuturePrevisoes() {
    const today = todayLocal()
    const { data: configRaw } = await supabase.from('fin_previsao_config').select('valor')
    const total = ((configRaw ?? []) as { valor: number }[]).reduce((s, c) => s + (Number(c.valor) || 0), 0)
    if (total <= 0) return

    const { data: futureRaw } = await supabase
      .from('fin_lancamentos')
      .select('id, data')
      .eq('is_previsao', true)
      .gte('data', today)
    const future = (futureRaw ?? []) as { id: string; data: string }[]

    if (!future.length) return

    const byMonth: Record<string, { ids: string[]; days: number }> = {}
    for (const entry of future) {
      const [y, m] = entry.data.split('-').map(Number)
      const key = `${y}-${m}`
      if (!byMonth[key]) {
        const days = new Date(y, m, 0).getDate()
        byMonth[key] = { ids: [], days }
      }
      byMonth[key].ids.push(entry.id)
    }

    for (const { ids, days } of Object.values(byMonth)) {
      const dailyValue = Math.round((total / days) * 100) / 100
      await (supabase.from('fin_lancamentos') as any)
        .update({ valor: dailyValue })
        .in('id', ids)
    }
  }

  return {
    categorias, cartoes, previsaoItems, loading,
    addCategoria, delCat, addCartao, delCartao,
    addAno, updateSaldoInicial,
    addPrevisaoItem, delPrevisaoItem, updatePrevisaoValor,
  }
}
