import { FolderOpen } from 'lucide-react'
import { useDashProjects } from '../../../hooks/useDashboard'
import { Sk, Bar, Widget, BigStat } from './shared'

/* ══════════════════════════════════════════════════════════════════
   WIDGET 3 — PROJETOS
══════════════════════════════════════════════════════════════════ */
export function ProjectsWidget() {
  const { data, isLoading } = useDashProjects()
  const active = (data ?? []).filter((p) => !p.delivered)
  const top2   = [...active].sort((a, b) => b.progress - a.progress).slice(0, 2)

  const STATUS_COLOR: Record<string, string> = {
    'em dev': '#60a5fa', inicio: '#fbbf24', ativo: '#34d399',
    live: '#6ee7b7', pausado: 'var(--text3)',
  }

  return (
    <Widget icon={<FolderOpen size={14} />} title="Projetos" to="/projetos">
      {isLoading ? (
        <div className="space-y-2"><Sk w="w-12" h="h-6" /><Sk /><Sk w="w-4/5" /></div>
      ) : (
        <>
          <BigStat value={active.length} label="em andamento" color="#0EA5E9" />
          {top2.length === 0 ? (
            <p className="text-ink-3 text-xs mt-2">Nenhum projeto ativo.</p>
          ) : (
            <ul className="space-y-2.5 mt-3">
              {top2.map((p) => (
                <li key={p.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-ink text-xs font-semibold truncate flex-1 mr-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {p.name}
                    </span>
                    <span
                      className="flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{
                        fontSize: 9, fontWeight: 700,
                        color: STATUS_COLOR[p.status] ?? 'var(--text2)',
                        background: (STATUS_COLOR[p.status] ?? 'var(--text2)') + '18',
                      }}
                    >
                      {p.status}
                    </span>
                  </div>
                  <Bar pct={p.progress} color={STATUS_COLOR[p.status] ?? '#0EA5E9'} />
                  <div className="text-right mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--text3)' }}>
                    {p.progress}%
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Widget>
  )
}
