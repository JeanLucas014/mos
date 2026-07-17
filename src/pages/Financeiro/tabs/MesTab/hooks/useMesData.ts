import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type {
  FinAno, FinLancamento, FinLancamentoTree,
  FinCategoria, FinCartao, DiaTotais,
} from '../../../types'
import { daysInMonth, buildTree, sumLeaves } from '../utils'
import { useRealtimeStore } from '@/stores/useRealtimeStore'

/**
 * Camada de leitura do mês: busca categorias/cartões/lançamentos, calcula o
 * saldo de abertura (saldo_inicial + net dos meses anteriores), dispara a
 * geração automática de previsão diária quando aplicável, e deriva a árvore
 * de lançamentos + totais por dia do mês.
 */
export function useMesData(ano: FinAno, month: number) {
  const [lancamentos, setLancamentos] = useState<FinLancamento[]>([])
  const [categorias, setCategorias]   = useState<FinCategoria[]>([])
  const [cartoes, setCartoes]         = useState<FinCartao[]>([])
  const [saldoAbertura, setSaldoAb]   = useState(0)
  const [loading, setLoading]         = useState(true)
  const { user } = useAuth()

  useEffect(() => { loadAll() }, [ano.id, month])

  // Recarrega quando outra aba/dispositivo muda fin_lancamentos (useRealtimeSync).
  // Pula a primeira execução — o mount acima já carrega os dados.
  const lancamentosVersion = useRealtimeStore(s => s.versions.fin_lancamentos)
  const skipFirstSync = useRef(true)
  useEffect(() => {
    if (skipFirstSync.current) { skipFirstSync.current = false; return }
    loadAll()
  }, [lancamentosVersion])

  async function loadAll() {
    setLoading(true)
    const lastDay  = daysInMonth(ano.ano, month)
    const startDate = `${ano.ano}-${String(month).padStart(2,'0')}-01`
    const endDate   = `${ano.ano}-${String(month).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`

    const [{ data: cats }, { data: cards }, { data: rows }] = await Promise.all([
      supabase.from('fin_categorias').select('*').order('ordem'),
      supabase.from('fin_cartoes').select('*').order('nome'),
      supabase.from('fin_lancamentos').select('*')
        .eq('ano_id', ano.id)
        .gte('data', startDate)
        .lte('data', endDate)
        .order('ordem'),
    ])
    setCategorias((cats ?? []) as FinCategoria[])
    setCartoes((cards ?? []) as FinCartao[])
    const currentRows = (rows ?? []) as FinLancamento[]
    setLancamentos(currentRows)

    // saldo_abertura = saldo_inicial + net dos meses anteriores
    const { data: prev } = await supabase
      .from('fin_lancamentos')
      .select('natureza, valor, is_grupo')
      .eq('ano_id', ano.id)
      .eq('is_grupo', false)
      .lt('data', startDate)

    type PRow = { natureza: string; valor: number | null; is_grupo: boolean }
    let ab = Number(ano.saldo_inicial)
    for (const r of (prev ?? []) as PRow[]) {
      const v = Number(r.valor) || 0
      ab += r.natureza === 'entrada' ? v : -v
    }
    setSaldoAb(ab)
    await generatePrevisoesIfNeeded(currentRows)
    setLoading(false)
  }

  async function generatePrevisoesIfNeeded(currentRows: FinLancamento[]) {
    const JEAN_ID = '64ab5956-18b1-432d-82f0-1ad8bc4761db'
    const now = new Date()
    const currentYear  = now.getFullYear()
    const currentMonth = now.getMonth() // 0-indexed

    if (user?.id === JEAN_ID) {
      if (ano.ano < 2026 || (ano.ano === 2026 && month < 8)) return
    } else {
      const isFutureOrCurrent =
        ano.ano > currentYear ||
        (ano.ano === currentYear && month >= currentMonth + 1)
      if (!isFutureOrCurrent) return
    }

    const jaTemDiario = currentRows.some(l => l.natureza === 'diario')
    if (jaTemDiario) return

    const { data: configRaw } = await supabase
      .from('fin_previsao_config').select('valor')
    const total = ((configRaw ?? []) as { valor: number }[]).reduce((s, c) => s + (Number(c.valor) || 0), 0)
    if (total <= 0) return

    const days = daysInMonth(ano.ano, month)
    const dailyValue = Math.round((total / days) * 100) / 100

    const inserts = Array.from({ length: days }, (_, i) => ({
      ano_id:      ano.id,
      data:        `${ano.ano}-${String(month).padStart(2,'0')}-${String(i + 1).padStart(2,'0')}`,
      natureza:    'diario' as const,
      nome:        'Previsão Diária',
      valor:       dailyValue,
      is_grupo:    false,
      is_previsao: true,
    }))

    await supabase.from('fin_lancamentos').insert(inserts)

    const lastDay = days
    const startDate = `${ano.ano}-${String(month).padStart(2,'0')}-01`
    const endDate   = `${ano.ano}-${String(month).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`
    const { data: reloaded } = await supabase
      .from('fin_lancamentos').select('*')
      .eq('ano_id', ano.id)
      .gte('data', startDate)
      .lte('data', endDate)
      .order('ordem')
    setLancamentos((reloaded ?? []) as FinLancamento[])
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const trees = buildTree(lancamentos)
  const byDay: Record<number, FinLancamentoTree[]> = {}
  for (const t of trees) {
    const d = new Date(t.data + 'T00:00:00').getDate()
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(t)
  }

  const totalDays = daysInMonth(ano.ano, month)
  const days: DiaTotais[] = (() => {
    let saldo = saldoAbertura
    return Array.from({ length: totalDays }, (_, i) => {
      const dia = i + 1
      let entrada = 0, saida = 0, diario = 0
      for (const t of byDay[dia] ?? []) {
        const v = sumLeaves(t)
        if (t.natureza === 'entrada') entrada += v
        else if (t.natureza === 'saida') saida += v
        else diario += v
      }
      saldo += entrada - saida - diario
      return { dia, entrada, saida, diario, saldo }
    })
  })()

  // Month summary
  const totE = days.reduce((a, d) => a + d.entrada, 0)
  const totS = days.reduce((a, d) => a + d.saida, 0)
  const totD = days.reduce((a, d) => a + d.diario, 0)
  const res  = totE - totS - totD

  const categoriasRapidas = categorias.filter(c => c.rapida && c.natureza === 'diario')

  return {
    loading,
    categorias,
    cartoes,
    saldoAbertura,
    trees,
    byDay,
    days,
    totE,
    totS,
    totD,
    res,
    categoriasRapidas,
    reload: loadAll,
  }
}
