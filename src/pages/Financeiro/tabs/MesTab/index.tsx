// src/pages/Financeiro/tabs/MesTab/index.tsx
// v2 — editar lançamentos, subitens em grupos, clique por coluna, nova cat rápida, cards de resumo

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, ChevronDown, ChevronRight, Trash2, Pencil, X, CalendarDays, List } from 'lucide-react'
import { ExtratoView } from '../ExtratoView'
import type {
  FinAno, FinLancamento, FinLancamentoTree,
  FinCategoria, FinCartao, DiaTotais, Natureza, SaidaTipo,
} from '../../types'
import { MS_FULL, MS_OPT, BRL, daysInMonth, buildTree, sumLeaves } from './utils'
import { defaultForm, type AddForm } from './types'
import { EditModal, type EditFormState } from './components/EditModal'
import { AddPanel } from './components/AddPanel'

// ─────────────────────────────────────────────────────────────────────────────
// MesTab (main)
// ─────────────────────────────────────────────────────────────────────────────

interface Props { ano: FinAno; initialMonth: number }

export function MesTab({ ano, initialMonth }: Props) {
  const [month, setMonth]               = useState(initialMonth)
  const [lancamentos, setLancamentos]   = useState<FinLancamento[]>([])
  const [categorias, setCategorias]     = useState<FinCategoria[]>([])
  const [cartoes, setCartoes]           = useState<FinCartao[]>([])
  const [saldoAbertura, setSaldoAb]     = useState(0)
  const [loading, setLoading]           = useState(true)
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set())
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [editingItem, setEditingItem]   = useState<FinLancamento | null>(null)
  const [addingToDay, setAddingToDay]   = useState<number | null>(null)
  const [viewMode, setViewMode]         = useState<'calendario' | 'extrato'>('calendario')
  const [addForm, setAddForm]           = useState<AddForm>(defaultForm())
  const [saving, setSaving]             = useState(false)
  const [mobileCol, setMobileCol]       = useState<Natureza>('diario')
  const [editingDiarioId, setEditingDiarioId] = useState<string | null>(null)
  const [editingValue, setEditingValue]       = useState<string>('')
  const queryClient = useQueryClient()
  const { user } = useAuth()

  useEffect(() => { loadAll() }, [ano.id, month])

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

    await (supabase.from('fin_lancamentos') as any).insert(inserts)

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

  // ── Actions ────────────────────────────────────────────────────────────────

  function openAdd(dia: number, nat: Natureza = 'diario', parentId: string | null = null, st: SaidaTipo = 'fixa') {
    setAddForm(defaultForm(nat, parentId, st))
    setAddingToDay(dia)
    if (!expandedDays.has(dia)) toggleDay(dia)
  }

  async function addLancamento(dia: number) {
    const nome = addForm.nome.trim()
    if (!nome) return
    setSaving(true)

    const baseDate = new Date(`${ano.ano}-${String(month).padStart(2,'0')}-${String(dia).padStart(2,'0')}`)
    const datas: string[] = []

    if (!addForm.repetir || !addForm.repeticao_ate) {
      datas.push(baseDate.toISOString().slice(0, 10))
    } else {
      const ateDate = new Date(addForm.repeticao_ate)
      let current = new Date(baseDate)
      while (current <= ateDate) {
        datas.push(current.toISOString().slice(0, 10))
        if (addForm.repeticao_freq === 'mensal') {
          current = new Date(current.getFullYear(), current.getMonth() + 1, current.getDate())
        } else if (addForm.repeticao_freq === 'quinzenal') {
          current = new Date(current.getTime() + 14 * 24 * 60 * 60 * 1000)
        } else {
          current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      }
    }

    const inserts = datas.map(data => ({
      ano_id:      ano.id,
      parent_id:   addForm.parent_id || null,
      data,
      natureza:    addForm.natureza,
      nome,
      valor:       addForm.is_grupo ? null : (parseFloat(addForm.valor.replace(',', '.')) || 0),
      is_grupo:    addForm.is_grupo,
      is_previsao: false,
      categoria_id: addForm.categoria_id || null,
      cartao_id:   addForm.natureza === 'saida' && addForm.saida_tipo === 'cartao' ? addForm.cartao_id || null : null,
      saida_tipo:  addForm.natureza === 'saida' ? addForm.saida_tipo : null,
    }))

    await (supabase.from('fin_lancamentos') as any).insert(inserts)

    setSaving(false)
    setAddingToDay(null)
    setAddForm(defaultForm())
    loadAll()
  }



  async function saveEdit(form: EditFormState) {
    if (!editingItem) return
    const update: Record<string, unknown> = {
      nome:         form.nome.trim(),
      data:         form.data,
      categoria_id: form.categoria_id || null,
      is_previsao:  false,
    }
    if (!editingItem.is_grupo) {
      update.valor = parseFloat(form.valor.replace(',', '.')) || 0
    }
    if (!editingItem.parent_id) {
      update.natureza = form.natureza
    }
    if (form.natureza === 'saida') {
      update.saida_tipo = form.saida_tipo
      update.cartao_id  = form.saida_tipo === 'cartao' ? form.cartao_id || null : null
    } else {
      update.saida_tipo = null
      update.cartao_id  = null
    }
    await (supabase.from('fin_lancamentos') as any).update(update).eq('id', editingItem.id)
    setEditingItem(null)
    loadAll()
  }

  async function deleteLancamento(id: string) {
    if (!confirm('Excluir este lançamento e todos os seus subitens?')) return
    await (supabase.from('fin_lancamentos') as any).delete().eq('id', id)
    loadAll()
  }

  async function saveDiario(id: string) {
    const valor = parseFloat(editingValue.replace(',', '.'))
    if (isNaN(valor) || valor < 0) { setEditingDiarioId(null); return }
    await (supabase.from('fin_lancamentos') as any).update({
      valor,
      is_previsao: false,
      nome: 'Diário',
    }).eq('id', id)
    setEditingDiarioId(null)
    loadAll()
  }

  async function togglePago(id: string, pago: boolean) {
    await (supabase.from('fin_lancamentos') as any).update({ pago }).eq('id', id)
    loadAll()
    queryClient.invalidateQueries({ queryKey: ['dash_recorrentes'] })
  }

  async function quickLaunch(dia: number, cat: FinCategoria, nome: string, valor: string) {
    const v = parseFloat(valor.replace(',', '.'))
    if (!v || !nome.trim()) return
    const data = `${ano.ano}-${String(month).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    await (supabase.from('fin_lancamentos') as any).insert({
      ano_id: ano.id, data, natureza: 'diario', nome: nome.trim(),
      valor: v, is_grupo: false, categoria_id: cat.id,
    })
    loadAll()
  }

  async function addQuickCat(nome: string, cor?: string) {
    if (!nome.trim()) return
    await (supabase.from('fin_categorias') as any).insert({
      nome: nome.trim(), natureza: 'diario', cor: cor || null, rapida: true,
      ordem: categorias.filter(c => c.rapida && c.natureza === 'diario').length,
    })
    loadAll()
  }

  function toggleDay(d: number) {
    setExpandedDays(prev => { const n = new Set(prev); n.has(d) ? n.delete(d) : n.add(d); return n })
  }
  function toggleItem(id: string) {
    setExpandedItems(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-5 h-5 rounded-full border-2 border-[#0EA5E9] border-t-transparent animate-spin" />
    </div>
  )

  const today = new Date()
  const isCurrentMonth = ano.ano === today.getFullYear() && month === today.getMonth() + 1

  return (
    <div>
      {/* ── Month selector ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-5">
        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="bg-bg-2 border border-line text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-[#0EA5E9]/60"
          >
            {MS_OPT.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <span className="text-[#555] text-sm">{MS_FULL[month - 1]} · {ano.ano}</span>
        </div>
        <span className="sm:ml-auto text-xs text-[#555]">
          Abertura: <span className="text-white tabular-nums">{BRL(saldoAbertura)}</span>
        </span>
      </div>

      {/* ── View mode toggle ── */}
      <div className="flex gap-1 mb-5">
        <button
          onClick={() => setViewMode('calendario')}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors',
            viewMode === 'calendario'
              ? 'border-[#0EA5E9]/50 text-[#0EA5E9]'
              : 'border-line text-[#555] hover:text-white',
          ].join(' ')}
        >
          <CalendarDays size={12} /> Calendário
        </button>
        <button
          onClick={() => setViewMode('extrato')}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors',
            viewMode === 'extrato'
              ? 'border-[#0EA5E9]/50 text-[#0EA5E9]'
              : 'border-line text-[#555] hover:text-white',
          ].join(' ')}
        >
          <List size={12} /> Extrato
        </button>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Entradas',  value: totE, color: '#22c55e' },
          { label: 'Saídas',   value: totS, color: '#ef4444' },
          { label: 'Diário',   value: totD, color: '#f97316' },
          { label: 'Resultado',value: res,  color: res >= 0 ? '#22c55e' : '#ef4444' },
        ].map(c => (
          <div key={c.label} className="bg-bg-2 border border-line rounded-xl p-3.5 relative">
            <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full" style={{ background: c.color }} />
            <div className="text-[10px] text-[#555] uppercase tracking-wider font-[Sora] mb-1.5">{c.label}</div>
            <div className="text-sm font-bold tabular-nums" style={{ color: c.color }}>{BRL(c.value)}</div>
          </div>
        ))}
      </div>

      {/* ── Mobile column toggle (apenas calendário) ── */}
      {viewMode === 'calendario' && (
        <div className="flex sm:hidden gap-1 mb-4">
          {(['entrada','saida','diario'] as Natureza[]).map(col => (
            <button
              key={col}
              onClick={() => setMobileCol(col)}
              className={[
                'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                mobileCol === col ? 'border-[#0EA5E9]/50 text-[#0EA5E9]' : 'border-line text-[#555]',
              ].join(' ')}
            >
              {col === 'entrada' ? 'Entrada' : col === 'saida' ? 'Saída' : 'Diário'}
            </button>
          ))}
        </div>
      )}

      {viewMode === 'calendario' ? (<>
      {/* ── PC TABLE ── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm border-collapse">
          <thead>
            <tr className="text-[10px] text-[#555] uppercase tracking-wider select-none">
              <th className="text-left py-2 px-2 w-12">Dia</th>
              <th className="text-right py-2 px-3 text-[#22c55e]/60" title="Clique na célula para adicionar">Entrada ↓</th>
              <th className="text-right py-2 px-3 text-[#ef4444]/60" title="Clique na célula para adicionar">Saída ↓</th>
              <th className="text-right py-2 px-3 text-[#f97316]/60" title="Clique no valor para registrar o gasto real do dia">Diário ↓</th>
              <th className="text-right py-2 px-2">Saldo</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {days.map(d => {
              const dayItems = byDay[d.dia] ?? []
              const isExpanded = expandedDays.has(d.dia)
              const isToday    = isCurrentMonth && d.dia === today.getDate()

              return (
                <>
                  {/* ── Day row ── */}
                  <tr
                    key={`day-${d.dia}`}
                    className={['border-t border-line group', isToday ? 'bg-[#0EA5E9]/5' : ''].join(' ')}
                  >
                    {/* Dia */}
                    <td className="py-2.5 px-2">
                      <button
                        onClick={() => dayItems.length > 0 && toggleDay(d.dia)}
                        className="flex items-center gap-1 text-[#666] hover:text-white transition-colors"
                      >
                        {dayItems.length > 0
                          ? isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                          : <span className="w-3 inline-block" />}
                        <span className={['tabular-nums font-medium', isToday ? 'text-[#0EA5E9]' : ''].join(' ')}>
                          {d.dia}
                        </span>
                      </button>
                    </td>

                    {/* Entrada — click to add */}
                    <td
                      className="py-2.5 px-3 text-right tabular-nums text-[#22c55e] cursor-pointer hover:bg-[#22c55e]/5 transition-colors"
                      onClick={() => openAdd(d.dia, 'entrada')}
                      title="Clique para adicionar entrada"
                    >
                      {d.entrada > 0 ? BRL(d.entrada) : <span className="text-[#252525]">—</span>}
                    </td>

                    {/* Saída — click to add */}
                    <td
                      className="py-2.5 px-3 text-right tabular-nums text-[#ef4444] cursor-pointer hover:bg-[#ef4444]/5 transition-colors"
                      onClick={() => openAdd(d.dia, 'saida')}
                      title="Clique para adicionar saída"
                    >
                      {d.saida > 0 ? BRL(d.saida) : <span className="text-[#252525]">—</span>}
                    </td>

                    {/* Diário — click to add */}
                    <td
                      className="py-2.5 px-3 text-right tabular-nums text-[#f97316] cursor-pointer hover:bg-[#f97316]/5 transition-colors"
                      onClick={() => openAdd(d.dia, 'diario')}
                      title="Clique para adicionar diário"
                    >
                      {d.diario > 0 ? BRL(d.diario) : <span className="text-[#252525]">—</span>}
                    </td>

                    {/* Saldo — texto simples sem fundo */}
                    <td className={['py-2.5 px-2 text-right tabular-nums font-medium', d.saldo >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'].join(' ')}>
                      {BRL(d.saldo)}
                    </td>

                    {/* Generic + */}
                    <td className="py-2.5 px-2">
                      <button
                        onClick={() => openAdd(d.dia)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[#0EA5E9] hover:text-white"
                      >
                        <Plus size={14} />
                      </button>
                    </td>
                  </tr>

                  {/* ── Expanded items ── */}
                  {isExpanded && dayItems.map(item => (
                    <ItemRows
                      key={item.id}
                      node={item}
                      depth={0}
                      expandedItems={expandedItems}
                      toggleItem={toggleItem}
                      onEdit={setEditingItem}
                      onDelete={deleteLancamento}
                      onAddChild={parent => openAdd(d.dia, parent.natureza, parent.id, (parent.saida_tipo as SaidaTipo) ?? 'fixa')}
                      onTogglePago={togglePago}
                      editingDiarioId={editingDiarioId}
                      editingValue={editingValue}
                      onEditDiario={(id, val) => { setEditingDiarioId(id); setEditingValue(String(val)) }}
                      onEditDiarioChange={setEditingValue}
                      onSaveDiario={saveDiario}
                    />
                  ))}

                </>
              )
            })}
          </tbody>
        </table>
        <div style={{ fontSize: 11, color: '#4b5563', marginTop: 8 }}>
          <span style={{ fontStyle: 'italic' }}>Itálico</span> = previsão ·{' '}
          <span style={{ color: '#f59e0b' }}>Colorido</span> = gasto real registrado
        </div>
      </div>

      {/* ── MOBILE LIST ── */}
      <div className="sm:hidden divide-y divide-[#1f1f1f]">
        {days.map(d => {
          const colVal          = mobileCol === 'entrada' ? d.entrada : mobileCol === 'saida' ? d.saida : d.diario
          const colColor        = mobileCol === 'entrada' ? '#22c55e' : mobileCol === 'saida' ? '#ef4444' : '#f97316'
          const isToday         = isCurrentMonth && d.dia === today.getDate()
          const dayItemsFiltered = (byDay[d.dia] ?? []).filter(i => i.natureza === mobileCol)
          const isExpanded      = expandedDays.has(d.dia)

          return (
            <div key={d.dia} className={isToday ? 'bg-[#0EA5E9]/5' : ''}>
              <div className="flex items-center gap-3 py-2.5">
                <button
                  className="flex items-center gap-1 w-8 shrink-0"
                  onClick={() => dayItemsFiltered.length > 0 && toggleDay(d.dia)}
                >
                  {dayItemsFiltered.length > 0
                    ? (isExpanded ? <ChevronDown size={11} className="text-[#666]" /> : <ChevronRight size={11} className="text-[#666]" />)
                    : <span className="w-[11px]" />}
                  <span className={['text-sm tabular-nums font-medium', isToday ? 'text-[#0EA5E9]' : 'text-[#666]'].join(' ')}>
                    {d.dia}
                  </span>
                </button>
                <button
                  className="flex-1 tabular-nums text-sm text-left"
                  style={{ color: colVal > 0 ? colColor : '#2a2a2a' }}
                  onClick={() => openAdd(d.dia, mobileCol)}
                >
                  {colVal > 0 ? BRL(colVal) : '—'}
                </button>
                <span className={['tabular-nums text-xs font-medium', d.saldo >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'].join(' ')}>
                  {BRL(d.saldo)}
                </span>
                <button onClick={() => openAdd(d.dia, mobileCol)} className="text-[#0EA5E9] shrink-0">
                  <Plus size={14} />
                </button>
              </div>

              {isExpanded && dayItemsFiltered.map(item => (
                <MobileItemRows
                  key={item.id}
                  node={item}
                  depth={0}
                  expandedItems={expandedItems}
                  toggleItem={toggleItem}
                  onEdit={setEditingItem}
                  onDelete={deleteLancamento}
                  onAddChild={parent => openAdd(d.dia, parent.natureza, parent.id, (parent.saida_tipo as SaidaTipo) ?? 'fixa')}
                  onTogglePago={togglePago}
                  editingDiarioId={editingDiarioId}
                  editingValue={editingValue}
                  onEditDiario={(id, val) => { setEditingDiarioId(id); setEditingValue(String(val)) }}
                  onEditDiarioChange={setEditingValue}
                  onSaveDiario={saveDiario}
                />
              ))}
            </div>
          )
        })}
      </div>
      </>) : (
        <ExtratoView trees={trees} />
      )}

      {/* ── Add modal (overlay — desktop e mobile) ── */}
      {addingToDay !== null && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
          onClick={() => setAddingToDay(null)}
        >
          <div
            className="bg-bg-2 border border-line rounded-xl p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-white font-[Sora]">
                Adicionar · Dia {addingToDay}
              </div>
              <button onClick={() => setAddingToDay(null)} className="text-[#555] hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
            <AddPanel
              form={addForm}
              onChange={setAddForm}
              categorias={categorias}
              cartoes={cartoes}
              categoriasRapidas={categoriasRapidas}
              onAdd={() => addLancamento(addingToDay)}
              onCancel={() => setAddingToDay(null)}
              saving={saving}
              dia={addingToDay}
              anoAno={ano.ano}
              monthNum={month}
              onQuickLaunch={quickLaunch}
              onAddQuickCat={addQuickCat}
            />
          </div>
        </div>
      )}

      {/* ── Edit modal ── */}
      {editingItem && (
        <EditModal
          item={editingItem}
          categorias={categorias}
          cartoes={cartoes}
          onSave={saveEdit}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ItemRows — árvore recursiva com editar, deletar e adicionar subitem
// ─────────────────────────────────────────────────────────────────────────────

interface ItemRowsProps {
  node: FinLancamentoTree
  depth: number
  expandedItems: Set<string>
  toggleItem: (id: string) => void
  onEdit: (item: FinLancamento) => void
  onDelete: (id: string) => void
  onAddChild: (parent: FinLancamentoTree) => void
  onTogglePago: (id: string, pago: boolean) => Promise<void>
  editingDiarioId: string | null
  editingValue: string
  onEditDiario: (id: string, currentVal: number) => void
  onEditDiarioChange: (v: string) => void
  onSaveDiario: (id: string) => Promise<void>
}

function ItemRows({ node, depth, expandedItems, toggleItem, onEdit, onDelete, onAddChild, onTogglePago, editingDiarioId, editingValue, onEditDiario, onEditDiarioChange, onSaveDiario }: ItemRowsProps) {
  const isExpanded = expandedItems.has(node.id)
  const natColor   = node.natureza === 'entrada' ? '#22c55e' : node.natureza === 'saida' ? '#ef4444' : '#f97316'
  const pl         = 8 + depth * 20
  const isSaida    = node.natureza === 'saida'
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmPos, setConfirmPos]   = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!showConfirm) return
    function handle() { setShowConfirm(false) }
    document.addEventListener('click', handle)
    return () => document.removeEventListener('click', handle)
  }, [showConfirm])

  return (
    <>
      <tr className="group hover:bg-[#0d0d0d]">
        {/* Expand toggle */}
        <td className="py-1.5" style={{ paddingLeft: pl }}>
          {node.is_grupo ? (
            <button onClick={() => toggleItem(node.id)} className="text-[#444] hover:text-white transition-colors">
              {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </button>
          ) : (
            <span className="w-3 inline-block" />
          )}
        </td>

        {/* Nome + badges */}
        <td
          className="py-1.5 px-2 text-xs text-[#aaa]"
          colSpan={3}
          onClick={isSaida ? (e) => { e.stopPropagation(); setConfirmPos({ x: e.clientX, y: e.clientY }); setShowConfirm(true) } : undefined}
          style={isSaida ? { cursor: 'pointer' } : undefined}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {node.pago && (
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', flexShrink: 0, display: 'inline-block' }} />
            )}
            <span style={{ opacity: node.pago ? 0.45 : 1 }}>{node.nome}</span>
          </span>
          {node.saida_tipo === 'cartao' && (
            <span className="ml-2 text-[9px] text-[#a78bfa] border border-[#a78bfa]/30 rounded px-1 py-0.5">cartão</span>
          )}
          {node.saida_tipo === 'fixa' && (
            <span className="ml-2 text-[9px] text-[#ef4444]/60 border border-[#ef4444]/20 rounded px-1 py-0.5">fixa</span>
          )}
        </td>

        {/* Valor */}
        <td className="py-1.5 px-2 text-right text-xs tabular-nums" style={{ opacity: node.pago ? 0.45 : 1 }}>
          {node.natureza === 'diario' && !node.is_grupo ? (
            editingDiarioId === node.id ? (
              <input
                autoFocus
                type="number"
                value={editingValue}
                onChange={e => onEditDiarioChange(e.target.value)}
                onBlur={() => onSaveDiario(node.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') onSaveDiario(node.id)
                  if (e.key === 'Escape') onEditDiarioChange('')
                }}
                style={{
                  width: 90, background: 'transparent', border: 'none',
                  borderBottom: '1px solid #0ea5e9', color: '#f59e0b',
                  fontSize: 12, textAlign: 'right', outline: 'none', fontFamily: 'inherit',
                }}
              />
            ) : (
              <span
                onClick={() => onEditDiario(node.id, node.valor ?? 0)}
                style={{
                  color: node.is_previsao ? '#4b5563' : '#f59e0b',
                  fontStyle: node.is_previsao ? 'italic' : 'normal',
                  cursor: 'pointer',
                  borderBottom: '1px dashed #262626',
                }}
                title={node.is_previsao ? 'Clique para registrar o gasto real' : 'Clique para editar'}
              >
                {BRL(node.valor ?? 0)}
              </span>
            )
          ) : (
            <span style={{ color: natColor }}>{BRL(node.valorTotal)}</span>
          )}
        </td>

        {/* Actions (hover) */}
        <td className="py-1.5 px-2">
          <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(node)}
              className="text-[#444] hover:text-[#0EA5E9] transition-colors"
              title="Editar"
            >
              <Pencil size={11} />
            </button>
            {node.is_grupo && (
              <button
                onClick={() => onAddChild(node)}
                className="text-[#444] hover:text-[#0EA5E9] transition-colors"
                title="Adicionar subitem"
              >
                <Plus size={11} />
              </button>
            )}
            <button
              onClick={() => onDelete(node.id)}
              className="text-[#444] hover:text-[#ef4444] transition-colors"
              title="Excluir"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </td>
      </tr>

      {showConfirm && createPortal(
        <div
          style={{
            position: 'fixed',
            top: Math.max(10, confirmPos.y - 70),
            left: Math.min(confirmPos.x - 20, window.innerWidth - 260),
            background: '#1a1a1a',
            border: '1px solid #1f1f1f',
            borderRadius: 12,
            padding: '14px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,.5)',
            zIndex: 200,
            minWidth: 220,
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5', marginBottom: 10 }}>
            {node.pago ? 'Marcar como pendente?' : 'Confirmar pagamento?'}
          </div>
          <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 12 }}>
            {node.nome} — {BRL(node.valor ?? 0)}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={async () => { await onTogglePago(node.id, !node.pago); setShowConfirm(false) }}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 8, border: 'none',
                background: node.pago ? '#2a1210' : '#0d2818',
                color: node.pago ? '#f87171' : '#4ade80',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {node.pago ? 'Marcar pendente' : 'Confirmar pago'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              style={{
                padding: '7px 12px', borderRadius: 8,
                border: '1px solid #262626', background: 'transparent',
                color: '#4b5563', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Children */}
      {isExpanded && (
        <>
          {node.children.map(child => (
            <ItemRows
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedItems={expandedItems}
              toggleItem={toggleItem}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onTogglePago={onTogglePago}
              editingDiarioId={editingDiarioId}
              editingValue={editingValue}
              onEditDiario={onEditDiario}
              onEditDiarioChange={onEditDiarioChange}
              onSaveDiario={onSaveDiario}
            />
          ))}

          {/* Add child row — sempre visível quando expandido */}
          <tr>
            <td colSpan={6} style={{ paddingLeft: pl + 20 }} className="pb-2">
              <button
                onClick={() => onAddChild(node)}
                className="flex items-center gap-1 text-[11px] text-[#0EA5E9]/50 hover:text-[#0EA5E9] transition-colors"
              >
                <Plus size={10} />
                <span>item em <em className="not-italic text-[#0EA5E9]/80">{node.nome}</em></span>
              </button>
            </td>
          </tr>
        </>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MobileItemRows — versão mobile do ItemRows (divs ao invés de tr/td)
// ─────────────────────────────────────────────────────────────────────────────

function MobileItemRows({ node, depth, expandedItems, toggleItem, onEdit, onDelete, onAddChild, onTogglePago, editingDiarioId, editingValue, onEditDiario, onEditDiarioChange, onSaveDiario }: ItemRowsProps) {
  const isExpanded = expandedItems.has(node.id)
  const natColor   = node.natureza === 'entrada' ? '#22c55e' : node.natureza === 'saida' ? '#ef4444' : '#f97316'
  const pl         = depth * 14
  const isSaida    = node.natureza === 'saida'
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmPos, setConfirmPos]   = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!showConfirm) return
    function handle() { setShowConfirm(false) }
    document.addEventListener('click', handle)
    return () => document.removeEventListener('click', handle)
  }, [showConfirm])

  return (
    <>
      <div className="flex items-center gap-2 py-2 border-t border-line/60" style={{ paddingLeft: pl }}>
        {node.is_grupo ? (
          <button onClick={() => toggleItem(node.id)} className="text-[#444] shrink-0">
            {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
        ) : (
          <span className="w-[11px] shrink-0" />
        )}
        <span
          className="flex-1 text-xs text-[#aaa] truncate"
          onClick={isSaida ? (e) => { e.stopPropagation(); setConfirmPos({ x: e.clientX, y: e.clientY }); setShowConfirm(true) } : undefined}
          style={isSaida ? { cursor: 'pointer' } : undefined}
        >
          {node.pago && (
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
          )}
          <span style={{ opacity: node.pago ? 0.45 : 1 }}>{node.nome}</span>
        </span>
        <span className="text-xs tabular-nums shrink-0" style={{ opacity: node.pago ? 0.45 : 1 }}>
          {node.natureza === 'diario' && !node.is_grupo ? (
            editingDiarioId === node.id ? (
              <input
                autoFocus
                type="number"
                value={editingValue}
                onChange={e => onEditDiarioChange(e.target.value)}
                onBlur={() => onSaveDiario(node.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') onSaveDiario(node.id)
                  if (e.key === 'Escape') onEditDiarioChange('')
                }}
                style={{
                  width: 80, background: 'transparent', border: 'none',
                  borderBottom: '1px solid #0ea5e9', color: '#f59e0b',
                  fontSize: 12, textAlign: 'right', outline: 'none', fontFamily: 'inherit',
                }}
              />
            ) : (
              <span
                onClick={() => onEditDiario(node.id, node.valor ?? 0)}
                style={{
                  color: node.is_previsao ? '#4b5563' : '#f59e0b',
                  fontStyle: node.is_previsao ? 'italic' : 'normal',
                  cursor: 'pointer', borderBottom: '1px dashed #2a2a2a',
                }}
              >
                {BRL(node.valor ?? 0)}
              </span>
            )
          ) : (
            <span style={{ color: natColor }}>{BRL(node.valorTotal)}</span>
          )}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onEdit(node)} className="text-[#444]"><Pencil size={11} /></button>
          {node.is_grupo && (
            <button onClick={() => onAddChild(node)} className="text-[#444]"><Plus size={11} /></button>
          )}
          <button onClick={() => onDelete(node.id)} className="text-[#444]"><Trash2 size={11} /></button>
        </div>
      </div>

      {showConfirm && createPortal(
        <div
          style={{
            position: 'fixed',
            top: Math.max(10, confirmPos.y - 70),
            left: Math.min(confirmPos.x - 20, window.innerWidth - 260),
            background: '#1a1a1a',
            border: '1px solid #1f1f1f',
            borderRadius: 12,
            padding: '14px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,.5)',
            zIndex: 200,
            minWidth: 220,
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5', marginBottom: 10 }}>
            {node.pago ? 'Marcar como pendente?' : 'Confirmar pagamento?'}
          </div>
          <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 12 }}>
            {node.nome} — {BRL(node.valor ?? 0)}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={async () => { await onTogglePago(node.id, !node.pago); setShowConfirm(false) }}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 8, border: 'none',
                background: node.pago ? '#2a1210' : '#0d2818',
                color: node.pago ? '#f87171' : '#4ade80',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {node.pago ? 'Marcar pendente' : 'Confirmar pago'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              style={{
                padding: '7px 12px', borderRadius: 8,
                border: '1px solid #262626', background: 'transparent',
                color: '#4b5563', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>,
        document.body
      )}

      {isExpanded && node.children.map(child => (
        <MobileItemRows
          key={child.id}
          node={child}
          depth={depth + 1}
          expandedItems={expandedItems}
          toggleItem={toggleItem}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
          onTogglePago={onTogglePago}
          editingDiarioId={editingDiarioId}
          editingValue={editingValue}
          onEditDiario={onEditDiario}
          onEditDiarioChange={onEditDiarioChange}
          onSaveDiario={onSaveDiario}
        />
      ))}
    </>
  )
}
