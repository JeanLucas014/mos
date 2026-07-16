import { ChevronDown, ChevronRight, Trash2, Pencil, Plus } from 'lucide-react'
import type { FinLancamento, FinLancamentoTree } from '../../../types'
import { BRL } from '../utils'
import { useConfirmPopup } from '../hooks/useConfirmPopup'
import { ConfirmPagamentoPopup } from './ConfirmPagamentoPopup'

export interface ItemRowProps {
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

/** Linha recursiva desktop (tr/td) — editar, deletar, adicionar subitem, confirmar pagamento. */
export function ItemRow({ node, depth, expandedItems, toggleItem, onEdit, onDelete, onAddChild, onTogglePago, editingDiarioId, editingValue, onEditDiario, onEditDiarioChange, onSaveDiario }: ItemRowProps) {
  const isExpanded = expandedItems.has(node.id)
  const natColor   = node.natureza === 'entrada' ? '#22c55e' : node.natureza === 'saida' ? '#ef4444' : '#f97316'
  const pl         = 8 + depth * 20
  const isSaida    = node.natureza === 'saida'
  const confirmPopup = useConfirmPopup()

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
          className="py-1.5 px-2 text-xs text-ink-2"
          colSpan={3}
          onClick={isSaida ? (e) => { e.stopPropagation(); confirmPopup.open(e) } : undefined}
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
              className="text-[#444] hover:text-brand transition-colors"
              title="Editar"
            >
              <Pencil size={11} />
            </button>
            {node.is_grupo && (
              <button
                onClick={() => onAddChild(node)}
                className="text-[#444] hover:text-brand transition-colors"
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

      {confirmPopup.showConfirm && (
        <ConfirmPagamentoPopup
          node={node}
          position={confirmPopup.confirmPos}
          onConfirm={async () => { await onTogglePago(node.id, !node.pago); confirmPopup.close() }}
          onClose={confirmPopup.close}
        />
      )}

      {/* Children */}
      {isExpanded && (
        <>
          {node.children.map(child => (
            <ItemRow
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
                className="flex items-center gap-1 text-[11px] text-brand/50 hover:text-brand transition-colors"
              >
                <Plus size={10} />
                <span>item em <em className="not-italic text-brand/80">{node.nome}</em></span>
              </button>
            </td>
          </tr>
        </>
      )}
    </>
  )
}
