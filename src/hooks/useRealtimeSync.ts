import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useRealtimeStore } from '../stores/useRealtimeStore'

/** Tabelas cujo consumidor principal ainda é useState + reload() manual
 * (não React Query) — recebem um bump em useRealtimeStore em vez de
 * invalidateQueries, que não teria efeito nenhum nelas. */
const RAW_STATE_TABLES = new Set(['tasks', 'calendar_events', 'fin_lancamentos'])

const SYNCED_TABLES = ['tasks', 'calendar_events', 'fin_lancamentos', 'fin_recorrentes', 'habit_logs'] as const

/** Espera uma pausa de 300ms sem novos eventos da mesma tabela antes de
 * invalidar/recarregar — evita uma rajada de fetches redundantes quando
 * uma única ação gera várias linhas de uma vez (ex: gerar previsão diária
 * do mês insere ~30 linhas em fin_lancamentos num só insert). */
const DEBOUNCE_MS = 300

/**
 * Hook central de sincronização em tempo real. Mantém UMA conexão Realtime
 * (um channel, múltiplos bindings postgres_changes) para as tabelas que
 * várias telas do app compartilham, e propaga cada mudança:
 *   - para tabelas já em React Query: invalidateQueries na queryKey certa
 *   - para tabelas ainda em useState/reload manual: bump em useRealtimeStore
 *   - sempre invalida o sino de notificações, que lê de todas essas tabelas
 *
 * Deve ser montado uma única vez por sessão autenticada (ver <RealtimeSync />
 * em AppShell.tsx) — não em App.tsx (também renderiza deslogado) nem em
 * AuthContext/main.tsx (resolvem antes de user.id estar garantido).
 */
export function useRealtimeSync() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const bump = useRealtimeStore((s) => s.bump)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    if (!user?.id) return
    const userId = user.id

    function handleTableChange(table: string) {
      clearTimeout(timers.current[table])
      timers.current[table] = setTimeout(() => {
        if (RAW_STATE_TABLES.has(table)) bump(table)

        if (table === 'habit_logs') qc.invalidateQueries({ queryKey: ['habit_logs'] })
        if (table === 'fin_recorrentes') qc.invalidateQueries({ queryKey: ['dash_recorrentes'] })
        if (table === 'fin_lancamentos') {
          qc.invalidateQueries({ queryKey: ['dash_financas_score'] })
          // dash_recorrentes também lê fin_lancamentos (pra saber quais
          // recorrências já foram pagas no mês) — sem isso o card de
          // Financeiro não limpava o alerta de "vencida" ao marcar como paga.
          qc.invalidateQueries({ queryKey: ['dash_recorrentes'] })
        }
        if (table === 'tasks') {
          qc.invalidateQueries({ queryKey: ['dash_tasks'] })
          qc.invalidateQueries({ queryKey: ['dash_tasks_score'] })
        }
        if (table === 'calendar_events') qc.invalidateQueries({ queryKey: ['dash_events'] })

        // O sino lê das 5 tabelas — qualquer mudança relevante invalida ele.
        qc.invalidateQueries({ queryKey: ['app_notifications', userId] })

        if (import.meta.env.DEV) console.log(`[useRealtimeSync] ${table} mudou`)
      }, DEBOUNCE_MS)
    }

    const channel = supabase.channel(`app-sync-${userId}`)
    for (const table of SYNCED_TABLES) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
        () => handleTableChange(table),
      )
    }
    channel.subscribe()

    // Reconciliação: o cliente Realtime já reconecta sozinho após sono/rede
    // caída, mas eventos que aconteceram durante a desconexão são perdidos.
    // Ao a aba voltar a ficar visível, força uma atualização de tudo.
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        for (const table of SYNCED_TABLES) handleTableChange(table)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      Object.values(timers.current).forEach(clearTimeout)
      supabase.removeChannel(channel)
    }
  }, [user?.id, qc, bump])
}
