import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileScrim } from './MobileScrim'
import { CommandPalette } from '../CommandPalette'
import { MOSChat } from '../chat/MOSChat'
import { ErrorBoundary } from '../ErrorBoundary'
import { useUIStore } from '../../stores/useUIStore'
import { useUserSettings } from '../../hooks/useUserSettings'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'

/** Sem render — só monta o hook de sincronização em tempo real uma vez por
 * sessão autenticada (mesmo padrão do ThemeApplier em App.tsx). */
function RealtimeSync() {
  useRealtimeSync()
  return null
}

export function AppShell() {
  const sidebarOpen      = useUIStore((s) => s.sidebarOpen)
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const { data: settings, isLoading } = useUserSettings()
  const location = useLocation()

  if (!isLoading && settings && settings.onboarding_completed === false) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <>
    <RealtimeSync />
    <CommandPalette />
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Sidebar — fixed drawer on mobile, static column on lg+ */}
      <div
        className={[
          'fixed lg:relative z-30 lg:z-auto h-full bg-bg-2 border-r border-line',
          'transition-all duration-[280ms] ease-smooth',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ width: sidebarCollapsed ? 56 : 220, flexShrink: 0 }}
      >
        <Sidebar />
      </div>

      {/* Overlay scrim — mobile only */}
      <MobileScrim />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-bg">
          <div className="p-4 lg:px-7 lg:py-[30px]">
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
    <MOSChat />
    </>
  )
}
