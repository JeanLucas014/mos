import { useUIStore } from '../../stores/useUIStore'

export function MobileScrim() {
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  if (!sidebarOpen) return null

  return (
    <div
      className="fixed inset-0 z-20 bg-black/60 lg:hidden"
      onClick={() => setSidebarOpen(false)}
    />
  )
}
