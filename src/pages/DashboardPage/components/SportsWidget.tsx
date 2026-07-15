import { Activity } from 'lucide-react'
import { useDashSports } from '../../../hooks/useDashboard'
import { daysUntil } from '../utils'
import { Sk, Widget } from './shared'

/* ══════════════════════════════════════════════════════════════════
   WIDGET 7 — ESPORTES
══════════════════════════════════════════════════════════════════ */
export function SportsWidget() {
  const { isLoading, kmMonth, countMonth, nextRace } = useDashSports()

  return (
    <Widget icon={<Activity size={14} />} title="Esportes" to="/esportes">
      {isLoading ? (
        <div className="space-y-2"><Sk w="w-20" h="h-6" /><Sk /><Sk w="w-4/5" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-bg rounded-xl px-3 py-2.5">
              <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>
                km no mes
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 800, color: '#0EA5E9' }}>
                {kmMonth.toFixed(1)}
              </div>
            </div>
            <div className="bg-bg rounded-xl px-3 py-2.5">
              <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>
                treinos
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 800, color: '#a78bfa' }}>
                {countMonth}
              </div>
            </div>
          </div>

          {nextRace ? (
            <div className="bg-bg rounded-xl px-3 py-2.5 flex items-center gap-2.5">
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-lg"
                style={{ width: 36, height: 36, background: 'rgba(251,191,36,.1)' }}
              >
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 800, color: '#fbbf24' }}>
                  {daysUntil(nextRace.race_date)}d
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-ink text-xs font-semibold truncate" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {nextRace.name}
                </div>
                {nextRace.location && (
                  <div className="text-ink-3" style={{ fontSize: 10 }}>{nextRace.location}</div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-ink-3 text-xs">Nenhuma prova cadastrada.</p>
          )}
        </>
      )}
    </Widget>
  )
}
