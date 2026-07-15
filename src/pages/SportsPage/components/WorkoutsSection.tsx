import { useState, type FormEvent } from 'react'
import { Activity, RefreshCw } from 'lucide-react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useWorkouts } from '../../../hooks/useWorkouts'
import { supabase } from '../../../lib/supabase'
import { todayLocal } from '../../../lib/dates'
import type { Sport } from '../types'
import { SPORT_KINDS, KIND_LABELS, MODALITY_TABS, type ModalityTab } from '../constants'
import { parseDuration, calcPace, groupByMonth } from '../utils'
import { Section } from './Section'
import { Modal } from './Modal'
import { Field } from './Field'
import { inputCls, inputH } from './shared'
import { useStravaConnected } from '../hooks/useStravaConnected'
import { YearStats } from './YearStats'
import { MonthGroup } from './MonthGroup'

/* ══════════════════════════════════════════════════════════════════
   SECTION 1 — TREINOS
══════════════════════════════════════════════════════════════════ */
export function WorkoutsSection({ sport }: { sport: string }) {
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
