import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/db'

type Tx = Database['public']['Tables']['transactions']['Row']

/* ── Palette ──────────────────────────────────────────────────── */
const C = {
  bg:     '#0a0a0a',
  card:   '#111111',
  border: '#1f1f1f',
  tx:     '#ffffff',
  dm:     '#888888',
  dm2:    '#444444',
  b:      '#0EA5E9',
  g:      '#34d399',
  r:      '#f87171',
  a:      '#fbbf24',
}

const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

/* ── Helpers ──────────────────────────────────────────────────── */
function fmt(v: number): string {
  const a = Math.abs(v)
  const f = a.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return v < 0 ? `-R$ ${f}` : `R$ ${f}`
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function padDay(n: number): string {
  return String(n).padStart(2, '0')
}

/* ── View-type config ─────────────────────────────────────────── */
type ViewType = 'T' | 'E' | 'S' | 'D'

const VIEW_TYPES: { id: ViewType; label: string; color: string }[] = [
  { id: 'T', label: 'Todos',    color: C.dm  },
  { id: 'E', label: 'Entradas', color: C.g   },
  { id: 'S', label: 'Saídas',   color: C.r   },
  { id: 'D', label: 'Diário',   color: C.a   },
]

/* ── useTransactions ──────────────────────────────────────────── */
function useTransactions(year: number, month: number) {
  const mm   = String(month + 1).padStart(2, '0')
  const last = String(daysInMonth(year, month)).padStart(2, '0')
  const start = `${year}-${mm}-01`
  const end   = `${year}-${mm}-${last}`

  return useQuery({
    queryKey: ['transactions', year, month],
    queryFn: async () => {
      const { data, error } = await (supabase.from('transactions') as any)
        .select('*')
        .gte('occurred_at', start)
        .lte('occurred_at', end)
        .order('occurred_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Tx[]
    },
  })
}

/* ── AddModal ─────────────────────────────────────────────────── */
function AddModal({
  day, year, month, onClose,
}: {
  day: number; year: number; month: number; onClose: () => void
}) {
  const qc = useQueryClient()
  const [desc,     setDesc]     = useState('')
  const [amount,   setAmount]   = useState('')
  const [kind,     setKind]     = useState<'out' | 'in'>('out')
  const [category, setCategory] = useState('')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${padDay(day)}`
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  async function save() {
    const v = parseFloat(amount.replace(',', '.'))
    if (!desc.trim())      { setError('Preencha a descrição'); return }
    if (isNaN(v) || v <= 0) { setError('Valor inválido');       return }
    setSaving(true)
    setError('')
    const { error: dbErr } = await (supabase.from('transactions') as any).insert({
      description: desc.trim(),
      amount_cents: v,
      kind,
      category: category.trim() || null,
      occurred_at: dateStr,
    })
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    qc.invalidateQueries({ queryKey: ['transactions'] })
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0,0,0,.65)',
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
          borderRadius: isMobile ? '16px 16px 0 0' : 14,
          padding: 24,
          width: '100%',
          maxWidth: isMobile ? '100%' : 380,
        }}
      >
        {/* title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.tx }}>
            Adicionar — {padDay(day)}/{String(month + 1).padStart(2, '0')}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.dm, display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* kind */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['out', 'in'] as const).map(k => {
            const active = kind === k
            const col    = k === 'in' ? C.g : C.r
            return (
              <button
                key={k}
                onClick={() => setKind(k)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  border:     active ? `1px solid ${col}60` : `1px solid ${C.border}`,
                  background: active ? col + '18' : 'transparent',
                  color:      active ? col : C.dm,
                }}
              >
                {k === 'in' ? 'Entrada' : 'Saída'}
              </button>
            )
          })}
        </div>

        {/* description */}
        <input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          placeholder="Descrição..."
          autoFocus
          style={inputStyle}
        />

        {/* amount */}
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          placeholder="Valor R$"
          style={inputStyle}
        />

        {/* category */}
        <input
          value={category}
          onChange={e => setCategory(e.target.value)}
          placeholder="Categoria (ex: cartao, variavel)"
          style={{ ...inputStyle, marginBottom: 20 }}
        />

        {error && (
          <div style={{ color: C.r, fontSize: 12, marginBottom: 12, marginTop: -8 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              flex: 1, padding: 12,
              background: 'linear-gradient(135deg, #34d399, #059669)',
              border: 'none', borderRadius: 10, color: '#fff',
              fontSize: 13, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: 12,
              background: 'rgba(255,255,255,.03)',
              border: '1px solid ' + C.border,
              borderRadius: 10, color: C.dm, fontSize: 13, cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', marginBottom: 12, boxSizing: 'border-box',
  background: 'rgba(255,255,255,.05)',
  border: '1px solid ' + C.border,
  borderRadius: 8, padding: '10px 12px',
  color: C.tx, fontSize: 13, outline: 'none',
}

/* ── DiarioTab ─────────────────────────────────────────────────── */
function DiarioTab({ txs, year, month, todayDate }: {
  txs: Tx[]; year: number; month: number; todayDate: Date
}) {
  const [viewType, setViewType] = useState<ViewType>('T')
  const [addDay,   setAddDay]   = useState<number | null>(null)
  const [typeOpen, setTypeOpen] = useState(false)

  const numDays      = daysInMonth(year, month)
  const isCurrMonth  = year === todayDate.getFullYear() && month === todayDate.getMonth()
  const viewCfg      = VIEW_TYPES.find(v => v.id === viewType)!

  /* Group transactions by day */
  const byDay = useMemo(() => {
    const map: Record<number, Tx[]> = {}
    for (let d = 1; d <= numDays; d++) map[d] = []
    txs.forEach(t => {
      const d = parseInt(t.occurred_at.slice(8, 10))
      if (d >= 1 && d <= numDays) map[d].push(t)
    })
    return map
  }, [txs, numDays])

  /* Compute running balance + per-day display value */
  const rows = useMemo(() => {
    let balance = 0
    return Array.from({ length: numDays }, (_, i) => {
      const day    = i + 1
      const dayTxs = byDay[day] ?? []

      // net affects running balance regardless of filter
      const netAll = dayTxs.reduce(
        (s, t) => (t.kind === 'in' ? s + t.amount_cents : s - t.amount_cents),
        0,
      )
      balance = Math.round((balance + netAll) * 100) / 100

      // filtered value for the middle column
      const filtered = dayTxs.filter(t => {
        if (viewType === 'E') return t.kind === 'in'
        if (viewType === 'S') return t.kind === 'out'
        if (viewType === 'D') return t.kind === 'out' && t.category === 'variavel'
        return true // T
      })
      const filteredVal = filtered.reduce(
        (s, t) => (t.kind === 'in' ? s + t.amount_cents : s - t.amount_cents),
        0,
      )

      return { day, balance, filteredVal }
    })
  }, [byDay, numDays, viewType])

  function balanceStyle(v: number): { bg: string; color: string } {
    if (v > 0) return { bg: 'rgba(52,211,153,.15)',  color: '#4ade80' }
    if (v < 0) return { bg: 'rgba(248,113,113,.15)', color: C.r }
    return { bg: 'transparent', color: C.dm2 }
  }

  const colLabel = viewType === 'T' ? 'LÍQUIDO' : viewCfg.label.toUpperCase()

  return (
    <div>
      {/* Type dropdown */}
      <div style={{ marginBottom: 14, position: 'relative', display: 'inline-block' }}>
        <button
          onClick={() => setTypeOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px',
            background: C.card, border: '1px solid ' + C.border,
            borderRadius: 8, cursor: 'pointer',
            color: viewCfg.color, fontSize: 13, fontWeight: 600,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: viewCfg.color, flexShrink: 0 }} />
          {viewCfg.label}
          <ChevronDown size={14} style={{ opacity: 0.6 }} />
        </button>

        {typeOpen && (
          <>
            {/* backdrop */}
            <div
              onClick={() => setTypeOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 90 }}
            />
            <div style={{
              position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: 4,
              background: '#1a1a1a', border: '1px solid ' + C.border, borderRadius: 10,
              overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,.5)', minWidth: 170,
            }}>
              {VIEW_TYPES.map(vt => (
                <button
                  key={vt.id}
                  onClick={() => { setViewType(vt.id); setTypeOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '12px 16px',
                    background: viewType === vt.id ? vt.color + '18' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    color: viewType === vt.id ? vt.color : C.dm,
                    fontSize: 13, fontWeight: viewType === vt.id ? 600 : 400,
                    textAlign: 'left',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: vt.color, flexShrink: 0 }} />
                  {vt.label}
                  {viewType === vt.id && (
                    <Check size={14} style={{ marginLeft: 'auto', flexShrink: 0 }} />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Table */}
      <div style={{ background: C.card, borderRadius: 10, border: '1px solid ' + C.border, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid ' + C.border }}>
              <th style={thStyle('left')}>DIA</th>
              <th style={{ ...thStyle('right'), color: viewCfg.color }}>{colLabel}</th>
              <th style={thStyle('right')}>SALDO</th>
              <th style={{ ...thStyle('center'), width: 48, color: C.g }}>+</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const isToday = isCurrMonth && row.day === todayDate.getDate()
              const bs      = balanceStyle(row.balance)
              const isZero  = Math.abs(row.filteredVal) < 0.001

              /* color for middle column */
              let valColor = viewCfg.color
              if (viewType === 'T') valColor = row.filteredVal >= 0 ? C.g : C.r

              return (
                <tr
                  key={row.day}
                  style={{
                    borderBottom: '1px solid ' + C.border,
                    background: isToday ? 'rgba(14,165,233,.08)' : 'transparent',
                  }}
                >
                  {/* day */}
                  <td style={{
                    padding: '10px 14px',
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
                    fontWeight: isToday ? 700 : 400,
                    color: isToday ? C.b : C.dm,
                  }}>
                    {padDay(row.day)}
                    {isToday && (
                      <span style={{ marginLeft: 6, fontSize: 9, color: C.b, opacity: 0.7 }}>hoje</span>
                    )}
                  </td>

                  {/* filtered value */}
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    {isZero ? (
                      <span style={{ color: C.dm2, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                        R$ 0,00
                      </span>
                    ) : (
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: valColor }}>
                        {fmt(Math.abs(row.filteredVal))}
                      </span>
                    )}
                  </td>

                  {/* running balance */}
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
                      padding: '3px 8px', borderRadius: 5,
                      background: bs.bg, color: bs.color,
                    }}>
                      {fmt(row.balance)}
                    </span>
                  </td>

                  {/* + button */}
                  <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                    <button
                      onClick={() => setAddDay(row.day)}
                      style={{
                        background: 'rgba(52,211,153,.12)',
                        border: '1px solid rgba(52,211,153,.3)',
                        borderRadius: 6, cursor: 'pointer',
                        color: C.g, padding: '4px 9px',
                        fontSize: 15, fontWeight: 700, lineHeight: 1,
                      }}
                    >
                      +
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {addDay !== null && (
        <AddModal
          day={addDay} year={year} month={month}
          onClose={() => setAddDay(null)}
        />
      )}
    </div>
  )
}

const thStyle = (align: 'left' | 'right' | 'center'): React.CSSProperties => ({
  padding: '10px 14px',
  textAlign: align,
  color: C.dm,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '.06em',
})

/* ── TxRow ─────────────────────────────────────────────────────── */
function TxRow({ tx, onDelete }: { tx: Tx; onDelete: () => void }) {
  const day   = tx.occurred_at.slice(8, 10)
  const isIn  = tx.kind === 'in'
  const color = isIn ? C.g : C.r

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderBottom: '1px solid ' + C.border,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: color + '15',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
        color,
      }}>
        {day}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, color: C.tx, fontWeight: 500,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {tx.description}
        </div>
        {tx.category && (
          <div style={{ fontSize: 10, color: C.dm, marginTop: 2 }}>{tx.category}</div>
        )}
      </div>

      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700,
        color, flexShrink: 0,
      }}>
        {isIn ? '+' : '-'}{fmt(tx.amount_cents)}
      </div>

      <button
        onClick={onDelete}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: C.dm2, padding: 4, flexShrink: 0, display: 'flex',
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}

/* ── ListTab ────────────────────────────────────────────────────── */
function ListTab({
  txs, emptyMsg,
}: {
  txs: Tx[]; emptyMsg: string; year: number; month: number
}) {
  const qc = useQueryClient()

  async function deleteTx(id: string) {
    await (supabase.from('transactions') as any).delete().eq('id', id)
    qc.invalidateQueries({ queryKey: ['transactions'] })
  }

  const total = txs.reduce(
    (s, t) => (t.kind === 'in' ? s + t.amount_cents : s - t.amount_cents),
    0,
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: C.dm }}>
          {txs.length} {txs.length === 1 ? 'lançamento' : 'lançamentos'}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: total >= 0 ? C.g : C.r }}>
          {fmt(total)}
        </span>
      </div>

      {txs.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          color: C.dm, fontSize: 13,
          background: C.card, borderRadius: 10, border: '1px solid ' + C.border,
        }}>
          {emptyMsg}
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: 10, border: '1px solid ' + C.border, overflow: 'hidden' }}>
          {txs.map(tx => (
            <TxRow key={tx.id} tx={tx} onDelete={() => deleteTx(tx.id)} />
          ))}
        </div>
      )}

    </div>
  )
}

/* ── Main ───────────────────────────────────────────────────────── */
export function FinancePage() {
  const now   = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [tab,   setTab]   = useState<'diario' | 'entradas' | 'despesas' | 'cartoes'>('diario')

  const { data: txs = [], isLoading } = useTransactions(year, month)

  const TABS = [
    { id: 'diario',   label: 'Diário'   },
    { id: 'entradas', label: 'Entradas' },
    { id: 'despesas', label: 'Despesas' },
    { id: 'cartoes',  label: 'Cartões'  },
  ] as const

  const entradas = txs.filter(t => t.kind === 'in')
  const despesas = txs.filter(t => t.kind === 'out')
  const cartoes  = txs.filter(t => t.category === 'cartao')

  const totalIn  = entradas.reduce((s, t) => s + t.amount_cents, 0)
  const totalOut = despesas.reduce((s, t) => s + t.amount_cents, 0)
  const resultado = totalIn - totalOut

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  return (
    <div style={{ fontFamily: 'Manrope, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 10,
      }}>
        <h1 style={{
          fontFamily: 'Sora, sans-serif', fontWeight: 800,
          fontSize: 26, letterSpacing: '-0.03em', margin: 0,
        }}>
          Financeiro
        </h1>

        {/* Month navigator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          background: C.card, border: '1px solid ' + C.border,
          borderRadius: 10, padding: '4px 6px',
        }}>
          <button onClick={prevMonth} style={navBtnStyle}>‹</button>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700,
            color: C.tx, minWidth: 90, textAlign: 'center',
          }}>
            {MONTHS_SHORT[month]} {year}
          </span>
          <button onClick={nextMonth} style={navBtnStyle}>›</button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10, marginBottom: 18,
      }}>
        {[
          { label: 'Entradas',  value: totalIn,   color: C.g },
          { label: 'Despesas',  value: totalOut,   color: C.r },
          { label: 'Resultado', value: resultado,  color: resultado >= 0 ? C.g : C.r },
        ].map(s => (
          <div key={s.label} style={{
            background: C.card, borderRadius: 10,
            padding: '14px 16px', border: '1px solid ' + C.border,
          }}>
            <div style={{
              color: C.dm, fontSize: 10, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6,
            }}>
              {s.label}
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 14, fontWeight: 700, color: s.color,
            }}>
              {fmt(s.value)}
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: 2, marginBottom: 18, overflowX: 'auto',
        background: C.card, border: '1px solid ' + C.border,
        borderRadius: 10, padding: 4,
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t.id ? 600 : 400, whiteSpace: 'nowrap',
              background: tab === t.id ? 'rgba(14,165,233,.15)' : 'transparent',
              border:     tab === t.id ? '1px solid rgba(14,165,233,.3)' : '1px solid transparent',
              color:      tab === t.id ? C.b : C.dm,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: C.dm, fontSize: 13 }}>
          Carregando...
        </div>
      ) : (
        <>
          {tab === 'diario' && (
            <DiarioTab txs={txs} year={year} month={month} todayDate={now} />
          )}
          {tab === 'entradas' && (
            <ListTab
              txs={entradas}
              emptyMsg="Nenhuma entrada este mês"
              year={year} month={month}
            />
          )}
          {tab === 'despesas' && (
            <ListTab
              txs={despesas}
              emptyMsg="Nenhuma despesa este mês"
              year={year} month={month}
            />
          )}
          {tab === 'cartoes' && (
            <ListTab
              txs={cartoes}
              emptyMsg="Nenhum lançamento de cartão este mês"
              year={year} month={month}
            />
          )}
        </>
      )}
    </div>
  )
}

const navBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: C.dm,
  cursor: 'pointer', fontSize: 20, padding: '2px 8px', lineHeight: 1,
}
