import { Pencil, Trash2, Calendar } from 'lucide-react'
import type { Invoice } from '../types'
import { C } from '../constants'
import { fmt, fmtDate, isPaid } from '../utils'
import { StatusPill } from './StatusPill'

/* ── InvoiceCard ─────────────────────────────────────────────────── */
export function InvoiceCard({
  inv, onEdit, onDelete,
}: {
  inv: Invoice
  onEdit: () => void
  onDelete: () => void
}) {
  const paid = isPaid(inv)
  return (
    <div style={{
      background: C.card,
      border: '1px solid ' + C.border,
      borderRadius: 12,
      padding: '14px 16px',
      opacity: paid ? 0.65 : 1,
      transition: 'opacity .2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        {/* left */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600, color: C.tx,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginBottom: 3,
          }}>
            {inv.service}
          </div>
          <div style={{ fontSize: 12, color: C.dm, marginBottom: 8 }}>{inv.client}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <StatusPill status={inv.status} />
            {inv.due_date && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.dm2 }}>
                <Calendar size={11} />
                {fmtDate(inv.due_date)}
              </span>
            )}
          </div>
        </div>

        {/* right */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 15, fontWeight: 700,
            color: paid ? C.dm : C.tx,
          }}>
            {fmt(inv.amount_cents)}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={onEdit}
              title="Editar"
              style={{
                background: 'rgba(14,165,233,.1)', border: '1px solid rgba(14,165,233,.25)',
                borderRadius: 7, cursor: 'pointer', color: C.b,
                padding: '5px 8px', display: 'flex', alignItems: 'center',
              }}
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={onDelete}
              title="Excluir"
              style={{
                background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.25)',
                borderRadius: 7, cursor: 'pointer', color: C.r,
                padding: '5px 8px', display: 'flex', alignItems: 'center',
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
