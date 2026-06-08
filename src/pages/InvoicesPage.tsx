import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type Invoice = Database['public']['Tables']['invoices']['Row']
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']

/* ── Palette ─────────────────────────────────────────────────────── */
const C = {
  bg:     '#0a0a0a',
  card:   '#111111',
  card2:  '#161616',
  border: '#1f1f1f',
  tx:     '#ffffff',
  dm:     '#888888',
  dm2:    '#444444',
  b:      '#0EA5E9',
  g:      '#34d399',
  r:      '#f87171',
  a:      '#fbbf24',
  p:      '#a78bfa',
}

/* ── Status config ───────────────────────────────────────────────── */
type Status = 'enviado' | 'em dev' | 'aprovado' | 'recorrente' | 'pago'

const STATUS_CFG: Record<Status, { label: string; color: string; bg: string }> = {
  'enviado':    { label: 'Enviado',    color: C.b, bg: 'rgba(14,165,233,.15)'  },
  'em dev':     { label: 'Em dev',     color: C.a, bg: 'rgba(251,191,36,.15)'  },
  'aprovado':   { label: 'Aprovado',   color: C.g, bg: 'rgba(52,211,153,.15)'  },
  'recorrente': { label: 'Recorrente', color: C.p, bg: 'rgba(167,139,250,.15)' },
  'pago':       { label: 'Pago',       color: C.dm, bg: 'rgba(136,136,136,.15)' },
}

const ALL_STATUSES: Status[] = ['enviado', 'em dev', 'aprovado', 'recorrente', 'pago']

/* ── Helpers ─────────────────────────────────────────────────────── */
function fmt(cents: number): string {
  const v = cents / 100
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(d: string | null): string | null {
  if (!d) return null
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function isPaid(inv: Invoice) {
  return inv.status === 'pago'
}

/* ── useInvoices ─────────────────────────────────────────────────── */
function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('invoices') as any)
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Invoice[]
    },
  })
}

/* ── Modal ───────────────────────────────────────────────────────── */
interface ModalProps {
  initial: Partial<Invoice> | null
  onClose: () => void
}

function InvoiceModal({ initial, onClose }: ModalProps) {
  const qc = useQueryClient()
  const isEdit = !!initial?.id

  const [service,  setService]  = useState(initial?.service  ?? '')
  const [client,   setClient]   = useState(initial?.client   ?? '')
  const [amount,   setAmount]   = useState(
    initial?.amount_cents != null ? String(initial.amount_cents / 100) : '',
  )
  const [status,   setStatus]   = useState<Status>((initial?.status as Status) ?? 'enviado')
  const [dueDate,  setDueDate]  = useState(initial?.due_date ?? '')
  const [saving,   setSaving]   = useState(false)
  const [err,      setErr]      = useState('')

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  const upsert = useMutation({
    mutationFn: async (payload: InvoiceInsert & { id?: string }) => {
      if (isEdit && payload.id) {
        const { error } = await (supabase.from('invoices') as any)
          .update(payload)
          .eq('id', payload.id)
        if (error) throw error
      } else {
        const { error } = await (supabase.from('invoices') as any)
          .insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      onClose()
    },
    onError: (e: Error) => setErr(e.message),
  })

  async function handleSave() {
    if (!service.trim()) { setErr('Preencha o serviço');   return }
    if (!client.trim())  { setErr('Preencha o cliente');   return }
    const cents = Math.round(parseFloat(amount.replace(',', '.')) * 100)
    if (isNaN(cents) || cents <= 0) { setErr('Valor inválido'); return }
    setErr('')
    setSaving(true)
    await upsert.mutateAsync({
      ...(isEdit ? { id: initial!.id! } : {}),
      service:      service.trim(),
      client:       client.trim(),
      amount_cents: cents,
      status,
      due_date:     dueDate || null,
    })
    setSaving(false)
  }

  const fs: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', marginBottom: 12,
    background: 'rgba(255,255,255,.05)',
    border: '1px solid ' + C.border,
    borderRadius: 8, padding: '10px 12px',
    color: C.tx, fontSize: 13, outline: 'none',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0,0,0,.7)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.card,
          border: '1px solid ' + C.border,
          borderRadius: isMobile ? '18px 18px 0 0' : 14,
          padding: isMobile ? '24px 20px 32px' : 24,
          width: '100%',
          maxWidth: isMobile ? '100%' : 420,
          maxHeight: isMobile ? '92dvh' : '90vh',
          overflowY: 'auto',
        }}
      >
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.tx }}>
            {isEdit ? 'Editar fatura' : 'Nova fatura'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.dm, display: 'flex', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <label style={labelStyle}>Serviço</label>
        <input value={service} onChange={e => setService(e.target.value)} placeholder="Plugin reservas v2.1" style={fs} autoFocus />

        <label style={labelStyle}>Cliente</label>
        <input value={client} onChange={e => setClient(e.target.value)} placeholder="Super Kart BH" style={fs} />

        <label style={labelStyle}>Valor (R$)</label>
        <input
          type="number" step="0.01" min="0"
          value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="2400,00"
          style={fs}
        />

        <label style={labelStyle}>Status</label>
        <select value={status} onChange={e => setStatus(e.target.value as Status)} style={{ ...fs, cursor: 'pointer' }}>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{STATUS_CFG[s].label}</option>
          ))}
        </select>

        <label style={labelStyle}>Vencimento (opcional)</label>
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          style={{ ...fs, marginBottom: 20, colorScheme: 'dark' }}
        />

        {err && (
          <div style={{ color: C.r, fontSize: 12, marginBottom: 12, marginTop: -8 }}>{err}</div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, padding: '12px', borderRadius: 10,
              background: 'linear-gradient(135deg, #0EA5E9, #0284c7)',
              border: 'none', color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar fatura'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 20px', borderRadius: 10,
              background: 'rgba(255,255,255,.04)',
              border: '1px solid ' + C.border,
              color: C.dm, fontSize: 13, cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: C.dm,
  marginBottom: 4, letterSpacing: '.04em',
}

/* ── StatusPill ──────────────────────────────────────────────────── */
function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CFG[status as Status] ?? { label: status, color: C.dm, bg: 'rgba(136,136,136,.15)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}30`,
    }}>
      {cfg.label}
    </span>
  )
}

/* ── InvoiceCard ─────────────────────────────────────────────────── */
function InvoiceCard({
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

/* ── Main page ───────────────────────────────────────────────────── */
export function InvoicesPage() {
  const qc = useQueryClient()
  const { data: invoices = [], isLoading } = useInvoices()

  const [filterStatus, setFilterStatus] = useState<Status | 'todos'>('todos')
  const [modal, setModal] = useState<Partial<Invoice> | null | false>(false)
  // false = closed, null = new invoice, Invoice partial = editing

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
      const { error } = await (supabase.from('invoices') as any)
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
    <div style={{ fontFamily: 'Manrope, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 22, flexWrap: 'wrap', gap: 12,
      }}>
        <h1 style={{
          fontFamily: 'Sora, sans-serif', fontWeight: 800,
          fontSize: 26, letterSpacing: '-0.03em', margin: 0,
        }}>
          Faturamento
        </h1>
        <button
          onClick={() => setModal(null)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 16px',
            background: 'linear-gradient(135deg, #0EA5E9, #0284c7)',
            border: 'none', borderRadius: 10,
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={15} />
          Nova fatura
        </button>
      </div>

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
    </div>
  )
}

/* ── Tile ────────────────────────────────────────────────────────── */
function Tile({ label, value, color, sub }: {
  label: string; value: string; color: string; sub?: string
}) {
  return (
    <div style={{
      background: C.card, borderRadius: 12,
      padding: '16px 18px', border: '1px solid ' + C.border,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 14, right: 14,
        width: 7, height: 7, borderRadius: '50%', background: color,
      }} />
      <div style={{
        color: C.dm, fontSize: 10, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 15, fontWeight: 700, color,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ color: C.dm2, fontSize: 10, marginTop: 3 }}>{sub}</div>
      )}
    </div>
  )
}
