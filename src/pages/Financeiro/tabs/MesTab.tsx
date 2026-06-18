// src/pages/Financeiro/tabs/MesTab.tsx
// v2 — editar lançamentos, subitens em grupos, clique por coluna, nova cat rápida, cards de resumo

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, ChevronDown, ChevronRight, Trash2, Pencil, X } from 'lucide-react'
import type {
  FinAno, FinLancamento, FinLancamentoTree,
  FinCategoria, FinCartao, DiaTotais, Natureza, SaidaTipo,
} from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────────────────────────────────────

const MS_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MS_OPT  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function buildTree(items: FinLancamento[]): FinLancamentoTree[] {
  const map = new Map<string, FinLancamentoTree>()
  for (const item of items) map.set(item.id, { ...item, children: [], valorTotal: 0 })
  const roots: FinLancamentoTree[] = []
  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  function calc(node: FinLancamentoTree): number {
    if (!node.is_grupo) { node.valorTotal = node.valor ?? 0; return node.valorTotal }
    node.valorTotal = node.children.reduce((s, c) => s + calc(c), 0)
    return node.valorTotal
  }
  roots.forEach(calc)
  return roots
}

function sumLeaves(node: FinLancamentoTree): number {
  if (!node.is_grupo) return node.valor ?? 0
  return node.children.reduce((s, c) => s + sumLeaves(c), 0)
}

// ─────────────────────────────────────────────────────────────────────────────
// AddForm type
// ─────────────────────────────────────────────────────────────────────────────

interface AddForm {
  natureza: Natureza
  saida_tipo: SaidaTipo
  nome: string
  valor: string
  categoria_id: string
  cartao_id: string
  is_grupo: boolean
  parent_id: string | null
  repetir: boolean
  repeticao_freq: 'mensal' | 'quinzenal' | 'semanal'
  repeticao_ate: string
}

function defaultForm(nat: Natureza = 'diario', parentId: string | null = null, st: SaidaTipo = 'fixa'): AddForm {
  return {
    natureza: nat, saida_tipo: st, nome: '', valor: '', categoria_id: '', cartao_id: '',
    is_grupo: false, parent_id: parentId,
    repetir: false, repeticao_freq: 'mensal', repeticao_ate: '',
  }
}

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
  const [addForm, setAddForm]           = useState<AddForm>(defaultForm())
  const [saving, setSaving]             = useState(false)
  const [mobileCol, setMobileCol]       = useState<Natureza>('diario')

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
    setLancamentos((rows ?? []) as FinLancamento[])

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
    setLoading(false)
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
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="bg-[#111111] border border-[#1f1f1f] text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-[#0EA5E9]/60"
        >
          {MS_OPT.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <span className="text-[#555] text-sm">{MS_FULL[month - 1]} · {ano.ano}</span>
        <span className="ml-auto text-xs text-[#555]">
          Abertura: <span className="text-white tabular-nums">{BRL(saldoAbertura)}</span>
        </span>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Entradas',  value: totE, color: '#22c55e' },
          { label: 'Saídas',   value: totS, color: '#ef4444' },
          { label: 'Diário',   value: totD, color: '#f97316' },
          { label: 'Resultado',value: res,  color: res >= 0 ? '#22c55e' : '#ef4444' },
        ].map(c => (
          <div key={c.label} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-3.5 relative">
            <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full" style={{ background: c.color }} />
            <div className="text-[10px] text-[#555] uppercase tracking-wider font-[Sora] mb-1.5">{c.label}</div>
            <div className="text-sm font-bold tabular-nums" style={{ color: c.color }}>{BRL(c.value)}</div>
          </div>
        ))}
      </div>

      {/* ── Mobile column toggle ── */}
      <div className="flex sm:hidden gap-1 mb-4">
        {(['entrada','saida','diario'] as Natureza[]).map(col => (
          <button
            key={col}
            onClick={() => setMobileCol(col)}
            className={[
              'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
              mobileCol === col ? 'border-[#0EA5E9]/50 text-[#0EA5E9]' : 'border-[#1f1f1f] text-[#555]',
            ].join(' ')}
          >
            {col === 'entrada' ? 'Entrada' : col === 'saida' ? 'Saída' : 'Diário'}
          </button>
        ))}
      </div>

      {/* ── PC TABLE ── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-[10px] text-[#555] uppercase tracking-wider select-none">
              <th className="text-left py-2 px-2 w-12">Dia</th>
              <th className="text-right py-2 px-3 text-[#22c55e]/60" title="Clique na célula para adicionar">Entrada ↓</th>
              <th className="text-right py-2 px-3 text-[#ef4444]/60" title="Clique na célula para adicionar">Saída ↓</th>
              <th className="text-right py-2 px-3 text-[#f97316]/60" title="Clique na célula para adicionar">Diário ↓</th>
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
                    className={['border-t border-[#1f1f1f] group', isToday ? 'bg-[#0EA5E9]/5' : ''].join(' ')}
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
                    />
                  ))}

                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE LIST ── */}
      <div className="sm:hidden divide-y divide-[#1f1f1f]">
        {days.map(d => {
          const colVal   = mobileCol === 'entrada' ? d.entrada : mobileCol === 'saida' ? d.saida : d.diario
          const colColor = mobileCol === 'entrada' ? '#22c55e' : mobileCol === 'saida' ? '#ef4444' : '#f97316'
          const isToday  = isCurrentMonth && d.dia === today.getDate()

          return (
            <div key={d.dia} className={['flex items-center gap-3 py-2.5', isToday ? 'bg-[#0EA5E9]/5' : ''].join(' ')}>
              <span className={['w-8 text-sm tabular-nums font-medium text-center shrink-0', isToday ? 'text-[#0EA5E9]' : 'text-[#666]'].join(' ')}>
                {d.dia}
              </span>
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
              <button onClick={() => openAdd(d.dia)} className="text-[#0EA5E9] shrink-0">
                <Plus size={14} />
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Add modal (overlay — desktop e mobile) ── */}
      {addingToDay !== null && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
          onClick={() => setAddingToDay(null)}
        >
          <div
            className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto"
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
}

function ItemRows({ node, depth, expandedItems, toggleItem, onEdit, onDelete, onAddChild }: ItemRowsProps) {
  const isExpanded = expandedItems.has(node.id)
  const natColor   = node.natureza === 'entrada' ? '#22c55e' : node.natureza === 'saida' ? '#ef4444' : '#f97316'
  const pl         = 8 + depth * 20

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
        <td className="py-1.5 px-2 text-xs text-[#aaa]" colSpan={3}>
          <span>{node.nome}</span>
          {node.saida_tipo === 'cartao' && (
            <span className="ml-2 text-[9px] text-[#a78bfa] border border-[#a78bfa]/30 rounded px-1 py-0.5">cartão</span>
          )}
          {node.saida_tipo === 'fixa' && (
            <span className="ml-2 text-[9px] text-[#ef4444]/60 border border-[#ef4444]/20 rounded px-1 py-0.5">fixa</span>
          )}
        </td>

        {/* Valor */}
        <td className="py-1.5 px-2 text-right text-xs tabular-nums" style={{ color: natColor }}>
          {BRL(node.valorTotal)}
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
// EditModal — edição completa de qualquer lançamento
// ─────────────────────────────────────────────────────────────────────────────

interface EditFormState {
  nome: string
  valor: string
  data: string
  natureza: Natureza
  saida_tipo: SaidaTipo
  cartao_id: string
  categoria_id: string
}

interface EditModalProps {
  item: FinLancamento
  categorias: FinCategoria[]
  cartoes: FinCartao[]
  onSave: (form: EditFormState) => Promise<void>
  onClose: () => void
}

function EditModal({ item, categorias, cartoes, onSave, onClose }: EditModalProps) {
  const [form, setForm] = useState<EditFormState>({
    nome:         item.nome,
    valor:        String(item.valor ?? ''),
    data:         item.data,
    natureza:     item.natureza,
    saida_tipo:   (item.saida_tipo as SaidaTipo) ?? 'fixa',
    cartao_id:    item.cartao_id ?? '',
    categoria_id: item.categoria_id ?? '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k: keyof EditFormState, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handle() {
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const filteredCats = categorias.filter(c => c.natureza === form.natureza)

  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 w-full max-w-sm space-y-3.5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white font-[Sora]">Editar lançamento</div>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Nome */}
        <input
          value={form.nome}
          onChange={e => set('nome', e.target.value)}
          placeholder="Nome"
          className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#0EA5E9]/60"
        />

        {/* Data */}
        <div>
          <div className="text-[10px] text-[#555] mb-1.5">Data</div>
          <input
            type="date"
            value={form.data}
            onChange={e => set('data', e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#0EA5E9]/60"
          />
        </div>

        <input
          value={form.valor}
          onChange={e => set('valor', e.target.value)}
          placeholder="Valor"
          className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#0EA5E9]/60 tabular-nums"
        />

        {/* Natureza (somente raízes) */}
        {!item.parent_id && (
          <div>
            <div className="text-[10px] text-[#555] mb-1.5">Natureza</div>
            <div className="flex gap-1">
              {(['entrada','saida','diario'] as Natureza[]).map(n => (
                <button
                  key={n}
                  onClick={() => set('natureza', n)}
                  className={[
                    'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                    form.natureza === n ? 'border-[#0EA5E9]/50 text-[#0EA5E9]' : 'border-[#1f1f1f] text-[#555] hover:text-white',
                  ].join(' ')}
                >
                  {n === 'entrada' ? 'Entrada' : n === 'saida' ? 'Saída' : 'Diário'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Saída tipo */}
        {form.natureza === 'saida' && (
          <div>
            <div className="text-[10px] text-[#555] mb-1.5">Tipo</div>
            <div className="flex gap-1">
              {(['fixa','cartao'] as SaidaTipo[]).map(t => (
                <button
                  key={t}
                  onClick={() => set('saida_tipo', t)}
                  className={[
                    'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                    form.saida_tipo === t ? 'border-[#a78bfa]/50 text-[#a78bfa]' : 'border-[#1f1f1f] text-[#555] hover:text-white',
                  ].join(' ')}
                >
                  {t === 'fixa' ? 'Fixa' : 'Cartão'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cartão */}
        {form.natureza === 'saida' && form.saida_tipo === 'cartao' && (
          <select
            value={form.cartao_id}
            onChange={e => set('cartao_id', e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white outline-none"
          >
            <option value="">Selecione o cartão</option>
            {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        )}

        {/* Categoria */}
        {filteredCats.length > 0 && (
          <select
            value={form.categoria_id}
            onChange={e => set('categoria_id', e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white outline-none"
          >
            <option value="">Sem categoria</option>
            {filteredCats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#555] border border-[#1f1f1f] rounded-lg hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handle}
            disabled={saving || !form.nome.trim()}
            className="flex-1 py-2 text-sm font-medium bg-[#0EA5E9] text-black rounded-lg hover:bg-[#38bdf8] disabled:opacity-40 transition-colors"
          >
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AddPanel — formulário de adição + atalhos rápidos + nova categoria rápida
// ─────────────────────────────────────────────────────────────────────────────

interface AddPanelProps {
  form: AddForm
  onChange: (f: AddForm) => void
  categorias: FinCategoria[]
  cartoes: FinCartao[]
  categoriasRapidas: FinCategoria[]
  onAdd: () => void
  onCancel: () => void
  saving: boolean
  dia: number
  anoAno: number
  monthNum: number
  onQuickLaunch: (dia: number, cat: FinCategoria, nome: string, valor: string) => void
  onAddQuickCat: (nome: string, cor?: string) => Promise<void>
}

function AddPanel({
  form, onChange, categorias, cartoes, categoriasRapidas,
  onAdd, onCancel, saving, dia, anoAno, monthNum, onQuickLaunch, onAddQuickCat,
}: AddPanelProps) {
  const [quickNome, setQuickNome]       = useState('')
  const [quickValor, setQuickValor]     = useState('')
  const [quickCat, setQuickCat]         = useState<FinCategoria | null>(null)
  const [showNewCat, setShowNewCat]     = useState(false)
  const [newCatNome, setNewCatNome]     = useState('')
  const [newCatCor, setNewCatCor]       = useState('#f97316')
  const [savingCat, setSavingCat]       = useState(false)

  const set = (k: keyof AddForm, v: unknown) => onChange({ ...form, [k]: v })

  const repeticaoCount = useMemo(() => {
    if (!form.repetir || !form.repeticao_ate) return 1
    const base = new Date(`${anoAno}-${String(monthNum).padStart(2,'0')}-${String(dia).padStart(2,'0')}`)
    const ate = new Date(form.repeticao_ate)
    let count = 0
    let current = new Date(base)
    while (current <= ate) {
      count++
      if (form.repeticao_freq === 'mensal') {
        current = new Date(current.getFullYear(), current.getMonth() + 1, current.getDate())
      } else if (form.repeticao_freq === 'quinzenal') {
        current = new Date(current.getTime() + 14 * 24 * 60 * 60 * 1000)
      } else {
        current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000)
      }
    }
    return count
  }, [form.repetir, form.repeticao_ate, form.repeticao_freq, anoAno, monthNum, dia])

  async function saveNewCat() {
    if (!newCatNome.trim()) return
    setSavingCat(true)
    await onAddQuickCat(newCatNome, newCatCor)
    setNewCatNome('')
    setShowNewCat(false)
    setSavingCat(false)
  }

  function fireQuick() {
    if (!quickCat || !quickValor.trim()) return
    onQuickLaunch(dia, quickCat, quickNome || quickCat.nome, quickValor)
    setQuickNome('')
    setQuickValor('')
    setQuickCat(null)
  }

  return (
    <div className="space-y-4">
      {/* ── Quick diary ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] text-[#555] uppercase tracking-wider">Diário rápido</div>
          <button
            onClick={() => setShowNewCat(v => !v)}
            className="flex items-center gap-0.5 text-[10px] text-[#0EA5E9]/60 hover:text-[#0EA5E9] transition-colors"
          >
            <Plus size={10} /> nova categoria
          </button>
        </div>

        {/* New quick cat form */}
        {showNewCat && (
          <div className="flex gap-2 mb-2">
            <input
              placeholder="Nome da categoria"
              value={newCatNome}
              onChange={e => setNewCatNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveNewCat()}
              className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-[#0EA5E9]/60"
            />
            <input
              type="color"
              value={newCatCor}
              onChange={e => setNewCatCor(e.target.value)}
              className="w-9 h-7 bg-[#0a0a0a] border border-[#1f1f1f] rounded cursor-pointer p-0.5"
            />
            <button
              onClick={saveNewCat}
              disabled={savingCat || !newCatNome.trim()}
              className="px-2.5 py-1 text-xs bg-[#0EA5E9] text-black rounded-lg hover:bg-[#38bdf8] disabled:opacity-40"
            >
              {savingCat ? '…' : 'OK'}
            </button>
          </div>
        )}

        {/* Quick cat buttons */}
        <div className="flex gap-2 flex-wrap">
          {categoriasRapidas.map(cat => (
            <button
              key={cat.id}
              onClick={() => setQuickCat(quickCat?.id === cat.id ? null : cat)}
              style={cat.cor ? {
                borderColor: quickCat?.id === cat.id ? cat.cor + '80' : '#1f1f1f',
                color: quickCat?.id === cat.id ? cat.cor : '#666',
              } : {}}
              className={[
                'px-2.5 py-1 text-xs rounded-lg border transition-colors',
                !cat.cor && (quickCat?.id === cat.id
                  ? 'border-[#0EA5E9]/50 text-[#0EA5E9]'
                  : 'border-[#1f1f1f] text-[#666] hover:text-white'),
              ].join(' ')}
            >
              {cat.nome}
            </button>
          ))}
        </div>

        {/* Quick launch inputs */}
        {quickCat && (
          <div className="flex gap-2 mt-2">
            <input
              placeholder={quickCat.nome}
              value={quickNome}
              onChange={e => setQuickNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fireQuick()}
              className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60"
            />
            <input
              placeholder="R$ 0,00"
              value={quickValor}
              onChange={e => setQuickValor(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fireQuick()}
              className="w-28 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60 tabular-nums"
              autoFocus
            />
            <button
              onClick={fireQuick}
              disabled={!quickValor.trim()}
              className="bg-[#0EA5E9] text-black text-xs font-semibold px-3 rounded-lg hover:bg-[#38bdf8] disabled:opacity-40 transition-colors"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* ── Full form ── */}
      <div className="border-t border-[#1f1f1f] pt-4">
        <div className="text-[10px] text-[#555] uppercase tracking-wider mb-3">
          {form.parent_id ? '↳ Subitem do grupo' : 'Lançamento'}
        </div>

        {/* Natureza (hide for subitems) */}
        {!form.parent_id && (
          <div className="flex gap-1 mb-3">
            {(['entrada','saida','diario'] as Natureza[]).map(n => (
              <button
                key={n}
                onClick={() => set('natureza', n)}
                className={[
                  'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                  form.natureza === n ? 'border-[#0EA5E9]/50 text-[#0EA5E9]' : 'border-[#1f1f1f] text-[#555] hover:text-white',
                ].join(' ')}
              >
                {n === 'entrada' ? 'Entrada' : n === 'saida' ? 'Saída' : 'Diário'}
              </button>
            ))}
          </div>
        )}

        {/* Saída tipo */}
        {form.natureza === 'saida' && (
          <div className="flex gap-1 mb-3">
            {(['fixa','cartao'] as SaidaTipo[]).map(t => (
              <button
                key={t}
                onClick={() => set('saida_tipo', t)}
                className={[
                  'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                  form.saida_tipo === t ? 'border-[#a78bfa]/50 text-[#a78bfa]' : 'border-[#1f1f1f] text-[#555] hover:text-white',
                ].join(' ')}
              >
                {t === 'fixa' ? 'Fixa' : 'Cartão'}
              </button>
            ))}
          </div>
        )}

        {/* Cartão */}
        {form.natureza === 'saida' && form.saida_tipo === 'cartao' && (
          <select
            value={form.cartao_id}
            onChange={e => set('cartao_id', e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none mb-2"
          >
            <option value="">Selecione o cartão</option>
            {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        )}

        {/* Nome + Valor */}
        <div className="flex gap-2 mb-2">
          <input
            placeholder="Nome"
            value={form.nome}
            onChange={e => set('nome', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onAdd()}
            autoFocus
            className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60"
          />
          {!form.is_grupo && (
            <input
              placeholder="R$ 0,00"
              value={form.valor}
              onChange={e => set('valor', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onAdd()}
              className="w-28 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60 tabular-nums"
            />
          )}
        </div>

        {/* Categoria */}
        {categorias.filter(c => c.natureza === form.natureza).length > 0 && (
          <select
            value={form.categoria_id}
            onChange={e => set('categoria_id', e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none mb-2"
          >
            <option value="">Sem categoria</option>
            {categorias.filter(c => c.natureza === form.natureza).map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        )}

        {/* Grupo toggle */}
        <label className="flex items-center gap-2 text-xs text-[#555] cursor-pointer mb-3 select-none">
          <input
            type="checkbox"
            checked={form.is_grupo}
            onChange={e => set('is_grupo', e.target.checked)}
            className="accent-[#0EA5E9]"
          />
          Criar como grupo (soma dos subitens)
        </label>

        {/* Recorrência */}
        <div className="border-t border-[#1f1f1f] pt-3 mb-3">
          <label className="flex items-center gap-2 text-xs text-[#555] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.repetir}
              onChange={e => set('repetir', e.target.checked)}
              className="accent-[#0EA5E9]"
            />
            Repetir este lançamento
          </label>

          {form.repetir && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-1">
                {(['mensal','quinzenal','semanal'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => set('repeticao_freq', f)}
                    className={[
                      'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                      form.repeticao_freq === f
                        ? 'border-[#0EA5E9]/50 text-[#0EA5E9]'
                        : 'border-[#1f1f1f] text-[#555] hover:text-white',
                    ].join(' ')}
                  >
                    {f === 'mensal' ? 'Mensal' : f === 'quinzenal' ? 'Quinzenal' : 'Semanal'}
                  </button>
                ))}
              </div>
              <div>
                <div className="text-[10px] text-[#555] mb-1">Repetir até</div>
                <input
                  type="date"
                  value={form.repeticao_ate}
                  onChange={e => set('repeticao_ate', e.target.value)}
                  min={`${anoAno}-01-01`}
                  max={`${anoAno}-12-31`}
                  className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm text-[#555] border border-[#1f1f1f] rounded-lg hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onAdd}
            disabled={saving || !form.nome.trim()}
            className="flex-1 py-1.5 text-sm font-medium bg-[#0EA5E9] text-black rounded-lg hover:bg-[#38bdf8] disabled:opacity-40 transition-colors"
          >
            {saving ? 'Salvando…' : form.repetir && form.repeticao_ate ? `Adicionar (${repeticaoCount}x)` : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}
