import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface BriefingData {
  briefing: string
  generatedAt: string
  context: {
    tasksPending: number
    tasksOverdue: number
    habitsDone: number
    habitsTotal: number
    saldo: number
    weekWorkouts: number
  }
}

export function useDailyBriefing() {
  return useQuery<BriefingData>({
    queryKey: ['daily-briefing'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('daily-briefing')
      if (error) throw error
      return data as BriefingData
    },
    staleTime: 1000 * 60 * 60 * 4, // 4 horas — não regenera toda vez que abre
    retry: 1,
  })
}
