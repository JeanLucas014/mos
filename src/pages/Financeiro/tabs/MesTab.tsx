import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import type { FinAno, FinLancamento, FinLancamentoTree, FinCategoria, FinCartao, DiaTotais, Natureza, SaidaTipo } from '../types'

const MS_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MS_OPT  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// ── Algoritmo de árvore ──────────────────────────────────────────────────────

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

  function calcValue(node: FinLancamentoTree): number {
    if (!node.is_grupo) { node.valorTotal = node.valor ?? 0; return node.valorTotal }
    node.valorTotal = node.children.reduce((s, c) => s + calcValue(c), 0)
    return node.valorTotal
  }
  roots.forEach(calcValue)
  return roots
}

function sumLeaves(node: FinLancamentoTree): number {
  if (!node.is_grupo) return node.valor ?? 0
  return node.children.reduce((s, c) => s + sumLeaves(c), 0)
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

// ── Componente principal ─────────────────────────────────────────────────────

interface Props { ano: FinAno; initialMonth: number }

interface AddForm {
  natureza: Natureza
  saida_tipo: SaidaTipo
  nome: string
  valor: string
  categoria_id: string
  cartao_id: string
  is_grupo: boolean
  parent_id: string | null
}

const defaultForm = (): AddForm => ({
  natureza: 'diario', saida_tipo: 'fixa',
  nome: '', valor: '', categoria_id: '', cartao_id: '',
  is_grupo: false, parent_id: null,
})

export function MesTab({ ano, initialMonth }: Props) {
  const [month, setMonth] = useState(initialMonth)
  const [lancamentos, setLancamentos] = useState<FinLancamento[]>([])
  const [categorias, setCategorias] = useState<FinCategoria[]>([])
  const [cartoes, setCartoes] = useState<FinCartao[]>([])
  const [saldoAbertura, setSaldoAbertura] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set())
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'nome' | 'valor' } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [addingToDay, setAddingToDay] = useState<number | null>(null)
  const [addForm, setAddForm] = useState<AddForm>(defaultForm())
  const [saving, setSaving] = useState(false)
  const [mobileCol, setMobileCol] = useState<'entrada' | 'saida' | 'diario'>('diario')
  const editRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadAll() }, [ano.id, month])
  useEffect(() => { if (editingCell) editRef.current?.focus() }, [editingCell])

  async function loadAll() {
    setLoading(true)

    const [{ data: cats }, { data: cards }, { data: rows }] = await Promise.all([
      supabase.from('fin_categorias').select('*').order('ordem'),
      supabase.from('fin_cartoes').select('*').order('nome'),
      supabase.from('fin_lancamentos').select('*')
        .eq('ano_id', ano.id)
        .gte('data', `${ano.ano}-${String(month).padStart(2,'0')}-01`)
        .lte('data', `${ano.ano}-${String(month).padStart(2,'0')}-${daysInMonth(ano.ano, month)}`)
        .order('ordem'),
    ])

    setCategorias((cats ?? []) as FinCategoria[])
    setCartoes((cards ?? []) as FinCartao[])
    setLancamentos((rows ?? []) as FinLancamento[])

    // Calcular saldo_abertura: saldo_inicial + tudo antes deste mês
    const firstDay = `${ano.ano}-${String(month).padStart(2,'0')}-01`
    const { data: prev } = await supabase
      .from('fin_lancamentos')
      .select('natureza, valor, saida_tipo, is_grupo')
      .eq('ano_id', ano.id)
      .eq('is_grupo', false)
      .lt('data', firstDay)

    type PRow = { natureza: string; valor: number | null; saida_tipo: string | null; is_grupo: boolean }
    let abertura = Number(ano.saldo_inicial)
    for (const r of (prev ?? []) as PRow[]) {
      const v = Number(r.valor) || 0
      if (r.natureza === 'entrada') abertura += v
      else abertura -= v
    }
    setSaldoAbertura(abertura)
    setLoading(false)
  }

  // Construção da estrutura de dados
  const trees = buildTree(lancamentos)
  const byDay: Record<number, FinLancamentoTree[]> = {}
  for (const t of trees) {
    const d = new Date(t.data + 'T00:00:00').getDate()
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(t)
  }

  const total = daysInMonth(ano.ano, month)
  const days: DiaTotais[] = (() => {
    let saldo = saldoAbertura
    return Array.from({ length: total }, (_, i) => {
      const dia = i + 1
      const items = byDay[dia] ?? []
      let entrada = 0, saida = 0, diario = 0
      for (const t of items) {
        const v = sumLeaves(t)
        if (t.natureza === 'entrada') entrada += v
        else if (t.natureza === 'saida') saida += v
        else diario += v
      }
      saldo += entrada - saida - diario
      return { dia, entrada, saida, diario, saldo }
    })
  })()

  const categoriasRapidas = categorias.filter(c => c.rapida && c.natureza === 'diario')

  // Ações inline
  function startEdit(id: string, field: 'nome' | 'valor', current: string) {
    setEditingCell({ id, field })
    setEditValue(current)
  }

  async function commitEdit() {
    if (!editingCell) return
    const { id, field } = editingCell
    const update: Record<string, unknown> = {}
    if (field === 'nome') update.nome = editValue.trim()
    if (field === 'valor') update.valor = parseFloat(editValue.replace(',', '.')) || 0
    await (supabase.from('fin_lancamentos') as any).update(update).eq('id', id)
    setEditingCell(null)
    loadAll()
  }

  async function deleteLancamento(id: string) {
    if (!confirm('Excluir este lançamento?')) return
    await (supabase.from('fin_lancamentos') as any).delete().eq('id', id)
    loadAll()
  }

  async function addLancamento(dia: number) {
    const nome = addForm.nome.trim()
    if (!nome) return
    setSaving(true)

    const data = `${ano.ano}-${String(month).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    const isLeaf = !addForm.is_grupo
    const valor = isLeaf ? (parseFloat(addForm.valor.replace(',', '.')) || 0) : null

    await (supabase.from('fin_lancamentos') as any).insert({
      ano_id: ano.id,
      parent_id: addForm.parent_id || null,
      data,
      natureza: addForm.natureza,
      nome,
      valor,
      is_grupo: addForm.is_grupo,
      categoria_id: addForm.categoria_id || null,
      cartao_id: addForm.natureza === 'saida' && addForm.saida_tipo === 'cartao'
        ? addForm.cartao_id || null : null,
      saida_tipo: addForm.natureza === 'saida' ? addForm.saida_tipo : null,
    })

    setSaving(false)
    setAddingToDay(null)
    setAddForm(defaultForm())
    loadAll()
  }

  async function launchQuick(dia: number, cat: FinCategoria, nome: string, valor: string) {
    const v = parseFloat(valor.replace(',', '.'))
    if (!v || !nome.trim()) return
    const data = `${ano.ano}-${String(month).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    await (supabase.from('fin_lancamentos') as any).insert({
      ano_id: ano.id, data, natureza: 'diario', nome: nome.trim(),
      valor: v, is_grupo: false, categoria_id: cat.id,
    })
    loadAll()
  }

  function toggleDay(d: number) {
    setExpandedDays(prev => { const n = new Set(prev); n.has(d) ? n.delete(d) : n.add(d); return n })
  }
  function toggleItem(id: string) {
    setExpandedItems(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-5 h-5 rounded-full border-2 border-[#0EA5E9] border-t-transparent animate-spin" />
    </div>
  )

  // ── Render ──

  return (
    <div>
      {/* Month selector */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="bg-[#111111] border border-[#1f1f1f] text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-[#0EA5E9]/60"
        >
          {MS_OPT.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <span className="text-[#555] text-sm">{MS_FULL[month - 1]} {ano.ano}</span>
        <span className="ml-auto text-xs text-[#555]">
          Saldo abertura: <span className="text-white tabular-nums">{BRL(saldoAbertura)}</span>
        </span>
      </div>

      {/* Mobile column toggle */}
      <div className="flex sm:hidden gap-1 mb-4">
        {(['entrada','saida','diario'] as const).map(col => (
          <button
            key={col}
            onClick={() => setMobileCol(col)}
            className={[
              'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
              mobileCol === col
                ? 'border-[#0EA5E9]/50 text-[#0EA5E9] bg-[#0EA5E9]/8'
                : 'border-[#1f1f1f] text-[#555]',
            ].join(' ')}
          >
            {col === 'entrada' ? 'Entrada' : col === 'saida' ? 'Saída' : 'Diário'}
          </button>
        ))}
      </div>

      {/* PC TABLE */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-[10px] text-[#555] uppercase tracking-wider">
              <th className="text-left py-2 px-2 w-12">Dia</th>
              <th className="text-right py-2 px-2">Entrada</th>
              <th className="text-right py-2 px-2">Saída</th>
              <th className="text-right py-2 px-2">Diário</th>
              <th className="text-right py-2 px-2">Saldo</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {days.map(d => {
              const dayItems = byDay[d.dia] ?? []
              const isExpanded = expandedDays.has(d.dia)
              const hasData = dayItems.length > 0
              const today = new Date()
              const isToday = d.dia === today.getDate() && month === today.getMonth() + 1 && ano.ano === today.getFullYear()

              return (
                <>
                  {/* Day row */}
                  <tr
                    key={d.dia}
                    className={[
                      'border-t border-[#1f1f1f] group',
                      isToday ? 'bg-[#0EA5E9]/5' : 'hover:bg-[#111111]/60',
                    ].join(' ')}
                  >
                    <td className="py-2.5 px-2">
                      <button
                        onClick={() => hasData && toggleDay(d.dia)}
                        className="flex items-center gap-1 text-[#999] hover:text-white transition-colors"
                        disabled={!hasData}
                      >
                        {hasData
                          ? isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                          : <span className="w-3" />}
                        <span className={['tabular-nums font-medium', isToday ? 'text-[#0EA5E9]' : ''].join(' ')}>
                          {d.dia}
                        </span>
                      </button>
                    </td>
                    <td className="py-2.5 px-2 text-right tabular-nums text-[#22c55e]">
                      {d.entrada > 0 ? BRL(d.entrada) : <span className="text-[#333]">—</span>}
                    </td>
                    <td className="py-2.5 px-2 text-right tabular-nums text-[#ef4444]">
                      {d.saida > 0 ? BRL(d.saida) : <span className="text-[#333]">—</span>}
                    </td>
                    <td className="py-2.5 px-2 text-right tabular-nums text-[#f97316]">
                      {d.diario > 0 ? (
                        <span title={`${dayItems.filter(i => i.natureza === 'diario').length} item(s)`}>
                          {BRL(d.diario)} {dayItems.some(i => i.natureza === 'diario') && '···'}
                        </span>
                      ) : <span className="text-[#333]">—</span>}
                    </td>
                    <td className={['py-2.5 px-2 text-right tabular-nums font-medium', d.saldo >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'].join(' ')}>
                      {BRL(d.saldo)}
                    </td>
                    <td className="py-2.5 px-2">
                      <button
                        onClick={() => { setAddingToDay(d.dia); setAddForm(defaultForm()) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[#0EA5E9] hover:text-white"
                      >
                        <Plus size={14} />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded items */}
                  {isExpanded && dayItems.map(item => (
                    <ItemRows
                      key={item.id}
                      node={item}
                      depth={0}
                      expandedItems={expandedItems}
                      toggleItem={toggleItem}
                      editingCell={editingCell}
                      editValue={editValue}
                      editRef={editRef}
                      onStartEdit={startEdit}
                      onEditChange={setEditValue}
                      onCommit={commitEdit}
                      onDelete={deleteLancamento}
                    />
                  ))}

                  {/* Add form inline */}
                  {addingToDay === d.dia && (
                    <tr className="bg-[#111111]">
                      <td colSpan={6} className="p-3">
                        <AddPanel
                          form={addForm}
                          onChange={setAddForm}

                          cartoes={cartoes}
                          categoriasRapidas={categoriasRapidas}
                          onAdd={() => addLancamento(d.dia)}
                          onCancel={() => setAddingToDay(null)}
                          saving={saving}
                          dia={d.dia}
                          onQuickLaunch={launchQuick}
                        />
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE LIST */}
      <div className="sm:hidden space-y-1">
        {days.map(d => {
          const colVal = mobileCol === 'entrada' ? d.entrada : mobileCol === 'saida' ? d.saida : d.diario
          const colColor = mobileCol === 'entrada' ? '#22c55e' : mobileCol === 'saida' ? '#ef4444' : '#f97316'
          const today = new Date()
          const isToday = d.dia === today.getDate() && month === today.getMonth() + 1 && ano.ano === today.getFullYear()

          return (
            <div key={d.dia} className={['border-b border-[#1f1f1f] py-2.5 flex items-center gap-3', isToday ? 'bg-[#0EA5E9]/5' : ''].join(' ')}>
              <span className={['w-8 text-sm tabular-nums font-medium text-center', isToday ? 'text-[#0EA5E9]' : 'text-[#666]'].join(' ')}>
                {d.dia}
              </span>
              <span className="flex-1 tabular-nums text-sm" style={{ color: colVal > 0 ? colColor : '#333' }}>
                {colVal > 0 ? BRL(colVal) : '—'}
              </span>
              <span className={['tabular-nums text-xs font-medium', d.saldo >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'].join(' ')}>
                {BRL(d.saldo)}
              </span>
              <button
                onClick={() => { setAddingToDay(d.dia); setAddForm(defaultForm()) }}
                className="text-[#0EA5E9]"
              >
                <Plus size={14} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Mobile add modal */}
      {addingToDay !== null && (
        <div className="sm:hidden fixed inset-0 bg-black/70 z-50 flex items-end" onClick={() => setAddingToDay(null)}>
          <div className="bg-[#111111] border-t border-[#1f1f1f] w-full p-4 rounded-t-2xl" onClick={e => e.stopPropagation()}>
            <AddPanel
              form={addForm}
              onChange={setAddForm}

              cartoes={cartoes}
              categoriasRapidas={categoriasRapidas}
              onAdd={() => addLancamento(addingToDay)}
              onCancel={() => setAddingToDay(null)}
              saving={saving}
              dia={addingToDay}
              onQuickLaunch={launchQuick}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

interface ItemRowsProps {
  node: FinLancamentoTree
  depth: number
  expandedItems: Set<string>
  toggleItem: (id: string) => void
  editingCell: { id: string; field: 'nome' | 'valor' } | null
  editValue: string
  editRef: React.RefObject<HTMLInputElement | null>
  onStartEdit: (id: string, field: 'nome' | 'valor', current: string) => void
  onEditChange: (v: string) => void
  onCommit: () => void
  onDelete: (id: string) => void
}

function ItemRows({ node, depth, expandedItems, toggleItem, editingCell, editValue, editRef, onStartEdit, onEditChange, onCommit, onDelete }: ItemRowsProps) {
  const isExpanded = expandedItems.has(node.id)
  const natColor = node.natureza === 'entrada' ? '#22c55e' : node.natureza === 'saida' ? '#ef4444' : '#f97316'
  const indent = depth * 16

  return (
    <>
      <tr className="group hover:bg-[#0a0a0a]">
        <td className="py-1.5 px-2" style={{ paddingLeft: 8 + indent }}>
          {node.is_grupo && (
            <button onClick={() => toggleItem(node.id)} className="text-[#555] hover:text-white mr-1">
              {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </button>
          )}
        </td>
        <td className="py-1.5 px-2 text-[#aaa] text-xs" colSpan={3} style={{ paddingLeft: node.is_grupo ? undefined : 8 + indent }}>
          {editingCell?.id === node.id && editingCell.field === 'nome' ? (
            <input
              ref={editRef}
              value={editValue}
              onChange={e => onEditChange(e.target.value)}
              onBlur={onCommit}
              onKeyDown={e => e.key === 'Enter' && onCommit()}
              className="bg-transparent border-b border-[#0EA5E9] outline-none text-white w-full"
            />
          ) : (
            <span onClick={() => onStartEdit(node.id, 'nome', node.nome)} className="cursor-text hover:text-white transition-colors">
              {node.nome}
            </span>
          )}
        </td>
        <td className="py-1.5 px-2 text-right text-xs tabular-nums" style={{ color: natColor }}>
          {editingCell?.id === node.id && editingCell.field === 'valor' ? (
            <input
              ref={editRef}
              value={editValue}
              onChange={e => onEditChange(e.target.value)}
              onBlur={onCommit}
              onKeyDown={e => e.key === 'Enter' && onCommit()}
              className="bg-transparent border-b border-[#0EA5E9] outline-none text-right w-24"
            />
          ) : (
            <span onClick={() => !node.is_grupo && onStartEdit(node.id, 'valor', String(node.valor ?? 0))} className={!node.is_grupo ? 'cursor-text' : ''}>
              {BRL(node.valorTotal)}
            </span>
          )}
        </td>
        <td className="py-1.5 px-2">
          <button onClick={() => onDelete(node.id)} className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-[#ef4444] transition-all">
            <Trash2 size={12} />
          </button>
        </td>
      </tr>
      {isExpanded && node.children.map(child => (
        <ItemRows key={child.id} node={child} depth={depth + 1}
          expandedItems={expandedItems} toggleItem={toggleItem}
          editingCell={editingCell} editValue={editValue} editRef={editRef}
          onStartEdit={onStartEdit} onEditChange={onEditChange} onCommit={onCommit} onDelete={onDelete}
        />
      ))}
    </>
  )
}

// ── AddPanel ─────────────────────────────────────────────────────────────────

interface AddPanelProps {
  form: AddForm
  onChange: (f: AddForm) => void
  cartoes: FinCartao[]
  categoriasRapidas: FinCategoria[]
  onAdd: () => void
  onCancel: () => void
  saving: boolean
  dia: number
  onQuickLaunch: (dia: number, cat: FinCategoria, nome: string, valor: string) => void
}

function AddPanel({ form, onChange, cartoes, categoriasRapidas, onAdd, onCancel, saving, dia, onQuickLaunch }: AddPanelProps) {
  const [quickNome, setQuickNome] = useState('')
  const [quickValor, setQuickValor] = useState('')
  const [quickCat, setQuickCat] = useState<FinCategoria | null>(null)

  const set = (k: keyof AddForm, v: unknown) => onChange({ ...form, [k]: v })

  return (
    <div className="space-y-3">
      {/* Atalhos rápidos de diário */}
      {categoriasRapidas.length > 0 && (
        <div>
          <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Diário rápido</div>
          <div className="flex gap-2 flex-wrap">
            {categoriasRapidas.map(cat => (
              <button
                key={cat.id}
                onClick={() => setQuickCat(quickCat?.id === cat.id ? null : cat)}
                className={[
                  'px-2.5 py-1 text-xs rounded-lg border transition-colors',
                  quickCat?.id === cat.id
                    ? 'border-[#0EA5E9]/50 text-[#0EA5E9]'
                    : 'border-[#1f1f1f] text-[#666] hover:text-white',
                ].join(' ')}
              >
                {cat.nome}
              </button>
            ))}
          </div>
          {quickCat && (
            <div className="flex gap-2 mt-2">
              <input
                placeholder={quickCat.nome}
                value={quickNome}
                onChange={e => setQuickNome(e.target.value)}
                className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60"
              />
              <input
                placeholder="R$ 0,00"
                value={quickValor}
                onChange={e => setQuickValor(e.target.value)}
                className="w-28 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60 tabular-nums"
              />
              <button
                onClick={() => { onQuickLaunch(dia, quickCat, quickNome || quickCat.nome, quickValor); setQuickNome(''); setQuickValor(''); setQuickCat(null) }}
                className="bg-[#0EA5E9] text-black text-xs font-semibold px-3 rounded-lg hover:bg-[#38bdf8] transition-colors"
              >
                OK
              </button>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-[#1f1f1f] pt-3">
        <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Lançamento completo</div>

        {/* Type selector */}
        <div className="flex gap-1 mb-3">
          {(['entrada','saida','diario'] as Natureza[]).map(n => (
            <button
              key={n}
              onClick={() => set('natureza', n)}
              className={[
                'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                form.natureza === n
                  ? 'border-[#0EA5E9]/50 text-[#0EA5E9]'
                  : 'border-[#1f1f1f] text-[#555] hover:text-white',
              ].join(' ')}
            >
              {n === 'entrada' ? 'Entrada' : n === 'saida' ? 'Saída' : 'Diário'}
            </button>
          ))}
        </div>

        {/* Saída tipo */}
        {form.natureza === 'saida' && (
          <div className="flex gap-1 mb-3">
            {(['fixa','cartao'] as SaidaTipo[]).map(t => (
              <button
                key={t}
                onClick={() => set('saida_tipo', t)}
                className={[
                  'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                  form.saida_tipo === t
                    ? 'border-[#a78bfa]/50 text-[#a78bfa]'
                    : 'border-[#1f1f1f] text-[#555] hover:text-white',
                ].join(' ')}
              >
                {t === 'fixa' ? 'Fixa' : 'Cartão'}
              </button>
            ))}
          </div>
        )}

        {/* Cartão selector */}
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
            className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60"
            onKeyDown={e => e.key === 'Enter' && onAdd()}
          />
          {!form.is_grupo && (
            <input
              placeholder="R$ 0,00"
              value={form.valor}
              onChange={e => set('valor', e.target.value)}
              className="w-28 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60 tabular-nums"
              onKeyDown={e => e.key === 'Enter' && onAdd()}
            />
          )}
        </div>

        {/* Grupo toggle */}
        <label className="flex items-center gap-2 text-xs text-[#555] cursor-pointer mb-3">
          <input type="checkbox" checked={form.is_grupo} onChange={e => set('is_grupo', e.target.checked)}
            className="accent-[#0EA5E9]" />
          Criar como grupo (soma filhos)
        </label>

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
            {saving ? 'Salvando…' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

