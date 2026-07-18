import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { WeekStart } from '../lib/dates'

export type WeekStartOption = 'monday' | 'sunday'

export function weekStartOptionToNumber(opt: WeekStartOption): WeekStart {
  return opt === 'sunday' ? 0 : 1
}

export function useWeekStart() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const { data: weekStart = 'monday' } = useQuery<WeekStartOption>({
    queryKey: ['week_start', user?.id],
    queryFn: async () => {
      if (!user) return 'monday'
      const { data } = await supabase
        .from('user_settings')
        .select('week_start')
        .eq('user_id', user.id)
        .maybeSingle()
      return (data?.week_start as WeekStartOption) ?? 'monday'
    },
    enabled: !!user,
    staleTime: Infinity,
  })

  const setWeekStartMutation = useMutation({
    mutationFn: async (w: WeekStartOption) => {
      if (!user) return
      await supabase
        .from('user_settings')
        .update({ week_start: w })
        .eq('user_id', user.id)
    },
    onMutate: async (w) => {
      await qc.cancelQueries({ queryKey: ['week_start', user?.id] })
      qc.setQueryData(['week_start', user?.id], w)
    },
  })

  return {
    weekStart,
    weekStartsOn: weekStartOptionToNumber(weekStart),
    setWeekStart: (w: WeekStartOption) => setWeekStartMutation.mutate(w),
  }
}
