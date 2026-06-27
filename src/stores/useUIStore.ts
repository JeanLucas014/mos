import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  sidebarCollapsed: boolean
  toggleSidebarCollapsed: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  sidebarCollapsed: localStorage.getItem('sidebar-collapsed') === 'true',
  toggleSidebarCollapsed: () => set((s) => {
    const next = !s.sidebarCollapsed
    localStorage.setItem('sidebar-collapsed', String(next))
    return { sidebarCollapsed: next }
  }),
}))
