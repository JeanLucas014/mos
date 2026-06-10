/**
 * useDashboard — data layer for the Dashboard page.
 *
 * Uses the same TanStack Query cache keys as the module hooks where possible,
 * so switching to a module page never triggers a redundant re-fetch.
 */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/db'

type Task     = Database['public']['Tables']['tasks']['Row']
type Habit    = Database['public']['Tables']['habits']['Row']
type HabitLog = Database['public']['Tables']['habit_logs']['Row']
type Project  = Database['public']['Tables']['projects']['Row']
type Goal     = Database['public']['Tables']['goals']['Row']
type Note     = Database['public']['Tables']['notes']['Row']
type Book     = Database['public']['Tables']['books']['Row']
type Workout  = Database['public']['Tables']['sports']['Row']
type SportRace = Database['public']['Tables']['sport_races']['Row']

/* ── Date helpers ─────────────────────────────────────────────── */
function monthStart(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}


function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function calcStreak(logs: HabitLog[]): number {
  if (!logs.length) return 0
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const dates = [...new Set(logs.map((l) => l.log_date))].sort().reverse()
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const yest = new Date(now); yest.setDate(yest.getDate() - 1)
  if (dates[0] !== fmt(now) && dates[0] !== fmt(yest)) return 0
  let streak = 0
  const cur = new Date(dates[0] + 'T00:00:00')
  for (const d of dates) {
    if (d === fmt(cur)) { streak++; cur.setDate(cur.getDate() - 1) }
    else break
  }
  return streak
}

/* ── Tasks ────────────────────────────────────────────────────── */
export function useDashTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('done', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Task[]
    },
  })
}

/* ── Habits ───────────────────────────────────────────────────── */
export function useDashHabits() {
  const habits = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits').select('*').order('created_at', { ascending: true })
      if (error) throw error
      return data as Habit[]
    },
  })

  const logs = useQuery({
    queryKey: ['habit_logs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('habit_logs').select('*')
      if (error) throw error
      return data as HabitLog[]
    },
  })

  const todayStr = today()
  const allHabits = habits.data ?? []
  const allLogs   = logs.data ?? []

  const doneToday = allHabits.filter((h) =>
    allLogs.some((l) => l.habit_id === h.id && l.log_date === todayStr),
  ).length

  const topStreak = allHabits.reduce((best, h) => {
    const hLogs = allLogs.filter((l) => l.habit_id === h.id)
    const s = calcStreak(hLogs)
    return s > best.streak ? { name: h.name, streak: s } : best
  }, { name: '', streak: 0 })

  return {
    isLoading: habits.isLoading || logs.isLoading,
    total: allHabits.length,
    doneToday,
    topStreak,
  }
}

/* ── Projects ─────────────────────────────────────────────────── */
export function useDashProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Project[]
    },
  })
}

/* ── Goals ────────────────────────────────────────────────────── */
export function useDashGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Goal[]
    },
  })
}

/* ── Invoices (pending) ───────────────────────────────────────── */
export function useDashInvoices() {
  return useQuery({
    queryKey: ['dash_invoices'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('invoices') as any)
        .select('amount_cents, status')
        .neq('status', 'pago')
      if (error) throw error
      const rows = (data ?? []) as { amount_cents: number; status: string }[]
      const total = rows.reduce((s, r) => s + r.amount_cents, 0)
      const result = { total: total / 100, count: rows.length }
      console.log('[dash_invoices]', data, '→', result)
      return result
    },
  })
}

/* ── Sports (workouts this month + next race) ─────────────────── */
export function useDashSports() {
  const workouts = useQuery({
    queryKey: ['workouts', 'corrida'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('sports') as any)
        .select('*')
        .eq('sport', 'corrida')
        .order('sport_date', { ascending: false })
      if (error) throw error
      return data as Workout[]
    },
  })

  const races = useQuery({
    queryKey: ['sport_races', 'corrida'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('sport_races') as any)
        .select('*')
        .eq('sport', 'corrida')
        .order('race_date', { ascending: true })
      if (error) throw error
      return data as SportRace[]
    },
  })

  const start    = monthStart()
  const todayStr = today()
  const monthWorkouts = (workouts.data ?? []).filter((w) => w.sport_date >= start)
  const kmMonth  = monthWorkouts.reduce((s, w) => s + (w.distance_m ?? 0), 0) / 1000
  const nextRace = (races.data ?? []).find((r) => r.race_date >= todayStr) ?? null

  return {
    isLoading: workouts.isLoading || races.isLoading,
    kmMonth,
    countMonth: monthWorkouts.length,
    nextRace,
  }
}

/* ── Notes ────────────────────────────────────────────────────── */
export function useDashNotes() {
  return useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('id, title, updated_at')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data as Pick<Note, 'id' | 'title' | 'updated_at'>[]
    },
  })
}

/* ── Upcoming events ──────────────────────────────────────────── */
export function useDashEvents() {
  return useQuery({
    queryKey: ['dash_events'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('events') as any)
        .select('id, title, starts_at, ends_at, category')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(3)
      if (error) throw error
      return (data ?? []) as {
        id: string
        title: string
        starts_at: string
        ends_at: string | null
        category: string
      }[]
    },
  })
}

/* ── Vercel deploys ───────────────────────────────────────────── */
export function useDashVercel() {
  return useQuery({
    queryKey: ['dash_vercel'],
    queryFn: async () => {
      // first check if vercel integration is connected
      const { data: int } = await (supabase.from('integrations') as any)
        .select('connected')
        .eq('provider', 'vercel')
        .eq('connected', true)
        .maybeSingle()
      if (!int) return null

      const { data: { session } } = await supabase.auth.getSession()
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vercel-data`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token ?? ''}`,
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        },
      )
      if (!resp.ok) return null
      const data = await resp.json()
      return (data.deployments ?? []) as { id: string; name: string; url: string; state: string; createdAt: number }[]
    },
  })
}

/* ── Books ────────────────────────────────────────────────────── */
export function useDashBooks() {
  return useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Book[]
    },
  })
}
