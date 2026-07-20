import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database, Json } from '@/types/db'
import { emptyDoc } from '@/lib/tiptapContent'

export type EstudoItem = Database['public']['Tables']['estudos_itens']['Row']
export type EstudoItemTipo = 'pasta' | 'pagina'

export function useEstudosItens(cursoId: string) {
  const qc = useQueryClient()
  const key = ['estudos_itens', cursoId]

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estudos_itens')
        .select('*')
        .eq('curso_id', cursoId)
        .order('ordem')
        .order('created_at')
      if (error) throw error
      return (data ?? []) as EstudoItem[]
    },
    enabled: !!cursoId,
  })

  const addItem = useMutation({
    mutationFn: async (i: { tipo: EstudoItemTipo; nome: string; parentId: string | null }) => {
      const { data, error } = await supabase
        .from('estudos_itens')
        .insert({
          curso_id: cursoId,
          parent_id: i.parentId,
          tipo: i.tipo,
          nome: i.nome,
          conteudo: i.tipo === 'pagina' ? (emptyDoc() as unknown as Json) : null,
        })
        .select()
        .single()
      if (error) throw error
      return data as EstudoItem
    },
    onSuccess: (item) => {
      qc.setQueryData<EstudoItem[]>(key, (old) => (old ? [...old, item] : [item]))
    },
  })

  const updateItem = useMutation({
    mutationFn: async ({ id, nome, parentId, conteudo }: { id: string; nome?: string; parentId?: string | null; conteudo?: Json }) => {
      const updates: { nome?: string; parent_id?: string | null; conteudo?: Json } = {}
      if (nome !== undefined) updates.nome = nome
      if (parentId !== undefined) updates.parent_id = parentId
      if (conteudo !== undefined) updates.conteudo = conteudo
      const { error } = await supabase.from('estudos_itens').update(updates).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, nome, parentId, conteudo }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<EstudoItem[]>(key)
      qc.setQueryData<EstudoItem[]>(key, (old) =>
        old?.map((it) =>
          it.id === id
            ? {
                ...it,
                ...(nome !== undefined ? { nome } : {}),
                ...(parentId !== undefined ? { parent_id: parentId } : {}),
                ...(conteudo !== undefined ? { conteudo } : {}),
                updated_at: new Date().toISOString(),
              }
            : it,
        ),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('estudos_itens').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<EstudoItem[]>(key)
      // O cascade de verdade acontece no banco (ON DELETE CASCADE) — aqui é
      // só pra não deixar os descendentes "órfãos" na tela até o invalidate.
      const toRemove = prev ? collectDescendants(id, prev) : new Set([id])
      qc.setQueryData<EstudoItem[]>(key, (old) => old?.filter((it) => !toRemove.has(it.id)))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, addItem, updateItem, deleteItem }
}

/** Todos os ids que seriam removidos por um DELETE em cascata a partir de `rootId`. */
export function collectDescendants(rootId: string, all: EstudoItem[]): Set<string> {
  const ids = new Set([rootId])
  let changed = true
  while (changed) {
    changed = false
    for (const it of all) {
      if (it.parent_id && ids.has(it.parent_id) && !ids.has(it.id)) {
        ids.add(it.id)
        changed = true
      }
    }
  }
  return ids
}
