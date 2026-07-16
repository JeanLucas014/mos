import { lazy, Suspense } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { greeting, longDate } from './utils'
import { Skeleton } from '@/components/ui/Skeleton'
import { TasksWidget } from './components/TasksWidget'
import { HabitsWidget } from './components/HabitsWidget'
import { AgendaWidget } from './components/AgendaWidget'
import { ProjectsWidget } from './components/ProjectsWidget'
import { GoalsWidget } from './components/GoalsWidget'
import { SportsWidget } from './components/SportsWidget'
import { NotesWidget } from './components/NotesWidget'
import { LibraryWidget } from './components/LibraryWidget'
import { StreakWidget } from './components/StreakWidget'
import { FinanceiroWidget } from './components/FinanceiroWidget'

/* LifeScoreSection puxa recharts (biblioteca pesada) — Suspense próprio
   pra não atrasar o resto do dashboard (saudação + grid de widgets). */
const LifeScoreSection = lazy(() => import('./components/LifeScoreSection').then(m => ({ default: m.LifeScoreSection })))

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export function DashboardPage() {
  const { user } = useAuth()
  const { data: profile } = useProfile()

  const displayName = profile?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'voce'

  return (
    <div>
      {/* Greeting */}
      <div className="mb-7">
        <h1
          style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(22px, 4vw, 34px)',
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
          }}
        >
          {greeting()},{' '}
          <span style={{ color: '#0EA5E9' }}>{displayName}</span>
        </h1>
        <p className="text-ink-2 mt-1.5" style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13 }}>
          {longDate()}
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-40 rounded-card" />}>
        <LifeScoreSection />
      </Suspense>

      {/* Widget grid */}
      <div
        style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}
      >
        Modulos
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FinanceiroWidget />
        <TasksWidget />
        <NotesWidget />
        <AgendaWidget />
        <ProjectsWidget />
        <GoalsWidget />
        <SportsWidget />
        <HabitsWidget />
        <LibraryWidget />
        <StreakWidget />
      </div>
    </div>
  )
}
