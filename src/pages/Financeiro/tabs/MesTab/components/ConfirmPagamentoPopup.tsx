import { createPortal } from 'react-dom'
import type { FinLancamentoTree } from '../../../types'
import { BRL } from '../utils'

interface Props {
  node: FinLancamentoTree
  position: { x: number; y: number }
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function ConfirmPagamentoPopup({ node, position, onConfirm, onClose }: Props) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: Math.max(10, position.y - 70),
        left: Math.min(position.x - 20, window.innerWidth - 260),
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
          onClick={onConfirm}
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
          onClick={onClose}
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
  )
}
