import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type Invoice = Database['public']['Tables']['invoices']['Row']
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
type MotoRecord = Database['public']['Tables']['moto_revenue']['Row']

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
  'enviado':    { label: 'Enviado',    color: '#7dd3fc', bg: '#0c1e2b' },
  'em dev':     { label: 'Em dev',     color: '#fcd34d', bg: '#1f1508' },
  'aprovado':   { label: 'Aprovado',   color: '#6ee7b7', bg: '#0a1f14' },
  'recorrente': { label: 'Recorrente', color: '#c4b5fd', bg: '#14112a' },
  'pago':       { label: 'Pago',       color: '#9ca3af', bg: '#141414' },
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
    background: '#1a1a1a',
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

/* ══════════════════════════════════════════════════════════════════
   MOTO TAB
══════════════════════════════════════════════════════════════════ */
const ENTRADA_CATS = ['Corrida', 'Entrega', 'Outros']
const GASTO_CATS   = ['Gasolina', 'Manutenção', 'Alimentação', 'Multa', 'Outros']
const MONTH_NAMES  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function useMotoRevenue(year: number, month: number) {
  const qc  = useQueryClient()
  const pad = (n: number) => String(n).padStart(2, '0')
  const lastDay = new Date(year, month + 1, 0).getDate()
  const from = `${year}-${pad(month + 1)}-01`
  const to   = `${year}-${pad(month + 1)}-${pad(lastDay)}`
  const key  = ['moto_revenue', year, month]

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await (supabase.from('moto_revenue') as any)
        .select('*')
        .gte('revenue_date', from)
        .lte('revenue_date', to)
        .order('revenue_date', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as MotoRecord[]
    },
  })

  const addRecord = useMutation({
    mutationFn: async (r: { revenue_date: string; kind: string; category: string; description: string; amount_cents: number; notes?: string }) => {
      const { data, error } = await (supabase.from('moto_revenue') as any).insert(r).select().single()
      console.log('[moto_insert]', data, error)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('moto_revenue') as any).delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<MotoRecord[]>(key)
      qc.setQueryData<MotoRecord[]>(key, old => old?.filter(r => r.id !== id))
      return { prev }
    },
    onError: (_e, _v, ctx: any) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, addRecord, deleteRecord }
}

/* Add record modal */
function MotoAddModal({
  date, onClose,
  onSave,
}: { date: string; onClose: () => void; onSave: (r: { revenue_date: string; kind: string; category: string; description: string; amount_cents: number; notes?: string }) => void }) {
  const [type,     setType]     = useState<'entrada' | 'gasto'>('entrada')
  const [category, setCategory] = useState(ENTRADA_CATS[0])
  const [desc,     setDesc]     = useState('')
  const [amount,   setAmount]   = useState('')
  const [notes,    setNotes]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [err,      setErr]      = useState('')

  const cats = type === 'entrada' ? ENTRADA_CATS : GASTO_CATS

  function handleTypeChange(t: 'entrada' | 'gasto') {
    setType(t)
    setCategory(t === 'entrada' ? ENTRADA_CATS[0] : GASTO_CATS[0])
  }

  async function handleSubmit() {
    if (!desc.trim()) { setErr('Preencha a descrição'); return }
    const cents = Math.round(parseFloat(amount.replace(',', '.')) * 100)
    if (isNaN(cents) || cents <= 0) { setErr('Valor inválido'); return }
    setErr(''); setSaving(true)
    onSave({ revenue_date: date, kind: type, category, description: desc.trim(), amount_cents: cents, notes: notes.trim() || undefined })
    setSaving(false)
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  const fs: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', marginBottom: 10,
    background: '#1a1a1a', border: '0.5px solid #2a2a2a',
    borderRadius: 8, padding: '10px 12px', color: C.tx, fontSize: 13, outline: 'none',
    fontFamily: 'Manrope, sans-serif',
  }

  const [y, m, d] = date.split('-')
  const dateLabel = `${d}/${m}/${y}`

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,.7)', display:'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent:'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:C.card, border:'1px solid '+C.border, borderRadius: isMobile ? '18px 18px 0 0' : 14, padding: isMobile ? '24px 20px 32px' : 24, width:'100%', maxWidth: isMobile ? '100%' : 420, maxHeight:'92dvh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <span style={{ fontSize:15, fontWeight:700, color:C.tx }}>Novo registro · {dateLabel}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:C.dm }}><X size={18} /></button>
        </div>

        {/* Type toggle */}
        <div style={{ display:'flex', gap:6, marginBottom:14 }}>
          {(['entrada', 'gasto'] as const).map(t => (
            <button key={t} onClick={() => handleTypeChange(t)} style={{ flex:1, padding:'9px', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', border: type===t ? 'none' : '1px solid '+C.border, background: type===t ? (t==='entrada' ? 'rgba(52,211,153,.2)' : 'rgba(248,113,113,.2)') : 'transparent', color: type===t ? (t==='entrada' ? C.g : C.r) : C.dm }}>
              {t === 'entrada' ? '↑ Entrada' : '↓ Gasto'}
            </button>
          ))}
        </div>

        <label style={labelStyle}>Categoria</label>
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...fs, cursor:'pointer', colorScheme: 'dark' }}>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <label style={labelStyle}>Descrição</label>
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder={type==='entrada' ? 'Ex: Corrida turno manhã' : 'Ex: Gasolina posto BR'} style={fs} autoFocus />

        <label style={labelStyle}>Valor (R$)</label>
        <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" style={fs} />

        <label style={labelStyle}>Observações (opcional)</label>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="..." style={{ ...fs, marginBottom:20 }} />

        {err && <div style={{ color:C.r, fontSize:12, marginBottom:10 }}>{err}</div>}

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={handleSubmit} disabled={saving} style={{ flex:1, padding:'12px', borderRadius:10, background:'linear-gradient(135deg, #0EA5E9, #0284c7)', border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1 }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={onClose} style={{ padding:'12px 20px', borderRadius:10, background:'rgba(255,255,255,.04)', border:'1px solid '+C.border, color:C.dm, fontSize:13, cursor:'pointer' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

/* Moto Tab component */
function MotoTab() {
  const today   = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const { data: records = [], isLoading, addRecord, deleteRecord } = useMotoRevenue(year, month)

  const [addModal, setAddModal] = useState<{ date: string } | null>(null)
  const [expandedWeek,  setExpandedWeek]  = useState<number | null>(0)
  const [expandedDay,   setExpandedDay]   = useState<string | null>(null)

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
  }
  function goToday() { setYear(today.getFullYear()); setMonth(today.getMonth()) }

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

  /* summary */
  const entradas  = records.filter(r => r.kind === 'entrada').reduce((s, r) => s + r.amount_cents, 0)
  const gastos    = records.filter(r => r.kind === 'gasto').reduce((s, r) => s + r.amount_cents, 0)
  const resultado = entradas - gastos

  /* build weeks: segunda a domingo seguindo o calendário real */
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const pad = (n: number) => String(n).padStart(2, '0')
  const weeks: { weekNum: number; days: string[] }[] = []
  let weekNum = 1
  let currentWeek: string[] = []

  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`
    const dow = new Date(dateStr + 'T12:00:00').getDay() // 0=dom, 1=seg, ..., 6=sab

    // Segunda-feira: fecha a semana anterior (se houver) e começa nova
    if (dow === 1 && currentWeek.length > 0) {
      weeks.push({ weekNum, days: currentWeek })
      weekNum++
      currentWeek = []
    }

    currentWeek.push(dateStr)

    // Domingo: fecha a semana atual
    if (dow === 0) {
      weeks.push({ weekNum, days: currentWeek })
      weekNum++
      currentWeek = []
    }
  }

  // Última semana parcial (termina antes do domingo)
  if (currentWeek.length > 0) {
    weeks.push({ weekNum, days: currentWeek })
  }

  /* by-day map */
  const byDay = records.reduce<Record<string, MotoRecord[]>>((acc, r) => {
    ;(acc[r.revenue_date] ??= []).push(r)
    return acc
  }, {})

  function fmtDay(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00')
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
  }

  function weekLabel(days: string[]): string {
    const first = new Date(days[0] + 'T12:00:00')
    const last  = new Date(days[days.length - 1] + 'T12:00:00')
    const m = MONTH_NAMES[month].substring(0, 3).toLowerCase()
    if (first.getMonth() === last.getMonth())
      return `${first.getDate()} a ${last.getDate()} de ${m}`
    return `${first.getDate()} a ${last.getDate()}`
  }

  function weekTotals(days: string[]) {
    const recs = days.flatMap(d => byDay[d] ?? [])
    const e = recs.filter(r => r.kind === 'entrada').reduce((s, r) => s + r.amount_cents, 0)
    const g = recs.filter(r => r.kind === 'gasto').reduce((s, r) => s + r.amount_cents, 0)
    return { e, g, res: e - g }
  }

  return (
    <div>
      {/* Month nav */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
        <button onClick={prevMonth} style={{ background:'none', border:'none', cursor:'pointer', color:C.dm, padding:'4px 6px', display:'flex' }}><ChevronLeft size={18} /></button>
        <span style={{ fontFamily:'JetBrains Mono, monospace', fontWeight:700, fontSize:14, color:C.tx, minWidth:140, textAlign:'center' }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button onClick={nextMonth} style={{ background:'none', border:'none', cursor:'pointer', color:C.dm, padding:'4px 6px', display:'flex' }}><ChevronRight size={18} /></button>
        {!isCurrentMonth && (
          <button onClick={goToday} style={{ marginLeft:4, padding:'5px 12px', background:'rgba(14,165,233,.1)', border:'1px solid rgba(14,165,233,.25)', borderRadius:8, color:C.b, fontSize:11, cursor:'pointer' }}>
            Hoje
          </button>
        )}
      </div>

      {/* Summary tiles */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap:10, marginBottom:22 }}>
        <div style={{ background:C.card, borderRadius:12, padding:'16px 18px', border:'1px solid '+C.border }}>
          <div style={{ color:C.dm, fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Entradas</div>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'clamp(11px, 3vw, 15px)', fontWeight:700, color:C.g }}>{fmt(entradas)}</div>
        </div>
        <div style={{ background:C.card, borderRadius:12, padding:'16px 18px', border:'1px solid '+C.border }}>
          <div style={{ color:C.dm, fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Gastos</div>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'clamp(11px, 3vw, 15px)', fontWeight:700, color:C.r }}>{fmt(gastos)}</div>
        </div>
        <div style={{ background:C.card, borderRadius:12, padding:'16px 18px', border:'1px solid '+C.border }}>
          <div style={{ color:C.dm, fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Resultado</div>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'clamp(11px, 3vw, 15px)', fontWeight:700, color:resultado >= 0 ? C.g : C.r }}>{fmt(resultado)}</div>
        </div>
      </div>

      {/* Weeks */}
      {isLoading ? (
        <div style={{ textAlign:'center', padding:'40px', color:C.dm }}>Carregando...</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {weeks.map(({ weekNum, days }) => {
            const wt = weekTotals(days)
            const isExpanded = expandedWeek === weekNum
            return (
              <div key={weekNum} style={{ background:C.card, borderRadius:12, border:'1px solid '+C.border, overflow:'hidden' }}>
                {/* Week header */}
                <button
                  onClick={() => setExpandedWeek(isExpanded ? null : weekNum)}
                  style={{
                    width: '100%', display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'none', border: 'none',
                    cursor: 'pointer', gap: 8,
                  }}
                >
                  <span style={{ fontSize:13, fontWeight:700, color:C.tx, whiteSpace:'nowrap' }}>
                    Semana {weekNum}
                  </span>
                  <span style={{ fontSize:11, color:C.dm, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'left' }}>
                    {weekLabel(days)}
                  </span>
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:C.g, fontFamily:'JetBrains Mono, monospace', whiteSpace:'nowrap' }}>
                      +{fmt(wt.e)}
                    </span>
                    <span style={{ fontSize:11, fontWeight:700, color:C.r, fontFamily:'JetBrains Mono, monospace', whiteSpace:'nowrap' }}>
                      -{fmt(wt.g)}
                    </span>
                    <span style={{ fontSize:11, fontWeight:700, color:wt.res >= 0 ? C.g : C.r, fontFamily:'JetBrains Mono, monospace', whiteSpace:'nowrap' }}>
                      {fmt(wt.res)}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                      style={{ transform:isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition:'transform .2s', flexShrink:0, color:C.dm }}>
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </button>

                {/* Day rows */}
                {isExpanded && (
                  <div style={{ borderTop:'1px solid '+C.border }}>
                    {days.map(dateStr => {
                      const dayRecs = byDay[dateStr] ?? []
                      const dayE = dayRecs.filter(r => r.kind === 'entrada').reduce((s, r) => s + r.amount_cents, 0)
                      const dayG = dayRecs.filter(r => r.kind === 'gasto').reduce((s, r) => s + r.amount_cents, 0)
                      const dayRes = dayE - dayG
                      const isToday = dateStr === todayStr
                      const isDayExpanded = expandedDay === dateStr

                      return (
                        <div key={dateStr} style={{ borderBottom:'1px solid '+C.border }}>
                          {/* Day row */}
                          <div
                            style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', background: isToday ? 'rgba(14,165,233,.06)' : 'transparent', cursor: dayRecs.length > 0 ? 'pointer' : 'default' }}
                            onClick={() => dayRecs.length > 0 && setExpandedDay(isDayExpanded ? null : dateStr)}
                          >
                            <span style={{ fontSize:12, fontFamily:'JetBrains Mono, monospace', color: isToday ? C.b : C.dm, fontWeight: isToday ? 700 : 400, minWidth:48 }}>
                              {fmtDay(dateStr)}
                            </span>
                            <span style={{ flex:1 }} />
                            {dayE > 0 && <span style={{ fontSize:11, color:C.g, fontFamily:'JetBrains Mono, monospace' }}>+{fmt(dayE)}</span>}
                            {dayG > 0 && <span style={{ fontSize:11, color:C.r, fontFamily:'JetBrains Mono, monospace' }}>-{fmt(dayG)}</span>}
                            {(dayE > 0 || dayG > 0) && <span style={{ fontSize:11, fontWeight:700, fontFamily:'JetBrains Mono, monospace', color: dayRes >= 0 ? C.g : C.r, minWidth:70, textAlign:'right' }}>{fmt(dayRes)}</span>}
                            {!(dayE > 0 || dayG > 0) && <span style={{ fontSize:11, color:C.dm2, minWidth:70, textAlign:'right' }}>—</span>}
                            <button
                              onClick={e => { e.stopPropagation(); setAddModal({ date: dateStr }) }}
                              style={{ background:'rgba(14,165,233,.1)', border:'1px solid rgba(14,165,233,.25)', borderRadius:6, cursor:'pointer', color:C.b, padding:'3px 8px', fontSize:12, marginLeft:4, flexShrink:0 }}
                              title="Adicionar registro"
                            >
                              +
                            </button>
                          </div>

                          {/* Expanded day records */}
                          {isDayExpanded && dayRecs.length > 0 && (
                            <div style={{ background:'rgba(0,0,0,.2)', padding:'8px 16px 10px 32px' }}>
                              {dayRecs.map(r => (
                                <div key={r.id} style={{ display:'flex', alignItems:'center', gap:8, paddingTop:5, paddingBottom:5, borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                                  <span style={{ fontSize:10, padding:'1px 6px', borderRadius:8, background: r.kind==='entrada' ? 'rgba(52,211,153,.12)' : 'rgba(248,113,113,.12)', color: r.kind==='entrada' ? C.g : C.r, flexShrink:0 }}>
                                    {r.category}
                                  </span>
                                  <span style={{ flex:1, fontSize:12, color:C.dm }}>{r.description}</span>
                                  <span style={{ fontSize:12, fontFamily:'JetBrains Mono, monospace', fontWeight:700, color: r.kind==='entrada' ? C.g : C.r, flexShrink:0 }}>
                                    {r.kind === 'entrada' ? '+' : '-'}{fmt(r.amount_cents)}
                                  </span>
                                  <button
                                    onClick={() => deleteRecord.mutate(r.id)}
                                    style={{ color:C.dm2, fontSize:14, cursor:'pointer', background:'none', border:'none', flexShrink:0, padding:'0 4px' }}
                                    title="Excluir"
                                  >×</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add modal */}
      {addModal && (
        <MotoAddModal
          date={addModal.date}
          onClose={() => setAddModal(null)}
          onSave={r => {
            addRecord.mutate(r, { onSuccess: () => setAddModal(null), onError: () => {} })
          }}
        />
      )}
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

  const [tab, setTab] = useState<'faturas' | 'moto'>('faturas')

  return (
    <div style={{ fontFamily: 'Manrope, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16, flexWrap: 'wrap', gap: 12,
      }}>
        <h1 style={{
          fontFamily: 'Sora, sans-serif', fontWeight: 800,
          fontSize: 26, letterSpacing: '-0.03em', margin: 0,
        }}>
          Faturamento
        </h1>
        {tab === 'faturas' && (
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
        )}
      </div>

      {/* ── Tab switcher ── */}
      <div style={{ display:'flex', gap:2, marginBottom:22, background:C.card, borderRadius:10, border:'1px solid '+C.border, padding:4, width:'fit-content' }}>
        {(['faturas','moto'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:'7px 18px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500, background: tab===t ? C.card2 : 'transparent', border: tab===t ? '1px solid rgba(255,255,255,.08)' : '1px solid transparent', color: tab===t ? C.tx : C.dm, transition:'all .15s' }}>
            {t === 'faturas' ? 'Faturas' : 'Moto'}
          </button>
        ))}
      </div>

      {/* ── Moto tab ── */}
      {tab === 'moto' && <MotoTab />}

      {/* ── Faturas content ── */}
      {tab === 'faturas' && <>

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

      </>}

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
