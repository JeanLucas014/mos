// Generated types — run `npx supabase gen types typescript --linked > src/types/db.ts` to regenerate

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          city: string | null
          marathon_goal: string | null
          created_at: string
        }
        Insert: {
          id: string
          name?: string
          city?: string | null
          marathon_goal?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          city?: string | null
          marathon_goal?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          project: string | null
          done: boolean
          due_date: string | null
          priority: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          title: string
          project?: string | null
          done?: boolean
          due_date?: string | null
          priority?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          project?: string | null
          done?: boolean
          due_date?: string | null
          priority?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
      }
      habit_logs: {
        Row: {
          id: string
          user_id: string
          habit_id: string
          log_date: string
        }
        Insert: {
          id?: string
          user_id?: string
          habit_id: string
          log_date: string
        }
        Update: {
          id?: string
          user_id?: string
          habit_id?: string
          log_date?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          meta: string | null
          notes: string | null
          status: string
          progress: number
          delivered: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          meta?: string | null
          notes?: string | null
          status?: string
          progress?: number
          delivered?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          meta?: string | null
          notes?: string | null
          status?: string
          progress?: number
          delivered?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      project_checklist: {
        Row: {
          id: string
          user_id: string
          project_id: string
          text: string
          done: boolean
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          project_id: string
          text: string
          done?: boolean
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          text?: string
          done?: boolean
          position?: number
          created_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          name: string
          area: string | null
          progress: number
          label: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          area?: string | null
          progress?: number
          label?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          area?: string | null
          progress?: number
          label?: string | null
          created_at?: string
        }
      }
      goal_items: {
        Row: {
          id: string
          user_id: string
          goal_id: string
          text: string
          done: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          goal_id: string
          text: string
          done?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string
          text?: string
          done?: boolean
          created_at?: string
        }
      }
      habit_exceptions: {
        Row: {
          id: string
          user_id: string
          habit_id: string
          exception_date: string
        }
        Insert: {
          id?: string
          user_id?: string
          habit_id: string
          exception_date: string
        }
        Update: {
          id?: string
          user_id?: string
          habit_id?: string
          exception_date?: string
        }
      }
      shopping_items: {
        Row: {
          id: string
          user_id: string
          title: string
          done: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          title: string
          done?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          done?: boolean
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          description: string
          amount_cents: number
          kind: string
          category: string | null
          occurred_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          description: string
          amount_cents: number
          kind?: string
          category?: string | null
          occurred_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          amount_cents?: number
          kind?: string
          category?: string | null
          occurred_at?: string
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          service: string
          client: string
          amount_cents: number
          status: string
          due_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          service: string
          client: string
          amount_cents: number
          status?: string
          due_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          service?: string
          client?: string
          amount_cents?: number
          status?: string
          due_date?: string | null
          created_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          title?: string
          body?: string
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string
          updated_at?: string
          created_at?: string
        }
      }
      books: {
        Row: {
          id: string
          user_id: string
          title: string
          author: string | null
          status: string
          cover_url: string | null
          progress: number
          favorite: boolean
          category: string | null
          total_pages: number | null
          pages_read: number | null
          started_at: string | null
          finished_at: string | null
          rating: number | null
          format: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          title: string
          author?: string | null
          status?: string
          cover_url?: string | null
          progress?: number
          favorite?: boolean
          category?: string | null
          total_pages?: number | null
          pages_read?: number | null
          started_at?: string | null
          finished_at?: string | null
          rating?: number | null
          format?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          author?: string | null
          status?: string
          cover_url?: string | null
          progress?: number
          favorite?: boolean
          category?: string | null
          total_pages?: number | null
          pages_read?: number | null
          started_at?: string | null
          finished_at?: string | null
          rating?: number | null
          format?: string | null
          created_at?: string
        }
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          sport: string
          kind: string
          distance_m: number
          duration_s: number
          pace_label: string | null
          workout_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          sport: string
          kind: string
          distance_m: number
          duration_s: number
          pace_label?: string | null
          workout_date?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sport?: string
          kind?: string
          distance_m?: number
          duration_s?: number
          pace_label?: string | null
          workout_date?: string
          notes?: string | null
          created_at?: string
        }
      }
      sport_goals: {
        Row: {
          id: string
          user_id: string
          sport: string
          name: string
          target: string | null
          target_date: string | null
          distance_km: number | null
          duration_s: number | null
          linked_race_id: string | null
          done: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          sport: string
          name: string
          target?: string | null
          target_date?: string | null
          distance_km?: number | null
          duration_s?: number | null
          linked_race_id?: string | null
          done?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sport?: string
          name?: string
          target?: string | null
          target_date?: string | null
          distance_km?: number | null
          duration_s?: number | null
          linked_race_id?: string | null
          done?: boolean
          created_at?: string
        }
      }
      sport_races: {
        Row: {
          id: string
          user_id: string
          sport: string
          name: string
          race_date: string
          location: string | null
          distance: string | null
          goal_time: string | null
          registered: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          sport: string
          name: string
          race_date: string
          location?: string | null
          distance?: string | null
          goal_time?: string | null
          registered?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sport?: string
          name?: string
          race_date?: string
          location?: string | null
          distance?: string | null
          goal_time?: string | null
          registered?: boolean
          created_at?: string
        }
      }
      sport_shopping: {
        Row: {
          id: string
          user_id: string
          sport: string
          name: string
          done: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          sport: string
          name: string
          done?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sport?: string
          name?: string
          done?: boolean
          created_at?: string
        }
      }
      studies: {
        Row: {
          id: string
          user_id: string
          name: string
          meta: string | null
          progress: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          meta?: string | null
          progress?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          meta?: string | null
          progress?: number
          status?: string
          created_at?: string
        }
      }
      study_files: {
        Row: {
          id: string
          user_id: string
          study_id: string | null
          name: string
          kind: string | null
          source: string | null
          external_url: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          study_id?: string | null
          name: string
          kind?: string | null
          source?: string | null
          external_url?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          study_id?: string | null
          name?: string
          kind?: string | null
          source?: string | null
          external_url?: string | null
          updated_at?: string
        }
      }
      vault_items: {
        Row: {
          id: string
          user_id: string
          service: string
          username: string | null
          password_cipher: string
          password_iv: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          service: string
          username?: string | null
          password_cipher: string
          password_iv: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          service?: string
          username?: string | null
          password_cipher?: string
          password_iv?: string
          created_at?: string
        }
      }
      runs: {
        Row: {
          id: string
          user_id: string
          kind: string
          distance_m: number
          duration_s: number
          pace_label: string | null
          run_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          kind?: string
          distance_m: number
          duration_s: number
          pace_label?: string | null
          run_date?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kind?: string
          distance_m?: number
          duration_s?: number
          pace_label?: string | null
          run_date?: string
          notes?: string | null
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          starts_at: string
          ends_at: string | null
          category: string
          source: string
          external_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          title: string
          description?: string | null
          starts_at: string
          ends_at?: string | null
          category?: string
          source?: string
          external_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          starts_at?: string
          ends_at?: string | null
          category?: string
          source?: string
          external_id?: string | null
          created_at?: string
        }
      }
      integrations: {
        Row: {
          id: string
          user_id: string
          provider: string
          connected: boolean
          access_token_cipher: string | null
          refresh_token_cipher: string | null
          meta: Json
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          provider: string
          connected?: boolean
          access_token_cipher?: string | null
          refresh_token_cipher?: string | null
          meta?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          connected?: boolean
          access_token_cipher?: string | null
          refresh_token_cipher?: string | null
          meta?: Json
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
