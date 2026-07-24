import { Activity, Dumbbell, Bike, Waves, Footprints } from 'lucide-react'
import type { Sport } from '../types'
import { SPORT_LABEL_BY_KEY } from '../constants'
import { fmtKm, fmtDurationShort, primaryMetric } from '../utils'

const ICON_BY_SPORT: Record<string, React.ReactNode> = {
  musculacao: <Dumbbell size={20} color="var(--text2)" />,
  ciclismo:   <Bike size={20} color="var(--text2)" />,
  triathlon:  <Bike size={20} color="var(--text2)" />,
  natacao:    <Waves size={20} color="var(--text2)" />,
  caminhada:  <Footprints size={20} color="var(--text2)" />,
}

function fmtCardDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── WorkoutRow ─────────────────────────────────────────────────── */
export function WorkoutRow({ w, onDelete }: { w: Sport; onDelete: (id: string) => void }) {
  const icon  = ICON_BY_SPORT[w.sport] ?? <Activity size={20} color="var(--text2)" />
  const title = w.activity_name || SPORT_LABEL_BY_KEY[w.sport] || w.sport
  const km    = fmtKm(w.distance_m)
  const metric = primaryMetric(w)

  const metrics = [
    ...(km ? [{ label: 'Distância', value: km }] : []),
    { label: 'Tempo', value: fmtDurationShort(w.duration_s) },
    ...(metric ? [metric] : []),
  ]

  return (
    <div className="group flex items-center gap-4 p-4 rounded-2xl border border-[#1f1f1f] hover:border-[#2a2a2a] transition-colors" style={{ background: '#111111' }}>
      {/* Preview de rota — TODO: renderizar o traçado GPS real quando o
          projeto passar a armazenar a polyline do Strava (map.summary_polyline);
          por ora, placeholder com o ícone do esporte. */}
      <div
        className="flex-shrink-0 rounded-xl flex items-center justify-center"
        style={{ width: 64, height: 64, background: '#0a0a0a' }}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-white font-semibold text-sm sm:text-base truncate" style={{ fontFamily: 'Sora, sans-serif' }}>
            {title}
          </span>
          <button
            onClick={() => onDelete(w.id)}
            aria-label="Excluir treino"
            className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-red-400 transition-opacity w-6 h-6 flex items-center justify-center text-sm flex-shrink-0"
          >×</button>
        </div>
        <div className="text-ink-3 text-xs mt-0.5">{fmtCardDate(w.sport_date)}</div>

        <div className="flex gap-5 mt-3 flex-wrap">
          {metrics.map(m => (
            <div key={m.label}>
              <div className="text-[10px] uppercase tracking-wide text-ink-3">{m.label}</div>
              <div className="text-white font-bold text-base sm:text-lg" style={{ fontFamily: 'Sora, sans-serif' }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
