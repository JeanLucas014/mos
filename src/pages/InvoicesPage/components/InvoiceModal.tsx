import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Invoice, InvoiceInsert, Status } from '../types'
import { C, STATUS_CFG, ALL_STATUSES } from '../constants'

export const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: C.dm,
  marginBottom: 4, letterSpacing: '.04em',
}

/* ── Modal ───────────────────────────────────────────────────────── */
interface ModalProps {
  initial: Partial<Invoice> | null
  onClose: () => void
}

export function InvoiceModal({ initial, onClose }: ModalProps) {
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
    background: 'var(--bg3)',
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

        <label style={labelStyle}>Cliente / Parceiro (opcional)</label>
        <input value={client} onChange={e => setClient(e.target.value)} placeholder="Cliente, parceiro ou serviço (opcional)" style={fs} />

        <label style={labelStyle}>Valor (R$)</label>
        <input
          type="number" step="0.01" min="0"
          value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="2400,00"
          style={fs}
        />

        <label style={labelStyle}>Status</label>
        <select value={status} onChange={e => setStatus(e.target.value as Status)} style={{ ...fs, cursor: 'pointer', colorScheme: 'dark' }}>
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
