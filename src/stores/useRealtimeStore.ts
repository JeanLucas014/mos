import { create } from 'zustand'

/**
 * Ponte entre o useRealtimeSync (dono da conexão Realtime) e páginas que
 * ainda não usam React Query (Tarefas, Agenda, Mês do Financeiro — leem
 * dados via useState + reload() manual). Cada tabela tem um contador que
 * incrementa a cada evento postgres_changes; a página assina o número da
 * sua tabela e recarrega quando ele muda, sem acoplamento direto ao hook
 * central.
 */
interface RealtimeState {
  versions: Record<string, number>
  bump: (table: string) => void
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  versions: {},
  bump: (table) => set((s) => ({
    versions: { ...s.versions, [table]: (s.versions[table] ?? 0) + 1 },
  })),
}))
