import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileScrim } from './MobileScrim'
import { useUIStore } from '../../stores/useUIStore'

export function AppShell() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Sidebar */}
      <div
        className={[
          'fixed md:relative z-30 md:z-auto h-full bg-bg-2 border-r border-line transition-transform duration-[280ms]',
          'md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ width: 220, flexShrink: 0 }}
      >
        <Sidebar />
      </div>

      {/* Scrim for mobile */}
      <MobileScrim />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 md:ml-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-bg">
          <div className="px-7 py-7 md:px-7 md:py-7" style={{ padding: '30px 28px' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
