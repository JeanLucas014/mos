import { Flame } from 'lucide-react'
import { useDashHabits } from '../../../hooks/useDashboard'
import { Sk, Bar, Widget, BigStat } from './shared'

/* ══════════════════════════════════════════════════════════════════
   WIDGET 2 — HABITOS (hoje)
══════════════════════════════════════════════════════════════════ */
export function HabitsWidget() {
  const { isLoading, total, doneToday } = useDashHabits()
  const pct   = total > 0 ? (doneToday / total) * 100 : 0
  const color = pct >= 80 ? '#34d399' : pct >= 50 ? 'var(--blue)' : '#fbbf24'

  return (
    <Widget icon={<Flame size={14} />} title="Habitos" to="/habitos">
      {isLoading ? (
        <div className="space-y-2"><Sk w="w-20" h="h-6" /><Sk /></div>
      ) : (
        <>
          <BigStat value={`${doneToday}/${total}`} label="concluidos hoje" color={color} />
          <div className="mt-3">
            <Bar pct={pct} color={color} />
            <div className="text-right mt-1" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color }}>
              {Math.round(pct)}%
            </div>
          </div>
        </>
      )}
    </Widget>
  )
}
