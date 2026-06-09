import { useState, type FormEvent } from 'react'
import {
  ChevronDown, Activity, Target, Trophy, ShoppingBag,
  Calendar, MapPin, Check, Circle, Dumbbell, RefreshCw,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useWorkouts } from '../hooks/useWorkouts'
import { useSportGoals } from '../hooks/useSportGoals'
import { useSportRaces } from '../hooks/useSportRaces'
import { useSportShopping } from '../hooks/useSportShopping'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type Sport = 'corrida' | 'triathlon' | 'musculacao'
type SportRace = Database['public']['Tables']['sport_races']['Row']

/* ── Sport config ──────────────────────────────────────────────── */
const SPORT_KINDS: Record<Sport, string[]> = {
  corrida:    ['easy', 'long', 'tempo', 'interval'],
  triathlon:  ['natação', 'bike', 'corrida', 'tijolo'],
  musculacao: ['superior', 'inferior', 'full_body', 'cardio', 'alongamento'],
}
const KIND_LABELS: Record<string, string> = {
  easy: 'Fácil', long: 'Longo', tempo: 'Tempo', interval: 'Intervalo',
  natação: 'Natação', bike: 'Bike', corrida: 'Corrida', tijolo: 'Tijolo',
  superior: 'Superior', inferior: 'Inferior', full_body: 'Full Body',
  cardio: 'Cardio', alongamento: 'Alongamento',
}
const KIND_COLORS: Record<string, string> = {
  easy: '#34d399', long: '#0EA5E9', tempo: '#fbbf24', interval: '#f87171',
  natação: '#60a5fa', bike: '#f59e0b', corrida: '#34d399', tijolo: '#a78bfa',
  superior: '#f87171', inferior: '#0EA5E9', full_body: '#a78bfa',
  cardio: '#fbbf24', alongamento: '#34d399',
}

/* ── Helpers ───────────────────────────────────────────────────── */
function fmtDuration(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function parseDuration(str: string): number {
  const parts = str.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

function calcPace(distance_m: number, duration_s: number): string {
  if (!distance_m || !duration_s) return '—'
  const secPerKm = duration_s / (distance_m / 1000)
  return `${Math.floor(secPerKm / 60)}:${String(Math.round(secPerKm % 60)).padStart(2, '0')}/km`
}

function fmtDate(d: string): string {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T12:00:00')
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr + 'T12:00:00')
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

/* ── Section card ──────────────────────────────────────────────── */
function Section({
  title,
  icon,
  count,
  children,
  defaultOpen = true,
  extra,
}: {
  title: string
  icon: React.ReactNode
  count?: number | string
  children: React.ReactNode
  defaultOpen?: boolean
  extra?: React.ReactNode
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
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14 }}>
              {title}
            </span>
            {count !== undefined && (
              <span className="text-ink-3" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                {count}
              </span>
            )}
          </div>
          <ChevronDown
            size={16}
            className={`text-ink-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {extra && <div style={{ flexShrink: 0 }}>{extra}</div>}
      </div>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

/* ── Stat tile ─────────────────────────────────────────────────── */
function StatTile({ label, value, color = '#0EA5E9' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-bg-3 rounded-xl p-4 flex flex-col gap-1">
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 20, color }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: '#888', fontFamily: 'Manrope, sans-serif' }}>{label}</div>
    </div>
  )
}

/* ── Small modal ───────────────────────────────────────────────── */
function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.8)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-line p-6 space-y-4"
        style={{ background: '#111111', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-between">
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 17 }}>{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-ink-3 hover:text-ink rounded-input hover:bg-bg-3 transition-colors text-lg"
          >
            ×
          </button>
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
        .select('connected')
        .eq('provider', 'strava')
        .eq('connected', true)
        .maybeSingle()
      return !!data
    },
  })
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 1 — TREINOS
══════════════════════════════════════════════════════════════════ */
function WorkoutsSection({ sport }: { sport: Sport }) {
  const { data: workouts = [], isLoading, addWorkout, deleteWorkout } = useWorkouts(sport)
  const qc = useQueryClient()
  const { data: stravaConnected } = useStravaConnected()
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  async function handleStravaSync() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strava-sync`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token ?? ''}`,
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        },
      )
      const data = await resp.json()
      console.log('[strava-sync] response:', data)
      if (!resp.ok) throw new Error(data.error)
      setSyncMsg(`${data.imported} treino${data.imported !== 1 ? 's' : ''} importado${data.imported !== 1 ? 's' : ''}`)
      qc.invalidateQueries({ queryKey: ['workouts'] })
      qc.invalidateQueries({ queryKey: ['workouts', sport] })
    } catch (err) {
      console.error('[strava-sync] error:', err)
      setSyncMsg('Erro ao sincronizar com Strava')
    }
    setSyncing(false)
    setTimeout(() => setSyncMsg(null), 4000)
  }
  const [wDate, setWDate] = useState(new Date().toISOString().slice(0, 10))
  const [wKind, setWKind] = useState(SPORT_KINDS[sport][0])
  const [wDist, setWDist] = useState('')
  const [wDur, setWDur] = useState('')
  const [wNotes, setWNotes] = useState('')

  /* monthly stats */
  const monthly = workouts.filter((w) => isThisMonth(w.workout_date))
  const totalKm = monthly.reduce((a, w) => a + w.distance_m, 0) / 1000
  const totalS  = monthly.reduce((a, w) => a + w.duration_s, 0)
  const avgPace = totalKm > 0 ? calcPace(totalKm * 1000, totalS) : '—'

  // Musculação: most frequent kind this month
  const kindFreq = monthly.reduce<Record<string, number>>((acc, w) => {
    acc[w.kind] = (acc[w.kind] ?? 0) + 1; return acc
  }, {})
  const topKind = Object.entries(kindFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    const dur = parseDuration(wDur)
    if (!dur || !wDate) return
    if (sport !== 'musculacao' && !wDist.trim()) return
    const dist = parseFloat(wDist.replace(',', '.')) || 0
    const dist_m = Math.round(dist * 1000)
    const pace = sport !== 'musculacao' && dist_m > 0 ? calcPace(dist_m, dur) : null
    addWorkout.mutate(
      { sport, kind: wKind, distance_m: dist_m, duration_s: dur, pace_label: pace, workout_date: wDate, notes: wNotes || null },
      { onSuccess: () => { setShowModal(false); setWDist(''); setWDur(''); setWNotes('') } },
    )
  }

  return (
    <Section
      title="Treinos"
      icon={<Activity size={16} />}
      count={workouts.length}
      extra={sport !== 'musculacao' && stravaConnected ? (
        <button
          onClick={handleStravaSync}
          disabled={syncing}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
            background: 'rgba(252,76,2,.12)', border: '1px solid rgba(252,76,2,.3)',
            color: '#FC4C02', cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? 0.7 : 1,
          }}
        >
          <RefreshCw size={11} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
          {syncing ? 'Sincronizando...' : 'Sincronizar Strava'}
        </button>
      ) : undefined}
    >
      {/* Sync message */}
      {syncMsg && (
        <div style={{ marginBottom: 12, padding: '6px 12px', borderRadius: 8, background: syncMsg.startsWith('Erro') ? 'rgba(248,113,113,.1)' : 'rgba(52,211,153,.1)', border: `1px solid ${syncMsg.startsWith('Erro') ? 'rgba(248,113,113,.3)' : 'rgba(52,211,153,.3)'}`, fontSize: 12, color: syncMsg.startsWith('Erro') ? '#f87171' : '#34d399' }}>
          {syncMsg}
        </div>
      )}
      {/* Monthly tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {sport === 'musculacao' ? (
          <>
            <StatTile label="tempo total" value={fmtDuration(totalS)} color="#34d399" />
            <StatTile label="treinos" value={String(monthly.length)} color="#a78bfa" />
            <StatTile label="mais frequente" value={KIND_LABELS[topKind] ?? topKind} color="#fbbf24" />
            <StatTile label="este mês" value={monthly.length > 0 ? `${Math.round(totalS / monthly.length / 60)}min avg` : '—'} color="#0EA5E9" />
          </>
        ) : (
          <>
            <StatTile label="km no mês" value={totalKm.toFixed(1)} color="#0EA5E9" />
            <StatTile label="tempo total" value={fmtDuration(totalS)} color="#34d399" />
            <StatTile label="treinos" value={String(monthly.length)} color="#a78bfa" />
            <StatTile label="pace médio" value={avgPace} color="#fbbf24" />
          </>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-12 bg-bg-3 rounded-input animate-pulse" />)}
        </div>
      ) : workouts.length === 0 ? (
        <p className="text-ink-3 text-sm text-center py-4">Nenhum treino registrado.</p>
      ) : (
        <div className="space-y-1.5 mb-4">
          {workouts.map((w) => (
            <div
              key={w.id}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-input hover:bg-bg-3 transition-colors"
            >
              <span
                className="rounded-full flex-shrink-0"
                style={{
                  width: 8, height: 8,
                  background: KIND_COLORS[w.kind] ?? '#888',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, color: KIND_COLORS[w.kind] ?? '#888', fontWeight: 700, width: 64, flexShrink: 0, fontFamily: 'Manrope, sans-serif' }}>
                {KIND_LABELS[w.kind] ?? w.kind}
              </span>
              <span className="text-ink text-sm flex-1 truncate" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                {sport !== 'musculacao' && w.distance_m > 0 ? `${(w.distance_m / 1000).toFixed(1)} km · ` : ''}{fmtDuration(w.duration_s)}
              </span>
              {sport !== 'musculacao' && (
                <span className="text-ink-2 flex-shrink-0" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                  {w.pace_label ?? calcPace(w.distance_m, w.duration_s)}
                </span>
              )}
              <span className="text-ink-3 flex-shrink-0" style={{ fontSize: 10 }}>
                {fmtDate(w.workout_date)}
              </span>
              <button
                onClick={() => deleteWorkout.mutate(w.id)}
                className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red-400 transition-opacity w-7 h-7 flex items-center justify-center text-sm flex-shrink-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-input border border-dashed border-line text-ink-2 hover:text-ink hover:bg-bg-3 transition-colors text-sm"
        style={{ minHeight: 44 }}
      >
        + Registrar treino
      </button>

      {showModal && (
        <Modal title="Novo treino" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd} className="space-y-3">
            <Field label="Data">
              <input type="date" value={wDate} onChange={(e) => setWDate(e.target.value)} className={inputCls} style={inputH} />
            </Field>
            <Field label="Tipo">
              <select
                value={wKind}
                onChange={(e) => setWKind(e.target.value)}
                className={inputCls}
                style={inputH}
              >
                {SPORT_KINDS[sport].map((k) => (
                  <option key={k} value={k}>{KIND_LABELS[k] ?? k}</option>
                ))}
              </select>
            </Field>
            <div className={sport === 'musculacao' ? '' : 'grid grid-cols-2 gap-3'}>
              {sport !== 'musculacao' && (
                <Field label="Distância (km)">
                  <input
                    value={wDist}
                    onChange={(e) => setWDist(e.target.value)}
                    placeholder="Ex: 10.5"
                    className={inputCls}
                    style={inputH}
                  />
                </Field>
              )}
              <Field label="Duração (hh:mm:ss)">
                <input
                  value={wDur}
                  onChange={(e) => setWDur(e.target.value)}
                  placeholder="00:55:00"
                  className={inputCls}
                  style={{ ...inputH, fontFamily: 'JetBrains Mono, monospace' }}
                />
              </Field>
            </div>
            <Field label="Notas (opcional)">
              <input
                value={wNotes}
                onChange={(e) => setWNotes(e.target.value)}
                placeholder="Observações..."
                className={inputCls}
                style={inputH}
              />
            </Field>
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={(sport !== 'musculacao' && !wDist) || !wDur || addWorkout.isPending}
                className="flex-1 bg-brand text-white rounded-input font-semibold text-sm hover:brightness-110 disabled:opacity-40 transition-all"
                style={inputH}
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 bg-bg-3 text-ink-2 rounded-input text-sm hover:text-ink transition-colors"
                style={inputH}
              >
                Cancelar
              </button>
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
/* pace calculator helpers */
function paceToSec(pace: string): number {
  // "4:30/km" → 270
  const m = pace.match(/^(\d+):(\d{2})/)
  if (!m) return 0
  return parseInt(m[1]) * 60 + parseInt(m[2])
}
function secToPace(s: number): string {
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}/km`
}

function GoalsSection({ sport }: { sport: Sport }) {
  const { data: goals = [], isLoading, addGoal, toggleGoal, deleteGoal } = useSportGoals(sport)
  const { data: races = [] } = useSportRaces(sport)
  const [showModal, setShowModal] = useState(false)
  const [gName, setGName] = useState('')
  const [gTarget, setGTarget] = useState('')
  const [gDate, setGDate] = useState('')
  const [gDistKm, setGDistKm] = useState('')
  const [gDurStr, setGDurStr] = useState('')
  const [gPace, setGPace] = useState('')
  const [gLinkedRace, setGLinkedRace] = useState('')

  function computeThird(changed: 'dist' | 'dur' | 'pace', val: string) {
    const dist = changed === 'dist' ? parseFloat(val) : parseFloat(gDistKm)
    const dur  = changed === 'dur'  ? parseDuration(val) : parseDuration(gDurStr)
    const pSec = changed === 'pace' ? paceToSec(val)     : paceToSec(gPace)
    if (changed !== 'dist' && dur > 0 && pSec > 0) {
      setGDistKm(String(Math.round((dur / pSec) * 10) / 10))
    } else if (changed !== 'dur' && dist > 0 && pSec > 0) {
      const totalSec = Math.round(dist * pSec)
      setGDurStr(fmtDuration(totalSec))
    } else if (changed !== 'pace' && dist > 0 && dur > 0) {
      setGPace(secToPace(dur / dist))
    }
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!gName.trim()) return
    const distNum = parseFloat(gDistKm) || null
    const durNum  = parseDuration(gDurStr) || null
    addGoal.mutate(
      {
        name: gName.trim(), target: gTarget.trim() || undefined, target_date: gDate || undefined,
        distance_km: distNum, duration_s: durNum, linked_race_id: gLinkedRace || null,
      },
      { onSuccess: () => { setShowModal(false); setGName(''); setGTarget(''); setGDate(''); setGDistKm(''); setGDurStr(''); setGPace(''); setGLinkedRace('') } },
    )
  }

  return (
    <Section title="Metas" icon={<Target size={16} />} count={goals.length} defaultOpen={false}>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-10 bg-bg-3 rounded-input animate-pulse" />)}
        </div>
      ) : goals.length === 0 ? (
        <p className="text-ink-3 text-sm text-center py-4">Nenhuma meta definida.</p>
      ) : (
        <div className="space-y-1.5 mb-4">
          {goals.map((g) => (
            <div
              key={g.id}
              className="group flex items-center gap-3 px-3 py-3 rounded-input hover:bg-bg-3 transition-colors"
            >
              <button
                onClick={() => toggleGoal.mutate({ id: g.id, done: !g.done })}
                className={[
                  'w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors',
                  g.done ? 'bg-ok border-ok' : 'border-ink-3 hover:border-ink-2',
                ].join(' ')}
              >
                {g.done && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${g.done ? 'line-through text-ink-3' : 'text-ink'}`}>
                  {g.name}
                </div>
                {(g.target || g.target_date) && (
                  <div className="text-ink-3 flex gap-3" style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
                    {g.target && <span>{g.target}</span>}
                    {g.target_date && <span className="flex items-center gap-0.5"><Calendar size={9} />{fmtDate(g.target_date)}</span>}
                  </div>
                )}
              </div>
              <button
                onClick={() => deleteGoal.mutate(g.id)}
                className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red-400 transition-opacity w-7 h-7 flex items-center justify-center text-sm flex-shrink-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-input border border-dashed border-line text-ink-2 hover:text-ink hover:bg-bg-3 transition-colors text-sm"
        style={{ minHeight: 44 }}
      >
        + Nova meta
      </button>

      {showModal && (
        <Modal title="Nova meta" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd} className="space-y-3">
            <Field label="Meta *">
              <input
                autoFocus
                value={gName}
                onChange={(e) => setGName(e.target.value)}
                placeholder={sport === 'corrida' ? 'Ex: Sub-3h na maratona' : 'Ex: Completar 70.3 Floripa'}
                className={inputCls}
                style={inputH}
              />
            </Field>

            {/* Pace calculator — 3 interlinked fields */}
            <div style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)' }}>
              <div className="text-ink-3 mb-2" style={{ fontSize: 11, fontWeight: 600 }}>Calculadora de pace (opcional)</div>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Distância (km)">
                  <input
                    value={gDistKm}
                    onChange={(e) => { setGDistKm(e.target.value); computeThird('dist', e.target.value) }}
                    placeholder="42.2"
                    className={inputCls}
                    style={{ minHeight: 36, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
                  />
                </Field>
                <Field label="Tempo (h:mm:ss)">
                  <input
                    value={gDurStr}
                    onChange={(e) => { setGDurStr(e.target.value); computeThird('dur', e.target.value) }}
                    placeholder="3:00:00"
                    className={inputCls}
                    style={{ minHeight: 36, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
                  />
                </Field>
                <Field label="Pace (/km)">
                  <input
                    value={gPace}
                    onChange={(e) => { setGPace(e.target.value); computeThird('pace', e.target.value) }}
                    placeholder="4:16/km"
                    className={inputCls}
                    style={{ minHeight: 36, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
                  />
                </Field>
              </div>
            </div>

            <Field label="Target (ex: 3:00:00, 200km)">
              <input
                value={gTarget}
                onChange={(e) => setGTarget(e.target.value)}
                placeholder="Valor alvo"
                className={inputCls}
                style={{ ...inputH, fontFamily: 'JetBrains Mono, monospace' }}
              />
            </Field>
            <Field label="Data alvo (opcional)">
              <input type="date" value={gDate} onChange={(e) => setGDate(e.target.value)} className={inputCls} style={inputH} />
            </Field>

            {/* Linked race dropdown */}
            {races.length > 0 && (
              <Field label="Vincular à prova (opcional)">
                <select value={gLinkedRace} onChange={(e) => setGLinkedRace(e.target.value)} className={inputCls} style={inputH}>
                  <option value="">— nenhuma —</option>
                  {races.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({fmtDate(r.race_date)})</option>
                  ))}
                </select>
              </Field>
            )}

            {/* Garmin Em breve */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.06)', opacity: 0.5 }}>
              <span style={{ fontSize: 11, color: '#888' }}>⌚</span>
              <span style={{ fontSize: 11, color: '#888' }}>Sincronização Garmin — Em breve</span>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={!gName.trim() || addGoal.isPending}
                className="flex-1 bg-brand text-white rounded-input font-semibold text-sm hover:brightness-110 disabled:opacity-40 transition-all"
                style={inputH}
              >
                Adicionar
              </button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-bg-3 text-ink-2 rounded-input text-sm hover:text-ink transition-colors" style={inputH}>
                Cancelar
              </button>
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
function RacesSection({ sport }: { sport: Sport }) {
  const { data: races = [], isLoading, addRace, toggleRegistered, deleteRace } = useSportRaces(sport)
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
    if (d < 0) return { text: 'Passou', color: '#888' }
    if (d === 0) return { text: 'Hoje!', color: '#34d399' }
    if (d <= 7)  return { text: `${d}d`, color: '#f87171' }
    if (d <= 30) return { text: `${d}d`, color: '#fbbf24' }
    return { text: `${d}d`, color: '#888' }
  }

  return (
    <Section title="Próximas Provas" icon={<Trophy size={16} />} count={races.length} defaultOpen={false}>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-16 bg-bg-3 rounded-input animate-pulse" />)}
        </div>
      ) : races.length === 0 ? (
        <p className="text-ink-3 text-sm text-center py-4">Nenhuma prova cadastrada.</p>
      ) : (
        <div className="space-y-2 mb-4">
          {races.map((r) => {
            const badge = daysBadge(r)
            return (
              <div
                key={r.id}
                className="group flex items-start gap-3 px-3 py-3 rounded-xl border border-line hover:border-white/10 transition-colors bg-bg-3"
              >
                {/* Days badge */}
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-lg text-center"
                  style={{ width: 44, height: 44, background: badge.color + '18', minWidth: 44 }}
                >
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 800, color: badge.color }}>
                    {badge.text}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-ink font-semibold text-sm truncate" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {r.name}
                    </span>
                    {r.registered && (
                      <span style={{ fontSize: 9, background: 'rgba(52,211,153,.12)', color: '#34d399', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                        inscrito
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap" style={{ fontSize: 10, color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>
                    <span className="flex items-center gap-0.5"><Calendar size={9} />{fmtDate(r.race_date)}</span>
                    {r.location && <span className="flex items-center gap-0.5"><MapPin size={9} />{r.location}</span>}
                    {r.distance && <span>{r.distance}</span>}
                    {r.goal_time && <span>⏱ {r.goal_time}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                  <button
                    onClick={() => toggleRegistered.mutate({ id: r.id, registered: !r.registered })}
                    className={`text-xs px-2 py-1 rounded transition-colors ${r.registered ? 'text-ok hover:text-ink-2' : 'text-ink-3 hover:text-ok'}`}
                    title={r.registered ? 'Desmarcar inscrito' : 'Marcar inscrito'}
                    style={{ fontSize: 14 }}
                  >
                    {r.registered ? <Check size={14} /> : <Circle size={14} />}
                  </button>
                  <button
                    onClick={() => deleteRace.mutate(r.id)}
                    className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red-400 transition-opacity w-7 h-7 flex items-center justify-center text-sm"
                  >
                    ×
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-input border border-dashed border-line text-ink-2 hover:text-ink hover:bg-bg-3 transition-colors text-sm"
        style={{ minHeight: 44 }}
      >
        + Adicionar prova
      </button>

      {showModal && (
        <Modal title="Nova prova" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd} className="space-y-3">
            <Field label="Nome *">
              <input autoFocus value={rName} onChange={(e) => setRName(e.target.value)} placeholder="Ex: Maratona de SP 2026" className={inputCls} style={inputH} />
            </Field>
            <Field label="Data *">
              <input type="date" value={rDate} onChange={(e) => setRDate(e.target.value)} className={inputCls} style={inputH} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Local">
                <input value={rLocation} onChange={(e) => setRLocation(e.target.value)} placeholder="Cidade" className={inputCls} style={inputH} />
              </Field>
              <Field label="Distância">
                <input value={rDistance} onChange={(e) => setRDistance(e.target.value)} placeholder="Ex: 42km" className={inputCls} style={inputH} />
              </Field>
            </div>
            <Field label="Tempo objetivo">
              <input value={rGoal} onChange={(e) => setRGoal(e.target.value)} placeholder="Ex: 3:00:00" className={inputCls} style={{ ...inputH, fontFamily: 'JetBrains Mono, monospace' }} />
            </Field>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={!rName.trim() || !rDate || addRace.isPending} className="flex-1 bg-brand text-white rounded-input font-semibold text-sm hover:brightness-110 disabled:opacity-40 transition-all" style={inputH}>
                Adicionar
              </button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-bg-3 text-ink-2 rounded-input text-sm hover:text-ink transition-colors" style={inputH}>
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Section>
  )
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 4 — LISTA DE COMPRAS DO ESPORTE
══════════════════════════════════════════════════════════════════ */
function SportShoppingSection({ sport }: { sport: Sport }) {
  const { data: items = [], isLoading, addItem, toggleItem, deleteItem } = useSportShopping(sport)
  const [draft, setDraft] = useState('')
  const [addErr, setAddErr] = useState<string | null>(null)

  const sorted = [...items].sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    setAddErr(null)
    addItem.mutate(draft.trim(), {
      onSuccess: () => setDraft(''),
      onError: (err) => setAddErr((err as Error).message ?? 'Erro ao adicionar item'),
    })
  }

  return (
    <Section title="Lista de Compras" icon={<ShoppingBag size={16} />} count={items.filter((i) => !i.done).length + '/' + items.length} defaultOpen={false}>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-10 bg-bg-3 rounded-input animate-pulse" />)}
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-ink-3 text-sm text-center py-3">Lista vazia.</p>
      ) : (
        <div className="space-y-0.5 mb-4">
          {sorted.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-input hover:bg-bg-3 transition-colors"
              style={{ minHeight: 44 }}
            >
              <button
                onClick={() => toggleItem.mutate({ id: item.id, done: !item.done })}
                className={[
                  'w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors',
                  item.done ? 'bg-brand border-brand' : 'border-ink-3 hover:border-ink-2',
                ].join(' ')}
              >
                {item.done && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className={`flex-1 text-sm ${item.done ? 'line-through text-ink-3' : 'text-ink'}`}>
                {item.name}
              </span>
              <button
                onClick={() => deleteItem.mutate(item.id)}
                className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red-400 transition-opacity w-7 h-7 flex items-center justify-center text-sm flex-shrink-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {addErr && (
        <div style={{ marginBottom: 8, padding: '6px 12px', borderRadius: 8, background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', fontSize: 12, color: '#f87171' }}>
          {addErr}
        </div>
      )}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ex: Tênis novo…"
          className="flex-1 bg-bg border border-line rounded-input px-3 text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
          style={{ minHeight: 40 }}
        />
        <button
          type="submit"
          disabled={!draft.trim() || addItem.isPending}
          className="bg-brand text-white rounded-input px-4 text-sm font-semibold hover:brightness-110 disabled:opacity-40 transition-all flex-shrink-0"
          style={{ minHeight: 40 }}
        >
          +
        </button>
      </form>
    </Section>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
const SPORTS: { key: Sport; label: string; icon: React.ReactNode }[] = [
  { key: 'corrida',    label: 'Corrida',    icon: <Activity size={14} /> },
  { key: 'triathlon',  label: 'Triathlon',  icon: <Dumbbell size={14} /> },
  { key: 'musculacao', label: 'Musculação', icon: <Dumbbell size={14} /> },
]

export function SportsPage() {
  const [sport, setSport] = useState<Sport>('corrida')

  return (
    <div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      {/* Header */}
      <h1
        className="text-2xl lg:text-[30px]"
        style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}
      >
        Esportes
      </h1>
      <p className="text-ink-2 mt-1 text-sm mb-5">Treinos, metas, provas e gear.</p>

      {/* Sport tabs */}
      <div
        className="flex gap-1.5 mb-6 p-1 rounded-xl border border-line"
        style={{ background: '#111111', width: 'fit-content' }}
      >
        {SPORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSport(s.key)}
            className="flex items-center gap-2 px-5 rounded-lg transition-colors font-semibold"
            style={{
              minHeight: 40,
              fontSize: 13,
              background: sport === s.key ? '#1f1f1f' : 'transparent',
              color: sport === s.key ? '#fff' : '#888',
              border: sport === s.key ? '1px solid rgba(255,255,255,.08)' : '1px solid transparent',
              fontFamily: 'Manrope, sans-serif',
            }}
          >
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <WorkoutsSection sport={sport} />
        <GoalsSection sport={sport} />
        <RacesSection sport={sport} />
        <SportShoppingSection sport={sport} />
      </div>
    </div>
  )
}
