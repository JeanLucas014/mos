import { Zap } from 'lucide-react'
import { useDashHabits } from '../../../hooks/useDashboard'
import { Sk, Widget } from './shared'

/* ══════════════════════════════════════════════════════════════════
   WIDGET 10 — STREAK
══════════════════════════════════════════════════════════════════ */
export function StreakWidget() {
  const { isLoading, topStreak } = useDashHabits()
  const color = topStreak.streak >= 14 ? '#f59e0b' : topStreak.streak >= 7 ? '#fbbf24' : '#0EA5E9'

  return (
    <Widget icon={<Zap size={14} />} title="Maior Streak" to="/habitos">
      {isLoading ? (
        <div className="space-y-2"><Sk w="w-16" h="h-8" /><Sk w="w-3/4" /></div>
      ) : topStreak.streak === 0 ? (
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 26, color: 'var(--text3)', lineHeight: 1 }}>
            —
          </div>
          <p className="text-ink-3 text-xs mt-1">Marque habitos para iniciar streak.</p>
        </div>
      ) : (
        <>
          <div className="flex items-end gap-1.5 mb-1">
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 32, color, lineHeight: 1 }}>
              {topStreak.streak}
            </div>
            <div className="text-ink-2 pb-0.5" style={{ fontSize: 12 }}>dias</div>
          </div>
          <div className="text-ink-2 text-xs truncate mb-2">{topStreak.name}</div>
          <div>
            {[...Array(Math.min(topStreak.streak, 14))].map((_, i) => (
              <span
                key={i}
                className="inline-block rounded-sm mr-0.5 mb-0.5"
                style={{ width: 8, height: 8, background: color, opacity: 0.3 + (i / Math.max(topStreak.streak - 1, 1)) * 0.7 }}
              />
            ))}
          </div>
        </>
      )}
    </Widget>
  )
}
