import { useState, useEffect, type FormEvent } from 'react'
import {
  ChevronDown, ChevronUp, Activity, Dumbbell, Bike,
  Target, Trophy, ShoppingBag, Calendar, MapPin, Check, Circle, RefreshCw, Plus,
} from 'lucide-react'
import { HelpButton } from '@/components/help/HelpButton'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useWorkouts } from '../../hooks/useWorkouts'
import { useSportGoals } from '../../hooks/useSportGoals'
import { useSportRaces } from '../../hooks/useSportRaces'
import { useSportShopping } from '../../hooks/useSportShopping'
import { supabase } from '../../lib/supabase'
import { todayLocal } from '../../lib/dates'
import type { SportRace, Sport, UserSport } from './types'
import { SPORT_CATALOG, SPORT_KINDS, KIND_LABELS, MODALITY_TABS, type ModalityTab } from './constants'
import {
  fmtDuration, parseDuration, calcPace, fmtDate, daysUntil,
  fmtDurationShort, fmtKm, fmtMonthLabel, fmtDayLabel, calcAvgPace, groupByMonth,
  paceToSec, secToPace,
} from './utils'

/* ── Section card ──────────────────────────────────────────────── */
function Section({
  title, icon, count, children, defaultOpen = true, extra,
}: {
  title: string; icon: React.ReactNode; count?: number | string
  children: React.ReactNode; defaultOpen?: boolean; extra?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-bg-2 border border-line rounded-card overflow-hidden">
      <div className="flex items-center pr-4" style={{ minHeight: 56 }}>
        <button
          onClick={() => setOpen(!open)}
          className="flex-1 flex items-center justify-between px-5 py-4 hover:bg-bg-3 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-ink-2">{icon}</span>
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14 }}>{title}</span>
            {count !== undefined && (
              <span className="text-ink-3" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{count}</span>
            )}
          </div>
          <ChevronDown size={16} className={`text-ink-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
        {extra && <div style={{ flexShrink: 0 }}>{extra}</div>}
      </div>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}


/* ── Small modal ───────────────────────────────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.8)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-line p-6 space-y-4" style={{ background: 'var(--bg2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between">
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 17 }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-ink-3 hover:text-ink rounded-input hover:bg-bg-3 transition-colors text-lg">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-bg border border-line rounded-input px-3 text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors'
const inputH = { minHeight: 44 }

/* ── Strava sync hook ──────────────────────────────────────────── */
function useStravaConnected() {
  return useQuery({
    queryKey: ['integration', 'strava'],
    queryFn: async () => {
      const { data } = await (supabase.from('integrations') as any)
        .select('connected').eq('provider', 'strava').eq('connected', true).maybeSingle()
      return !!data
    },
  })
}

/* ── YearStats ─────────────────────────────────────────────────── */
function YearStats({ workouts, year }: { workouts: Sport[]; year: string }) {
  const totalKm   = workouts.reduce((s, w) => s + (w.distance_m ?? 0), 0)
  const totalTime = workouts.reduce((s, w) => s + (w.duration_s ?? 0), 0)
  const totalCount = workouts.length
  const avgPerWeek = (totalCount / 26).toFixed(1)
  const bestPace   = calcAvgPace(workouts)
  const withDist   = workouts.filter(w => w.distance_m)
  const longestRun = withDist.length ? Math.max(...withDist.map(w => w.distance_m!)) : 0

  const modalityCounts = [
    { key: 'corrida',    label: 'Corrida',    count: workouts.filter(w => w.sport === 'corrida').length },
    { key: 'musculacao', label: 'Musculação', count: workouts.filter(w => w.sport === 'musculacao').length },
    { key: 'triathlon',  label: 'Triathlon',  count: workouts.filter(w => w.sport === 'triathlon').length },
  ].filter(m => m.count > 0)

  const stats = [
    { label: 'Distância total', value: `${(totalKm / 1000).toFixed(0)} km` },
    { label: 'Tempo total',     value: `${Math.floor(totalTime / 3600)}h ${Math.floor((totalTime % 3600) / 60)}min` },
    { label: 'Atividades',      value: String(totalCount) },
    { label: 'Média/semana',    value: `${avgPerWeek} treinos` },
    { label: 'Pace médio',      value: bestPace ?? '—' },
    { label: 'Maior corrida',   value: longestRun ? `${(longestRun / 1000).toFixed(1)} km` : '—' },
  ]

  return (
    <div className="border border-[#1f1f1f] rounded-2xl p-5 mb-5" style={{ background: 'var(--bg)' }}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-[#444] mb-1">Resumo anual</div>
          <div className="font-bold text-xl text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{year}</div>
        </div>
        {modalityCounts.length > 0 && (
          <div className="flex gap-5">
            {modalityCounts.map(m => (
              <div key={m.key} className="text-center">
                <div className="text-lg font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{m.count}</div>
                <div className="text-xs text-[#555]">{m.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {stats.map(s => (
          <div key={s.label} className="border border-[#1f1f1f] rounded-xl p-3" style={{ background: 'var(--bg2)' }}>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-[#444] mb-1.5">{s.label}</div>
            <div className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif', color: '#0EA5E9', wordBreak: 'break-word' }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── WorkoutRow ─────────────────────────────────────────────────── */
function WorkoutRow({ w, onDelete }: { w: Sport; onDelete: (id: string) => void }) {
  const icon = w.sport === 'musculacao'
    ? <Dumbbell size={14} color="var(--text2)" />
    : w.sport === 'triathlon'
    ? <Bike size={14} color="var(--text2)" />
    : <Activity size={14} color="var(--text2)" />

  const label = w.sport === 'corrida' ? 'Corrida'
    : w.sport === 'musculacao' ? 'Musculação'
    : w.sport === 'triathlon'  ? 'Triathlon'
    : w.sport

  const km = fmtKm(w.distance_m)

  return (
    <div className="group flex items-center gap-3 py-2.5 px-4 border-b border-[#171717] last:border-b-0 hover:bg-[#111111] transition-colors">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 flex items-center gap-2 min-w-0 overflow-hidden">
        <span className="text-sm font-semibold text-white flex-shrink-0">{label}</span>
        {km && <span className="text-sm text-[#555] flex-shrink-0">{km}</span>}
        {km && <span className="text-[#333] flex-shrink-0">·</span>}
        <span className="text-sm text-[#555] flex-shrink-0">{fmtDurationShort(w.duration_s)}</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {w.pace_label && (
          <span className="text-sm font-bold" style={{ fontFamily: 'Sora, sans-serif', color: '#0EA5E9' }}>{w.pace_label}</span>
        )}
        <span className="text-xs text-[#555]">{fmtDayLabel(w.sport_date)}</span>
        <button
          onClick={() => onDelete(w.id)}
          className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-red-400 transition-opacity w-6 h-6 flex items-center justify-center text-sm"
        >×</button>
      </div>
    </div>
  )
}

/* ── MonthGroup ─────────────────────────────────────────────────── */
function MonthGroup({ monthKey, workouts, onDelete }: { monthKey: string; workouts: Sport[]; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(true)
  const totalKm   = workouts.reduce((s, w) => s + (w.distance_m ?? 0), 0)
  const totalTime = workouts.reduce((s, w) => s + (w.duration_s ?? 0), 0)
  const pace  = calcAvgPace(workouts)
  const label = fmtMonthLabel(monthKey + '-01')

  return (
    <div className="border border-[#1f1f1f] rounded-2xl overflow-hidden mb-2" style={{ background: 'var(--bg)' }}>
      <button onClick={() => setOpen(!open)} className="w-full p-4 text-left hover:bg-[#0d0d0d] transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-sm font-bold text-white capitalize mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>{label}</div>
            <div className="flex gap-3 flex-wrap">
              <span className="text-xs text-[#555]">{workouts.length} atividade{workouts.length !== 1 ? 's' : ''}</span>
              {totalKm > 0 && <span className="text-xs text-[#555]">{(totalKm / 1000).toFixed(1)} km</span>}
              <span className="text-xs text-[#555]">{fmtDurationShort(totalTime)}</span>
              {pace && <span className="text-xs text-[#555]">Pace med. {pace}</span>}
            </div>
          </div>
          {open ? <ChevronUp size={14} color="var(--text2)" /> : <ChevronDown size={14} color="var(--text2)" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-[#1a1a1a]">
          {workouts.map(w => <WorkoutRow key={w.id} w={w} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 1 — TREINOS
══════════════════════════════════════════════════════════════════ */
function WorkoutsSection({ sport }: { sport: string }) {
  const { addWorkout } = useWorkouts(sport as any)
  const qc = useQueryClient()
  const { data: stravaConnected } = useStravaConnected()

  const { data: allWorkouts = [], isLoading } = useQuery({
    queryKey: ['sports_all'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('sports') as any)
        .select('*').order('sport_date', { ascending: false })
      if (error) throw error
      return data as Sport[]
    },
  })

  const deleteW = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('sports') as any).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sports'] })
      qc.invalidateQueries({ queryKey: ['sports_all'] })
    },
  })

  const [syncing,      setSyncing]      = useState(false)
  const [syncMsg,      setSyncMsg]      = useState<string | null>(null)
  const [showModal,    setShowModal]    = useState(false)
  const [modalityTab,  setModalityTab]  = useState<ModalityTab>('todos')

  const kinds = SPORT_KINDS[sport] ?? ['geral']
  const [wDate,  setWDate]  = useState(todayLocal())
  const [wKind,  setWKind]  = useState(kinds[0])
  const [wDist,  setWDist]  = useState('')
  const [wDur,   setWDur]   = useState('')
  const [wNotes, setWNotes] = useState('')

  async function handleStravaSync() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const { data, error } = await supabase.functions.invoke('strava-sync')
      if (error) throw new Error(error.message)
      setSyncMsg(`${data.imported} treino${data.imported !== 1 ? 's' : ''} importado${data.imported !== 1 ? 's' : ''}`)
      qc.invalidateQueries({ queryKey: ['sports'] })
      qc.invalidateQueries({ queryKey: ['sports_all'] })
    } catch {
      setSyncMsg('Erro ao sincronizar com Strava')
    }
    setSyncing(false)
    setTimeout(() => setSyncMsg(null), 4000)
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    const dur = parseDuration(wDur)
    if (!dur || !wDate) return
    const needsDist = sport !== 'musculacao' && !['yoga', 'crossfit', 'futebol', 'tenis', 'volei', 'escalada'].includes(sport)
    if (needsDist && !wDist.trim()) return
    const dist   = parseFloat(wDist.replace(',', '.')) || 0
    const dist_m = Math.round(dist * 1000)
    const pace   = dist_m > 0 ? calcPace(dist_m, dur) : null
    addWorkout.mutate(
      { sport, kind: wKind, distance_m: dist_m || null, duration_s: dur, pace_label: pace, sport_date: wDate, notes: wNotes || null } as any,
      { onSuccess: () => {
        setShowModal(false); setWDist(''); setWDur(''); setWNotes('')
        qc.invalidateQueries({ queryKey: ['sports_all'] })
      }},
    )
  }

  const currentYear   = new Date().getFullYear().toString()
  const yearWorkouts  = allWorkouts.filter(w => w.sport_date.startsWith(currentYear))
  const filtered      = modalityTab === 'todos' ? allWorkouts : allWorkouts.filter(w => w.sport === modalityTab)
  const grouped       = groupByMonth(filtered)

  return (
    <Section
      title="Treinos"
      icon={<Activity size={16} />}
      count={allWorkouts.length}
      extra={sport === 'corrida' && stravaConnected ? (
        <button
          onClick={handleStravaSync} disabled={syncing}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: 'rgba(252,76,2,.12)', border: '1px solid rgba(252,76,2,.3)', color: '#FC4C02', cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? 0.7 : 1 }}
        >
          <RefreshCw size={11} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
          {syncing ? 'Sincronizando...' : 'Sincronizar Strava'}
        </button>
      ) : undefined}
    >
      {syncMsg && (
        <div style={{ marginBottom: 12, padding: '6px 12px', borderRadius: 8, background: syncMsg.startsWith('Erro') ? 'rgba(248,113,113,.1)' : 'rgba(52,211,153,.1)', border: `1px solid ${syncMsg.startsWith('Erro') ? 'rgba(248,113,113,.3)' : 'rgba(52,211,153,.3)'}`, fontSize: 12, color: syncMsg.startsWith('Erro') ? '#f87171' : '#34d399' }}>
          {syncMsg}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-48 bg-bg-3 rounded-2xl animate-pulse" />
          <div className="h-20 bg-bg-3 rounded-2xl animate-pulse" />
        </div>
      ) : (
        <>
          <YearStats workouts={yearWorkouts} year={currentYear} />

          {/* Modality tabs */}
          <div className="flex border-b border-[#1f1f1f] mb-4 -mx-5 px-5">
            {MODALITY_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setModalityTab(t.key)}
                className="px-3 py-2 text-xs font-semibold transition-colors"
                style={{
                  color: modalityTab === t.key ? '#0EA5E9' : 'var(--text2)',
                  borderBottom: modalityTab === t.key ? '2px solid #0EA5E9' : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Month groups */}
          {grouped.length === 0 ? (
            <p className="text-ink-3 text-sm text-center py-8">Nenhum treino registrado.</p>
          ) : (
            grouped.map(([key, wks]) => (
              <MonthGroup key={key} monthKey={key} workouts={wks} onDelete={id => deleteW.mutate(id)} />
            ))
          )}
        </>
      )}

      <button onClick={() => setShowModal(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-input border border-dashed border-line text-ink-2 hover:text-ink hover:bg-bg-3 transition-colors text-sm mt-4" style={{ minHeight: 44 }}>
        + Registrar treino
      </button>

      {showModal && (
        <Modal title="Novo treino" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd} className="space-y-3">
            <Field label="Data">
              <input type="date" value={wDate} onChange={(e) => setWDate(e.target.value)} className={inputCls} style={inputH} />
            </Field>
            {kinds.length > 1 && (
              <Field label="Tipo">
                <select value={wKind} onChange={(e) => setWKind(e.target.value)} className={inputCls} style={inputH}>
                  {kinds.map((k) => <option key={k} value={k}>{KIND_LABELS[k] ?? k}</option>)}
                </select>
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Distância (km)">
                <input value={wDist} onChange={(e) => setWDist(e.target.value)} placeholder="Ex: 10.5" className={inputCls} style={inputH} />
              </Field>
              <Field label="Duração (hh:mm:ss)">
                <input value={wDur} onChange={(e) => setWDur(e.target.value)} placeholder="00:55:00" className={inputCls} style={{ ...inputH, fontFamily: 'JetBrains Mono, monospace' }} />
              </Field>
            </div>
            <Field label="Notas (opcional)">
              <input value={wNotes} onChange={(e) => setWNotes(e.target.value)} placeholder="Observações..." className={inputCls} style={inputH} />
            </Field>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={!wDur || addWorkout.isPending} className="flex-1 bg-brand text-white rounded-input font-semibold text-sm hover:brightness-110 disabled:opacity-40 transition-all" style={inputH}>Salvar</button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-bg-3 text-ink-2 rounded-input text-sm hover:text-ink transition-colors" style={inputH}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}
    </Section>
  )
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 2 — METAS
══════════════════════════════════════════════════════════════════ */
function GoalsSection({ sport }: { sport: string }) {
  const { data: goals = [], isLoading, addGoal, toggleGoal, deleteGoal } = useSportGoals(sport as any)
  const { data: races = [] } = useSportRaces(sport as any)
  const [showModal, setShowModal] = useState(false)
  const [gName, setGName] = useState('')
  const [gTarget, setGTarget] = useState('')
  const [gDate, setGDate] = useState('')
  const [gDistKm, setGDistKm] = useState('')
  const [gDurStr, setGDurStr] = useState('')
  const [gPace, setGPace] = useState('')
  const [gLinkedRace, setGLinkedRace] = useState('')
  const [paceUserFields, setPaceUserFields] = useState<Set<'dist' | 'dur' | 'pace'>>(new Set())

  const paceComputedField: 'dist' | 'dur' | 'pace' | null = (() => {
    const u = paceUserFields
    if (u.has('dist') && u.has('dur'))  return 'pace'
    if (u.has('dist') && u.has('pace')) return 'dur'
    if (u.has('dur')  && u.has('pace')) return 'dist'
    return null
  })()

  function handlePaceInput(field: 'dist' | 'dur' | 'pace', val: string) {
    const newUserFields = new Set(paceUserFields)
    if (!val.trim()) {
      newUserFields.delete(field)
      if (paceComputedField && paceComputedField !== field) {
        if (paceComputedField === 'dist') setGDistKm('')
        else if (paceComputedField === 'dur') setGDurStr('')
        else setGPace('')
      }
    } else { newUserFields.add(field) }
    if (field === 'dist') setGDistKm(val)
    else if (field === 'dur') setGDurStr(val)
    else setGPace(val)
    setPaceUserFields(newUserFields)
    const distStr = field === 'dist' ? val : gDistKm
    const durStr  = field === 'dur'  ? val : gDurStr
    const paceStr = field === 'pace' ? val : gPace
    const dist = parseFloat(distStr.replace(',', '.'))
    const dur  = parseDuration(durStr)
    const pSec = paceToSec(paceStr)
    if (newUserFields.has('dist') && newUserFields.has('dur')) { if (dist > 0 && dur > 0) setGPace(secToPace(dur / dist)) }
    else if (newUserFields.has('dist') && newUserFields.has('pace')) { if (dist > 0 && pSec > 0) setGDurStr(fmtDuration(Math.round(dist * pSec))) }
    else if (newUserFields.has('dur') && newUserFields.has('pace')) { if (dur > 0 && pSec > 0) setGDistKm(String(Math.round((dur / pSec) * 10) / 10)) }
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!gName.trim()) return
    const distNum = parseFloat(gDistKm) || null
    const durNum  = parseDuration(gDurStr) || null
    addGoal.mutate(
      { name: gName.trim(), target: gTarget.trim() || undefined, target_date: gDate || undefined, distance_km: distNum, duration_s: durNum, linked_race_id: gLinkedRace || null },
      { onSuccess: () => { setShowModal(false); setGName(''); setGTarget(''); setGDate(''); setGDistKm(''); setGDurStr(''); setGPace(''); setGLinkedRace(''); setPaceUserFields(new Set()) } },
    )
  }

  return (
    <Section title="Metas" icon={<Target size={16} />} count={goals.length} defaultOpen={false}>
      {isLoading ? (
        <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-10 bg-bg-3 rounded-input animate-pulse" />)}</div>
      ) : goals.length === 0 ? (
        <p className="text-ink-3 text-sm text-center py-4">Nenhuma meta definida.</p>
      ) : (
        <div className="space-y-1.5 mb-4">
          {goals.map((g) => (
            <div key={g.id} className="group flex items-center gap-3 px-3 py-3 rounded-input hover:bg-bg-3 transition-colors">
              <button onClick={() => toggleGoal.mutate({ id: g.id, done: !g.done })} className={['w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors', g.done ? 'bg-ok border-ok' : 'border-ink-3 hover:border-ink-2'].join(' ')}>
                {g.done && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${g.done ? 'line-through text-ink-3' : 'text-ink'}`}>{g.name}</div>
                {(g.target || g.target_date) && (
                  <div className="text-ink-3 flex gap-3" style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
                    {g.target && <span>{g.target}</span>}
                    {g.target_date && <span className="flex items-center gap-0.5"><Calendar size={9} />{fmtDate(g.target_date)}</span>}
                  </div>
                )}
              </div>
              <button onClick={() => deleteGoal.mutate(g.id)} className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red-400 transition-opacity w-7 h-7 flex items-center justify-center text-sm flex-shrink-0">×</button>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setShowModal(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-input border border-dashed border-line text-ink-2 hover:text-ink hover:bg-bg-3 transition-colors text-sm" style={{ minHeight: 44 }}>
        + Nova meta
      </button>

      {showModal && (
        <Modal title="Nova meta" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd} className="space-y-3">
            <Field label="Meta *">
              <input autoFocus value={gName} onChange={(e) => setGName(e.target.value)} placeholder="Ex: Sub-3h na maratona" className={inputCls} style={inputH} />
            </Field>
            <div style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)' }}>
              <div className="text-ink-3 mb-2" style={{ fontSize: 11, fontWeight: 600 }}>Calculadora de pace (opcional)</div>
              <div className="grid grid-cols-3 gap-2">
                {['dist', 'dur', 'pace'].map((f) => (
                  <Field key={f} label={f === 'dist' ? 'Distância (km)' : f === 'dur' ? 'Tempo (h:mm:ss)' : 'Pace (/km)'}>
                    <input
                      value={f === 'dist' ? gDistKm : f === 'dur' ? gDurStr : gPace}
                      readOnly={paceComputedField === f}
                      onChange={(e) => handlePaceInput(f as any, e.target.value)}
                      placeholder={f === 'dist' ? '42.2' : f === 'dur' ? '3:00:00' : '4:16/km'}
                      className={inputCls}
                      style={{ minHeight: 36, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, ...(paceComputedField === f ? { background: '#1e1e1e', color: '#666', cursor: 'default' } : {}) }}
                    />
                  </Field>
                ))}
              </div>
            </div>
            <Field label="Target (ex: 3:00:00, 200km)">
              <input value={gTarget} onChange={(e) => setGTarget(e.target.value)} placeholder="Valor alvo" className={inputCls} style={{ ...inputH, fontFamily: 'JetBrains Mono, monospace' }} />
            </Field>
            <Field label="Data alvo (opcional)">
              <input type="date" value={gDate} onChange={(e) => setGDate(e.target.value)} className={inputCls} style={inputH} />
            </Field>
            {races.length > 0 && (
              <Field label="Vincular à prova (opcional)">
                <select value={gLinkedRace} onChange={(e) => setGLinkedRace(e.target.value)} className={inputCls} style={inputH}>
                  <option value="">— nenhuma —</option>
                  {races.map(r => <option key={r.id} value={r.id}>{r.name} ({fmtDate(r.race_date)})</option>)}
                </select>
              </Field>
            )}
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={!gName.trim() || addGoal.isPending} className="flex-1 bg-brand text-white rounded-input font-semibold text-sm hover:brightness-110 disabled:opacity-40 transition-all" style={inputH}>Adicionar</button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-bg-3 text-ink-2 rounded-input text-sm hover:text-ink transition-colors" style={inputH}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}
    </Section>
  )
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 3 — PRÓXIMAS PROVAS
══════════════════════════════════════════════════════════════════ */
function RacesSection({ sport }: { sport: string }) {
  const { data: races = [], isLoading, addRace, toggleRegistered, deleteRace } = useSportRaces(sport as any)
  const [showModal, setShowModal] = useState(false)
  const [rName, setRName] = useState('')
  const [rDate, setRDate] = useState('')
  const [rLocation, setRLocation] = useState('')
  const [rDistance, setRDistance] = useState('')
  const [rGoal, setRGoal] = useState('')

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!rName.trim() || !rDate) return
    addRace.mutate(
      { name: rName.trim(), race_date: rDate, location: rLocation.trim() || undefined, distance: rDistance.trim() || undefined, goal_time: rGoal.trim() || undefined },
      { onSuccess: () => { setShowModal(false); setRName(''); setRDate(''); setRLocation(''); setRDistance(''); setRGoal('') } },
    )
  }

  function daysBadge(race: SportRace) {
    const d = daysUntil(race.race_date)
    if (d < 0)  return { text: 'Passou', color: 'var(--text2)' }
    if (d === 0) return { text: 'Hoje!',  color: '#34d399' }
    if (d <= 7)  return { text: `${d}d`,  color: '#f87171' }
    if (d <= 30) return { text: `${d}d`,  color: '#fbbf24' }
    return { text: `${d}d`, color: 'var(--text2)' }
  }

  return (
    <Section title="Próximas Provas" icon={<Trophy size={16} />} count={races.length} defaultOpen={false}>
      {isLoading ? (
        <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-16 bg-bg-3 rounded-input animate-pulse" />)}</div>
      ) : races.length === 0 ? (
        <p className="text-ink-3 text-sm text-center py-4">Nenhuma prova cadastrada.</p>
      ) : (
        <div className="space-y-2 mb-4">
          {races.map((r) => {
            const badge = daysBadge(r)
            return (
              <div key={r.id} className="group flex items-start gap-3 px-3 py-3 rounded-xl border border-line hover:border-white/10 transition-colors bg-bg-3">
                <div className="flex-shrink-0 flex items-center justify-center rounded-lg text-center" style={{ width: 44, height: 44, background: badge.color + '18', minWidth: 44 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 800, color: badge.color }}>{badge.text}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-ink font-semibold text-sm truncate" style={{ fontFamily: 'Sora, sans-serif' }}>{r.name}</span>
                    {r.registered && <span style={{ fontSize: 9, background: 'rgba(52,211,153,.12)', color: '#34d399', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>inscrito</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap" style={{ fontSize: 10, color: 'var(--text2)', fontFamily: 'JetBrains Mono, monospace' }}>
                    <span className="flex items-center gap-0.5"><Calendar size={9} />{fmtDate(r.race_date)}</span>
                    {r.location && <span className="flex items-center gap-0.5"><MapPin size={9} />{r.location}</span>}
                    {r.distance && <span>{r.distance}</span>}
                    {r.goal_time && <span>⏱ {r.goal_time}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                  <button onClick={() => toggleRegistered.mutate({ id: r.id, registered: !r.registered })} className={`text-xs px-2 py-1 rounded transition-colors ${r.registered ? 'text-ok hover:text-ink-2' : 'text-ink-3 hover:text-ok'}`} style={{ fontSize: 14 }}>
                    {r.registered ? <Check size={14} /> : <Circle size={14} />}
                  </button>
                  <button onClick={() => deleteRace.mutate(r.id)} className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red-400 transition-opacity w-7 h-7 flex items-center justify-center text-sm">×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <button onClick={() => setShowModal(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-input border border-dashed border-line text-ink-2 hover:text-ink hover:bg-bg-3 transition-colors text-sm" style={{ minHeight: 44 }}>+ Adicionar prova</button>
      {showModal && (
        <Modal title="Nova prova" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd} className="space-y-3">
            <Field label="Nome *"><input autoFocus value={rName} onChange={(e) => setRName(e.target.value)} placeholder="Ex: Maratona de SP 2026" className={inputCls} style={inputH} /></Field>
            <Field label="Data *"><input type="date" value={rDate} onChange={(e) => setRDate(e.target.value)} className={inputCls} style={inputH} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Local"><input value={rLocation} onChange={(e) => setRLocation(e.target.value)} placeholder="Cidade" className={inputCls} style={inputH} /></Field>
              <Field label="Distância"><input value={rDistance} onChange={(e) => setRDistance(e.target.value)} placeholder="Ex: 42km" className={inputCls} style={inputH} /></Field>
            </div>
            <Field label="Tempo objetivo"><input value={rGoal} onChange={(e) => setRGoal(e.target.value)} placeholder="Ex: 3:00:00" className={inputCls} style={{ ...inputH, fontFamily: 'JetBrains Mono, monospace' }} /></Field>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={!rName.trim() || !rDate || addRace.isPending} className="flex-1 bg-brand text-white rounded-input font-semibold text-sm hover:brightness-110 disabled:opacity-40 transition-all" style={inputH}>Adicionar</button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-bg-3 text-ink-2 rounded-input text-sm hover:text-ink transition-colors" style={inputH}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}
    </Section>
  )
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 4 — LISTA DE COMPRAS
══════════════════════════════════════════════════════════════════ */
function SportShoppingSection({ sport }: { sport: string }) {
  const { data: items = [], isLoading, addItem, toggleItem, deleteItem } = useSportShopping(sport as any)
  const [draft, setDraft] = useState('')
  const [addErr, setAddErr] = useState<string | null>(null)
  const sorted = [...items].sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    setAddErr(null)
    addItem.mutate(draft.trim(), { onSuccess: () => setDraft(''), onError: (err) => setAddErr((err as Error).message ?? 'Erro') })
  }

  return (
    <Section title="Lista de Compras" icon={<ShoppingBag size={16} />} count={items.filter((i) => !i.done).length + '/' + items.length} defaultOpen={false}>
      {isLoading ? (
        <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-10 bg-bg-3 rounded-input animate-pulse" />)}</div>
      ) : sorted.length === 0 ? (
        <p className="text-ink-3 text-sm text-center py-3">Lista vazia.</p>
      ) : (
        <div className="space-y-0.5 mb-4">
          {sorted.map((item) => (
            <div key={item.id} className="group flex items-center gap-3 px-3 py-2.5 rounded-input hover:bg-bg-3 transition-colors" style={{ minHeight: 44 }}>
              <button onClick={() => toggleItem.mutate({ id: item.id, done: !item.done })} className={['w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors', item.done ? 'bg-brand border-brand' : 'border-ink-3 hover:border-ink-2'].join(' ')}>
                {item.done && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
              <span className={`flex-1 text-sm ${item.done ? 'line-through text-ink-3' : 'text-ink'}`}>{item.title}</span>
              <button onClick={() => deleteItem.mutate(item.id)} className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red-400 transition-opacity w-7 h-7 flex items-center justify-center text-sm flex-shrink-0">×</button>
            </div>
          ))}
        </div>
      )}
      {addErr && <div style={{ marginBottom: 8, padding: '6px 12px', borderRadius: 8, background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', fontSize: 12, color: '#f87171' }}>{addErr}</div>}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ex: Tênis novo…" className="flex-1 bg-bg border border-line rounded-input px-3 text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors" style={{ minHeight: 40 }} />
        <button type="submit" disabled={!draft.trim() || addItem.isPending} className="bg-brand text-white rounded-input px-4 text-sm font-semibold hover:brightness-110 disabled:opacity-40 transition-all flex-shrink-0" style={{ minHeight: 40 }}>+</button>
      </form>
    </Section>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export function SportsPage() {
  const [userSports,   setUserSports]   = useState<UserSport[]>([])
  const [sport,        setSport]        = useState<string>('')
  const [loadingSports, setLoadingSports] = useState(true)
  const [showAddSport, setShowAddSport] = useState(false)

  useEffect(() => { loadUserSports() }, [])

  async function loadUserSports() {
    const { data } = await (supabase as any).from('user_sports').select('*').order('ordem')
    const sports = data ?? []
    setUserSports(sports)
    if (sports.length > 0 && !sport) setSport(sports[0].key)
    setLoadingSports(false)
  }

  async function addSport(key: string, label: string) {
    await (supabase as any).from('user_sports').insert({ key, label, ordem: userSports.length })
    setShowAddSport(false)
    await loadUserSports()
    setSport(key)
  }

  async function removeSport(id: string, key: string) {
    if (!window.confirm('Remover este esporte? Os treinos registrados não serão apagados.')) return
    await (supabase as any).from('user_sports').delete().eq('id', id)
    const remaining = userSports.filter(s => s.id !== id)
    setUserSports(remaining)
    if (sport === key) setSport(remaining[0]?.key ?? '')
    await loadUserSports()
  }

  return (
    <div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div className="flex items-center gap-2">
        <h1 className="text-2xl lg:text-[30px]" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}>Esportes</h1>
        <HelpButton pageId="esportes" />
      </div>
      <p className="text-ink-2 mt-1 text-sm mb-5">Treinos, metas, provas e gear.</p>

      {/* Sport tabs */}
      <div className="flex gap-1.5 mb-6 p-1 rounded-xl border border-line overflow-x-auto" style={{ background: 'var(--bg2)' }}>
        {userSports.map((s) => (
          <button
            key={s.id}
            onClick={() => setSport(s.key)}
            className="flex items-center gap-2 px-4 sm:px-5 rounded-lg transition-colors font-semibold flex-shrink-0"
            style={{
              minHeight: 40, fontSize: 13,
              background: sport === s.key ? 'var(--border)' : 'transparent',
              color: sport === s.key ? '#fff' : 'var(--text2)',
              border: sport === s.key ? '1px solid rgba(255,255,255,.08)' : '1px solid transparent',
              whiteSpace: 'nowrap',
            }}
          >
            {s.label}
            {sport === s.key && (
              <span
                onClick={(e) => { e.stopPropagation(); removeSport(s.id, s.key) }}
                className="ml-1 text-[#555] hover:text-[#ef4444] transition-colors"
                style={{ fontSize: 16, lineHeight: 1 }}
              >×</span>
            )}
          </button>
        ))}
        <button
          onClick={() => setShowAddSport(true)}
          className="flex items-center gap-1.5 px-3 rounded-lg text-[#555] hover:text-[#0EA5E9] transition-colors flex-shrink-0"
          style={{ minHeight: 40, fontSize: 13 }}
        >
          <Plus size={14} /> Adicionar
        </button>
      </div>

      {/* Empty state */}
      {!loadingSports && userSports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-[#888] text-sm mb-1">Nenhum esporte adicionado ainda.</p>
          <p className="text-[#555] text-xs mb-4">Adicione os esportes que você pratica para começar a registrar treinos.</p>
          <button onClick={() => setShowAddSport(true)} className="flex items-center gap-2 bg-[#0EA5E9] text-black px-4 py-2 rounded-xl text-sm font-semibold">
            <Plus size={14} /> Adicionar esporte
          </button>
        </div>
      )}

      {/* Sections */}
      {sport && userSports.length > 0 && (
        <div className="space-y-3">
          <WorkoutsSection sport={sport} />
          <GoalsSection sport={sport} />
          <RacesSection sport={sport} />
          <SportShoppingSection sport={sport} />
        </div>
      )}

      {/* Add sport modal */}
      {showAddSport && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={() => setShowAddSport(false)}>
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold font-[Sora] text-white">Adicionar esporte</span>
              <button onClick={() => setShowAddSport(false)} className="text-[#555] hover:text-white text-lg">×</button>
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {SPORT_CATALOG
                .filter(c => !userSports.some(s => s.key === c.key))
                .map(c => (
                  <button
                    key={c.key}
                    onClick={() => addSport(c.key, c.label)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-[#ccc] hover:bg-[#1f1f1f] hover:text-white transition-colors"
                  >
                    {c.label}
                  </button>
                ))}
            </div>
            {SPORT_CATALOG.filter(c => !userSports.some(s => s.key === c.key)).length === 0 && (
              <p className="text-[#555] text-sm text-center py-4">Todos os esportes já foram adicionados.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
