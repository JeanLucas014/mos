import { useState, type FormEvent } from 'react'
import { Target, Calendar } from 'lucide-react'
import { useSportGoals } from '../../../hooks/useSportGoals'
import { useSportRaces } from '../../../hooks/useSportRaces'
import { fmtDuration, parseDuration, fmtDate, paceToSec, secToPace } from '../utils'
import { Section } from './Section'
import { Modal } from './Modal'
import { Field } from './Field'
import { inputCls, inputH } from './shared'

/* ══════════════════════════════════════════════════════════════════
   SECTION 2 — METAS
══════════════════════════════════════════════════════════════════ */
export function GoalsSection({ sport }: { sport: string }) {
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
