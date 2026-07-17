import { useState, type FormEvent } from 'react'
import { Trophy, Calendar, MapPin, Check, Circle } from 'lucide-react'
import { useSportRaces } from '../../../hooks/useSportRaces'
import type { SportRace } from '../types'
import { fmtDate, daysUntil } from '../utils'
import { Section } from './Section'
import { Modal } from './Modal'
import { Field } from './Field'
import { inputCls, inputH } from './shared'

/* ══════════════════════════════════════════════════════════════════
   SECTION 3 — PRÓXIMAS PROVAS
══════════════════════════════════════════════════════════════════ */
export function RacesSection({ sport }: { sport: string }) {
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
                  <button onClick={() => deleteRace.mutate(r.id)} aria-label="Excluir prova" className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red-400 transition-opacity w-7 h-7 flex items-center justify-center text-sm">×</button>
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
