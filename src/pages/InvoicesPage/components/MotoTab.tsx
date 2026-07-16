import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { MotoRecord } from '../types'
import { C, MONTH_NAMES } from '../constants'
import { fmt } from '../utils'
import { useMotoRevenue } from '../hooks/useMotoRevenue'
import { MotoAddModal } from './MotoAddModal'

/* Moto Tab component */
export function MotoTab() {
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
                                    aria-label="Excluir lançamento"
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
