import { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import type { Invoice, Status } from '../types'
import { C, STATUS_CFG } from '../constants'
import { fmt } from '../utils'
import { useInvoices } from '../hooks/useInvoices'
import { Tile } from './Tile'
import { InvoiceCard } from './InvoiceCard'
import { InvoiceModal } from './InvoiceModal'

interface FaturasTabProps {
  modal: Partial<Invoice> | null | false
  setModal: (m: Partial<Invoice> | null | false) => void
}

/** Aba Faturas: tiles de resumo, filtro por status, lista e modal de criar/editar. */
export function FaturasTab({ modal, setModal }: FaturasTabProps) {
  const qc = useQueryClient()
  const { data: invoices = [], isLoading } = useInvoices()

  const [filterStatus, setFilterStatus] = useState<Status | 'todos'>('todos')

  /* ── Stats ── */
  const totalReceivable = invoices
    .filter(i => i.status !== 'pago')
    .reduce((s, i) => s + i.amount_cents, 0)

  const totalReceived = invoices
    .filter(i => i.status === 'pago')
    .reduce((s, i) => s + i.amount_cents, 0)

  const pendingCount = invoices.filter(i => i.status !== 'pago').length

  /* ── Sorted + filtered list ── */
  const displayed = useMemo(() => {
    const filtered = filterStatus === 'todos'
      ? invoices
      : invoices.filter(i => i.status === filterStatus)

    // not-paid first (by created_at desc), paid last (by created_at desc)
    return [...filtered].sort((a, b) => {
      const aPaid = a.status === 'pago' ? 1 : 0
      const bPaid = b.status === 'pago' ? 1 : 0
      if (aPaid !== bPaid) return aPaid - bPaid
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [invoices, filterStatus])

  /* ── Delete ── */
  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invoices')
        .delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })

  function handleDelete(inv: Invoice) {
    if (!window.confirm(`Excluir fatura "${inv.service}"?`)) return
    deleteMut.mutate(inv.id)
  }

  /* ── Filter pills row ── */
  const filterOptions: { id: Status | 'todos'; label: string }[] = [
    { id: 'todos',      label: 'Todos'      },
    { id: 'enviado',    label: 'Enviado'    },
    { id: 'em dev',     label: 'Em dev'     },
    { id: 'aprovado',   label: 'Aprovado'   },
    { id: 'recorrente', label: 'Recorrente' },
    { id: 'pago',       label: 'Pago'       },
  ]

  return (
    <>
      {/* ── Tiles ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
        marginBottom: 22,
      }}
        className="inv-tiles"
      >
        <style>{`
          @media (min-width: 640px) { .inv-tiles { grid-template-columns: repeat(4, 1fr) !important; } }
        `}</style>

        {/* col-span-full on mobile for total receivable? No — keep 2x2 on mobile */}
        <Tile
          label="A receber"
          value={fmt(totalReceivable)}
          color={C.g}
          sub={`${pendingCount} ${pendingCount === 1 ? 'fatura' : 'faturas'}`}
        />
        <Tile
          label="Recebido"
          value={fmt(totalReceived)}
          color={C.b}
        />
        <Tile
          label="Pendentes"
          value={String(pendingCount)}
          color={C.a}
          sub="não pagas"
        />
        <Tile
          label="Total"
          value={fmt(totalReceivable + totalReceived)}
          color={C.dm}
          sub="no período"
        />
      </div>

      {/* ── Filter bar ── */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 18,
        overflowX: 'auto', paddingBottom: 2,
        WebkitOverflowScrolling: 'touch',
      }}>
        {filterOptions.map(f => {
          const active = filterStatus === f.id
          const cfg    = f.id !== 'todos' ? STATUS_CFG[f.id as Status] : null
          const activeColor = cfg?.color ?? C.b
          return (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              style={{
                padding: '7px 14px', borderRadius: 20, flexShrink: 0,
                cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400,
                background: active ? activeColor + '18' : 'transparent',
                border:     active ? `1px solid ${activeColor}40` : `1px solid ${C.border}`,
                color:      active ? activeColor : C.dm,
                transition: 'all .15s',
              }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* ── List ── */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: C.dm, fontSize: 13 }}>
          Carregando...
        </div>
      ) : displayed.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '56px 24px',
          color: C.dm, fontSize: 13,
          background: C.card, borderRadius: 12, border: '1px solid ' + C.border,
        }}>
          {filterStatus === 'todos'
            ? 'Nenhuma fatura cadastrada'
            : `Nenhuma fatura com status "${STATUS_CFG[filterStatus as Status]?.label ?? filterStatus}"`}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayed.map(inv => (
            <InvoiceCard
              key={inv.id}
              inv={inv}
              onEdit={() => setModal(inv)}
              onDelete={() => handleDelete(inv)}
            />
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {modal !== false && (
        <InvoiceModal
          initial={modal}
          onClose={() => setModal(false)}
        />
      )}
    </>
  )
}
