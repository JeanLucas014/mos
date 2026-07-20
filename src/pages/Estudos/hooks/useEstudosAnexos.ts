import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/db'

export type EstudoAnexo = Database['public']['Tables']['estudos_anexos']['Row']

export function useEstudosAnexos(itemId: string | null) {
  const qc = useQueryClient()
  const key = ['estudos_anexos', itemId]

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estudos_anexos')
        .select('*')
        .eq('item_id', itemId as string)
        .order('created_at')
      if (error) throw error
      return (data ?? []) as EstudoAnexo[]
    },
    enabled: !!itemId,
  })

  const addAnexo = useMutation({
    mutationFn: async (a: { path: string; nomeArquivo: string; tipoArquivo: string; tamanhoBytes: number }) => {
      const { data, error } = await supabase
        .from('estudos_anexos')
        .insert({
          item_id: itemId as string,
          nome_arquivo: a.nomeArquivo,
          url: a.path,
          tipo_arquivo: a.tipoArquivo,
          tamanho_bytes: a.tamanhoBytes,
        })
        .select()
        .single()
      if (error) throw error
      return data as EstudoAnexo
    },
    onSuccess: (anexo) => {
      qc.setQueryData<EstudoAnexo[]>(key, (old) => (old ? [...old, anexo] : [anexo]))
    },
  })

  const deleteAnexo = useMutation({
    mutationFn: async (anexo: EstudoAnexo) => {
      // Remove o arquivo do storage também — evita lixo acumulado no bucket.
      await supabase.storage.from('estudos-anexos').remove([anexo.url])
      const { error } = await supabase.from('estudos_anexos').delete().eq('id', anexo.id)
      if (error) throw error
    },
    onMutate: async (anexo) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<EstudoAnexo[]>(key)
      qc.setQueryData<EstudoAnexo[]>(key, (old) => old?.filter((a) => a.id !== anexo.id))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, addAnexo, deleteAnexo }
}
