import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export type Profile = {
  id: string
  name: string
  city: string | null
  marathon_goal: string | null
  created_at: string
}

export function useProfile() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const key = ['profile', user?.id]

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data as Profile | null
    },
  })

  const updateProfile = useMutation({
    mutationFn: async (fields: Partial<Omit<Profile, 'id' | 'created_at'>>) => {
      const { error } = await supabase.from('profiles')
        .upsert({ id: user!.id, ...fields })
      if (error) throw error
    },
    onMutate: async (fields) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Profile | null>(key)
      qc.setQueryData<Profile | null>(key, (old) =>
        old ? { ...old, ...fields } : ({ id: user!.id, created_at: '', city: null, marathon_goal: null, name: '', ...fields } as Profile)
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev !== undefined) qc.setQueryData(key, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, updateProfile }
}

/* Admin: list all profiles */
export function useAllProfiles() {
  return useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Pick<Profile, 'id' | 'name' | 'created_at'>[]
    },
  })
}
