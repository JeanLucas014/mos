import { useState, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, RefreshCw, Plus, X, Unplug, CalendarDays } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type Event       = Database['public']['Tables']['events']['Row']
type EventInsert = Database['public']['Tables']['events']['Insert']

/* ── Palette ──────────────────────────────────────────────────── */
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

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]
const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

/* ── Category colors ─────────────────────────────────────────── */
type Category = 'treino' | 'reuniao' | 'estudo' | 'geral'

const CAT: Record<string, { color: string; bg: string; label: string }> = {
  treino:  { color: C.g,  bg: 'rgba(52,211,153,.85)',  label: 'Treino'  },
  reuniao: { color: C.b,  bg: 'rgba(14,165,233,.85)',  label: 'Reunião' },
  estudo:  { color: C.a,  bg: 'rgba(251,191,36,.85)',  label: 'Estudo'  },
  geral:   { color: C.dm, bg: 'rgba(136,136,136,.75)', label: 'Geral'   },
}
function catCfg(c: string) { return CAT[c] ?? CAT.geral }

/* ── Helpers ──────────────────────────────────────────────────── */
function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function fmtTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function isAllDay(ev: Event): boolean {
  return ev.starts_at.endsWith('T00:00:00Z') && (ev.ends_at?.endsWith('T23:59:59Z') ?? false)
}

/** Full calendar grid — always starts on Sunday */
function calendarGrid(year: number, month: number): Date[] {
  const first    = new Date(year, month, 1)
  const last     = new Date(year, month + 1, 0)
  const startSun = new Date(first); startSun.setDate(1 - first.getDay())
  const endSat   = new Date(last);  endSat.setDate(last.getDate() + (6 - last.getDay()))
  const days: Date[] = []
  const cur = new Date(startSun)
  while (cur <= endSat) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }
  return days
}

function monthRange(year: number, month: number): { timeMin: string; timeMax: string } {
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0, 23, 59, 59)
  return { timeMin: first.toISOString(), timeMax: last.toISOString() }
}

/* ── Hooks ────────────────────────────────────────────────────── */
function useGCalIntegration() {
  return useQuery({
    queryKey: ['integration', 'gcal'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('integrations') as any)
        .select('connected, meta')
        .eq('provider', 'gcal')
        .maybeSingle()
      if (error) throw error
      return data as { connected: boolean; meta: Record<string, unknown> } | null
    },
  })
}

function useEvents(year: number, month: number) {
  const { timeMin, timeMax } = monthRange(year, month)
  return useQuery({
    queryKey: ['events', year, month],
    queryFn: async () => {
      const { data, error } = await (supabase.from('events') as any)
        .select('*')
        .gte('starts_at', timeMin)
        .lte('starts_at', timeMax)
        .order('starts_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Event[]
    },
  })
}

/* ── AddEventModal ────────────────────────────────────────────── */
function AddEventModal({
  defaultDate, onClose,
}: {
  defaultDate?: Date; onClose: () => void
}) {
  const qc = useQueryClient()
  const isMobile = window.innerWidth < 640

  const [title,     setTitle]     = useState('')
  const [date,      setDate]      = useState(defaultDate ? toDateKey(defaultDate) : toDateKey(new Date()))
  const [startTime, setStartTime] = useState('09:00')
  const [endTime,   setEndTime]   = useState('10:00')
  const [category,  setCategory]  = useState<Category>('geral')
  const [saving,    setSaving]    = useState(false)
  const [err,       setErr]       = useState('')

  async function handleSave() {
    if (!title.trim()) { setErr('Preencha o título'); return }
    setSaving(true); setErr('')
    const starts_at = new Date(`${date}T${startTime}:00`).toISOString()
    const ends_at   = new Date(`${date}T${endTime}:00`).toISOString()
    const payload: EventInsert = { title: title.trim(), starts_at, ends_at, category, source: 'local' }
    const { error } = await (supabase.from('events') as any).insert(payload)
    setSaving(false)
    if (error) { setErr(error.message); return }
    qc.invalidateQueries({ queryKey: ['events'] })
    onClose()
  }

  const fs: React.CSSProperties = {
    width:'100%', boxSizing:'border-box', marginBottom:12,
    background:'rgba(255,255,255,.05)', border:`1px solid ${C.border}`,
    borderRadius:8, padding:'10px 12px', color:C.tx, fontSize:13, outline:'none',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position:'fixed', inset:0, zIndex:500,
        background:'rgba(0,0,0,.7)',
        display:'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent:'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:C.card, border:`1px solid ${C.border}`,
          borderRadius: isMobile ? '18px 18px 0 0' : 14,
          padding: isMobile ? '24px 20px 32px' : 24,
          width:'100%', maxWidth: isMobile ? '100%' : 400,
        }}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <span style={{ fontSize:15, fontWeight:700, color:C.tx }}>Novo evento</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:C.dm, display:'flex' }}>
            <X size={18} />
          </button>
        </div>

        <label style={lbl}>Título</label>
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="Reunião de alinhamento..." style={fs} autoFocus
        />

        <label style={lbl}>Data</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...fs, colorScheme:'dark' }} />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
          <div>
            <label style={lbl}>Início</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ ...fs, marginBottom:0, colorScheme:'dark' }} />
          </div>
          <div>
            <label style={lbl}>Fim</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ ...fs, marginBottom:0, colorScheme:'dark' }} />
          </div>
        </div>

        <label style={lbl}>Categoria</label>
        <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
          {(Object.keys(CAT) as Category[]).map(c => {
            const cfg    = catCfg(c)
            const active = category === c
            return (
              <button
                key={c} onClick={() => setCategory(c)}
                style={{
                  padding:'5px 12px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:active?600:400,
                  background: active ? cfg.color + '20' : 'transparent',
                  border:     active ? `1px solid ${cfg.color}50` : `1px solid ${C.border}`,
                  color:      active ? cfg.color : C.dm,
                }}
              >
                {cfg.label}
              </button>
            )
          })}
        </div>

        {err && <div style={{ color:C.r, fontSize:12, marginBottom:12 }}>{err}</div>}

        <div style={{ display:'flex', gap:8 }}>
          <button
            onClick={handleSave} disabled={saving}
            style={{
              flex:1, padding:12, borderRadius:10,
              background:'linear-gradient(135deg,#0EA5E9,#0284c7)',
              border:'none', color:'#fff', fontSize:13, fontWeight:600,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Salvando...' : 'Criar evento'}
          </button>
          <button onClick={onClose} style={{ padding:'12px 20px', borderRadius:10, background:'rgba(255,255,255,.04)', border:`1px solid ${C.border}`, color:C.dm, fontSize:13, cursor:'pointer' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
const lbl: React.CSSProperties = { display:'block', fontSize:11, fontWeight:600, color:C.dm, marginBottom:4, letterSpacing:'.04em' }

/* ── DayPanel ─────────────────────────────────────────────────── */
function DayPanel({
  day, events, isMobile, onClose, onAdd,
}: {
  day: Date; events: Event[]; isMobile: boolean; onClose: () => void; onAdd: () => void
}) {
  const label = day.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' })

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position:'fixed', zIndex:300, inset:0, top:'auto', bottom:0, left:0, right:0,
        borderRadius:'18px 18px 0 0', maxHeight:'80dvh', overflowY:'auto',
        background:C.card, padding:20,
      }
    : {
        background:C.card, border:`1px solid ${C.border}`,
        borderRadius:12, padding:20, overflowY:'auto',
        maxHeight:'calc(100vh - 200px)',
      }

  const content = (
    <div style={panelStyle}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:C.tx, textTransform:'capitalize' }}>{label}</div>
          <div style={{ fontSize:11, color:C.dm, marginTop:2 }}>
            {events.length} {events.length === 1 ? 'evento' : 'eventos'}
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button
            onClick={onAdd}
            style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', background:'rgba(14,165,233,.15)', border:`1px solid rgba(14,165,233,.3)`, borderRadius:8, color:C.b, fontSize:12, cursor:'pointer' }}
          >
            <Plus size={13} /> Novo
          </button>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:C.dm, display:'flex', padding:4 }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign:'center', padding:'32px 16px', color:C.dm, fontSize:13 }}>
          Nenhum evento neste dia
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {events.map(ev => {
            const cfg    = catCfg(ev.category)
            const allDay = isAllDay(ev)
            return (
              <div key={ev.id} style={{
                background:C.card2, borderRadius:10, padding:'12px 14px',
                border:`1px solid ${C.border}`,
                borderLeft:`3px solid ${cfg.color}`,
              }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.tx, marginBottom:4 }}>{ev.title}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:600, background:cfg.color+'20', color:cfg.color }}>
                    {cfg.label}
                  </span>
                  <span style={{ fontSize:11, color:C.dm }}>
                    {allDay ? 'Dia inteiro' : `${fmtTime(ev.starts_at)}${ev.ends_at ? ' – ' + fmtTime(ev.ends_at) : ''}`}
                  </span>
                  {ev.source === 'gcal' && (
                    <span style={{ fontSize:9, color:C.dm2, marginLeft:'auto' }}>Google</span>
                  )}
                </div>
                {ev.description && (
                  <div style={{ marginTop:8, fontSize:11, color:C.dm, lineHeight:1.5 }}>{ev.description}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  if (!isMobile) return content
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:299, background:'rgba(0,0,0,.6)' }} />
      {content}
    </>
  )
}

/* ── ConnectCard ──────────────────────────────────────────────── */
function ConnectCard() {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function connect() {
    setLoading(true); setErr('')
    const { data, error } = await supabase.functions.invoke('gcal-auth-url')
    if (error || !data?.url) {
      setErr('Não foi possível iniciar a autorização. Verifique se as Edge Functions estão publicadas.')
      setLoading(false)
      return
    }
    window.location.href = data.url
  }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{
        background:C.card, border:`1px solid ${C.border}`,
        borderRadius:16, padding:'40px 32px', maxWidth:360, width:'100%', textAlign:'center',
      }}>
        <CalendarDays size={48} style={{ color:C.b, margin:'0 auto 16px', display:'block' }} />
        <h2 style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:20, letterSpacing:'-0.02em', margin:'0 0 8px', color:C.tx }}>
          Google Agenda
        </h2>
        <p style={{ color:C.dm, fontSize:13, lineHeight:1.6, margin:'0 0 24px' }}>
          Conecte sua conta Google para ver seus eventos diretamente no MOS.
          Tokens armazenados de forma segura no servidor.
        </p>
        {err && <div style={{ color:C.r, fontSize:12, marginBottom:16 }}>{err}</div>}
        <button
          onClick={connect} disabled={loading}
          style={{
            width:'100%', padding:13, borderRadius:12,
            background: loading ? 'rgba(14,165,233,.4)' : 'linear-gradient(135deg,#0EA5E9,#0284c7)',
            border:'none', color:'#fff', fontSize:14, fontWeight:700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}
        >
          <CalendarDays size={16} />
          {loading ? 'Redirecionando...' : 'Conectar Google Agenda'}
        </button>
      </div>
    </div>
  )
}

/* ── CalendarView ─────────────────────────────────────────────── */
function CalendarView({ onDisconnect }: { onDisconnect: () => void }) {
  const qc       = useQueryClient()
  const today    = useMemo(() => new Date(), [])
  const isMobile = window.innerWidth < 640

  const [year,        setYear]        = useState(today.getFullYear())
  const [month,       setMonth]       = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [addModal,    setAddModal]    = useState(false)
  const [addDate,     setAddDate]     = useState<Date | undefined>()
  const [syncing,     setSyncing]     = useState(false)

  const { data: events = [], isLoading } = useEvents(year, month)

  const days = useMemo(() => calendarGrid(year, month), [year, month])

  const byDay = useMemo(() => {
    const map: Record<string, Event[]> = {}
    events.forEach(ev => {
      const key = toDateKey(new Date(ev.starts_at))
      ;(map[key] ??= []).push(ev)
    })
    return map
  }, [events])

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return []
    return (byDay[toDateKey(selectedDay)] ?? []).sort((a,b) => a.starts_at.localeCompare(b.starts_at))
  }, [byDay, selectedDay])

  function prevMonth() { month === 0 ? (setMonth(11), setYear(y=>y-1)) : setMonth(m=>m-1) }
  function nextMonth() { month === 11 ? (setMonth(0), setYear(y=>y+1)) : setMonth(m=>m+1) }
  function goToday()   { setYear(today.getFullYear()); setMonth(today.getMonth()) }

  async function handleSync() {
    setSyncing(true)
    const { timeMin, timeMax } = monthRange(year, month)
    const { error } = await supabase.functions.invoke('gcal-events', { body: { timeMin, timeMax } })
    if (error) console.error('[gcal-events]', error)
    qc.invalidateQueries({ queryKey: ['events', year, month] })
    setSyncing(false)
  }

  async function handleDisconnect() {
    if (!window.confirm('Desconectar Google Agenda? Os eventos salvos localmente serão mantidos.')) return
    await (supabase.from('integrations') as any)
      .update({ connected: false, access_token_cipher: null, refresh_token_cipher: null })
      .eq('provider', 'gcal')
    qc.invalidateQueries({ queryKey: ['integration', 'gcal'] })
    onDisconnect()
  }

  const MAX_VISIBLE = isMobile ? 0 : 3

  return (
    <div style={{ fontFamily:'Manrope,sans-serif' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <h1 style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:26, letterSpacing:'-0.03em', margin:0 }}>
          Agenda
        </h1>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          <button
            onClick={() => { setAddDate(undefined); setAddModal(true) }}
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', background:'linear-gradient(135deg,#0EA5E9,#0284c7)', border:'none', borderRadius:9, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}
          >
            <Plus size={14} /> Novo evento
          </button>
          <button
            onClick={handleSync} disabled={syncing}
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', background:'rgba(52,211,153,.12)', border:`1px solid rgba(52,211,153,.3)`, borderRadius:9, color:C.g, fontSize:12, fontWeight:600, cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? 0.7 : 1 }}
          >
            <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
          <button
            onClick={handleDisconnect}
            style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'8px 12px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:9, color:C.dm, fontSize:12, cursor:'pointer' }}
          >
            <Unplug size={13} /> Desconectar
          </button>
        </div>
      </div>

      {/* ── Month navigator ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
        <button onClick={prevMonth} style={navBtn}><ChevronLeft size={18}/></button>
        <span style={{ fontFamily:'Sora,sans-serif', fontSize:18, fontWeight:700, color:C.tx, minWidth:190, textAlign:'center' }}>
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} style={navBtn}><ChevronRight size={18}/></button>
        {(year !== today.getFullYear() || month !== today.getMonth()) && (
          <button onClick={goToday} style={{ marginLeft:6, padding:'5px 12px', background:'rgba(14,165,233,.1)', border:`1px solid rgba(14,165,233,.25)`, borderRadius:8, color:C.b, fontSize:11, cursor:'pointer' }}>
            Hoje
          </button>
        )}
      </div>

      {/* ── Calendar + optional side panel ── */}
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>

        {/* Grid */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Weekday headers */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:600, color:C.dm2, padding:'4px 0', letterSpacing:'.05em' }}>
                {d}
              </div>
            ))}
          </div>

          {isLoading ? (
            <div style={{ textAlign:'center', padding:'48px 24px', color:C.dm, fontSize:13 }}>Carregando...</div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
              {days.map((day, idx) => {
                const key        = toDateKey(day)
                const inMonth    = day.getMonth() === month
                const isToday    = key === toDateKey(today)
                const isSelected = selectedDay ? key === toDateKey(selectedDay) : false
                const dayEvs     = byDay[key] ?? []

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    style={{
                      minHeight: isMobile ? 52 : 80,
                      background: isSelected
                        ? 'rgba(14,165,233,.12)'
                        : isToday ? 'rgba(14,165,233,.06)' : inMonth ? C.card : 'transparent',
                      border: isToday
                        ? `1px solid ${C.b}60`
                        : isSelected ? `1px solid ${C.b}50`
                        : `1px solid ${inMonth ? C.border : 'transparent'}`,
                      borderRadius:8, padding: isMobile ? '5px 5px' : '6px 8px',
                      cursor:'pointer', overflow:'hidden', transition:'background .1s',
                    }}
                  >
                    {/* Day number */}
                    <div style={{
                      fontSize: isMobile ? 11 : 12, fontWeight: isToday ? 700 : 400,
                      color: isToday ? C.b : inMonth ? C.tx : C.dm2,
                      marginBottom: isMobile ? 3 : 5, lineHeight:1,
                    }}>
                      {day.getDate()}
                    </div>

                    {/* Desktop: event bars */}
                    {!isMobile && dayEvs.slice(0, MAX_VISIBLE).map(ev => (
                      <div key={ev.id} style={{
                        background: catCfg(ev.category).bg,
                        borderRadius:3, padding:'2px 5px', marginBottom:2,
                        fontSize:10, color:'#fff', fontWeight:600,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.5,
                      }}>
                        {ev.title}
                      </div>
                    ))}
                    {!isMobile && dayEvs.length > MAX_VISIBLE && (
                      <div style={{ fontSize:9, color:C.dm }}>+{dayEvs.length - MAX_VISIBLE} mais</div>
                    )}

                    {/* Mobile: colored dots */}
                    {isMobile && dayEvs.length > 0 && (
                      <div style={{ display:'flex', gap:2, flexWrap:'wrap' }}>
                        {dayEvs.slice(0,4).map(ev => (
                          <div key={ev.id} style={{ width:5, height:5, borderRadius:'50%', background:catCfg(ev.category).color }} />
                        ))}
                        {dayEvs.length > 4 && <span style={{ fontSize:8, color:C.dm, lineHeight:'6px' }}>…</span>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Desktop side panel */}
        {!isMobile && selectedDay && (
          <div style={{ width:300, flexShrink:0 }}>
            <DayPanel
              day={selectedDay} events={selectedDayEvents} isMobile={false}
              onClose={() => setSelectedDay(null)}
              onAdd={() => { setAddDate(selectedDay); setAddModal(true) }}
            />
          </div>
        )}
      </div>

      {/* Mobile full-screen panel */}
      {isMobile && selectedDay && (
        <DayPanel
          day={selectedDay} events={selectedDayEvents} isMobile={true}
          onClose={() => setSelectedDay(null)}
          onAdd={() => { setAddDate(selectedDay); setAddModal(true) }}
        />
      )}

      {/* Add event modal */}
      {addModal && (
        <AddEventModal
          defaultDate={addDate}
          onClose={() => { setAddModal(false); setAddDate(undefined) }}
        />
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = {
  background:C.card, border:`1px solid ${C.border}`,
  borderRadius:8, cursor:'pointer', color:C.dm,
  display:'flex', alignItems:'center', padding:6,
}

/* ── Main ─────────────────────────────────────────────────────── */
export function AgendaPage() {
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()
  const [forceDisconnected, setForceDisconnected] = useState(false)

  const { data: integration, isLoading } = useGCalIntegration()

  /* Handle ?connected=true redirect from gcal-callback */
  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      qc.invalidateQueries({ queryKey: ['integration', 'gcal'] })
      window.history.replaceState({}, '', '/agenda')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div>
        <h1 style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:26, letterSpacing:'-0.03em' }}>Agenda</h1>
        <p style={{ color:C.dm, fontSize:13, marginTop:8 }}>Carregando...</p>
      </div>
    )
  }

  const connected = !forceDisconnected && integration?.connected === true

  if (!connected) return <ConnectCard />

  return <CalendarView onDisconnect={() => setForceDisconnected(true)} />
}
