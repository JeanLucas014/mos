import { Target } from 'lucide-react'
import { useDashGoals } from '../../../hooks/useDashboard'
import { Sk, Bar, Widget, BigStat } from './shared'

/* ══════════════════════════════════════════════════════════════════
   WIDGET 4 — METAS
══════════════════════════════════════════════════════════════════ */
export function GoalsWidget() {
  const { data, isLoading } = useDashGoals()
  const goals  = data ?? []
  const avgPct = goals.length
    ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
    : 0
  const top2     = [...goals].sort((a, b) => b.progress - a.progress).slice(0, 2)
  const colorAvg = avgPct >= 75 ? '#34d399' : avgPct >= 40 ? 'var(--blue)' : '#fbbf24'

  return (
    <Widget icon={<Target size={14} />} title="Metas" to="/metas">
      {isLoading ? (
        <div className="space-y-2"><Sk w="w-14" h="h-6" /><Sk /><Sk w="w-4/5" /></div>
      ) : (
        <>
          <BigStat value={`${avgPct}%`} label="progresso medio" color={colorAvg} />
          <div className="mt-2 mb-3">
            <Bar pct={avgPct} color={colorAvg} />
          </div>
          {top2.length === 0 ? (
            <p className="text-ink-3 text-xs">Nenhuma meta cadastrada.</p>
          ) : (
            <ul className="space-y-1.5">
              {top2.map((g) => (
                <li key={g.id} className="flex items-center justify-between">
                  <span className="text-ink-2 text-xs truncate flex-1 mr-2">{g.name}</span>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, flexShrink: 0,
                      color: g.progress >= 75 ? '#34d399' : g.progress >= 40 ? 'var(--blue)' : '#fbbf24',
                    }}
                  >
                    {g.label ?? `${g.progress}%`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Widget>
  )
}
