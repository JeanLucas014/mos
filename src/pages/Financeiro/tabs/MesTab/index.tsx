// src/pages/Financeiro/tabs/MesTab/index.tsx
// v2 — editar lançamentos, subitens em grupos, clique por coluna, nova cat rápida, cards de resumo

import { useState } from 'react'
import { Plus, ChevronDown, ChevronRight, CalendarDays, List, X } from 'lucide-react'
import { ExtratoView } from '../ExtratoView'
import type { FinAno, FinLancamento, Natureza, SaidaTipo } from '../../types'
import { MS_FULL, MS_OPT, BRL } from './utils'
import { defaultForm, type AddForm } from './types'
import { EditModal, type EditFormState } from './components/EditModal'
import { AddPanel } from './components/AddPanel'
import { ItemRow } from './components/ItemRow'
import { MobileItemRow } from './components/MobileItemRow'
import { useDiarioInlineEdit } from './hooks/useDiarioInlineEdit'
import { useMesData } from './hooks/useMesData'
import { useMesActions } from './hooks/useMesActions'

// ─────────────────────────────────────────────────────────────────────────────
// MesTab (main)
// ─────────────────────────────────────────────────────────────────────────────

interface Props { ano: FinAno; initialMonth: number }

export function MesTab({ ano, initialMonth }: Props) {
  const [month, setMonth]               = useState(initialMonth)
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set())
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [editingItem, setEditingItem]   = useState<FinLancamento | null>(null)
  const [addingToDay, setAddingToDay]   = useState<number | null>(null)
  const [viewMode, setViewMode]         = useState<'calendario' | 'extrato'>('calendario')
  const [addForm, setAddForm]           = useState<AddForm>(defaultForm())
  const [saving, setSaving]             = useState(false)
  const [mobileCol, setMobileCol]       = useState<Natureza>('diario')
  const {
    loading, categorias, cartoes, saldoAbertura,
    trees, byDay, days, totE, totS, totD, res, categoriasRapidas,
    reload: loadAll,
  } = useMesData(ano, month)
  const {
    addLancamento: addLancamentoAction,
    saveEdit: saveEditAction,
    deleteLancamento,
    saveDiarioValue,
    togglePago,
    quickLaunch,
    addQuickCat: addQuickCatAction,
  } = useMesActions({ ano, month, reload: loadAll })
  const diarioEdit = useDiarioInlineEdit(saveDiarioValue)

  // ── Actions (wrappers finos: ligam o estado de UI local às mutations) ──────

  function openAdd(dia: number, nat: Natureza = 'diario', parentId: string | null = null, st: SaidaTipo = 'fixa') {
    setAddForm(defaultForm(nat, parentId, st))
    setAddingToDay(dia)
    if (!expandedDays.has(dia)) toggleDay(dia)
  }

  async function addLancamento(dia: number) {
    setSaving(true)
    await addLancamentoAction(addForm, dia)
    setSaving(false)
    setAddingToDay(null)
    setAddForm(defaultForm())
  }

  async function saveEdit(form: EditFormState) {
    if (!editingItem) return
    await saveEditAction(editingItem, form)
    setEditingItem(null)
  }

  async function addQuickCat(nome: string, cor?: string) {
    const ordem = categorias.filter(c => c.rapida && c.natureza === 'diario').length
    await addQuickCatAction(nome, cor, ordem)
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
                    <ItemRow
                      key={item.id}
                      node={item}
                      depth={0}
                      expandedItems={expandedItems}
                      toggleItem={toggleItem}
                      onEdit={setEditingItem}
                      onDelete={deleteLancamento}
                      onAddChild={parent => openAdd(d.dia, parent.natureza, parent.id, (parent.saida_tipo as SaidaTipo) ?? 'fixa')}
                      onTogglePago={togglePago}
                      editingDiarioId={diarioEdit.editingDiarioId}
                      editingValue={diarioEdit.editingValue}
                      onEditDiario={diarioEdit.startEdit}
                      onEditDiarioChange={diarioEdit.changeValue}
                      onSaveDiario={diarioEdit.save}
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
                <MobileItemRow
                  key={item.id}
                  node={item}
                  depth={0}
                  expandedItems={expandedItems}
                  toggleItem={toggleItem}
                  onEdit={setEditingItem}
                  onDelete={deleteLancamento}
                  onAddChild={parent => openAdd(d.dia, parent.natureza, parent.id, (parent.saida_tipo as SaidaTipo) ?? 'fixa')}
                  onTogglePago={togglePago}
                  editingDiarioId={diarioEdit.editingDiarioId}
                  editingValue={diarioEdit.editingValue}
                  onEditDiario={diarioEdit.startEdit}
                  onEditDiarioChange={diarioEdit.changeValue}
                  onSaveDiario={diarioEdit.save}
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
