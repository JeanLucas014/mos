import { ChevronDown, ChevronRight, Trash2, Pencil, Plus } from 'lucide-react'
import { BRL } from '../utils'
import { useConfirmPopup } from '../hooks/useConfirmPopup'
import { ConfirmPagamentoPopup } from './ConfirmPagamentoPopup'
import type { ItemRowProps } from './ItemRow'

/** Versão mobile do ItemRow (divs ao invés de tr/td) — mesma lógica de editar, deletar, adicionar subitem, confirmar pagamento. */
export function MobileItemRow({ node, depth, expandedItems, toggleItem, onEdit, onDelete, onAddChild, onTogglePago, editingDiarioId, editingValue, onEditDiario, onEditDiarioChange, onSaveDiario }: ItemRowProps) {
  const isExpanded = expandedItems.has(node.id)
  const natColor   = node.natureza === 'entrada' ? '#22c55e' : node.natureza === 'saida' ? '#ef4444' : '#f97316'
  const pl         = depth * 14
  const isSaida    = node.natureza === 'saida'
  const confirmPopup = useConfirmPopup()

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
          onClick={isSaida ? (e) => { e.stopPropagation(); confirmPopup.open(e) } : undefined}
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

      {confirmPopup.showConfirm && (
        <ConfirmPagamentoPopup
          node={node}
          position={confirmPopup.confirmPos}
          onConfirm={async () => { await onTogglePago(node.id, !node.pago); confirmPopup.close() }}
          onClose={confirmPopup.close}
        />
      )}

      {isExpanded && node.children.map(child => (
        <MobileItemRow
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
