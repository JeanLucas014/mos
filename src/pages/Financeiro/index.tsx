import { useState, useMemo, useEffect, useCallback, useRef, Component } from 'react'
import {
  ComposedChart, Bar, Line, Area, AreaChart, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'
import { supabase } from '../../lib/supabase'

/* ─── MOS colour palette (matches tailwind.config) ─────────────────── */
const C = {
  bg: '#0a0a0a', card: '#111111', card2: '#161616',
  border: '#1f1f1f', bL: '#2a2a2a',
  tx: '#ffffff', dm: '#888888', dm2: '#444444',
  b: '#0EA5E9', bB: 'rgba(14,165,233,.12)',
  g: '#34d399', gB: 'rgba(52,211,153,.1)',
  r: '#f87171', rB: 'rgba(248,113,113,.08)',
  p: '#a78bfa', pB: 'rgba(167,139,250,.1)',
  a: '#fbbf24', aB: 'rgba(251,191,36,.08)',
}

const PC = ['#8b5cf6','#f59e0b','#06b6d4','#f97316','#ec4899','#10b981','#f43f5e','#14b8a6','#eab308']
const MS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MSH = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const fmt = (v: number | null | undefined) => {
  if (v == null) return 'R$ 0,00'
  const a = Math.abs(v)
  const f = a.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return v < 0 ? `-R$ ${f}` : `R$ ${f}`
}
const fmtS = (v: number) => {
  if (!v) return '0'
  const a = Math.abs(v)
  return a >= 1000 ? `${v < 0 ? '-' : ''}${(a / 1000).toFixed(1)}k` : v.toFixed(0)
}

let _id = Date.now()
const uid = () => String(_id++)

/* ─── Types ─────────────────────────────────────────────────────────── */
interface Item { id: string; nome: string; valor: number; dataPg?: string; prioridade?: string; pago?: boolean; cartao?: string; subs?: SubItem[] }
interface SubItem { id?: string; nome: string; valor: number }
interface MonthData { entradas: Item[]; fixas: Item[]; variaveis: Item[]; cartoes_itens: Item[]; [key: string]: Item[] }
interface Avulso { id: string; dia: number; nome: string; valor: number; tipo: string }
interface Meta { id: string; nome: string; target: number; atual: number; aportes?: { valor: number; data: string }[] }
interface Investimento { id: string; nome: string; tipo: string; subtipo: string; banco: string; valor: number; taxaTipo?: string; taxaValor?: number; taxaFixa?: number; dataAplicacao?: string; vencimento?: string; ticker?: string; quantidade?: number; precoPago?: number; precoAtual?: number; aportes?: { valor: number; data: string }[] }
interface Divida { id: string; nome: string; parcela: number; inicio: number; fim: number }

/* ─── Empty builders ─────────────────────────────────────────────────── */
function buildEmptyMonths(): Record<string, MonthData> {
  const d: Record<string, MonthData> = {}
  for (let i = 0; i < 12; i++) d[MS[i]] = { entradas: [], fixas: [], variaveis: [], cartoes_itens: [] }
  return d
}
/* ─── Small shared UI components ─────────────────────────────────────── */
function ENum({ value, onChange, color, w }: { value: number; onChange: (v: number) => void; color?: string; w?: number }) {
  const [ed, setEd] = useState(false)
  const [tmp, setTmp] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (ed && ref.current) ref.current.select() }, [ed])
  const commit = () => {
    setEd(false)
    const n = parseFloat(tmp.replace(',', '.'))
    if (!isNaN(n) && n !== value) onChange(n)
  }
  if (ed) return (
    <input ref={ref} value={tmp} onChange={e => setTmp(e.target.value)}
      onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEd(false) }}
      style={{ background: 'rgba(14,165,233,.15)', border: '1px solid ' + C.b, borderRadius: 4, color: C.tx, padding: '2px 6px', fontSize: 11, fontFamily: 'JetBrains Mono,monospace', width: w || 75, outline: 'none', textAlign: 'right' }} />
  )
  return (
    <span onClick={() => { setTmp(String(value || 0)); setEd(true) }}
      style={{ cursor: 'pointer', color: color || C.tx, fontFamily: 'JetBrains Mono,monospace', fontSize: 12, padding: '4px 6px', borderRadius: 4, minHeight: 28, display: 'inline-flex', alignItems: 'center' }}>
      {fmt(value)}
    </span>
  )
}

function EText({ value, onChange, placeholder, w }: { value: string; onChange: (v: string) => void; placeholder?: string; w?: number }) {
  const [ed, setEd] = useState(false)
  const [tmp, setTmp] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (ed && ref.current) ref.current.focus() }, [ed])
  const commit = () => { setEd(false); if (tmp !== value) onChange(tmp) }
  if (ed) return (
    <input ref={ref} value={tmp} onChange={e => setTmp(e.target.value)}
      onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEd(false) }}
      style={{ background: 'rgba(14,165,233,.15)', border: '1px solid ' + C.b, borderRadius: 4, color: C.tx, padding: '2px 6px', fontSize: 11, width: w || 120, outline: 'none' }}
      placeholder={placeholder} />
  )
  return <span onClick={() => { setTmp(value || ''); setEd(true) }} style={{ cursor: 'pointer', color: value ? C.tx : C.dm2, fontSize: 11, padding: '2px 4px' }}>{value || placeholder}</span>
}

function Stat({ label, value, color, sub }: { label: string; value: number | string; color: string; sub?: string }) {
  return (
    <div style={{ background: C.card, borderRadius: 10, padding: '16px 18px', border: '1px solid ' + C.border, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 14, right: 14, width: 7, height: 7, borderRadius: '50%', background: color }} />
      <div style={{ color: C.dm, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'JetBrains Mono,monospace' }}>{typeof value === 'number' ? fmt(value) : value}</div>
      {sub && <div style={{ color: C.dm2, fontSize: 10, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: C.card, borderRadius: 10, border: '1px solid ' + C.border, overflow: 'hidden', marginBottom: 14 }}>
      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid ' + C.border }}>
        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.tx }}>{title}</h3>
        {action}
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  )
}

function Btn({ children, onClick, color, small }: { children: React.ReactNode; onClick: () => void; color?: string; small?: boolean }) {
  const c = color || C.b
  return (
    <button onClick={onClick} style={{ background: c + '20', border: '1px solid ' + c + '40', color: c, padding: small ? '4px 8px' : '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: small ? 10 : 11, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {children}
    </button>
  )
}

function DayPicker({ value, onChange, numDays }: { value: string; onChange: (v: string) => void; numDays: number }) {
  const [open, setOpen] = useState(false)
  const val = parseInt(value) || 0
  const days = Array.from({ length: numDays || 31 }, (_, i) => i + 1)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(!open)} style={{ background: val > 0 ? C.bB : 'rgba(255,255,255,.03)', border: '1px solid ' + (val > 0 ? C.b + '50' : C.border), borderRadius: 6, padding: '4px 8px', color: val > 0 ? C.b : C.dm2, fontSize: 11, cursor: 'pointer', minWidth: 36, textAlign: 'center', fontFamily: 'JetBrains Mono,monospace' }}>
        {val > 0 ? (val < 10 ? '0' + val : val) : '—'}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: '#1a1a1a', border: '1px solid ' + C.border, borderRadius: 10, padding: 8, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,.6)', width: 210 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {days.map(d => (
              <button key={d} onClick={() => { onChange(String(d)); setOpen(false) }}
                style={{ background: d === val ? C.b : 'transparent', border: 'none', borderRadius: 4, padding: '5px 2px', color: d === val ? '#fff' : C.dm, fontSize: 11, cursor: 'pointer', fontWeight: d === val ? 700 : 400 }}>{d}</button>
            ))}
          </div>
          <button onClick={() => { onChange(''); setOpen(false) }} style={{ width: '100%', marginTop: 4, padding: 4, background: 'rgba(255,255,255,.03)', border: '1px solid ' + C.border, borderRadius: 4, color: C.dm2, fontSize: 9, cursor: 'pointer' }}>Limpar</button>
        </div>
      )}
    </div>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: C.card, border: '1px solid ' + C.bL, borderRadius: 8, padding: '10px 14px', fontSize: 12, boxShadow: '0 8px 32px rgba(0,0,0,.5)' }}>
      <p style={{ color: C.tx, fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, margin: '3px 0' }}>{p.name}: {fmt(p.value)}</p>)}
    </div>
  )
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 40, textAlign: 'center', color: C.r }}>
        <p style={{ fontSize: 12 }}>{this.state.error.message}</p>
        <button onClick={() => this.setState({ error: null })} style={{ marginTop: 12, padding: '8px 16px', background: C.b, border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>Tentar novamente</button>
      </div>
    )
    return this.props.children
  }
}

/* ─── MonthTab ──────────────────────────────────────────────────────── */
function MonthTab({ month, data, cartaosList, onUpdate, onAddCartao, duplicarMes, forceTab }: {
  month: string; data: MonthData; cartaosList: string[]; onUpdate: (m: string, d: MonthData | ((p: MonthData) => MonthData)) => void;
  onAddCartao: () => void; duplicarMes: (m: string) => void; forceTab?: string
}) {
  const [tab, setTab] = useState('entradas')
  const activeTab = forceTab || tab
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const d = data || { entradas: [], fixas: [], variaveis: [], cartoes_itens: [] }
  const numDays = new Date(2026, MS.indexOf(month) + 1, 0).getDate()

  function addItem(cat: keyof MonthData) {
    const item: Item = { id: uid(), nome: '', valor: 0, dataPg: '', prioridade: 'normal', pago: false }
    if (cat === 'cartoes_itens') item.cartao = cartaosList[0] || 'Nubank'
    onUpdate(month, { ...d, [cat]: [...(d[cat] || []), item] })
  }
  function upItem(cat: keyof MonthData, id: string, f: string, v: unknown) {
    onUpdate(month, { ...d, [cat]: d[cat].map(it => it.id === id ? { ...it, [f]: v } : it) })
  }
  function rmItem(cat: keyof MonthData, id: string) {
    onUpdate(month, { ...d, [cat]: d[cat].filter(it => it.id !== id) })
  }
  function addSub(cat: keyof MonthData, id: string) {
    onUpdate(month, { ...d, [cat]: d[cat].map(it => it.id === id ? { ...it, subs: [...(it.subs || []), { id: uid(), nome: '', valor: 0 }] } : it) })
  }
  function upSub(cat: keyof MonthData, id: string, si: number, f: string, v: unknown) {
    onUpdate(month, { ...d, [cat]: d[cat].map(it => {
      if (it.id !== id) return it
      const subs = (it.subs || []).map((s, j) => j === si ? { ...s, [f]: v } : s)
      const total = subs.reduce((a, s) => a + (s.valor || 0), 0)
      return { ...it, subs, valor: total > 0 ? total : it.valor }
    }) })
  }
  function rmSub(cat: keyof MonthData, id: string, si: number) {
    onUpdate(month, { ...d, [cat]: d[cat].map(it => {
      if (it.id !== id) return it
      const subs = (it.subs || []).filter((_, j) => j !== si)
      return { ...it, subs, valor: subs.reduce((a, s) => a + s.valor, 0) || it.valor }
    }) })
  }
  function recur(cat: keyof MonthData, item: Item) {
    const mi = MS.indexOf(month)
    const opts = MS.slice(mi + 1).map((m, i) => `${mi + 2 + i} - ${m}`).join('\n')
    const choice = window.prompt(`Repetir '${item.nome || 'item'}' até qual mês?\n\n${opts}`, '12')
    if (!choice) return
    let endIdx = parseInt(choice) - 1
    if (isNaN(endIdx) || endIdx <= mi || endIdx > 11) endIdx = 11
    for (let i = mi + 1; i <= endIdx; i++) {
      const newItem = { ...item, id: uid() }
      delete (newItem as Item).subs
      onUpdate(MS[i], (p: MonthData) => ({ ...p, [cat]: [...(p[cat] || []), newItem] }))
    }
  }

  const totE = d.entradas.reduce((a, b) => a + (b.valor || 0), 0)
  const totF = d.fixas.reduce((a, b) => a + (b.valor || 0), 0)
  const totV = d.variaveis.reduce((a, b) => a + (b.valor || 0), 0)
  const totC = d.cartoes_itens.reduce((a, b) => a + (b.valor || 0), 0)
  const tabs = [
    { id: 'entradas', label: 'Entradas', color: C.g, t: totE },
    { id: 'fixas', label: 'Fixas', color: C.r, t: totF },
    { id: 'variaveis', label: 'Variáveis', color: C.a, t: totV },
    { id: 'cartoes_itens', label: 'Cartões', color: C.p, t: totC },
  ]
  const isCart = activeTab === 'cartoes_itens'
  const canExp = activeTab !== 'entradas'
  const cat = activeTab as keyof MonthData
  const items = [...(d[cat] || [])].sort((a, b) => (parseInt(a.dataPg || '') || 99) - (parseInt(b.dataPg || '') || 99))
  const clr = tabs.find(t => t.id === activeTab)?.color || C.b
  const priColors: Record<string, string> = { alta: C.r, normal: C.a, baixa: C.g }

  return (
    <div>
      {!forceTab && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 12 }}>
            <Stat label="Entradas" value={totE} color={C.g} />
            <Stat label="Fixas" value={totF} color={C.r} />
            <Stat label="Variáveis" value={totV} color={C.a} />
            <Stat label="Cartões" value={totC} color={C.p} />
            <Stat label="Resultado" value={totE - totF - totV - totC} color={totE - totF - totV - totC >= 0 ? C.g : C.r} />
          </div>
          <div style={{ marginBottom: 8 }}><Btn onClick={() => duplicarMes(month)} color={C.dm} small>↻ Copiar para próximo mês</Btn></div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 10, overflowX: 'auto' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab === t.id ? t.color + '18' : 'transparent', border: tab === t.id ? '1px solid ' + t.color + '40' : '1px solid transparent', color: tab === t.id ? t.color : C.dm, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, minHeight: 38, fontWeight: 500, whiteSpace: 'nowrap' }}>
                {t.label} <span style={{ fontSize: 9, opacity: 0.7 }}>({fmt(t.t)})</span>
              </button>
            ))}
          </div>
        </>
      )}
      <div style={{ overflowX: 'auto', background: C.card, borderRadius: 10, border: '1px solid ' + C.border }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid ' + C.border }}>
              {canExp && <th style={{ padding: '8px', width: 24 }}></th>}
              <th style={{ padding: '8px 10px', textAlign: 'center', color: C.dm2, fontSize: 10, width: 30 }}>ok</th>
              {isCart && <th style={{ padding: '8px', textAlign: 'left', color: C.dm, fontSize: 10, width: 85 }}>Cartão</th>}
              <th style={{ padding: '8px 10px', textAlign: 'left', color: C.dm2, fontSize: 10 }}>Nome</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', color: C.dm2, fontSize: 10, width: 110 }}>Valor</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', color: C.dm2, fontSize: 10, width: 50 }}>Dia</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', color: C.dm2, fontSize: 10, width: 35 }}>Pri</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', color: C.dm2, fontSize: 10, width: 90 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => {
              const isExp = expanded[it.id]
              const hasSubs = (it.subs || []).length > 0
              return [
                <tr key={it.id} style={{ opacity: it.pago ? 0.5 : 1, borderBottom: '1px solid ' + C.border }}>
                  {canExp && <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                    <button onClick={() => setExpanded(p => ({ ...p, [it.id]: !p[it.id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: C.b }}>{isExp ? '▼' : hasSubs ? '▶' : '·'}</button>
                  </td>}
                  <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                    <input type="checkbox" checked={!!it.pago} onChange={() => upItem(cat, it.id, 'pago', !it.pago)} style={{ cursor: 'pointer', width: 14, height: 14, accentColor: C.g }} />
                  </td>
                  {isCart && <td style={{ padding: '5px 8px' }}>
                    <select value={it.cartao || cartaosList[0]} onChange={e => upItem(cat, it.id, 'cartao', e.target.value)} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid ' + C.border, borderRadius: 4, color: C.tx, padding: '3px 6px', fontSize: 10, outline: 'none' }}>
                      {cartaosList.map(cc => <option key={cc} value={cc}>{cc}</option>)}
                    </select>
                  </td>}
                  <td style={{ padding: '5px 8px' }}><EText value={it.nome} onChange={v => upItem(cat, it.id, 'nome', v)} placeholder="Nome..." w={130} /></td>
                  <td style={{ padding: '5px 8px', textAlign: 'right' }}><ENum value={it.valor} onChange={v => upItem(cat, it.id, 'valor', v)} color={clr} /></td>
                  <td style={{ padding: '5px 4px', textAlign: 'center' }}><DayPicker value={it.dataPg || ''} onChange={v => upItem(cat, it.id, 'dataPg', v)} numDays={numDays} /></td>
                  <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                    <select value={it.prioridade || 'normal'} onChange={e => upItem(cat, it.id, 'prioridade', e.target.value)} style={{ background: 'none', border: 'none', fontSize: 10, color: priColors[it.prioridade || 'normal'], cursor: 'pointer', outline: 'none' }}>
                      <option value="alta">●</option><option value="normal">●</option><option value="baixa">●</option>
                    </select>
                  </td>
                  <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                    {canExp && <button onClick={() => addSub(cat, it.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, padding: 1, color: C.b }}>+</button>}
                    <button onClick={() => recur(cat, it)} title="Repetir" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: '4px 6px', color: C.dm }}>↻</button>
                    <button onClick={() => { if (window.confirm('Remover?')) rmItem(cat, it.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, padding: 1, color: C.r }}>×</button>
                  </td>
                </tr>,
                ...(canExp && isExp ? [
                  ...(it.subs || []).map((sub, si) => (
                    <tr key={it.id + '-sub-' + si} style={{ background: 'rgba(14,165,233,.03)', borderBottom: '1px solid ' + C.border + '60' }}>
                      <td style={{ padding: '3px 4px' }}></td>
                      {isCart && <td></td>}
                      <td style={{ padding: '3px 8px', paddingLeft: 28 }} colSpan={1}>
                        <span style={{ color: C.dm2, fontSize: 10, marginRight: 4 }}>└</span>
                        <EText value={sub.nome} onChange={v => upSub(cat, it.id, si, 'nome', v)} placeholder="Detalhe..." w={110} />
                      </td>
                      <td style={{ padding: '3px 8px', textAlign: 'right' }}><ENum value={sub.valor} onChange={v => upSub(cat, it.id, si, 'valor', v)} color={C.dm} w={65} /></td>
                      <td></td><td></td>
                      <td style={{ padding: '3px 4px', textAlign: 'center' }}>
                        <button onClick={() => rmSub(cat, it.id, si)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.dm2 }}>×</button>
                      </td>
                    </tr>
                  )),
                  <tr key={it.id + '-add'} style={{ background: 'rgba(14,165,233,.03)', borderBottom: '1px solid ' + C.border }}>
                    <td colSpan={canExp ? 7 : 6} style={{ padding: '3px 8px', paddingLeft: 36 }}>
                      <button onClick={() => addSub(cat, it.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: C.b }}>+ detalhe</button>
                    </td>
                  </tr>
                ] : []),
              ]
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <Btn onClick={() => addItem(cat)} color={clr} small>+ Adicionar</Btn>
        {isCart && <Btn onClick={onAddCartao} color={C.b} small>+ Novo Cartão</Btn>}
      </div>
    </div>
  )
}

/* ─── DiarioView ────────────────────────────────────────────────────── */
function DiarioView({ mes, months, avulsos, setAvulsos, updateMonth }: {
  mes: string; months: Record<string, MonthData>; avulsos: Record<string, Avulso[]>; setAvulsos: React.Dispatch<React.SetStateAction<Record<string, Avulso[]>>>; updateMonth: (m: string, d: MonthData | ((p: MonthData) => MonthData)) => void
}) {
  const [popup, setPopup] = useState<{ dia: number; tipo: string; items: Item[]; avulsos: Avulso[] } | null>(null)
  const [addPopup, setAddPopup] = useState<number | null>(null)
  const [addNome, setAddNome] = useState('')
  const [addVal, setAddVal] = useState('')
  const [addTipo, setAddTipo] = useState('saida')
  const md = months[mes] || { entradas: [], fixas: [], variaveis: [], cartoes_itens: [] }
  const mesIdx = MS.indexOf(mes)
  const numDays = new Date(2026, mesIdx + 1, 0).getDate()
  const mesAvulsos: Avulso[] = Array.isArray(avulsos[mes]) ? avulsos[mes] : []

  const mensalByDay = useMemo(() => {
    const map: Record<number, { entradas: Item[]; saidas: Item[] }> = {}
    for (let dd = 1; dd <= numDays; dd++) map[dd] = { entradas: [], saidas: [] }
    ;(md.entradas || []).forEach(it => {
      const dia = parseInt(it.dataPg || ''); if (dia >= 1 && dia <= numDays && it.valor > 0) map[dia].entradas.push(it)
    })
    ;['fixas', 'cartoes_itens'].forEach(cat => {
      ((md as Record<string, Item[]>)[cat] || []).forEach((it: Item) => {
        const dia = parseInt(it.dataPg || ''); if (dia >= 1 && dia <= numDays && it.valor > 0) map[dia].saidas.push(it)
      })
    })
    return map
  }, [md, numDays])

  const daySaldos = useMemo(() => {
    // carry from prev months
    let carry = 0
    for (let mi = 0; mi < mesIdx; mi++) {
      const pm = MS[mi], pmd = months[pm] || { entradas: [], fixas: [], variaveis: [], cartoes_itens: [] }
      const pnd = new Date(2026, mi + 1, 0).getDate()
      for (let pd = 1; pd <= pnd; pd++) {
        ;(pmd.entradas || []).forEach(it => { if (parseInt(it.dataPg || '') === pd) carry += it.valor })
        ;['fixas','cartoes_itens'].forEach(cat => {
          ((pmd as Record<string, Item[]>)[cat] || []).forEach((it: Item) => { if (parseInt(it.dataPg || '') === pd) carry -= it.valor })
        })
        const pAv: Avulso[] = Array.isArray(avulsos[pm]) ? avulsos[pm] : []
        pAv.filter(a => a.dia === pd).forEach(a => { if (a.tipo === 'entrada') carry += a.valor; else carry -= a.valor })
      }
    }
    const rows = []
    let runSaldo = Math.round(carry * 100) / 100
    for (let d = 1; d <= numDays; d++) {
      const mItems = mensalByDay[d]
      const entMensal = mItems.entradas.reduce((a, b) => a + b.valor, 0)
      const saiMensal = mItems.saidas.reduce((a, b) => a + b.valor, 0)
      const dayAv = mesAvulsos.filter(a => a.dia === d)
      const avEnt = dayAv.filter(a => a.tipo === 'entrada').reduce((a, b) => a + b.valor, 0)
      const avSai = dayAv.filter(a => a.tipo !== 'entrada').reduce((a, b) => a + b.valor, 0)
      runSaldo = Math.round((runSaldo + entMensal + avEnt - saiMensal - avSai) * 100) / 100
      rows.push({ dia: d, entrada: entMensal + avEnt, saida: saiMensal + avSai, saldo: runSaldo, mensalE: mItems.entradas, mensalS: mItems.saidas, avulsos: dayAv })
    }
    return rows
  }, [mensalByDay, mesAvulsos, months, mesIdx, avulsos])

  function saldoBg(val: number) {
    if (val > 2000) return { bg: '#1a3a1a', color: '#4ade80' }
    if (val > 500) return { bg: '#1a2a1a', color: '#86efac' }
    if (val > 0) return { bg: '#1a2a1a', color: C.g }
    if (val > -500) return { bg: '#2a1a1a', color: C.a }
    return { bg: '#2a1010', color: C.r }
  }

  function addAvulso(dia: number, nome: string, valor: number, tipo: string) {
    setAvulsos(p => ({ ...p, [mes]: [...(p[mes] || []), { id: uid(), dia, nome, valor, tipo }] }))
  }
  function rmAvulso(id: string) {
    setAvulsos(p => ({ ...p, [mes]: (p[mes] || []).filter(a => a.id !== id) }))
  }
  function updateMensalItem(itemId: string, newVal: number) {
    const newMd = { ...md }
    ;(['entradas','fixas','variaveis','cartoes_itens'] as (keyof MonthData)[]).forEach(cat => {
      newMd[cat] = newMd[cat].map(it => it.id === itemId ? { ...it, valor: newVal } : it)
    })
    updateMonth(mes, newMd)
  }

  const [mobileType, setMobileType] = useState<'T'|'E'|'S'|'D'>('T')
  const quickCats = ['Mercado','Gasolina','Alimentação','Uber','Café','Pessoais','Lazer','Farmácia','Outro']
  const today = new Date()

  const noDate = useMemo(() => {
    const nd: { nome: string; valor: number }[] = []
    ;(['entradas','fixas','cartoes_itens'] as (keyof MonthData)[]).forEach(cat => {
      md[cat].forEach(it => { const dia = parseInt(it.dataPg || ''); if ((!dia || dia < 1 || dia > numDays) && it.valor > 0) nd.push({ nome: it.nome, valor: it.valor }) })
    })
    return nd
  }, [md, numDays])

  return (
    <div>
      {/* ── Mobile card list ────────────────────────────────────── */}
      <div className="block md:hidden">
        {/* Type selector */}
        <div style={{ display:'flex', gap:6, marginBottom:10, overflowX:'auto', paddingBottom:2 }}>
          {(['T','E','S','D'] as const).map(t => {
            const cfg = ({ T:[C.b,'Todas'], E:[C.g,'Entradas'], S:[C.r,'Saídas'], D:[C.a,'Diários'] } as Record<string,[string,string]>)[t]
            return (
              <button key={t} onClick={() => setMobileType(t)} style={{
                padding:'6px 14px', borderRadius:20, fontSize:11, fontWeight:600, whiteSpace:'nowrap' as const,
                border: mobileType===t ? `1px solid ${cfg[0]}50` : `1px solid ${C.border}`,
                background: mobileType===t ? cfg[0]+'18' : 'transparent',
                color: mobileType===t ? cfg[0] : C.dm, cursor:'pointer',
              }}>
                {cfg[1]}
              </button>
            )
          })}
        </div>
        {/* Day cards */}
        <div style={{ display:'flex', flexDirection:'column' as const, gap:4 }}>
          {daySaldos.map(row => {
            const isToday = row.dia === today.getDate() && mesIdx === today.getMonth()
            const dayAvSai = row.avulsos.filter(a => a.tipo !== 'entrada')
            const dayAvSaiTotal = dayAvSai.reduce((a, b) => a + b.valor, 0)
            const saiMensalOnly = row.saida - dayAvSaiTotal
            let displayVal = 0, displayColor = C.dm
            if (mobileType==='E') { displayVal=row.entrada; displayColor=C.g }
            else if (mobileType==='S') { displayVal=saiMensalOnly; displayColor=C.r }
            else if (mobileType==='D') { displayVal=dayAvSaiTotal; displayColor=C.a }
            else { displayVal=row.entrada-row.saida; displayColor=(row.entrada-row.saida)>=0?C.g:C.r }
            const ss = saldoBg(row.saldo)
            return (
              <div key={row.dia} style={{
                display:'flex', alignItems:'center', gap:8, padding:'10px 12px',
                background: isToday ? C.bB : C.card,
                border: `1px solid ${isToday ? C.b+'60' : C.border}`,
                borderRadius:10,
              }}>
                {/* Day number */}
                <div style={{ width:26, flexShrink:0, fontFamily:'JetBrains Mono,monospace', fontSize:13, fontWeight:isToday?700:400, color:isToday?C.b:C.dm, textAlign:'center' as const }}>
                  {String(row.dia).padStart(2,'0')}
                </div>
                {/* Value for selected type */}
                <div style={{ flex:1, textAlign:'center' as const }}>
                  {displayVal !== 0
                    ? <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:600, color:displayColor }}>{fmt(displayVal)}</span>
                    : <span style={{ fontSize:11, color:C.dm2 }}>—</span>}
                </div>
                {/* Saldo badge */}
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:6, background:ss.bg, color:ss.color, flexShrink:0, whiteSpace:'nowrap' as const }}>
                  {Math.abs(row.saldo)>=1000 ? fmtS(row.saldo) : row.saldo.toFixed(0)}
                </div>
                {/* Add button */}
                <button
                  onClick={() => { setAddPopup(row.dia); setAddNome(''); setAddVal(''); setAddTipo('saida') }}
                  style={{ background:C.g+'15', border:'1px solid '+C.g+'40', borderRadius:6, cursor:'pointer', fontSize:13, color:C.g, padding:'3px 9px', fontWeight:700, flexShrink:0, lineHeight:1 }}
                >+</button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Desktop table ────────────────────────────────────────── */}
      <div className="hidden md:block">
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 420 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid ' + C.border }}>
              <th style={{ padding: '8px', textAlign: 'left', color: C.dm, fontSize: 10 }}>DIA</th>
              <th style={{ padding: '8px', textAlign: 'right', color: C.dm, fontSize: 10 }}>ENTRADA</th>
              <th style={{ padding: '8px', textAlign: 'right', color: C.dm, fontSize: 10 }}>SAÍDA</th>
              <th style={{ padding: '8px', textAlign: 'right', color: C.dm, fontSize: 10 }}>DIÁRIO</th>
              <th style={{ padding: '8px', textAlign: 'right', color: C.dm, fontSize: 10 }}>SALDO</th>
              <th style={{ padding: '8px 4px', textAlign: 'center', color: C.g, fontSize: 10 }}>+</th>
            </tr>
          </thead>
          <tbody>
            {daySaldos.map(row => {
              const isToday = row.dia === today.getDate() && mesIdx === today.getMonth()
              const ss = saldoBg(row.saldo)
              const dayAvSai = row.avulsos.filter(a => a.tipo !== 'entrada')
              const dayAvSaiTotal = dayAvSai.reduce((a, b) => a + b.valor, 0)
              const saiMensalOnly = row.saida - dayAvSaiTotal
              return (
                <tr key={row.dia} style={{ borderBottom: '1px solid ' + C.border, background: isToday ? C.bB : 'transparent', verticalAlign: 'top' }}>
                  <td style={{ padding: '8px', fontFamily: 'JetBrains Mono,monospace', fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? C.b : C.tx }}>{String(row.dia).padStart(2,'0')}</td>
                  <td style={{ padding: '8px', textAlign: 'right', cursor: row.mensalE.length > 0 ? 'pointer' : 'default' }} onClick={() => row.mensalE.length > 0 && setPopup({ dia: row.dia, tipo: 'entrada', items: row.mensalE, avulsos: row.avulsos.filter(a => a.tipo === 'entrada') })}>
                    {row.entrada > 0 ? <span style={{ color: C.g, fontFamily: 'JetBrains Mono,monospace', fontSize: 11, fontWeight: 600, borderBottom: row.mensalE.length ? '1px dashed ' + C.g + '40' : 'none' }}>{fmt(row.entrada)}</span> : <span style={{ color: C.dm2, fontSize: 10 }}>—</span>}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', cursor: row.mensalS.length > 0 ? 'pointer' : 'default' }} onClick={() => row.mensalS.length > 0 && setPopup({ dia: row.dia, tipo: 'saida', items: row.mensalS, avulsos: [] })}>
                    {saiMensalOnly > 0 ? <span style={{ color: C.r, fontFamily: 'JetBrains Mono,monospace', fontSize: 11, fontWeight: 600 }}>{fmt(saiMensalOnly)}</span> : <span style={{ color: C.dm2, fontSize: 10 }}>—</span>}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <ENum value={dayAvSaiTotal} onChange={v => {
                        if (dayAvSai.length === 0 && v > 0) addAvulso(row.dia, 'Diário', v, 'saida')
                        else if (dayAvSai.length === 1) setAvulsos(p => ({ ...p, [mes]: (p[mes] || []).map(a => a.id === dayAvSai[0].id ? { ...a, valor: v } : a) }))
                      }} color={dayAvSaiTotal > 0 ? C.a : C.dm2} w={70} />
                      {dayAvSai.length > 0 && <button onClick={() => setPopup({ dia: row.dia, tipo: 'diario', items: [], avulsos: dayAvSai })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, color: C.a, padding: '2px' }}>···</button>}
                    </div>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: ss.bg, color: ss.color }}>{fmt(row.saldo)}</span>
                  </td>
                  <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                    <button onClick={() => { setAddPopup(row.dia); setAddNome(''); setAddVal(''); setAddTipo('saida') }} style={{ background: C.g + '15', border: '1px solid ' + C.g + '40', borderRadius: 6, cursor: 'pointer', fontSize: 11, color: C.g, padding: '3px 7px', fontWeight: 600 }}>+</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      </div>

      {noDate.length > 0 && (
        <div style={{ marginTop: 10, padding: 10, background: C.aB, border: '1px solid ' + C.a + '20', borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.a, marginBottom: 4 }}>{noDate.length} itens sem data definida</div>
          {noDate.map((it, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '2px 0' }}>
            <span style={{ color: C.dm }}>{it.nome}</span><span style={{ color: C.r, fontFamily: 'JetBrains Mono,monospace' }}>{fmt(it.valor)}</span>
          </div>)}
        </div>
      )}

      {/* Mensal popup */}
      {popup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 400, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setPopup(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 20, maxWidth: 380, width: '100%' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: C.tx }}>{popup.tipo === 'entrada' ? 'Entradas' : popup.tipo === 'diario' ? 'Gastos Diários' : 'Saídas'} — Dia {String(popup.dia).padStart(2,'0')}</div>
            {popup.items.map(it => (
              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid ' + C.border }}>
                <div><span style={{ fontSize: 12, color: C.tx }}>{it.nome}</span><span style={{ fontSize: 9, color: it.pago ? C.g : C.dm2, marginLeft: 6 }}>{it.pago ? 'pago' : 'pendente'}</span></div>
                <ENum value={it.valor} onChange={v => { updateMensalItem(it.id, v); setPopup(null) }} color={popup.tipo === 'entrada' ? C.g : C.r} w={80} />
              </div>
            ))}
            {popup.avulsos.map(av => (
              <div key={av.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid ' + C.border }}>
                <span style={{ fontSize: 12, color: C.tx }}>{av.nome} <span style={{ fontSize: 9, color: C.a }}>avulso</span></span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono,monospace', color: C.a }}>{fmt(av.valor)}</span>
                  <button onClick={() => { rmAvulso(av.id); setPopup(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: C.dm2 }}>×</button>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontWeight: 700 }}>
              <span style={{ fontSize: 12, color: C.tx }}>Total</span>
              <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono,monospace', color: popup.tipo === 'entrada' ? C.g : C.r }}>{fmt(popup.items.reduce((a,b) => a+b.valor, 0) + popup.avulsos.reduce((a,b) => a+b.valor, 0))}</span>
            </div>
          </div>
        </div>
      )}

      {/* Add avulso popup */}
      {addPopup !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 400, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setAddPopup(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 20, maxWidth: 340, width: '100%' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: C.tx }}>Adicionar — Dia {String(addPopup).padStart(2,'0')}</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {quickCats.map(c => <button key={c} onClick={() => setAddNome(c)} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, cursor: 'pointer', border: '1px solid ' + C.border, background: addNome === c ? C.bB : 'transparent', color: addNome === c ? C.b : C.dm }}>{c}</button>)}
            </div>
            <input value={addNome} onChange={e => setAddNome(e.target.value)} placeholder="Nome..." style={{ width: '100%', marginBottom: 8, background: 'rgba(255,255,255,.05)', border: '1px solid ' + C.border, borderRadius: 8, padding: '8px 12px', color: C.tx, fontSize: 13, outline: 'none' }} />
            <input type="number" value={addVal} onChange={e => setAddVal(e.target.value)} placeholder="Valor R$" style={{ width: '100%', marginBottom: 8, background: 'rgba(255,255,255,.05)', border: '1px solid ' + C.border, borderRadius: 8, padding: '8px 12px', color: C.tx, fontSize: 13, outline: 'none' }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[{id:'saida',label:'Saída',c:C.r},{id:'entrada',label:'Entrada',c:C.g}].map(t => (
                <button key={t.id} onClick={() => setAddTipo(t.id)} style={{ flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', border: addTipo === t.id ? '1px solid ' + t.c + '40' : '1px solid ' + C.border, background: addTipo === t.id ? t.c + '18' : 'transparent', color: addTipo === t.id ? t.c : C.dm, fontSize: 12, fontWeight: addTipo === t.id ? 600 : 400 }}>{t.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => {
                const v = parseFloat(addVal); if (isNaN(v) || v <= 0 || !addNome) return
                addAvulso(addPopup, addNome, v, addTipo); setAddPopup(null)
              }} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,' + C.g + ',' + '#059669)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Salvar</button>
              <button onClick={() => setAddPopup(null)} style={{ flex: 1, padding: 12, background: 'rgba(255,255,255,.03)', border: '1px solid ' + C.border, borderRadius: 10, color: C.dm, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────────────────────── */
export function FinancePage() {
  const [ano, setAno] = useState(new Date().getFullYear())
  const [months, setMonths] = useState<Record<string, MonthData>>(buildEmptyMonths)
  const [avulsos, setAvulsos] = useState<Record<string, Avulso[]>>({})
  const [cartaosList, setCartaosList] = useState<string[]>(['Nubank','Bradesco'])
  const [metas, setMetas] = useState<Meta[]>([])
  const [carteira, setCarteira] = useState<Investimento[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [investimentos, setInvestimentos] = useState<Record<string, any>>({})
  const [dividas, setDividas] = useState<Divida[]>([])
  const [taxaSelic, setTaxaSelic] = useState(13.75)
  const [view, setView] = useState('overview')
  const [filtroMeses, setFiltroMeses] = useState('ano')
  const [diarioMes, setDiarioMes] = useState(MS[new Date().getMonth()] || MS[0])
  const [mesesSubTab, setMesesSubTab] = useState('diadia')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [showAddCartao, setShowAddCartao] = useState(false)
  const [newCartao, setNewCartao] = useState('')
  const [editInv, setEditInv] = useState<Investimento | null>(null)
  const [addInv, setAddInv] = useState<Investimento | null>(null)
  const [aportePopup, setAportePopup] = useState<{ invId: string; valor: string; data: string } | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* load — resets + reloads whenever ano changes */
  useEffect(() => {
    setLoaded(false)
    setMonths(buildEmptyMonths())
    setAvulsos({})
    setCartaosList(['Nubank','Bradesco'])
    setMetas([])
    setCarteira([])
    setInvestimentos({})
    setDividas([])
    setTaxaSelic(13.75)
    ;(async () => {
      const { data } = await (supabase as ReturnType<typeof supabase.from> extends never ? never : typeof supabase).from('financeiro').select('payload').eq('id', String(ano)).maybeSingle() as unknown as { data: { payload: Record<string, unknown> } | null }
      if (data?.payload) {
        const p = data.payload as Record<string, unknown>
        if (p.months) setMonths(p.months as Record<string, MonthData>)
        if (p.avulsos) setAvulsos(p.avulsos as Record<string, Avulso[]>)
        if (p.cartaosList) setCartaosList(p.cartaosList as string[])
        if (p.metas) setMetas(p.metas as Meta[])
        if (p.carteira) setCarteira(p.carteira as Investimento[])
        if (p.investimentos) setInvestimentos(p.investimentos as Record<string, any>)
        if (p.dividas) setDividas(p.dividas as Divida[])
        if (p.taxaSelic) setTaxaSelic(p.taxaSelic as number)
      }
      setLoaded(true)
    })()
  }, [ano])

  /* autosave */
  const save = useCallback((m = months, av = avulsos, cl = cartaosList, mt = metas, ca = carteira, inv = investimentos, dv = dividas, sel = taxaSelic) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      const payload = { months: m, avulsos: av, cartaosList: cl, metas: mt, carteira: ca, investimentos: inv, dividas: dv, taxaSelic: sel }
      await (supabase as unknown as { from: (t: string) => { upsert: (d: unknown) => Promise<void> } }).from('financeiro').upsert({ id: String(ano), payload })
      setSaving(false)
    }, 1500)
  }, [])

  function triggerSave(m = months, av = avulsos, cl = cartaosList, mt = metas, ca = carteira, inv = investimentos, dv = dividas, sel = taxaSelic) {
    save(m, av, cl, mt, ca, inv, dv, sel)
  }

  function updateMonth(mes: string, d: MonthData | ((p: MonthData) => MonthData)) {
    setMonths(prev => {
      const next = { ...prev, [mes]: typeof d === 'function' ? d(prev[mes] || buildEmptyMonths()[mes]) : d }
      triggerSave(next)
      return next
    })
  }

  function duplicarMes(mesSrc: string) {
    const mi = MS.indexOf(mesSrc)
    if (mi >= 11) return
    const dest = MS[mi + 1]
    const src = months[mesSrc]
    const newData: MonthData = {
      entradas: src.entradas.map(it => ({ ...it, id: uid(), pago: false })),
      fixas: src.fixas.map(it => ({ ...it, id: uid(), pago: false })),
      variaveis: src.variaveis.map(it => ({ ...it, id: uid(), pago: false })),
      cartoes_itens: src.cartoes_itens.map(it => ({ ...it, id: uid(), pago: false })),
    }
    updateMonth(dest, newData)
  }

  function addCartao() {
    if (!newCartao.trim()) return
    const nl = [...cartaosList, newCartao.trim()]
    setCartaosList(nl); setNewCartao(''); setShowAddCartao(false)
    triggerSave(months, avulsos, nl)
  }

  /* overview computation
     Tiles: ENTRADAS=entradas, FIXAS=fixas, VARIÁVEIS=variaveis, CARTÕES=cartao
     RESULTADO = ENTRADAS − (FIXAS + VARIÁVEIS + CARTÕES)                       */
  const overview = useMemo(() => MS.map(mes => {
    const md = months[mes] || { entradas: [], fixas: [], variaveis: [], cartoes_itens: [] }
    const entradas = md.entradas.reduce((a, b) => a + b.valor, 0)
    const fixas    = md.fixas.reduce((a, b) => a + b.valor, 0)
    const variaveis = md.variaveis.reduce((a, b) => a + b.valor, 0)
    const cartao   = md.cartoes_itens.reduce((a, b) => a + b.valor, 0)
    const resultado = entradas - fixas - variaveis - cartao
    return { mes, entradas, fixas, variaveis, cartao, resultado }
  }), [months])

  const filteredOverview = useMemo(() => {
    const ranges: Record<string, number[]> = {
      ano: [0,11], s1: [0,5], s2: [6,11], t1: [0,2], t2: [3,5], t3: [6,8], t4: [9,11]
    }
    const [lo, hi] = ranges[filtroMeses] || [0,11]
    return overview.filter((_, i) => i >= lo && i <= hi)
  }, [overview, filtroMeses])

  const totals = useMemo(() => filteredOverview.reduce((acc, r) => ({
    entradas: acc.entradas + r.entradas, fixas: acc.fixas + r.fixas,
    variaveis: acc.variaveis + r.variaveis, cartao: acc.cartao + r.cartao, resultado: acc.resultado + r.resultado,
    dividas: 0,
  }), { entradas: 0, fixas: 0, variaveis: 0, cartao: 0, resultado: 0, dividas: 0 }), [filteredOverview])

  const currentMonthIdx = new Date().getMonth()
  const navItems = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'meses', label: 'Meses' },
    { id: 'metas', label: 'Metas' },
    { id: 'investimentos', label: 'Investimentos' },
    { id: 'config', label: 'Configurações' },
  ]

  if (!loaded) return (
    <div>
      <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em' }}>Financeiro</h1>
      <p className="text-ink-2 mt-2" style={{ fontSize: 13 }}>Carregando...</p>
    </div>
  )

  return (
    <div style={{ fontFamily: 'Manrope,sans-serif' }}>
      <style>{`
        .fin-grid5{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px}
        .fin-grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
        .fin-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
        @media(max-width:640px){.fin-grid5,.fin-grid4{grid-template-columns:repeat(2,1fr)!important}.fin-grid2{grid-template-columns:1fr!important}}
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', margin: 0 }}>Financeiro</h1>
          {/* Year selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: C.card, border: '1px solid ' + C.border, borderRadius: 8, padding: '3px 6px' }}>
            <button onClick={() => setAno(a => a - 1)} style={{ background: 'none', border: 'none', color: C.dm, cursor: 'pointer', fontSize: 18, padding: '0 6px', lineHeight: 1, fontWeight: 400 }}>‹</button>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, fontWeight: 700, color: C.tx, minWidth: 38, textAlign: 'center' }}>{ano}</span>
            <button onClick={() => setAno(a => a + 1)} style={{ background: 'none', border: 'none', color: C.dm, cursor: 'pointer', fontSize: 18, padding: '0 6px', lineHeight: 1, fontWeight: 400 }}>›</button>
          </div>
        </div>
        {saving && <span style={{ fontSize: 11, color: C.g, fontFamily: 'JetBrains Mono,monospace' }}>salvo</span>}
      </div>

      {/* Nav tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 18, overflowX: 'auto', WebkitOverflowScrolling: 'touch' as const, background: C.card, borderRadius: 10, border: '1px solid ' + C.border, padding: 4 }}>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setView(n.id)} style={{ background: view === n.id ? C.bB : 'transparent', border: view === n.id ? '1px solid ' + C.b + '40' : '1px solid transparent', color: view === n.id ? C.b : C.dm, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' as const }}>
            {n.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {view === 'overview' && (
        <div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' as const }}>
            {[{id:'ano',l:'Ano'},{id:'s1',l:'1º Sem'},{id:'s2',l:'2º Sem'},{id:'t1',l:'T1'},{id:'t2',l:'T2'},{id:'t3',l:'T3'},{id:'t4',l:'T4'}].map(f => (
              <button key={f.id} onClick={() => setFiltroMeses(f.id)} style={{ padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 600, border: filtroMeses === f.id ? '1px solid ' + C.b + '40' : '1px solid ' + C.border, background: filtroMeses === f.id ? C.bB : 'transparent', color: filtroMeses === f.id ? C.b : C.dm }}>{f.l}</button>
            ))}
          </div>
          <div className="fin-grid5">
            <Stat label="Entradas" value={totals.entradas} color={C.g} sub="Período" />
            <Stat label="Fixas" value={totals.fixas} color={C.r} />
            <Stat label="Variáveis" value={totals.variaveis} color={C.a} />
            <Stat label="Cartões" value={totals.cartao} color={C.p} />
            <Stat label="Resultado" value={totals.resultado} color={totals.resultado >= 0 ? C.g : C.r} />
          </div>
          <Section title="Entradas vs Saídas">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={filteredOverview.map(r => ({ name: MSH[MS.indexOf(r.mes)], entradas: r.entradas, fixas: r.fixas, variaveis: r.variaveis, cartao: r.cartao }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="name" tick={{ fill: C.dm, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.dm, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtS} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="fixas" name="Fixas" fill={C.r} stackId="s" opacity={0.8} />
                <Bar dataKey="variaveis" name="Variáveis" fill={C.a} stackId="s" opacity={0.8} />
                <Bar dataKey="cartao" name="Cartão" fill={C.p} stackId="s" radius={[4,4,0,0]} opacity={0.8} />
                <Line type="monotone" dataKey="entradas" name="Entradas" stroke={C.g} strokeWidth={2.5} dot={{ r: 3, fill: C.g }} />
              </ComposedChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Resultado Acumulado">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={filteredOverview.reduce<Array<{name:string;acc:number}>>((a, r, i) => { const p = i > 0 ? a[i-1].acc : 0; a.push({ name: MSH[MS.indexOf(r.mes)], acc: p + r.resultado }); return a }, [])}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="name" tick={{ fill: C.dm, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.dm, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtS} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke={C.dm2} strokeDasharray="3 3" />
                <Area type="monotone" dataKey="acc" name="Acumulado" stroke={C.b} fill={C.bB} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          {/* Dívidas */}
          <Section title="Dívidas" action={<Btn onClick={() => setDividas(p => [...p, { id: uid(), nome: '', parcela: 0, inicio: 0, fim: 11 }])} color={C.dm} small>+ Dívida</Btn>}>
            {dividas.length === 0 ? <div style={{ color: C.dm, fontSize: 11, textAlign: 'center', padding: 10 }}>Nenhuma dívida</div> : dividas.map((dv, i) => {
              const totalM = (dv.fim || 0) - (dv.inicio || 0) + 1
              const pagos = Math.max(0, currentMonthIdx - (dv.inicio || 0) + 1)
              const pct = totalM > 0 ? Math.min(Math.round((pagos / totalM) * 100), 100) : 0
              return (
                <div key={dv.id || i} style={{ marginBottom: 10, padding: 10, background: 'rgba(255,255,255,.02)', borderRadius: 8, border: '1px solid ' + C.border }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <EText value={dv.nome} onChange={v => { const nd = dividas.map((x,j) => j===i?{...x,nome:v}:x); setDividas(nd); triggerSave(months,avulsos,cartaosList,metas,carteira,investimentos,nd) }} placeholder="Nome..." w={120} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ENum value={dv.parcela} onChange={v => { const nd = dividas.map((x,j) => j===i?{...x,parcela:v}:x); setDividas(nd); triggerSave(months,avulsos,cartaosList,metas,carteira,investimentos,nd) }} color={C.r} w={70} />
                      <span style={{ fontSize: 9, color: C.dm }}>/mês</span>
                      <button onClick={() => { const nd = dividas.filter((_,j)=>j!==i); setDividas(nd); triggerSave(months,avulsos,cartaosList,metas,carteira,investimentos,nd) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: C.dm2 }}>×</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 9, color: C.dm, marginBottom: 6 }}>
                    <span>Início: <select value={dv.inicio||0} onChange={e => { const nd = dividas.map((x,j)=>j===i?{...x,inicio:parseInt(e.target.value)}:x); setDividas(nd) }} style={{ background:'rgba(255,255,255,.05)',border:'1px solid '+C.border,borderRadius:4,color:C.tx,fontSize:9,padding:'2px 4px' }}>{MSH.map((m,mi)=><option key={mi} value={mi}>{m}</option>)}</select></span>
                    <span>Fim: <select value={dv.fim||11} onChange={e => { const nd = dividas.map((x,j)=>j===i?{...x,fim:parseInt(e.target.value)}:x); setDividas(nd) }} style={{ background:'rgba(255,255,255,.05)',border:'1px solid '+C.border,borderRadius:4,color:C.tx,fontSize:9,padding:'2px 4px' }}>{MSH.map((m,mi)=><option key={mi} value={mi}>{m}</option>)}</select></span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: pct + '%', background: pct >= 100 ? C.g : C.a, borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 9, color: C.dm, marginTop: 2 }}>{pct}% — {pagos}/{totalM} parcelas</div>
                </div>
              )
            })}
          </Section>

          {/* Resumo tabela */}
          <Section title="Resumo por Mês">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 460 }}>
                <thead><tr style={{ borderBottom: '2px solid ' + C.border }}>
                  {['Mês','Entradas','Fixas','Cartões','Diário','Resultado'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: h==='Mês'?'left':'right', color: C.dm2, fontSize: 10 }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredOverview.map(r => {
                    const mi = MS.indexOf(r.mes)
                    // Resultado = Entradas − (Fixas + Cartões + Diário)
                    // Diário = r.variaveis (kind='out' category='variavel')
                    const resultado = r.entradas - r.fixas - r.cartao - r.variaveis
                    return (
                      <tr key={mi} style={{ borderBottom: '1px solid ' + C.border, cursor: 'pointer', background: mi === currentMonthIdx ? C.bB : 'transparent' }} onClick={() => { setView('meses'); setDiarioMes(r.mes) }}>
                        <td style={{ padding: '10px', fontWeight: 600, fontSize: 12 }}>{MSH[mi]}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: C.g, fontFamily: 'JetBrains Mono,monospace' }}>{fmt(r.entradas)}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: C.r, fontFamily: 'JetBrains Mono,monospace' }}>{fmt(r.fixas)}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: C.p, fontFamily: 'JetBrains Mono,monospace' }}>{fmt(r.cartao)}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: C.a, fontFamily: 'JetBrains Mono,monospace' }}>{fmt(r.variaveis)}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: resultado >= 0 ? C.g : C.r, fontFamily: 'JetBrains Mono,monospace' }}>{fmt(resultado)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      )}

      {/* ── MESES ── */}
      {view === 'meses' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6, marginBottom: 14 }}>
            {MS.map((m, i) => (
              <button key={m} onClick={() => setDiarioMes(m)} style={{ background: diarioMes === m ? C.bB : 'rgba(255,255,255,.03)', border: diarioMes === m ? '1px solid ' + C.b + '40' : '1px solid ' + C.border, color: diarioMes === m ? C.b : C.dm, padding: '10px 6px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: diarioMes === m ? 700 : 500 }}>{MSH[i]}</button>
            ))}
          </div>
          {/* Stats */}
          {(() => {
            const md = months[diarioMes] || { entradas: [], fixas: [], variaveis: [], cartoes_itens: [] }
            const totE = md.entradas.reduce((a,b)=>a+b.valor,0)
            const totF = md.fixas.reduce((a,b)=>a+b.valor,0)
            const totC = md.cartoes_itens.reduce((a,b)=>a+b.valor,0)
            const avSai = (avulsos[diarioMes]||[]).filter(a=>a.tipo!=='entrada').reduce((a,b)=>a+b.valor,0)
            const res = totE - totF - totC - avSai
            return (
              <div className="fin-grid5" style={{ marginBottom: 14 }}>
                <Stat label="Entradas" value={totE} color={C.g} />
                <Stat label="Fixas" value={totF} color={C.r} />
                <Stat label="Cartões" value={totC} color={C.p} />
                <Stat label="Diário" value={avSai} color={C.a} />
                <Stat label="Resultado" value={res} color={res>=0?C.g:C.r} />
              </div>
            )
          })()}
          <div style={{ marginBottom: 8, textAlign: 'right' }}>
            <button onClick={() => duplicarMes(diarioMes)} style={{ background: 'none', border: 'none', color: C.dm2, fontSize: 10, cursor: 'pointer', padding: '4px 8px' }}>↻ Copiar estrutura →</button>
          </div>
          {/* Sub-tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 14, overflowX: 'auto' }}>
            {[{id:'diadia',label:'Diário',color:C.b},{id:'entradas',label:'Entradas',color:C.g},{id:'fixas',label:'Despesas',color:C.r},{id:'cartoes_itens',label:'Cartões',color:C.p}].map(t => (
              <button key={t.id} onClick={() => setMesesSubTab(t.id)} style={{ background: mesesSubTab===t.id ? t.color+'18' : 'transparent', border: mesesSubTab===t.id ? '1px solid '+t.color+'40' : '1px solid transparent', color: mesesSubTab===t.id ? t.color : C.dm, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, minHeight: 38, fontWeight: mesesSubTab===t.id ? 600 : 400, whiteSpace: 'nowrap' as const }}>{t.label}</button>
            ))}
          </div>
          {mesesSubTab === 'diadia' ? (
            <ErrorBoundary key={diarioMes}>
              <Section title={`Dia a dia — ${diarioMes}`}>
                <DiarioView mes={diarioMes} months={months} avulsos={avulsos} setAvulsos={av => { setAvulsos(av as Record<string, Avulso[]>); triggerSave(months, av as Record<string, Avulso[]>) }} updateMonth={updateMonth} />
              </Section>
            </ErrorBoundary>
          ) : (
            <MonthTab month={diarioMes} data={months[diarioMes] || { entradas:[], fixas:[], variaveis:[], cartoes_itens:[] }} cartaosList={cartaosList} onUpdate={updateMonth} onAddCartao={() => setShowAddCartao(true)} duplicarMes={duplicarMes} forceTab={mesesSubTab} />
          )}
        </div>
      )}

      {/* ── METAS ── */}
      {view === 'metas' && (
        <Section title="Metas e Objetivos" action={<Btn onClick={() => { const m=[...metas,{id:uid(),nome:'',target:1000,atual:0,aportes:[]}]; setMetas(m); triggerSave(months,avulsos,cartaosList,m) }} color={C.g} small>+ Meta</Btn>}>
          <div className="fin-grid2">
            {metas.map((mt, i) => {
              const atualCalc = (mt.aportes||[]).length > 0 ? mt.aportes!.reduce((a,b)=>a+b.valor,0) : mt.atual
              const pct = mt.target > 0 ? Math.min(Math.round((atualCalc/mt.target)*100),100) : 0
              return (
                <div key={mt.id} style={{ background:'rgba(255,255,255,.02)',borderRadius:10,padding:16,border:'1px solid '+C.border }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
                    <EText value={mt.nome} onChange={v=>{const m=metas.map((x,j)=>j===i?{...x,nome:v}:x);setMetas(m);triggerSave(months,avulsos,cartaosList,m)}} placeholder="Nome da meta..." w={150} />
                    <button onClick={()=>{const m=metas.filter((_,j)=>j!==i);setMetas(m);triggerSave(months,avulsos,cartaosList,m)}} style={{ background:'none',border:'none',cursor:'pointer',fontSize:12,color:C.dm2 }}>×</button>
                  </div>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:11 }}>
                    <span style={{ color:C.dm }}>Atual: {fmt(atualCalc)}</span>
                    <span style={{ color:C.dm }}>Meta: <ENum value={mt.target} onChange={v=>{const m=metas.map((x,j)=>j===i?{...x,target:v}:x);setMetas(m);triggerSave(months,avulsos,cartaosList,m)}} color={C.b} w={70} /></span>
                  </div>
                  <div style={{ height:8,background:'rgba(255,255,255,.06)',borderRadius:4,overflow:'hidden',marginBottom:6 }}>
                    <div style={{ height:'100%',width:pct+'%',background:pct>=100?C.g:C.b,borderRadius:4,transition:'width .5s' }} />
                  </div>
                  <div style={{ textAlign:'center',fontSize:14,fontWeight:700,color:pct>=100?C.g:C.b,fontFamily:'JetBrains Mono,monospace' }}>{pct}%</div>
                  <div style={{ textAlign:'center',fontSize:10,color:C.dm,marginTop:2 }}>Faltam {fmt(Math.max(0,mt.target-atualCalc))}</div>
                  <div style={{ marginTop:10,borderTop:'1px solid '+C.border,paddingTop:8 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
                      <span style={{ fontSize:10,fontWeight:600,color:C.dm }}>Aportes</span>
                      <button onClick={() => {
                        const valor = parseFloat(window.prompt('Valor do aporte R$:')||'')
                        if (isNaN(valor)||valor<=0) return
                        const data = new Date().toISOString().slice(0,10)
                        const m = metas.map((x,j)=>{if(j!==i)return x;const ap=(x.aportes||[]).concat([{valor,data}]);return{...x,aportes:ap,atual:ap.reduce((a,b)=>a+b.valor,0)}})
                        setMetas(m);triggerSave(months,avulsos,cartaosList,m)
                      }} style={{ background:C.g+'15',border:'1px solid '+C.g+'40',borderRadius:6,color:C.g,fontSize:9,padding:'3px 8px',cursor:'pointer' }}>+ Aporte</button>
                    </div>
                    {(mt.aportes||[]).length===0 ? <div style={{ fontSize:9,color:C.dm2,textAlign:'center' }}>Nenhum aporte</div> :
                      (mt.aportes||[]).slice().reverse().map((ap,ai)=><div key={ai} style={{ display:'flex',justifyContent:'space-between',fontSize:9,padding:'2px 0',color:C.dm }}>
                        <span>{ap.data?ap.data.split('-').reverse().join('/'):'-'}</span>
                        <span style={{ color:C.g,fontFamily:'JetBrains Mono,monospace' }}>{fmt(ap.valor)}</span>
                      </div>)
                    }
                  </div>
                </div>
              )
            })}
          </div>
          {metas.length===0 && <div style={{ textAlign:'center',padding:30,color:C.dm,fontSize:12 }}>Nenhuma meta cadastrada</div>}
        </Section>
      )}

      {/* ── INVESTIMENTOS ── */}
      {view === 'investimentos' && (() => {
        const hoje = new Date()
        let totalInvestido=0,totalAtual=0,totalRendimento=0
        const carteiraCalc = carteira.map(inv => {
          const dataApp = new Date(inv.dataAplicacao||'2026-01-01')
          const dias = Math.max(1,Math.floor((hoje.getTime()-dataApp.getTime())/(1000*60*60*24)))
          if (inv.tipo==='Renda Variável') {
            const va=(inv.precoAtual||inv.precoPago||0)*(inv.quantidade||1)
            const ti=inv.valor||0; const rl=va-ti
            totalInvestido+=ti;totalAtual+=va;totalRendimento+=rl
            return {...inv,valorAtual:Math.round(va*100)/100,rendLiq:Math.round(rl*100)/100,isento:false,aliqIR:'0'}
          }
          let taxaAnual=0
          if (inv.taxaTipo==='cdi'||inv.taxaTipo==='selic') taxaAnual=(taxaSelic/100)*((inv.taxaValor||100)/100)
          else if (inv.taxaTipo==='ipca') taxaAnual=0.05+(inv.taxaFixa||0)/100
          else if (inv.taxaTipo==='pre') taxaAnual=(inv.taxaValor||12)/100
          else taxaAnual=(inv.taxaValor||10)/100
          const taxaDiaria=Math.pow(1+taxaAnual,1/252)-1
          const aportes=inv.aportes||[{valor:inv.valor||0,data:inv.dataAplicacao||'2026-01-01'}]
          let totalVI=0,totalRB=0
          aportes.forEach(ap=>{
            const apD=new Date(ap.data||inv.dataAplicacao||'2026-01-01')
            const apDias=Math.max(1,Math.floor((hoje.getTime()-apD.getTime())/(1000*60*60*24)))
            const apDU=Math.floor(apDias*252/365)
            totalVI+=ap.valor; totalRB+=(ap.valor)*(Math.pow(1+taxaDiaria,apDU)-1)
          })
          const isento=inv.subtipo==='LCI'||inv.subtipo==='LCA'||inv.subtipo==='Poupança'
          const aliq=dias<=180?0.225:dias<=360?0.20:dias<=720?0.175:0.15
          const ir=isento?0:totalRB*aliq
          const rl=totalRB-ir; const va=totalVI+rl
          totalInvestido+=totalVI;totalAtual+=va;totalRendimento+=rl
          return {...inv,valorAtual:Math.round(va*100)/100,rendLiq:Math.round(rl*100)/100,isento,aliqIR:(aliq*100).toFixed(1)}
        })
        const totalEco=MS.reduce((a,m)=>a+((investimentos[m] as {economia:number}|undefined)?.economia||0),0)
        const valorInicial=(investimentos as Record<string,unknown>)._inicial as number||0
        return (
          <div>
            <div className="fin-grid4">
              <Stat label="Total Ativos" value={totalAtual} color={C.b} sub={'Investido: '+fmt(totalInvestido)} />
              <Stat label="Rendimento" value={totalRendimento} color={C.g} sub={totalInvestido>0?(totalRendimento/totalInvestido*100).toFixed(1)+'%':''} />
              <Stat label="Economizado" value={totalEco+valorInicial} color={C.a} />
              <div style={{ background:C.card,borderRadius:10,padding:'16px 18px',border:'1px solid '+C.border }}>
                <div style={{ color:C.dm,fontSize:10,fontWeight:600,textTransform:'uppercase' as const,letterSpacing:'.06em',marginBottom:8 }}>Selic</div>
                <div style={{ display:'flex',alignItems:'center',gap:4 }}>
                  <ENum value={taxaSelic} onChange={v=>{setTaxaSelic(v);triggerSave(months,avulsos,cartaosList,metas,carteira,investimentos,dividas,v)}} color={C.tx} w={50} />
                  <span style={{ color:C.dm,fontSize:12 }}>% a.a.</span>
                </div>
              </div>
            </div>
            <Section title="Meus Investimentos" action={
              <div style={{ display:'flex',gap:4 }}>
                <Btn onClick={()=>setAddInv({id:uid(),nome:'',tipo:'Renda Fixa',subtipo:'CDB',banco:'',valor:0,taxaTipo:'cdi',taxaValor:100,dataAplicacao:hoje.toISOString().slice(0,10),vencimento:''})} color={C.b} small>+ Renda Fixa</Btn>
                <Btn onClick={()=>setAddInv({id:uid(),nome:'',tipo:'Renda Variável',subtipo:'Ações',banco:'',valor:0,quantidade:0,precoPago:0,precoAtual:0,ticker:'',dataAplicacao:hoje.toISOString().slice(0,10),vencimento:''})} color={C.g} small>+ Renda Variável</Btn>
              </div>
            }>
              {carteiraCalc.length===0 ? <div style={{ textAlign:'center',padding:30,color:C.dm,fontSize:12 }}>Nenhum investimento</div> :
                carteiraCalc.map(inv=>{
                  const isRV=inv.tipo==='Renda Variável'
                  const rc=inv.rendLiq>=0?C.g:C.r
                  return (
                    <div key={inv.id} style={{ padding:'12px',marginBottom:8,background:'rgba(255,255,255,.02)',border:'1px solid '+C.border,borderRadius:10 }}>
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8 }}>
                        <div>
                          <div style={{ fontSize:13,fontWeight:700,color:C.tx }}>{inv.nome}{inv.ticker?<span style={{ color:C.dm,fontSize:10 }}> ({inv.ticker})</span>:null}</div>
                          <div style={{ display:'flex',gap:4,marginTop:3,flexWrap:'wrap' as const }}>
                            <span style={{ background:C.b+'15',color:C.b,padding:'1px 6px',borderRadius:4,fontSize:9 }}>{inv.subtipo}</span>
                            <span style={{ color:C.dm2,fontSize:9 }}>{inv.banco}</span>
                            {inv.isento&&<span style={{ background:C.g+'15',color:C.g,padding:'1px 6px',borderRadius:4,fontSize:9 }}>Isento IR</span>}
                          </div>
                        </div>
                        <div style={{ display:'flex',gap:4 }}>
                          <button onClick={()=>setAportePopup({invId:inv.id,valor:'',data:hoje.toISOString().slice(0,10)})} style={{ background:'none',border:'none',cursor:'pointer',fontSize:13,color:C.g }}>+</button>
                          <button onClick={()=>setEditInv({...inv})} style={{ background:'none',border:'none',cursor:'pointer',fontSize:11,color:C.b }}>edit</button>
                          <button onClick={()=>{if(window.confirm('Remover?')){const nc=carteira.filter(x=>x.id!==inv.id);setCarteira(nc);triggerSave(months,avulsos,cartaosList,metas,nc)}}} style={{ background:'none',border:'none',cursor:'pointer',fontSize:11,color:C.dm2 }}>×</button>
                        </div>
                      </div>
                      <div style={{ display:'grid',gridTemplateColumns:isRV?'1fr 1fr 1fr 1fr':'1fr 1fr 1fr',gap:8,fontSize:10 }}>
                        <div><div style={{ color:C.dm }}>Investido</div><div style={{ color:C.tx,fontFamily:'JetBrains Mono,monospace',fontWeight:600 }}>{fmt(inv.valor)}</div></div>
                        <div><div style={{ color:C.dm }}>Atual</div><div style={{ color:C.g,fontFamily:'JetBrains Mono,monospace',fontWeight:600 }}>{fmt(inv.valorAtual)}</div></div>
                        <div><div style={{ color:C.dm }}>Rendimento</div><div style={{ color:rc,fontFamily:'JetBrains Mono,monospace',fontWeight:600 }}>{fmt(inv.rendLiq)}</div></div>
                        {isRV&&<div><div style={{ color:C.dm }}>Qtd</div><div style={{ color:C.tx,fontSize:9 }}>{inv.quantidade}× {fmt(inv.precoAtual||0)}</div></div>}
                      </div>
                    </div>
                  )
                })
              }
            </Section>
            <Section title="Economia Mensal">
              <div style={{ display:'flex',gap:8,alignItems:'center',marginBottom:10,flexWrap:'wrap' as const }}>
                <span style={{ fontSize:11,color:C.dm }}>Valor Inicial:</span>
                <ENum value={valorInicial} onChange={v=>{const ni={...investimentos,_inicial:v};setInvestimentos(ni);triggerSave(months,avulsos,cartaosList,metas,carteira,ni)}} color={C.b} w={80} />
                <span style={{ fontSize:10,color:C.g,fontWeight:600 }}>Total: {fmt(totalEco+valorInicial)}</span>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%',borderCollapse:'collapse',fontSize:11 }}>
                  <thead><tr style={{ borderBottom:'2px solid '+C.border }}>
                    {['Mês','Renda','Economizado','%'].map(h=><th key={h} style={{ padding:'8px',textAlign:h==='Mês'?'left':'right',color:C.dm,fontSize:10 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{MS.map((m,mi)=>{
                    const md=months[m]||{entradas:[],fixas:[],variaveis:[],cartoes_itens:[]}
                    const totEnt=md.entradas.reduce((a,b)=>a+b.valor,0)
                    const eco=((investimentos[m] as {economia:number}|undefined)?.economia)||0
                    const pct=totEnt>0?Math.round((eco/totEnt)*100):0
                    return <tr key={m} style={{ borderBottom:'1px solid '+C.border }}>
                      <td style={{ padding:'6px 8px' }}>{MSH[mi]}</td>
                      <td style={{ padding:'6px 8px',textAlign:'right',color:C.g,fontFamily:'JetBrains Mono,monospace' }}>{fmt(totEnt)}</td>
                      <td style={{ padding:'6px 8px',textAlign:'right' }}><ENum value={eco} onChange={v=>{const ni={...investimentos,[m]:{...((investimentos[m] as {economia:number})||{}),economia:v}};setInvestimentos(ni);triggerSave(months,avulsos,cartaosList,metas,carteira,ni)}} color={eco>=0?C.b:C.r} w={70} /></td>
                      <td style={{ padding:'6px 8px',textAlign:'right',color:pct>=10?C.g:C.a,fontFamily:'JetBrains Mono,monospace' }}>{pct}%</td>
                    </tr>
                  })}</tbody>
                </table>
              </div>
            </Section>
          </div>
        )
      })()}

      {/* ── CONFIG ── */}
      {view === 'config' && (
        <div>
          <Section title="Dados & Backup">
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              <button onClick={() => {
                const rows=[['Mês','Entradas','Fixas','Variáveis','Cartões','Resultado']]
                overview.forEach(r=>{rows.push([r.mes,String(r.entradas),String(r.fixas),String(r.variaveis),String(r.cartao),String(r.resultado)])})
                const csv=rows.map(r=>r.join(';')).join('\n')
                const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download=`financeiro-${ano}.csv`;a.click()
              }} style={{ padding:'10px 16px',borderRadius:10,cursor:'pointer',fontSize:12,fontWeight:600,border:'1px solid '+C.g+'40',background:C.gB,color:C.g }}>Exportar CSV</button>
              <button onClick={() => {
                const blob=new Blob([JSON.stringify({months,avulsos,cartaosList,metas,carteira,investimentos,dividas,taxaSelic},null,2)],{type:'application/json'})
                const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`mos-financeiro-${ano}.json`;a.click()
              }} style={{ padding:'10px 16px',borderRadius:10,cursor:'pointer',fontSize:12,fontWeight:600,border:'1px solid '+C.b+'40',background:C.bB,color:C.b }}>Backup JSON</button>
              <button onClick={() => {
                const inp=document.createElement('input');inp.type='file';inp.accept='.json'
                inp.onchange=async e=>{
                  const f=(e.target as HTMLInputElement).files?.[0];if(!f)return
                  const txt=await f.text();const p=JSON.parse(txt)
                  if(p.months)setMonths(p.months)
                  if(p.avulsos)setAvulsos(p.avulsos)
                  if(p.cartaosList)setCartaosList(p.cartaosList)
                  if(p.metas)setMetas(p.metas)
                  if(p.carteira)setCarteira(p.carteira)
                  if(p.investimentos)setInvestimentos(p.investimentos)
                  if(p.dividas)setDividas(p.dividas)
                  if(p.taxaSelic)setTaxaSelic(p.taxaSelic)
                  triggerSave(p.months||months,p.avulsos||avulsos)
                }
                inp.click()
              }} style={{ padding:'10px 16px',borderRadius:10,cursor:'pointer',fontSize:12,fontWeight:600,border:'1px solid '+C.a+'40',background:C.aB,color:C.a }}>Restaurar Backup</button>
              <button onClick={() => {
                if(window.confirm('Zerar todos os dados de '+ano+'?')&&window.confirm('Tem certeza? Não tem volta!')) {
                  const em=buildEmptyMonths();setMonths(em);setAvulsos({});setMetas([]);setCarteira([]);setDividas([])
                  triggerSave(em,{})
                }
              }} style={{ padding:'10px 16px',borderRadius:10,cursor:'pointer',fontSize:12,fontWeight:600,border:'1px solid '+C.r+'30',background:C.rB,color:C.r }}>Zerar dados do ano</button>
            </div>
          </Section>
          <Section title="Sobre">
            <div style={{ fontSize:12,color:C.dm,lineHeight:1.8 }}>
              <div>Módulo <span style={{ color:C.tx,fontWeight:600 }}>Financeiro {ano}</span> — MOS</div>
              <div>Dados salvos automaticamente no Supabase</div>
            </div>
          </Section>
        </div>
      )}

      {/* Add cartão popup */}
      {showAddCartao && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.65)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center' }} onClick={()=>setShowAddCartao(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:C.card,borderRadius:14,padding:24,width:320,border:'1px solid '+C.bL }}>
            <h3 style={{ marginBottom:14,fontSize:14,fontWeight:700,color:C.tx }}>Novo Cartão</h3>
            <input value={newCartao} onChange={e=>setNewCartao(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addCartao()}} placeholder="Ex: C6, Inter, PicPay..." style={{ width:'100%',background:'rgba(255,255,255,.05)',border:'1px solid '+C.border,borderRadius:8,padding:'10px 14px',color:C.tx,fontSize:13,outline:'none',marginBottom:12 }} autoFocus />
            <div style={{ display:'flex',gap:8,justifyContent:'flex-end' }}>
              <Btn onClick={()=>setShowAddCartao(false)} color={C.dm}>Cancelar</Btn>
              <Btn onClick={addCartao} color={C.g}>Adicionar</Btn>
            </div>
            {cartaosList.length>0&&<div style={{ marginTop:14,paddingTop:12,borderTop:'1px solid '+C.border }}>
              <div style={{ fontSize:10,color:C.dm,marginBottom:8 }}>Cartões cadastrados:</div>
              <div style={{ display:'flex',gap:6,flexWrap:'wrap' as const }}>
                {cartaosList.map((c,i)=><span key={c} style={{ padding:'3px 10px',background:PC[i%PC.length]+'18',border:'1px solid '+PC[i%PC.length]+'40',borderRadius:6,fontSize:10,color:PC[i%PC.length],display:'inline-flex',alignItems:'center',gap:4 }}>
                  {c}
                  <button onClick={()=>{const nl=cartaosList.filter(x=>x!==c);setCartaosList(nl);triggerSave(months,avulsos,nl)}} style={{ background:'none',border:'none',cursor:'pointer',fontSize:8,color:PC[i%PC.length],padding:0 }}>×</button>
                </span>)}
              </div>
            </div>}
          </div>
        </div>
      )}

      {/* Investimento add/edit popups */}
      {(addInv||editInv) && (() => {
        const inv=(addInv||editInv)!
        const setInv=addInv?setAddInv:setEditInv
        const isRV=inv.tipo==='Renda Variável'
        const subs=isRV?['Ações','FIIs','Cripto']:['CDB','LCI','LCA','Tesouro Direto','Poupança']
        const fs={width:'100%',background:'rgba(255,255,255,.05)',border:'1px solid '+C.border,borderRadius:8,padding:'10px 12px',color:C.tx,fontSize:13,outline:'none'} as React.CSSProperties
        return (
          <div style={{ position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:400,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }} onClick={()=>{setAddInv(null);setEditInv(null)}}>
            <div onClick={e=>e.stopPropagation()} style={{ background:C.bg,border:'1px solid '+C.border,borderRadius:14,padding:20,maxWidth:440,width:'100%',maxHeight:'85vh',overflowY:'auto' }}>
              <div style={{ fontSize:15,fontWeight:700,marginBottom:14,color:C.tx }}>{addInv?'Novo Investimento':'Editar'} — {inv.tipo}</div>
              <div style={{ marginBottom:10 }}><label style={{ fontSize:10,color:C.dm,marginBottom:4,display:'block' }}>Nome</label><input value={inv.nome||''} onChange={e=>setInv({...inv,nome:e.target.value})} placeholder="Ex: CDB Nubank 120% CDI" style={fs} /></div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10 }}>
                <div><label style={{ fontSize:10,color:C.dm,marginBottom:4,display:'block' }}>Subtipo</label>
                  <select value={inv.subtipo||''} onChange={e=>setInv({...inv,subtipo:e.target.value})} style={fs}>{subs.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
                <div><label style={{ fontSize:10,color:C.dm,marginBottom:4,display:'block' }}>Banco</label><input value={inv.banco||''} onChange={e=>setInv({...inv,banco:e.target.value})} placeholder="Nubank, XP..." style={fs} /></div>
              </div>
              {isRV ? (
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10 }}>
                  <div><label style={{ fontSize:10,color:C.dm,marginBottom:4,display:'block' }}>Ticker</label><input value={inv.ticker||''} onChange={e=>setInv({...inv,ticker:e.target.value})} style={fs} /></div>
                  <div><label style={{ fontSize:10,color:C.dm,marginBottom:4,display:'block' }}>Quantidade</label><input type="number" value={inv.quantidade||''} onChange={e=>setInv({...inv,quantidade:parseFloat(e.target.value)||0})} style={fs} /></div>
                  <div><label style={{ fontSize:10,color:C.dm,marginBottom:4,display:'block' }}>Preço Pago</label><input type="number" step="0.01" value={inv.precoPago||''} onChange={e=>setInv({...inv,precoPago:parseFloat(e.target.value)||0})} style={fs} /></div>
                  <div><label style={{ fontSize:10,color:C.dm,marginBottom:4,display:'block' }}>Preço Atual</label><input type="number" step="0.01" value={inv.precoAtual||''} onChange={e=>setInv({...inv,precoAtual:parseFloat(e.target.value)||0})} style={fs} /></div>
                </div>
              ) : (
                <div style={{ marginBottom:10 }}>
                  <label style={{ fontSize:10,color:C.dm,marginBottom:4,display:'block' }}>Valor Investido (R$)</label>
                  <input type="number" step="0.01" value={inv.valor||''} onChange={e=>setInv({...inv,valor:parseFloat(e.target.value)||0})} style={fs} />
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8 }}>
                    <div><label style={{ fontSize:10,color:C.dm,marginBottom:4,display:'block' }}>Tipo de Taxa</label>
                      <select value={inv.taxaTipo||'cdi'} onChange={e=>setInv({...inv,taxaTipo:e.target.value})} style={fs}>
                        <option value="cdi">% CDI/Selic</option><option value="ipca">IPCA+</option><option value="pre">Prefixado</option>
                      </select></div>
                    <div><label style={{ fontSize:10,color:C.dm,marginBottom:4,display:'block' }}>{inv.taxaTipo==='ipca'?'IPCA +%':'% taxa'}</label>
                      <input type="number" step="0.01" value={inv.taxaTipo==='ipca'?inv.taxaFixa||'':inv.taxaValor||''} onChange={e=>{const v=parseFloat(e.target.value)||0;setInv(inv.taxaTipo==='ipca'?{...inv,taxaFixa:v}:{...inv,taxaValor:v})}} style={fs} /></div>
                  </div>
                </div>
              )}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14 }}>
                <div><label style={{ fontSize:10,color:C.dm,marginBottom:4,display:'block' }}>Data Aplicação</label><input type="date" value={inv.dataAplicacao||''} onChange={e=>setInv({...inv,dataAplicacao:e.target.value})} style={fs} /></div>
                <div><label style={{ fontSize:10,color:C.dm,marginBottom:4,display:'block' }}>Vencimento</label><input type="date" value={inv.vencimento||''} onChange={e=>setInv({...inv,vencimento:e.target.value})} style={fs} /></div>
              </div>
              <div style={{ display:'flex',gap:8 }}>
                <button onClick={()=>{
                  if(!inv.nome){alert('Preencha o nome');return}
                  if(isRV) inv.valor=(inv.quantidade||0)*(inv.precoPago||0)
                  if(addInv){const nc=[...carteira,inv];setCarteira(nc);triggerSave(months,avulsos,cartaosList,metas,nc);setAddInv(null)}
                  else{const nc=carteira.map(x=>x.id===inv.id?inv:x);setCarteira(nc);triggerSave(months,avulsos,cartaosList,metas,nc);setEditInv(null)}
                }} style={{ flex:1,padding:12,background:'linear-gradient(135deg,'+C.g+',#059669)',border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer' }}>Salvar</button>
                <button onClick={()=>{setAddInv(null);setEditInv(null)}} style={{ flex:1,padding:12,background:'rgba(255,255,255,.03)',border:'1px solid '+C.border,borderRadius:10,color:C.dm,fontSize:13,cursor:'pointer' }}>Cancelar</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Aporte popup */}
      {aportePopup && (
        <div style={{ position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:400,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }} onClick={()=>setAportePopup(null)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:C.bg,border:'1px solid '+C.border,borderRadius:14,padding:20,maxWidth:340,width:'100%' }}>
            <div style={{ fontSize:15,fontWeight:700,marginBottom:14,color:C.tx }}>Novo Aporte</div>
            <div style={{ marginBottom:10 }}><label style={{ fontSize:10,color:C.dm,marginBottom:4,display:'block' }}>Valor R$</label><input type="number" step="0.01" value={aportePopup.valor} onChange={e=>setAportePopup({...aportePopup,valor:e.target.value})} style={{ width:'100%',background:'rgba(255,255,255,.05)',border:'1px solid '+C.border,borderRadius:8,padding:'10px 12px',color:C.tx,fontSize:13,outline:'none' }} autoFocus /></div>
            <div style={{ marginBottom:14 }}><label style={{ fontSize:10,color:C.dm,marginBottom:4,display:'block' }}>Data</label><input type="date" value={aportePopup.data} onChange={e=>setAportePopup({...aportePopup,data:e.target.value})} style={{ width:'100%',background:'rgba(255,255,255,.05)',border:'1px solid '+C.border,borderRadius:8,padding:'10px 12px',color:C.tx,fontSize:13,outline:'none' }} /></div>
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={()=>{
                const v=parseFloat(aportePopup.valor);if(isNaN(v)||v<=0){alert('Valor inválido');return}
                const nc=carteira.map(i=>{if(i.id!==aportePopup.invId)return i;const ap=(i.aportes||[{valor:i.valor,data:i.dataAplicacao||''}]).concat([{valor:v,data:aportePopup.data}]);return{...i,aportes:ap,valor:ap.reduce((a,b)=>a+b.valor,0)}})
                setCarteira(nc);triggerSave(months,avulsos,cartaosList,metas,nc);setAportePopup(null)
              }} style={{ flex:1,padding:12,background:'linear-gradient(135deg,'+C.g+',#059669)',border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer' }}>Salvar</button>
              <button onClick={()=>setAportePopup(null)} style={{ flex:1,padding:12,background:'rgba(255,255,255,.03)',border:'1px solid '+C.border,borderRadius:10,color:C.dm,fontSize:13,cursor:'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
