import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type {
  FinAno, FinLancamento, FinLancamentoTree,
  FinCategoria, FinCartao, DiaTotais,
} from '../../../types'
import { daysInMonth, buildTree, sumLeaves, computeMissingOccurrences } from '../utils'
import type { RecorrenciaFreq } from '../../../types'
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
    const afterRecorrentes = await generateRecorrentesIfNeeded(currentRows, startDate, endDate)
    await generatePrevisoesIfNeeded(afterRecorrentes)
    setLoading(false)
  }

  /**
   * Gera sob demanda as próximas ocorrências de itens marcados como
   * recorrentes (raiz ou sub-item) — só quando o mês visualizado ainda não
   * tem a instância daquela série. Nunca cria anos de registros de uma vez:
   * cada navegação até um mês futuro materializa só o que falta até ali.
   *
   * Duas passadas:
   * 1) séries de itens RAIZ recorrentes → cria o item do mês + replica
   *    TODOS os filhos da última instância (recorrentes ou não) sob o novo
   *    id, preservando a árvore inteira do grupo.
   * 2) séries de SUB-ITENS recorrentes cujo pai não é gerenciado pela
   *    passada 1 (ex: grupo "Mãe" recriado manualmente todo mês) — acha um
   *    pai com mesmo nome/natureza já existente no mês alvo (ou cria um
   *    placeholder) e encaixa o sub-item ali.
   */
  async function generateRecorrentesIfNeeded(
    currentRows: FinLancamento[],
    startDate: string,
    endDate: string,
  ): Promise<FinLancamento[]> {
    const { data: allRecorrentes } = await supabase
      .from('fin_lancamentos')
      .select('*')
      .eq('ano_id', ano.id)
      .eq('recorrente', true)
    const rows = (allRecorrentes ?? []) as FinLancamento[]
    if (rows.length === 0) return currentRows

    const monthStart = new Date(ano.ano, month - 1, 1)
    const lastDay = daysInMonth(ano.ano, month)
    const monthEnd = new Date(ano.ano, month - 1, lastDay)

    const bySerie = new Map<string, FinLancamento[]>()
    for (const r of rows) {
      if (!r.recorrencia_serie_id) continue
      if (!bySerie.has(r.recorrencia_serie_id)) bySerie.set(r.recorrencia_serie_id, [])
      bySerie.get(r.recorrencia_serie_id)!.push(r)
    }

    let generatedAny = false
    const handledChildAnchorIds = new Set<string>()

    // ── Passada 1: séries raiz ──────────────────────────────────────────
    for (const instances of bySerie.values()) {
      const roots = instances.filter(i => !i.parent_id).sort((a, b) => a.data.localeCompare(b.data))
      if (roots.length === 0) continue
      const last = roots[roots.length - 1]

      const alreadyThisMonth = roots.some(r => r.data >= startDate && r.data <= endDate)
      if (alreadyThisMonth) continue

      const lastDate = new Date(last.data + 'T00:00:00')
      const freq = (last.recorrencia_freq as RecorrenciaFreq) ?? 'mensal'
      const ate = last.recorrencia_ate ? new Date(last.recorrencia_ate + 'T00:00:00') : null
      const occurrences = computeMissingOccurrences(lastDate, freq, monthStart, monthEnd, ate)
      if (occurrences.length === 0) continue

      const lastChildren = await fetchChildren(last.id)

      for (const occDate of occurrences) {
        const dataStr = toIsoDate(occDate)
        const { data: newParent } = await supabase.from('fin_lancamentos').insert({
          ano_id: ano.id,
          parent_id: null,
          data: dataStr,
          natureza: last.natureza,
          nome: last.nome,
          valor: last.is_grupo ? null : last.valor,
          is_grupo: last.is_grupo,
          is_previsao: false,
          categoria_id: last.categoria_id,
          cartao_id: last.cartao_id,
          saida_tipo: last.saida_tipo,
          recorrente: true,
          recorrencia_freq: freq,
          recorrencia_serie_id: last.recorrencia_serie_id,
          recorrencia_ate: last.recorrencia_ate,
        }).select().single()
        if (!newParent) continue
        generatedAny = true

        for (const child of lastChildren) {
          handledChildAnchorIds.add(child.id)
          await supabase.from('fin_lancamentos').insert({
            ano_id: ano.id,
            parent_id: newParent.id,
            data: dataStr,
            natureza: child.natureza,
            nome: child.nome,
            valor: child.valor,
            is_grupo: child.is_grupo,
            is_previsao: false,
            categoria_id: child.categoria_id,
            cartao_id: child.cartao_id,
            saida_tipo: child.saida_tipo,
            recorrente: child.recorrente,
            recorrencia_freq: child.recorrencia_freq,
            recorrencia_serie_id: child.recorrencia_serie_id,
            recorrencia_ate: child.recorrencia_ate,
          })
        }
      }
    }

    // ── Passada 2: sub-itens recorrentes cujo pai não veio junto acima ──
    for (const instances of bySerie.values()) {
      const childInstances = instances.filter(i => i.parent_id).sort((a, b) => a.data.localeCompare(b.data))
      if (childInstances.length === 0) continue
      const last = childInstances[childInstances.length - 1]
      if (handledChildAnchorIds.has(last.id)) continue

      const alreadyThisMonth = childInstances.some(r => r.data >= startDate && r.data <= endDate)
      if (alreadyThisMonth) continue

      const lastDate = new Date(last.data + 'T00:00:00')
      const freq = (last.recorrencia_freq as RecorrenciaFreq) ?? 'mensal'
      const ate = last.recorrencia_ate ? new Date(last.recorrencia_ate + 'T00:00:00') : null
      const occurrences = computeMissingOccurrences(lastDate, freq, monthStart, monthEnd, ate)
      if (occurrences.length === 0) continue

      // Pai da última instância — usado como molde pro placeholder e pra
      // achar um "mesmo grupo" já existente no mês alvo (por nome+natureza).
      const { data: anchorParentRaw } = await supabase
        .from('fin_lancamentos').select('*').eq('id', last.parent_id!).maybeSingle()
      const anchorParent = anchorParentRaw as FinLancamento | null
      if (!anchorParent) continue

      for (const occDate of occurrences) {
        const dataStr = toIsoDate(occDate)

        const { data: existingParents } = await supabase
          .from('fin_lancamentos')
          .select('*')
          .eq('ano_id', ano.id)
          .eq('data', dataStr)
          .eq('nome', anchorParent.nome)
          .eq('natureza', anchorParent.natureza)
          .eq('is_grupo', true)
          .limit(1)

        let parentId = (existingParents ?? [])[0]?.id as string | undefined
        if (!parentId) {
          const { data: newParent } = await supabase.from('fin_lancamentos').insert({
            ano_id: ano.id,
            parent_id: null,
            data: dataStr,
            natureza: anchorParent.natureza,
            nome: anchorParent.nome,
            valor: null,
            is_grupo: true,
            is_previsao: false,
            categoria_id: anchorParent.categoria_id,
            cartao_id: anchorParent.cartao_id,
            saida_tipo: anchorParent.saida_tipo,
          }).select().single()
          if (!newParent) continue
          parentId = newParent.id
          generatedAny = true
        }

        await supabase.from('fin_lancamentos').insert({
          ano_id: ano.id,
          parent_id: parentId,
          data: dataStr,
          natureza: last.natureza,
          nome: last.nome,
          valor: last.valor,
          is_grupo: last.is_grupo,
          is_previsao: false,
          categoria_id: last.categoria_id,
          cartao_id: last.cartao_id,
          saida_tipo: last.saida_tipo,
          recorrente: true,
          recorrencia_freq: freq,
          recorrencia_serie_id: last.recorrencia_serie_id,
          recorrencia_ate: last.recorrencia_ate,
        })
        generatedAny = true
      }
    }

    if (!generatedAny) return currentRows

    const { data: reloaded } = await supabase
      .from('fin_lancamentos').select('*')
      .eq('ano_id', ano.id)
      .gte('data', startDate)
      .lte('data', endDate)
      .order('ordem')
    const reloadedRows = (reloaded ?? []) as FinLancamento[]
    setLancamentos(reloadedRows)
    return reloadedRows
  }

  async function fetchChildren(parentId: string): Promise<FinLancamento[]> {
    const { data } = await supabase.from('fin_lancamentos').select('*').eq('parent_id', parentId)
    return (data ?? []) as FinLancamento[]
  }

  function toIsoDate(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
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
