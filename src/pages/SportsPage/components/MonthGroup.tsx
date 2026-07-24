import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Sport } from '../types'
import { calcAvgPace, fmtMonthLabel, fmtDurationShort } from '../utils'
import { WorkoutRow } from './WorkoutRow'

/* ── MonthGroup ─────────────────────────────────────────────────── */
export function MonthGroup({ monthKey, workouts, onDelete }: { monthKey: string; workouts: Sport[]; onDelete: (id: string) => void }) {
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
              <span className="text-xs text-ink-3">{workouts.length} atividade{workouts.length !== 1 ? 's' : ''}</span>
              {totalKm > 0 && <span className="text-xs text-ink-3">{(totalKm / 1000).toFixed(1)} km</span>}
              <span className="text-xs text-ink-3">{fmtDurationShort(totalTime)}</span>
              {pace && <span className="text-xs text-ink-3">Pace med. {pace}</span>}
            </div>
          </div>
          {open ? <ChevronUp size={14} color="var(--text2)" /> : <ChevronDown size={14} color="var(--text2)" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-[#1a1a1a] p-3 space-y-3">
          {workouts.map(w => <WorkoutRow key={w.id} w={w} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  )
}
