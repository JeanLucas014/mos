import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { MODULES } from '../lib/modules'
import { useAuth } from '../contexts/AuthContext'

interface UserSettings {
  user_id: string
  enabled_modules: string[]
  onboarding_completed: boolean
  is_admin: boolean
}

export function useUserSettings() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const key = ['user_settings', user?.id]

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return (data as UserSettings) ?? {
        user_id: '',
        enabled_modules: MODULES.map(m => m.id),
        onboarding_completed: false,
        is_admin: false,
      }
    },
    // configurações do usuário mudam raramente (só quando ele mexe em
    // Configurações) — mutações já invalidam a query manualmente
    staleTime: 1000 * 60 * 10,
  })

  const toggleModule = useMutation({
    mutationFn: async (moduleId: string) => {
      const current = qc.getQueryData<UserSettings>(key)
      if (!current) return
      const enabled = current.enabled_modules.includes(moduleId)
        ? current.enabled_modules.filter(m => m !== moduleId)
        : [...current.enabled_modules, moduleId]
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: user!.id, enabled_modules: enabled }, { onConflict: 'user_id' })
      if (error) throw error
      return enabled
    },
    onSuccess: (enabled) => {
      if (!enabled) return
      qc.setQueryData<UserSettings>(key, (old) =>
        old ? { ...old, enabled_modules: enabled } : old,
      )
    },
  })

  const completeOnboarding = useMutation({
    mutationFn: async (selectedModules: string[]) => {
      const { error } = await supabase
        .from('user_settings')
        .upsert(
          { user_id: user!.id, enabled_modules: selectedModules, onboarding_completed: true },
          { onConflict: 'user_id' },
        )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, toggleModule, completeOnboarding }
}
