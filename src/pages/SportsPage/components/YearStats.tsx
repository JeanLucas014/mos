import type { Sport } from '../types'
import { calcAvgPace } from '../utils'

/* ── YearStats ─────────────────────────────────────────────────── */
export function YearStats({ workouts, year }: { workouts: Sport[]; year: string }) {
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
                <div className="text-xs text-ink-3">{m.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {stats.map(s => (
          <div key={s.label} className="border border-[#1f1f1f] rounded-xl p-3" style={{ background: 'var(--bg2)' }}>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-[#444] mb-1.5">{s.label}</div>
            <div className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--blue)', wordBreak: 'break-word' }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
