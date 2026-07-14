import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const qc = useQueryClient()
  const lastUserId = useRef<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('[AuthContext] erro ao obter sessão:', error)
        }
        lastUserId.current = session?.user?.id ?? null
        setSession(session)
        setLoading(false)
      })
      .catch((err) => {
        console.error('[AuthContext] falha crítica ao obter sessão:', err)
        setLoading(false) // garantir que loading não fica preso
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id ?? null
      // A different account signed in/out in this tab — drop all cached
      // data so a stale user's info can never flash for the next account.
      if (lastUserId.current !== null && nextUserId !== lastUserId.current) {
        qc.clear()
      }
      lastUserId.current = nextUserId
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [qc])

  async function signOut() {
    await supabase.auth.signOut()
    qc.clear()
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
