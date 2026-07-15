import { CheckSquare } from 'lucide-react'
import { useDashTasks } from '../../../hooks/useDashboard'
import { Sk, Widget, BigStat } from './shared'

/* ══════════════════════════════════════════════════════════════════
   WIDGET 1 — TAREFAS
══════════════════════════════════════════════════════════════════ */
export function TasksWidget() {
  const { data, isLoading } = useDashTasks()
  const tasks = (data ?? []) as {
    id: string; title: string; priority: number
    due_date: string | null; project_id: string | null
  }[]
  const pending = tasks
  const top3    = tasks.slice(0, 3)

  return (
    <Widget icon={<CheckSquare size={14} />} title="Tarefas" to="/tarefas">
      {isLoading ? (
        <div className="space-y-2">
          <Sk w="w-16" h="h-6" />
          <Sk w="w-full" />
          <Sk w="w-4/5" />
          <Sk w="w-3/4" />
        </div>
      ) : (
        <>
          <BigStat
            value={pending.length}
            label={`pendente${pending.length !== 1 ? 's' : ''}`}
            color={pending.length > 5 ? '#fbbf24' : '#34d399'}
          />
          {top3.length === 0 ? (
            <p className="text-ink-3 text-xs mt-2">Tudo em dia!</p>
          ) : (
            <ul className="space-y-1.5 mt-3">
              {top3.map((t) => (
                <li key={t.id} className="flex items-start gap-2">
                  <span style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3, flexShrink: 0 }}>●</span>
                  <span className="text-ink-2 text-xs leading-snug line-clamp-1">{t.title}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Widget>
  )
}
