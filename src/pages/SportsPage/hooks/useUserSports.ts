import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import type { UserSport } from '../types'

/**
 * CRUD local dos esportes do usuario (user_sports): carrega, adiciona
 * e remove, mantendo o esporte ativo selecionado consistente.
 */
export function useUserSports() {
  const [userSports,   setUserSports]   = useState<UserSport[]>([])
  const [sport,        setSport]        = useState<string>('')
  const [loadingSports, setLoadingSports] = useState(true)

  useEffect(() => { loadUserSports() }, [])

  async function loadUserSports() {
    const { data } = await (supabase as any).from('user_sports').select('*').order('ordem')
    const sports = data ?? []
    setUserSports(sports)
    if (sports.length > 0 && !sport) setSport(sports[0].key)
    setLoadingSports(false)
  }

  async function addSport(key: string, label: string) {
    await (supabase as any).from('user_sports').insert({ key, label, ordem: userSports.length })
    await loadUserSports()
    setSport(key)
  }

  async function removeSport(id: string, key: string) {
    if (!window.confirm('Remover este esporte? Os treinos registrados não serão apagados.')) return
    await (supabase as any).from('user_sports').delete().eq('id', id)
    const remaining = userSports.filter(s => s.id !== id)
    setUserSports(remaining)
    if (sport === key) setSport(remaining[0]?.key ?? '')
    await loadUserSports()
  }

  return { userSports, sport, setSport, loadingSports, addSport, removeSport }
}
