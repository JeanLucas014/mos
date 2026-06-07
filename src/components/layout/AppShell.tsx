import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileScrim } from './MobileScrim'
import { useUIStore } from '../../stores/useUIStore'

export function AppShell() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Sidebar — fixed drawer on mobile, static column on lg+ */}
      <div
        className={[
          'fixed lg:relative z-30 lg:z-auto h-full bg-bg-2 border-r border-line',
          'transition-transform duration-[280ms] ease-smooth',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ width: 220, flexShrink: 0 }}
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
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
