import type { Database } from '../../types/db'

export type SportRace = Database['public']['Tables']['sport_races']['Row']
export type Sport = Database['public']['Tables']['sports']['Row']

export type UserSport = { id: string; key: string; label: string }
