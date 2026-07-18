import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useUserSettings } from '../../hooks/useUserSettings'

/**
 * Fonte única de verdade pro acesso Jean-only (Faturamento, Sistemas, Admin).
 * Usa `user_settings.is_admin` — a mesma flag já usada pra decidir o item
 * "Admin" do Sidebar — em vez de depender de `enabled_modules` (array
 * configurável por usuário/seed, que já vazou esses módulos pra outras
 * contas por engano no passado). Não duplicar essa checagem em outro
 * lugar: qualquer rota Jean-only deve ser envolvida por este componente
 * em App.tsx.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { data: settings, isLoading } = useUserSettings()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!settings?.is_admin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
