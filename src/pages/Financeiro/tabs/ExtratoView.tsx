// src/pages/Financeiro/tabs/ExtratoView.tsx
// Modo de visualização "Extrato" — somente leitura, sem edição/criação/exclusão.
// Agrupa subitens sob o nome do "pai" (grupo) e permite ordenar por
// data, nome ou valor (asc/desc).

import { useState } from 'react'
import { Search, ArrowUpDown } from 'lucide-react'
import type { FinLancamentoTree, Natureza } from '../types'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (iso: string) => {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

interface ExtratoItem {
  id: string
  nome: string
  data: string
  valor: number
  natureza: Natureza
  parentNome?: string
}

// Achata a árvore em folhas, mantendo o nome do grupo-pai (se houver)
function flattenLeaves(nodes: FinLancamentoTree[], parentNome?: string): ExtratoItem[] {
  let out: ExtratoItem[] = []
  for (const node of nodes) {
    if (node.is_grupo) {
      out = out.concat(flattenLeaves(node.children, node.nome))
    } else {
      out.push({
        id: node.id,
        nome: node.nome,
        data: node.data,
        valor: node.valor ?? 0,
        natureza: node.natureza,
        parentNome,
      })
    }
  }
  return out
}

type Block =
  | { kind: 'single'; item: ExtratoItem }
  | { kind: 'group'; parentNome: string; children: ExtratoItem[]; total: number }

type SortOption = 'data_desc' | 'data_asc' | 'nome_asc' | 'nome_desc' | 'valor_desc' | 'valor_asc'

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'data_desc',  label: 'Data (mais recente)' },
  { id: 'data_asc',   label: 'Data (mais antiga)' },
  { id: 'nome_asc',   label: 'Nome (A-Z)' },
  { id: 'nome_desc',  label: 'Nome (Z-A)' },
  { id: 'valor_desc', label: 'Valor (maior)' },
  { id: 'valor_asc',  label: 'Valor (menor)' },
]

function makeComparator<T>(
  option: SortOption,
  dateOf: (x: T) => string,
  nameOf: (x: T) => string,
  valorOf: (x: T) => number,
) {
  return (a: T, b: T) => {
    switch (option) {
      case 'data_desc':  return dateOf(b).localeCompare(dateOf(a))
      case 'data_asc':   return dateOf(a).localeCompare(dateOf(b))
      case 'nome_asc':   return nameOf(a).localeCompare(nameOf(b), 'pt-BR')
      case 'nome_desc':  return nameOf(b).localeCompare(nameOf(a), 'pt-BR')
      case 'valor_desc': return valorOf(b) - valorOf(a)
      case 'valor_asc':  return valorOf(a) - valorOf(b)
      default: return 0
    }
  }
}

function buildBlocks(items: ExtratoItem[], sortOption: SortOption): Block[] {
  const groupsMap = new Map<string, ExtratoItem[]>()
  const standalone: ExtratoItem[] = []

  for (const item of items) {
    if (item.parentNome) {
      if (!groupsMap.has(item.parentNome)) groupsMap.set(item.parentNome, [])
      groupsMap.get(item.parentNome)!.push(item)
    } else {
      standalone.push(item)
    }
  }

  const childComparator = makeComparator<ExtratoItem>(sortOption, i => i.data, i => i.nome, i => i.valor)

  let blocks: Block[] = []
  for (const item of standalone) {
    blocks.push({ kind: 'single', item })
  }
  for (const [parentNome, children] of groupsMap.entries()) {
    const total = children.reduce((s, c) => s + c.valor, 0)
    const sortedChildren = [...children].sort(childComparator)
    blocks.push({ kind: 'group', parentNome, children: sortedChildren, total })
  }

  const blockComparator = makeComparator<Block>(
    sortOption,
    b => b.kind === 'single' ? b.item.data : b.children[0].data,
    b => b.kind === 'single' ? b.item.nome : b.parentNome,
    b => b.kind === 'single' ? b.item.valor : b.total,
  )
  return blocks.sort(blockComparator)
}

interface Props {
  trees: FinLancamentoTree[]
}

const SEGMENTS: { id: Natureza; label: string; color: string }[] = [
  { id: 'saida',   label: 'Saída',   color: '#ef4444' },
  { id: 'entrada', label: 'Entrada', color: '#22c55e' },
  { id: 'diario',  label: 'Diário',  color: '#f97316' },
]

export function ExtratoView({ trees }: Props) {
  const [segment, setSegment] = useState<Natureza>('saida')
  const [query, setQuery] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('data_asc')

  const allLeaves = flattenLeaves(trees)
  const bySegment = allLeaves.filter(i => i.natureza === segment)

  const q = query.trim().toLowerCase()
  const filteredItems = q
    ? bySegment.filter(i =>
        i.nome.toLowerCase().includes(q) ||
        (i.parentNome ?? '').toLowerCase().includes(q)
      )
    : bySegment

  const blocks = buildBlocks(filteredItems, sortOption)
  const total = filteredItems.reduce((s, i) => s + i.valor, 0)
  const activeColor = SEGMENTS.find(s => s.id === segment)!.color

  return (
    <div>
      {/* Segment selector */}
      <div className="flex gap-1 mb-3">
        {SEGMENTS.map(s => (
          <button
            key={s.id}
            onClick={() => setSegment(s.id)}
            style={segment === s.id ? { borderColor: s.color + '80', color: s.color } : {}}
            className={[
              'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
              segment === s.id ? '' : 'border-[#1f1f1f] text-[#555] hover:text-white',
            ].join(' ')}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nome…"
            className="w-full bg-[#111111] border border-[#1f1f1f] rounded-lg pl-8 pr-3 py-2 text-sm text-white outline-none focus:border-[#0EA5E9]/60"
          />
        </div>

        <div className="relative shrink-0">
          <ArrowUpDown size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none" />
          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value as SortOption)}
            className="bg-[#111111] border border-[#1f1f1f] rounded-lg pl-7 pr-2.5 py-2 text-xs text-[#ccc] outline-none cursor-pointer appearance-none max-w-[150px] focus:border-[#0EA5E9]/60"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between mb-3 text-xs text-[#555]">
        <span>{filteredItems.length} lançamento{filteredItems.length !== 1 ? 's' : ''}</span>
        <span className="tabular-nums font-medium" style={{ color: activeColor }}>{BRL(total)}</span>
      </div>

      {/* List */}
      <div>
        {blocks.map((block, bi) => {
          const borderTopClass = bi === 0 ? '' : 'border-t border-[#1f1f1f]'

          if (block.kind === 'single') {
            const item = block.item
            return (
              <div key={item.id} className={['flex items-center gap-3 py-2.5', borderTopClass].join(' ')}>
                <span className="text-xs text-[#555] tabular-nums w-9 shrink-0">{fmtDate(item.data)}</span>
                <div className="flex-1 min-w-0 text-sm text-[#ddd] truncate">{item.nome}</div>
                <span className="tabular-nums text-sm font-medium shrink-0" style={{ color: activeColor }}>
                  {BRL(item.valor)}
                </span>
              </div>
            )
          }

          // kind === 'group'
          return (
            <div key={block.parentNome} className={borderTopClass}>
              {/* Cabeçalho do grupo */}
              <div className="flex items-center gap-3 pt-2.5 pb-1.5">
                <span className="w-9 shrink-0" />
                <div className="flex-1 text-sm text-white font-semibold truncate">{block.parentNome}</div>
                <span className="tabular-nums text-sm font-medium shrink-0" style={{ color: activeColor }}>
                  {BRL(block.total)}
                </span>
              </div>
              {/* Subitens */}
              {block.children.map(child => (
                <div key={child.id} className="flex items-center gap-3 py-1.5">
                  <span className="w-9 shrink-0" />
                  <span className="text-[11px] text-[#444] w-3.5 shrink-0 text-center">↳</span>
                  <span className="text-[11px] text-[#555] tabular-nums w-7 shrink-0">{fmtDate(child.data)}</span>
                  <div className="flex-1 min-w-0 text-[13px] text-[#999] truncate">{child.nome}</div>
                  <span className="tabular-nums text-[13px] shrink-0 opacity-75" style={{ color: activeColor }}>
                    {BRL(child.valor)}
                  </span>
                </div>
              ))}
            </div>
          )
        })}

        {blocks.length === 0 && (
          <div className="text-center py-12 text-[#555] text-sm">
            {query ? 'Nenhum resultado para essa busca.' : 'Nenhum lançamento neste mês.'}
          </div>
        )}
      </div>
    </div>
  )
}
