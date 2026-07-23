import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/db'

export type EstudoMarco = Database['public']['Tables']['estudos_marcos']['Row']

export function useEstudosMarcos(cursoId: string) {
  const qc = useQueryClient()
  const key = ['estudos_marcos', cursoId]

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estudos_marcos')
        .select('*')
        .eq('curso_id', cursoId)
        .order('ordem')
        .order('created_at')
      if (error) throw error
      return (data ?? []) as EstudoMarco[]
    },
    enabled: !!cursoId,
  })

  const addMarco = useMutation({
    mutationFn: async (nome: string) => {
      const atuais = qc.getQueryData<EstudoMarco[]>(key) ?? []
      const { data, error } = await supabase
        .from('estudos_marcos')
        .insert({ curso_id: cursoId, nome, ordem: atuais.length })
        .select()
        .single()
      if (error) throw error
      return data as EstudoMarco
    },
    onSuccess: (novo) => {
      qc.setQueryData<EstudoMarco[]>(key, (old) => (old ? [...old, novo] : [novo]))
    },
  })

  const toggleMarco = useMutation({
    mutationFn: async ({ id, concluido }: { id: string; concluido: boolean }) => {
      const { error } = await supabase.from('estudos_marcos').update({ concluido }).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, concluido }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<EstudoMarco[]>(key)
      qc.setQueryData<EstudoMarco[]>(key, (old) => old?.map((m) => (m.id === id ? { ...m, concluido } : m)))
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const deleteMarco = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('estudos_marcos').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<EstudoMarco[]>(key)
      qc.setQueryData<EstudoMarco[]>(key, (old) => old?.filter((m) => m.id !== id))
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, addMarco, toggleMarco, deleteMarco }
}
