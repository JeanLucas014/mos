// src/pages/Financeiro/tabs/ExtratoView.tsx
// Modo de visualização "Extrato" — somente leitura, sem edição/criação/exclusão.
// Agrupa subitens sob o nome do "pai" (grupo), igual à visão de calendário.

import { useState } from 'react'
import { Search } from 'lucide-react'
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
  | { kind: 'single'; sortKey: string; item: ExtratoItem }
  | { kind: 'group'; parentNome: string; children: ExtratoItem[]; total: number; sortKey: string }

function buildBlocks(items: ExtratoItem[]): Block[] {
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

  const blocks: Block[] = []
  for (const item of standalone) {
    blocks.push({ kind: 'single', sortKey: item.data, item })
  }
  for (const [parentNome, children] of groupsMap.entries()) {
    const total = children.reduce((s, c) => s + c.valor, 0)
    const sorted = [...children].sort((a, b) => b.data.localeCompare(a.data))
    blocks.push({ kind: 'group', parentNome, children: sorted, total, sortKey: sorted[0].data })
  }

  blocks.sort((a, b) => b.sortKey.localeCompare(a.sortKey))
  return blocks
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

  const allLeaves = flattenLeaves(trees)
  const bySegment = allLeaves.filter(i => i.natureza === segment)

  const q = query.trim().toLowerCase()
  const filteredItems = q
    ? bySegment.filter(i =>
        i.nome.toLowerCase().includes(q) ||
        (i.parentNome ?? '').toLowerCase().includes(q)
      )
    : bySegment

  const blocks = buildBlocks(filteredItems)
  const total = filteredItems.reduce((s, i) => s + i.valor, 0)
  const activeColor = SEGMENTS.find(s => s.id === segment)!.color

  return (
    <div>
      {/* Segment selector */}
      <div className="flex gap-1 mb-4">
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

      {/* Search */}
      <div className="relative mb-4">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nome…"
          className="w-full bg-[#111111] border border-[#1f1f1f] rounded-lg pl-8 pr-3 py-2 text-sm text-white outline-none focus:border-[#0EA5E9]/60"
        />
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
