import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
      // Mantido true (default do React Query) de propósito: combinado com
      // staleTime de 60s, só refaz a query se os dados já estiverem
      // "velhos" quando a janela recupera o foco — bom para um app com
      // dados financeiros/notificações que mudam entre dispositivos.
      refetchOnWindowFocus: true,
    },
  },
})
