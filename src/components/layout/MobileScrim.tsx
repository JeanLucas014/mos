import { useUIStore } from '../../stores/useUIStore'

export function MobileScrim() {
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  if (!sidebarOpen) return null

  return (
    <div
      className="fixed inset-0 z-20 bg-black/50 md:hidden"
      onClick={() => setSidebarOpen(false)}
    />
  )
}
