import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

/* ── Strava sync hook ──────────────────────────────────────────── */
export function useStravaConnected() {
  return useQuery({
    queryKey: ['integration', 'strava'],
    queryFn: async () => {
      const { data } = await supabase.from('integrations')
        .select('connected').eq('provider', 'strava').eq('connected', true).maybeSingle()
      return !!data
    },
  })
}
