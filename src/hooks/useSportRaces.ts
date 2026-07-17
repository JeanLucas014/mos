import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type SportRace = Database['public']['Tables']['sport_races']['Row']

export function useSportRaces(sport: string) {
  const qc = useQueryClient()
  const key = ['sport_races', sport]

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('sport_races')
        .select('*')
        .eq('sport', sport)
        .order('race_date', { ascending: true })
      if (error) throw error
      return data as SportRace[]
    },
  })

  const addRace = useMutation({
    mutationFn: async (r: {
      name: string
      race_date: string
      location?: string
      distance?: string
      goal_time?: string
    }) => {
      const { data, error } = await supabase.from('sport_races')
        .insert({
          sport,
          name: r.name,
          race_date: r.race_date,
          location: r.location ?? null,
          distance: r.distance ?? null,
          goal_time: r.goal_time ?? null,
          registered: false,
        })
        .select()
        .single()
      if (error) throw error
      return data as SportRace
    },
    onSuccess: (n) => {
      qc.setQueryData<SportRace[]>(key, (old) =>
        old ? [...old, n].sort((a, b) => a.race_date.localeCompare(b.race_date)) : [n],
      )
    },
  })

  const toggleRegistered = useMutation({
    mutationFn: async ({ id, registered }: { id: string; registered: boolean }) => {
      const { error } = await supabase.from('sport_races').update({ registered }).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, registered }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<SportRace[]>(key)
      qc.setQueryData<SportRace[]>(key, (old) => old?.map((r) => r.id === id ? { ...r, registered } : r))
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const deleteRace = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sport_races').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<SportRace[]>(key)
      qc.setQueryData<SportRace[]>(key, (old) => old?.filter((r) => r.id !== id))
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, addRace, toggleRegistered, deleteRace }
}
