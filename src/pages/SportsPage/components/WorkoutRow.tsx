import { Activity, Dumbbell, Bike } from 'lucide-react'
import type { Sport } from '../types'
import { fmtKm, fmtDurationShort, fmtDayLabel } from '../utils'

/* ── WorkoutRow ─────────────────────────────────────────────────── */
export function WorkoutRow({ w, onDelete }: { w: Sport; onDelete: (id: string) => void }) {
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
          aria-label="Excluir treino"
          className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-red-400 transition-opacity w-6 h-6 flex items-center justify-center text-sm"
        >×</button>
      </div>
    </div>
  )
}
