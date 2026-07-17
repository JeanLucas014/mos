import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export type ThemeOption = 'system' | 'dark' | 'light'

export function useTheme() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const { data: theme = 'system' } = useQuery<ThemeOption>({
    queryKey: ['theme', user?.id],
    queryFn: async () => {
      if (!user) return 'system'
      const { data } = await supabase
        .from('user_settings')
        .select('theme')
        .eq('user_id', user.id)
        .maybeSingle()
      return (data?.theme as ThemeOption) ?? 'system'
    },
    enabled: !!user,
    staleTime: Infinity,
  })

  const setThemeMutation = useMutation({
    mutationFn: async (t: ThemeOption) => {
      if (!user) return
      await supabase
        .from('user_settings')
        .update({ theme: t })
        .eq('user_id', user.id)
    },
    onMutate: async (t) => {
      await qc.cancelQueries({ queryKey: ['theme', user?.id] })
      qc.setQueryData(['theme', user?.id], t)
    },
  })

  // Aplicar tema no <html>
  useEffect(() => {
    const html = document.documentElement
    if (theme === 'system') {
      html.removeAttribute('data-theme')
    } else {
      html.setAttribute('data-theme', theme)
    }
  }, [theme])

  return { theme, setTheme: (t: ThemeOption) => setThemeMutation.mutate(t) }
}
