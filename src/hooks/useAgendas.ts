import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Agenda } from '../pages/Agenda/types'

const agendasKey = ['agendas']

export function useAgendas() {
  const qc = useQueryClient()

  const agendasQuery = useQuery({
    queryKey: agendasKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agendas')
        .select('*')
        .order('ordem', { ascending: true })
      if (error) throw error
      return data as Agenda[]
    },
  })

  const agendas = agendasQuery.data ?? []
  const defaultAgenda = agendas.find((a) => a.eh_padrao) ?? agendas[0]

  const createAgenda = useMutation({
    mutationFn: async ({ nome, cor }: { nome: string; cor: string }) => {
      const { data, error } = await supabase.from('agendas')
        .insert({ nome, cor, ordem: agendas.length })
        .select().single()
      if (error) throw error
      return data as Agenda
    },
    onSuccess: (newAgenda) => {
      qc.setQueryData<Agenda[]>(agendasKey, (old) => (old ? [...old, newAgenda] : [newAgenda]))
    },
  })

  const updateAgenda = useMutation({
    mutationFn: async ({ id, nome, cor }: { id: string; nome?: string; cor?: string }) => {
      const patch: { nome?: string; cor?: string } = {}
      if (nome !== undefined) patch.nome = nome
      if (cor !== undefined) patch.cor = cor
      const { data, error } = await supabase.from('agendas')
        .update(patch).eq('id', id).select().single()
      if (error) throw error
      return data as Agenda
    },
    onSuccess: (updated) => {
      qc.setQueryData<Agenda[]>(agendasKey, (old) => old?.map((a) => a.id === updated.id ? updated : a))
    },
  })

  /** Define uma agenda como padrão — só uma pode ser padrão por usuário
   * (constraint no banco), então desmarca a anterior antes de marcar a nova. */
  const setDefaultAgenda = useMutation({
    mutationFn: async (id: string) => {
      const current = agendas.find((a) => a.eh_padrao)
      if (current && current.id !== id) {
        const { error: e1 } = await supabase.from('agendas').update({ eh_padrao: false }).eq('id', current.id)
        if (e1) throw e1
      }
      const { error: e2 } = await supabase.from('agendas').update({ eh_padrao: true }).eq('id', id)
      if (e2) throw e2
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agendasKey })
    },
  })

  /** Exclui uma agenda. Se `reassignToId` for informado, move os eventos
   * dela pra outra agenda antes de excluir; senão, apaga os eventos junto.
   * Nunca permite excluir a agenda marcada como padrão (o chamador deve
   * verificar isso e pedir pra escolher outra padrão antes). */
  const deleteAgenda = useMutation({
    mutationFn: async ({ id, reassignToId }: { id: string; reassignToId?: string }) => {
      const agenda = agendas.find((a) => a.id === id)
      if (agenda?.eh_padrao) throw new Error('Não é possível excluir a agenda padrão.')

      if (reassignToId) {
        const { error } = await supabase.from('calendar_events')
          .update({ agenda_id: reassignToId }).eq('agenda_id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('calendar_events').delete().eq('agenda_id', id)
        if (error) throw error
      }

      const { error } = await supabase.from('agendas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agendasKey })
      // calendar_events não é gerenciado por React Query aqui — a mudança já
      // chega em AgendaPage via Realtime (useRealtimeStore), que dispara
      // loadEvents() sozinho.
    },
  })

  return {
    agendas,
    defaultAgenda,
    isLoading: agendasQuery.isLoading,
    isError: agendasQuery.isError,
    createAgenda,
    updateAgenda,
    setDefaultAgenda,
    deleteAgenda,
  }
}
