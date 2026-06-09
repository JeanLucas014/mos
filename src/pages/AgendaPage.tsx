import { useState, useMemo, useEffect, useRef } from 'react'
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

/* ── Category config ──────────────────────────────────────────── */
type Category = 'nata' | 'moto' | 'treino' | 'estudos' | 'casa' | 'lazer' | 'tarefas' | 'outros'

const CAT: Record<string, { color: string; bg: string; label: string }> = {
  nata:    { color: '#0EA5E9', bg: 'rgba(14,165,233,.85)',  label: 'Nata'    },
  moto:    { color: '#ef4444', bg: 'rgba(239,68,68,.85)',   label: 'Moto'    },
  treino:  { color: '#22c55e', bg: 'rgba(34,197,94,.85)',   label: 'Treino'  },
  estudos: { color: '#eab308', bg: 'rgba(234,179,8,.85)',   label: 'Estudos' },
  casa:    { color: '#f97316', bg: 'rgba(249,115,22,.85)',  label: 'Casa'    },
  lazer:   { color: '#ec4899', bg: 'rgba(236,72,153,.85)',  label: 'Lazer'   },
  tarefas: { color: '#71717a', bg: 'rgba(113,113,122,.75)', label: 'Tarefas' },
  outros:  { color: '#52525b', bg: 'rgba(82,82,91,.75)',    label: 'Outros'  },
  // legacy fallbacks for old events
  reuniao: { color: '#0EA5E9', bg: 'rgba(14,165,233,.85)',  label: 'Reunião' },
  estudo:  { color: '#eab308', bg: 'rgba(234,179,8,.85)',   label: 'Estudo'  },
  geral:   { color: '#52525b', bg: 'rgba(82,82,91,.75)',    label: 'Geral'   },
}
function catCfg(c: string) { return CAT[c] ?? CAT.outros }

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

/* ── Week helpers ─────────────────────────────────────────────── */
const HOUR_H = 56 // px per hour

function getWeekSunday(d: Date): Date {
  const s = new Date(d)
  s.setDate(d.getDate() - d.getDay())
  s.setHours(0, 0, 0, 0)
  return s
}

function buildWeekDays(sunday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(d.getDate() + i)
    return d
  })
}

function weekRange(sunday: Date): { timeMin: string; timeMax: string } {
  const end = new Date(sunday)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { timeMin: sunday.toISOString(), timeMax: end.toISOString() }
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

function useEventsRange(timeMin: string, timeMax: string) {
  return useQuery({
    queryKey: ['events', timeMin, timeMax],
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

/* ── EventCard (with category edit) ──────────────────────────── */
function EventCard({ ev }: { ev: Event }) {
  const qc              = useQueryClient()
  const [cat, setCat]   = useState(ev.category ?? 'geral')
  const [saving, setSaving] = useState(false)

  async function updateCategory(newCat: string) {
    setCat(newCat)
    setSaving(true)
    await (supabase.from('events') as any).update({ category: newCat }).eq('id', ev.id)
    setSaving(false)
    qc.invalidateQueries({ queryKey: ['events'] })
  }

  const cfg    = catCfg(cat)
  const allDay = isAllDay(ev)

  return (
    <div style={{
      background:C.card2, borderRadius:10, padding:'12px 14px',
      border:`1px solid ${C.border}`,
      borderLeft:`3px solid ${cfg.color}`,
    }}>
      <div style={{ fontSize:13, fontWeight:600, color:C.tx, marginBottom:6 }}>{ev.title}</div>

      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:6 }}>
        <span style={{ fontSize:11, color:C.dm }}>
          {allDay ? 'Dia inteiro' : `${fmtTime(ev.starts_at)}${ev.ends_at ? ' – ' + fmtTime(ev.ends_at) : ''}`}
        </span>
        {ev.source === 'gcal' && (
          <span style={{ fontSize:9, color:C.dm2, marginLeft:'auto' }}>Google</span>
        )}
      </div>

      {/* Category badge + edit dropdown */}
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{
          padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:600,
          background: cfg.color + '20', color: cfg.color, whiteSpace:'nowrap',
        }}>
          {cfg.label}
        </span>
        <select
          value={cat}
          onChange={e => updateCategory(e.target.value)}
          disabled={saving}
          style={{
            background:C.card2, border:`1px solid ${C.border}`,
            borderRadius:6, color:C.dm, fontSize:10,
            padding:'2px 6px', cursor:'pointer', outline:'none',
            opacity: saving ? 0.5 : 1,
          }}
        >
          {Object.entries(CAT).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {ev.description && (
        <div style={{ marginTop:8, fontSize:11, color:C.dm, lineHeight:1.5 }}>{ev.description}</div>
      )}
    </div>
  )
}

/* ── AddEventModal ────────────────────────────────────────────── */
function AddEventModal({
  defaultDate, defaultStartTime, onClose,
}: {
  defaultDate?: Date; defaultStartTime?: string; onClose: () => void
}) {
  const qc       = useQueryClient()
  const isMobile = window.innerWidth < 640

  const [title,     setTitle]     = useState('')
  const [date,      setDate]      = useState(defaultDate ? toDateKey(defaultDate) : toDateKey(new Date()))
  const [startTime, setStartTime] = useState(defaultStartTime ?? '09:00')
  const [endTime,   setEndTime]   = useState(() => {
    if (defaultStartTime) {
      const h = parseInt(defaultStartTime.split(':')[0], 10)
      return `${String(Math.min(h + 1, 23)).padStart(2,'0')}:00`
    }
    return '10:00'
  })
  const [category,  setCategory]  = useState<Category>('outros')
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
          {events.map(ev => <EventCard key={ev.id} ev={ev} />)}
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

/* ── WeekView ─────────────────────────────────────────────────── */
function WeekView({
  days, events, todayKey, isMobile, onSlotClick,
}: {
  days: Date[]
  events: Event[]
  todayKey: string
  isMobile: boolean
  onSlotClick: (date: Date, hour: number) => void
}) {
  const scrollRef  = useRef<HTMLDivElement>(null)
  const now        = useMemo(() => new Date(), [])
  const nowTop     = ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * HOUR_H * 24

  const LABEL_W = 44
  const DAY_W   = isMobile
    ? Math.floor((window.innerWidth - LABEL_W - 8) / 3)
    : undefined

  // Group events by day key
  const byDay = useMemo(() => {
    const map: Record<string, Event[]> = {}
    days.forEach(d => { map[toDateKey(d)] = [] })
    events.forEach(ev => {
      const k = toDateKey(new Date(ev.starts_at))
      if (map[k]) map[k].push(ev)
    })
    return map
  }, [days, events])

  // Scroll to ~7 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(7 * HOUR_H - 60, 0)
    }
  }, [])

  const minWidth = isMobile ? `${LABEL_W + 7 * (DAY_W ?? 100)}px` : '100%'

  return (
    <div
      ref={scrollRef}
      style={{
        overflowY: 'auto',
        overflowX: isMobile ? 'auto' : 'hidden',
        maxHeight: 560,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
      }}
    >
      <div style={{ minWidth }}>
        {/* Sticky day-header row */}
        <div style={{
          position:'sticky', top:0, zIndex:20,
          display:'flex', background:C.bg,
          borderBottom:`1px solid ${C.border}`,
        }}>
          <div style={{ width:LABEL_W, flexShrink:0 }} />
          {days.map((d, i) => {
            const k       = toDateKey(d)
            const isToday = k === todayKey
            return (
              <div key={i} style={{
                flex: DAY_W ? `0 0 ${DAY_W}px` : 1,
                textAlign:'center', padding:'6px 4px',
                background: isToday ? 'rgba(14,165,233,.06)' : 'transparent',
              }}>
                <div style={{ fontSize:9, color:C.dm, fontWeight:600, letterSpacing:'.06em', textTransform:'uppercase' }}>
                  {WEEKDAYS[d.getDay()]}
                </div>
                <div style={{
                  fontSize:15, fontWeight: isToday ? 700 : 400,
                  color: isToday ? '#fff' : C.dm,
                  width:28, height:28, borderRadius:'50%',
                  background: isToday ? C.b : 'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  margin:'2px auto 0',
                }}>
                  {d.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time grid */}
        <div style={{ display:'flex' }}>
          {/* Hour labels */}
          <div style={{ width:LABEL_W, flexShrink:0, borderRight:`1px solid ${C.border}` }}>
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} style={{
                height:HOUR_H, boxSizing:'border-box',
                borderBottom:`1px solid ${C.border}`,
                display:'flex', alignItems:'flex-start',
                justifyContent:'flex-end',
                paddingTop:3, paddingRight:6,
                fontSize:9, color:C.dm2,
              }}>
                {h === 0 ? '' : `${h.toString().padStart(2,'0')}:00`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d, di) => {
            const k       = toDateKey(d)
            const isToday = k === todayKey
            const dayEvs  = byDay[k] ?? []

            return (
              <div key={di} style={{
                flex: DAY_W ? `0 0 ${DAY_W}px` : 1,
                position:'relative',
                height: HOUR_H * 24,
                borderLeft: `1px solid ${C.border}`,
                background: isToday ? 'rgba(14,165,233,.02)' : 'transparent',
                boxSizing:'border-box',
              }}>
                {/* Clickable hour slots + grid lines */}
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} style={{
                    position:'absolute', left:0, right:0,
                    top: h * HOUR_H, height: HOUR_H,
                    borderBottom:`1px solid ${C.border}`,
                    boxSizing:'border-box', cursor:'pointer',
                  }}
                    onClick={() => onSlotClick(d, h)}
                  />
                ))}

                {/* Half-hour marks */}
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={`h${h}`} style={{
                    position:'absolute', left:0, right:0,
                    top: h * HOUR_H + HOUR_H / 2,
                    height:1, background:C.border, opacity:0.4,
                    pointerEvents:'none',
                  }} />
                ))}

                {/* Events */}
                {dayEvs.filter(ev => !isAllDay(ev)).map(ev => {
                  const s   = new Date(ev.starts_at)
                  const e   = ev.ends_at ? new Date(ev.ends_at) : new Date(s.getTime() + 3_600_000)
                  const sm  = s.getHours() * 60 + s.getMinutes()
                  const em  = Math.min(e.getHours() * 60 + e.getMinutes() || 24 * 60, 24 * 60)
                  const dur = Math.max(em - sm, 15)
                  const top    = (sm / (24 * 60)) * HOUR_H * 24
                  const height = Math.max((dur / (24 * 60)) * HOUR_H * 24, 18)
                  const cfg    = catCfg(ev.category)

                  return (
                    <div key={ev.id} title={ev.title} style={{
                      position:'absolute',
                      top: top + 1, left: 2, right: 2,
                      height: height - 2,
                      background: cfg.color + '22',
                      borderLeft: `3px solid ${cfg.color}`,
                      borderRadius: 4,
                      padding: '2px 4px',
                      overflow: 'hidden',
                      cursor: 'default',
                      zIndex: 5,
                    }}>
                      <div style={{ fontSize:10, fontWeight:700, color:cfg.color, lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {ev.title}
                      </div>
                      {height > 32 && (
                        <div style={{ fontSize:9, color:cfg.color + 'aa' }}>
                          {fmtTime(ev.starts_at)}{ev.ends_at ? ' – ' + fmtTime(ev.ends_at) : ''}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Current time indicator */}
                {isToday && (
                  <div style={{
                    position:'absolute', left:0, right:0, top: nowTop,
                    height:2, background:C.r, zIndex:10, pointerEvents:'none',
                  }}>
                    <div style={{
                      position:'absolute', left:-4, top:-4,
                      width:8, height:8, borderRadius:'50%', background:C.r,
                    }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── ConnectCard ──────────────────────────────────────────────── */
function ConnectCard() {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function connect() {
    setLoading(true); setErr('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gcal-auth-url`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token ?? ''}`,
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        },
      )
      if (!resp.ok) {
        const msg = await resp.text()
        throw new Error(msg)
      }
      const data = await resp.json()
      if (!data?.url) throw new Error('URL não retornada pela função')
      window.location.href = data.url
    } catch (e) {
      setErr('Não foi possível iniciar a autorização. Verifique se as Edge Functions estão publicadas.')
      console.error('[gcal-auth-url]', e)
      setLoading(false)
    }
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

  const [viewMode,      setViewMode]      = useState<'month' | 'week' | 'year'>('month')
  const [year,          setYear]          = useState(today.getFullYear())
  const [month,         setMonth]         = useState(today.getMonth())
  const [weekSunday,    setWeekSunday]    = useState(() => getWeekSunday(today))
  const [selectedDay,   setSelectedDay]   = useState<Date | null>(null)
  const [addModal,      setAddModal]      = useState(false)
  const [addDate,       setAddDate]       = useState<Date | undefined>()
  const [addStartTime,  setAddStartTime]  = useState<string | undefined>()
  const [syncing,       setSyncing]       = useState(false)

  const todayKey = useMemo(() => toDateKey(today), [today])

  /* Dynamic query range — month, week, or year */
  const { timeMin, timeMax } = useMemo(() => {
    if (viewMode === 'week') return weekRange(weekSunday)
    if (viewMode === 'year') return {
      timeMin: new Date(year, 0, 1).toISOString(),
      timeMax: new Date(year, 11, 31, 23, 59, 59).toISOString(),
    }
    return monthRange(year, month)
  }, [viewMode, weekSunday, year, month])

  const { data: events = [], isLoading } = useEventsRange(timeMin, timeMax)

  /* Month-view data */
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
    return (byDay[toDateKey(selectedDay)] ?? []).sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  }, [byDay, selectedDay])

  /* Week-view days */
  const weekDaysArr = useMemo(() => buildWeekDays(weekSunday), [weekSunday])

  /* Navigation */
  function prevPeriod() {
    if (viewMode === 'year') { setYear(y => y - 1) }
    else if (viewMode === 'month') {
      month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1)
    } else {
      setWeekSunday(s => { const d = new Date(s); d.setDate(d.getDate() - 7); return d })
    }
  }
  function nextPeriod() {
    if (viewMode === 'year') { setYear(y => y + 1) }
    else if (viewMode === 'month') {
      month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1)
    } else {
      setWeekSunday(s => { const d = new Date(s); d.setDate(d.getDate() + 7); return d })
    }
  }
  function goToday() {
    setYear(today.getFullYear()); setMonth(today.getMonth())
    setWeekSunday(getWeekSunday(today))
  }

  function switchView(v: 'month' | 'week' | 'year') {
    if (v === 'week' && viewMode === 'month') {
      const isCurrent = year === today.getFullYear() && month === today.getMonth()
      setWeekSunday(getWeekSunday(isCurrent ? today : new Date(year, month, 1)))
    } else if (v === 'month' && viewMode === 'week') {
      const mid = new Date(weekSunday); mid.setDate(mid.getDate() + 3)
      setYear(mid.getFullYear()); setMonth(mid.getMonth())
    }
    setSelectedDay(null)
    setViewMode(v)
  }

  const isCurrentPeriod = viewMode === 'year'
    ? year === today.getFullYear()
    : viewMode === 'month'
    ? (year === today.getFullYear() && month === today.getMonth())
    : toDateKey(weekSunday) === toDateKey(getWeekSunday(today))

  const periodLabel = useMemo(() => {
    if (viewMode === 'year')  return String(year)
    if (viewMode === 'month') return `${MONTHS[month]} ${year}`
    const last = weekDaysArr[6]
    if (weekSunday.getMonth() === last.getMonth()) {
      return `${weekSunday.getDate()} – ${last.getDate()} de ${MONTHS[weekSunday.getMonth()].substring(0,3)} ${weekSunday.getFullYear()}`
    }
    return `${weekSunday.getDate()} ${MONTHS[weekSunday.getMonth()].substring(0,3)} – ${last.getDate()} ${MONTHS[last.getMonth()].substring(0,3)} ${last.getFullYear()}`
  }, [viewMode, month, year, weekSunday, weekDaysArr])

  /* Sync */
  async function handleSync() {
    setSyncing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gcal-events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token ?? ''}`,
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ timeMin, timeMax }),
        },
      )
      if (!resp.ok) console.error('[gcal-events]', await resp.text())
    } catch (e) {
      console.error('[gcal-events]', e)
    }
    qc.invalidateQueries({ queryKey: ['events'] })
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

  function handleSlotClick(date: Date, hour: number) {
    setAddDate(date)
    setAddStartTime(`${hour.toString().padStart(2,'0')}:00`)
    setAddModal(true)
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
          {/* View toggle */}
          <div style={{ display:'flex', gap:2, padding:3, background:C.card2, borderRadius:9, border:`1px solid ${C.border}` }}>
            {([['month','Mês'],['week','Semana'],['year','Ano']] as const).map(([v, label]) => (
              <button
                key={v} onClick={() => switchView(v as 'month' | 'week' | 'year')}
                style={{
                  padding:'5px 14px', borderRadius:7, border:'none', cursor:'pointer', fontSize:12, fontWeight:600,
                  background: viewMode === v ? C.b : 'transparent',
                  color:      viewMode === v ? '#fff' : C.dm,
                  transition:'background .15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setAddDate(undefined); setAddStartTime(undefined); setAddModal(true) }}
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

      {/* ── Period navigator ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
        <button onClick={prevPeriod} style={navBtn}><ChevronLeft size={18}/></button>
        <span style={{ fontFamily:'Sora,sans-serif', fontSize:17, fontWeight:700, color:C.tx, minWidth: viewMode==='month' ? 190 : 220, textAlign:'center' }}>
          {periodLabel}
        </span>
        <button onClick={nextPeriod} style={navBtn}><ChevronRight size={18}/></button>
        {!isCurrentPeriod && (
          <button onClick={goToday} style={{ marginLeft:6, padding:'5px 12px', background:'rgba(14,165,233,.1)', border:`1px solid rgba(14,165,233,.25)`, borderRadius:8, color:C.b, fontSize:11, cursor:'pointer' }}>
            Hoje
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign:'center', padding:'48px 24px', color:C.dm, fontSize:13 }}>Carregando...</div>
      ) : viewMode === 'week' ? (
        /* ── Week view ── */
        <WeekView
          days={weekDaysArr}
          events={events}
          todayKey={todayKey}
          isMobile={isMobile}
          onSlotClick={handleSlotClick}
        />
      ) : viewMode === 'year' ? (
        /* ── Year view ── */
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {MONTHS.map((mName, mIdx) => {
            const firstDay  = new Date(year, mIdx, 1)
            const lastDay   = new Date(year, mIdx + 1, 0)
            const startSun  = new Date(firstDay); startSun.setDate(1 - firstDay.getDay())
            const miniDays: (Date | null)[] = []
            const cur = new Date(startSun)
            while (cur <= lastDay || miniDays.length % 7 !== 0) {
              miniDays.push(cur <= lastDay && cur >= firstDay ? new Date(cur) : null)
              cur.setDate(cur.getDate() + 1)
              if (miniDays.length > 42) break
            }
            const isCurrentMonth = year === today.getFullYear() && mIdx === today.getMonth()
            return (
              <div
                key={mIdx}
                onClick={() => { setMonth(mIdx); setYear(year); switchView('month') }}
                style={{
                  background: C.card, border: `1px solid ${isCurrentMonth ? C.b + '60' : C.border}`,
                  borderRadius:10, padding:'10px 10px 8px', cursor:'pointer',
                  transition:'border-color .15s',
                }}
              >
                <div style={{ fontSize:11, fontWeight:700, color: isCurrentMonth ? C.b : C.tx, marginBottom:6 }}>
                  {mName}
                </div>
                {/* Mini weekday headers */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:2 }}>
                  {['D','S','T','Q','Q','S','S'].map((d, i) => (
                    <div key={i} style={{ textAlign:'center', fontSize:7, color:C.dm2 }}>{d}</div>
                  ))}
                </div>
                {/* Mini day grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1 }}>
                  {miniDays.map((day, di) => {
                    if (!day) return <div key={`e${di}`} />
                    const dk      = toDateKey(day)
                    const isToday = dk === todayKey
                    const dayEvs  = byDay[dk] ?? []
                    const dotColors = dayEvs.slice(0, 3).map(ev => catCfg(ev.category).color)
                    return (
                      <div key={di} style={{
                        display:'flex', flexDirection:'column', alignItems:'center',
                        padding:'1px 0',
                      }}>
                        <div style={{
                          fontSize:8, lineHeight:'14px',
                          color: isToday ? '#fff' : C.dm,
                          background: isToday ? C.b : 'transparent',
                          borderRadius: isToday ? '50%' : 0,
                          width:14, height:14, textAlign:'center',
                          fontWeight: isToday ? 700 : 400,
                        }}>
                          {day.getDate()}
                        </div>
                        {dotColors.length > 0 && (
                          <div style={{ display:'flex', gap:1, marginTop:1 }}>
                            {dotColors.map((c, ci) => (
                              <div key={ci} style={{ width:3, height:3, borderRadius:'50%', background:c }} />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Month view ── */
        <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
          <div style={{ flex:1, minWidth:0 }}>
            {/* Weekday headers */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
              {WEEKDAYS.map(d => (
                <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:600, color:C.dm2, padding:'4px 0', letterSpacing:'.05em' }}>
                  {d}
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
              {days.map((day, idx) => {
                const key        = toDateKey(day)
                const inMonth    = day.getMonth() === month
                const isToday    = key === todayKey
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
                    <div style={{
                      fontSize: isMobile ? 11 : 12, fontWeight: isToday ? 700 : 400,
                      color: isToday ? C.b : inMonth ? C.tx : C.dm2,
                      marginBottom: isMobile ? 3 : 5, lineHeight:1,
                    }}>
                      {day.getDate()}
                    </div>

                    {/* Desktop: event bars */}
                    {!isMobile && dayEvs.slice(0, MAX_VISIBLE).map(ev => {
                      const cfg = catCfg(ev.category)
                      return (
                        <div key={ev.id} style={{
                          background: cfg.color + '22',
                          borderLeft: `2px solid ${cfg.color}`,
                          borderRadius:3, padding:'2px 5px', marginBottom:2,
                          fontSize:10, color:cfg.color, fontWeight:600,
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.5,
                        }}>
                          {ev.title}
                        </div>
                      )
                    })}
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
          </div>

          {/* Desktop side panel */}
          {!isMobile && selectedDay && (
            <div style={{ width:300, flexShrink:0 }}>
              <DayPanel
                day={selectedDay} events={selectedDayEvents} isMobile={false}
                onClose={() => setSelectedDay(null)}
                onAdd={() => { setAddDate(selectedDay); setAddStartTime(undefined); setAddModal(true) }}
              />
            </div>
          )}
        </div>
      )}

      {/* Mobile month-view day panel */}
      {viewMode === 'month' && isMobile && selectedDay && (
        <DayPanel
          day={selectedDay} events={selectedDayEvents} isMobile={true}
          onClose={() => setSelectedDay(null)}
          onAdd={() => { setAddDate(selectedDay); setAddStartTime(undefined); setAddModal(true) }}
        />
      )}

      {/* Add event modal */}
      {addModal && (
        <AddEventModal
          defaultDate={addDate}
          defaultStartTime={addStartTime}
          onClose={() => { setAddModal(false); setAddDate(undefined); setAddStartTime(undefined) }}
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
