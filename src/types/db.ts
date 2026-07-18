export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      books: {
        Row: {
          author: string | null
          category: string | null
          cover_url: string | null
          created_at: string
          favorite: boolean
          finished_at: string | null
          format: string | null
          id: string
          pages_read: number | null
          progress: number | null
          rating: number | null
          started_at: string | null
          status: string
          title: string
          total_pages: number | null
          user_id: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          favorite?: boolean
          finished_at?: string | null
          format?: string | null
          id?: string
          pages_read?: number | null
          progress?: number | null
          rating?: number | null
          started_at?: string | null
          status?: string
          title: string
          total_pages?: number | null
          user_id?: string
        }
        Update: {
          author?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          favorite?: boolean
          finished_at?: string | null
          format?: string | null
          id?: string
          pages_read?: number | null
          progress?: number | null
          rating?: number | null
          started_at?: string | null
          status?: string
          title?: string
          total_pages?: number | null
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          color: string | null
          created_at: string | null
          description: string | null
          end_at: string
          id: string
          location: string | null
          recurrence_rule: string | null
          start_at: string
          tags: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_at: string
          id?: string
          location?: string | null
          recurrence_rule?: string | null
          start_at: string
          tags?: string[] | null
          title: string
          user_id?: string
        }
        Update: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_at?: string
          id?: string
          location?: string | null
          recurrence_rule?: string | null
          start_at?: string
          tags?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_rotinas: {
        Row: {
          ativa: boolean | null
          cor: string | null
          descricao: string | null
          dias_semana: string[]
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          ordem: number | null
          titulo: string
          user_id: string
        }
        Insert: {
          ativa?: boolean | null
          cor?: string | null
          descricao?: string | null
          dias_semana?: string[]
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          ordem?: number | null
          titulo: string
          user_id?: string
        }
        Update: {
          ativa?: boolean | null
          cor?: string | null
          descricao?: string | null
          dias_semana?: string[]
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          ordem?: number | null
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_tags: {
        Row: {
          color: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          id?: string
          name: string
          user_id?: string
        }
        Update: {
          color?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_rate_limits: {
        Row: {
          count: number
          user_id: string
          window_start: string
        }
        Insert: {
          count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      dismissed_notifications: {
        Row: {
          dismissed_at: string
          id: string
          notification_id: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string
          id?: string
          notification_id: string
          user_id: string
        }
        Update: {
          dismissed_at?: string
          id?: string
          notification_id?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          external_id: string | null
          id: string
          source: string | null
          starts_at: string
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          external_id?: string | null
          id?: string
          source?: string | null
          starts_at: string
          title: string
          user_id?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          external_id?: string | null
          id?: string
          source?: string | null
          starts_at?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      fin_anos: {
        Row: {
          ano: number
          created_at: string | null
          id: string
          saldo_inicial: number
          user_id: string
        }
        Insert: {
          ano: number
          created_at?: string | null
          id?: string
          saldo_inicial?: number
          user_id?: string
        }
        Update: {
          ano?: number
          created_at?: string | null
          id?: string
          saldo_inicial?: number
          user_id?: string
        }
        Relationships: []
      }
      fin_cartoes: {
        Row: {
          cor: string | null
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          cor?: string | null
          id?: string
          nome: string
          user_id?: string
        }
        Update: {
          cor?: string | null
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      fin_categorias: {
        Row: {
          cor: string | null
          id: string
          natureza: string
          nome: string
          ordem: number | null
          rapida: boolean | null
          user_id: string
        }
        Insert: {
          cor?: string | null
          id?: string
          natureza: string
          nome: string
          ordem?: number | null
          rapida?: boolean | null
          user_id?: string
        }
        Update: {
          cor?: string | null
          id?: string
          natureza?: string
          nome?: string
          ordem?: number | null
          rapida?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      fin_investimentos: {
        Row: {
          ativo: boolean | null
          cor: string | null
          criado_em: string | null
          data_atualizacao: string | null
          data_compra: string | null
          data_vencimento: string | null
          id: string
          indexador: string | null
          instituicao: string | null
          liquidez: string | null
          nome: string
          notas: string | null
          preco_medio: number | null
          quantidade: number | null
          subtipo: string | null
          taxa_adicional: number | null
          ticker: string | null
          tipo: string
          user_id: string
          valor_aplicado: number | null
          valor_atual: number | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          criado_em?: string | null
          data_atualizacao?: string | null
          data_compra?: string | null
          data_vencimento?: string | null
          id?: string
          indexador?: string | null
          instituicao?: string | null
          liquidez?: string | null
          nome: string
          notas?: string | null
          preco_medio?: number | null
          quantidade?: number | null
          subtipo?: string | null
          taxa_adicional?: number | null
          ticker?: string | null
          tipo: string
          user_id?: string
          valor_aplicado?: number | null
          valor_atual?: number | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          criado_em?: string | null
          data_atualizacao?: string | null
          data_compra?: string | null
          data_vencimento?: string | null
          id?: string
          indexador?: string | null
          instituicao?: string | null
          liquidez?: string | null
          nome?: string
          notas?: string | null
          preco_medio?: number | null
          quantidade?: number | null
          subtipo?: string | null
          taxa_adicional?: number | null
          ticker?: string | null
          tipo?: string
          user_id?: string
          valor_aplicado?: number | null
          valor_atual?: number | null
        }
        Relationships: []
      }
      fin_investimentos_movimentos: {
        Row: {
          criado_em: string | null
          data: string
          id: string
          investimento_id: string
          notas: string | null
          preco_unitario: number | null
          quantidade: number | null
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          criado_em?: string | null
          data: string
          id?: string
          investimento_id: string
          notas?: string | null
          preco_unitario?: number | null
          quantidade?: number | null
          tipo: string
          user_id?: string
          valor: number
        }
        Update: {
          criado_em?: string | null
          data?: string
          id?: string
          investimento_id?: string
          notas?: string | null
          preco_unitario?: number | null
          quantidade?: number | null
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_investimentos_movimentos_investimento_id_fkey"
            columns: ["investimento_id"]
            isOneToOne: false
            referencedRelation: "fin_investimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_lancamentos: {
        Row: {
          ano_id: string
          cartao_id: string | null
          categoria_id: string | null
          created_at: string | null
          data: string
          id: string
          is_grupo: boolean | null
          is_previsao: boolean | null
          natureza: string
          nome: string
          ordem: number | null
          pago: boolean | null
          parent_id: string | null
          pluggy_tx_id: string | null
          saida_tipo: string | null
          user_id: string
          valor: number | null
        }
        Insert: {
          ano_id: string
          cartao_id?: string | null
          categoria_id?: string | null
          created_at?: string | null
          data: string
          id?: string
          is_grupo?: boolean | null
          is_previsao?: boolean | null
          natureza: string
          nome: string
          ordem?: number | null
          pago?: boolean | null
          parent_id?: string | null
          pluggy_tx_id?: string | null
          saida_tipo?: string | null
          user_id?: string
          valor?: number | null
        }
        Update: {
          ano_id?: string
          cartao_id?: string | null
          categoria_id?: string | null
          created_at?: string | null
          data?: string
          id?: string
          is_grupo?: boolean | null
          is_previsao?: boolean | null
          natureza?: string
          nome?: string
          ordem?: number | null
          pago?: boolean | null
          parent_id?: string | null
          pluggy_tx_id?: string | null
          saida_tipo?: string | null
          user_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_lancamentos_ano_id_fkey"
            columns: ["ano_id"]
            isOneToOne: false
            referencedRelation: "fin_anos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_lancamentos_cartao_id_fkey"
            columns: ["cartao_id"]
            isOneToOne: false
            referencedRelation: "fin_cartoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_lancamentos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "fin_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_lancamentos_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "fin_lancamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_metas: {
        Row: {
          alvo: number
          atual: number
          id: string
          nome: string
          ordem: number | null
          user_id: string
        }
        Insert: {
          alvo: number
          atual?: number
          id?: string
          nome: string
          ordem?: number | null
          user_id?: string
        }
        Update: {
          alvo?: number
          atual?: number
          id?: string
          nome?: string
          ordem?: number | null
          user_id?: string
        }
        Relationships: []
      }
      fin_previsao_config: {
        Row: {
          id: string
          nome: string
          ordem: number | null
          user_id: string
          valor: number
        }
        Insert: {
          id?: string
          nome: string
          ordem?: number | null
          user_id?: string
          valor?: number
        }
        Update: {
          id?: string
          nome?: string
          ordem?: number | null
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      fin_recorrentes: {
        Row: {
          ativo: boolean | null
          categoria_id: string | null
          dia_previsto: number
          id: string
          natureza: string
          nome: string
          saida_tipo: string | null
          user_id: string
          valor: number
        }
        Insert: {
          ativo?: boolean | null
          categoria_id?: string | null
          dia_previsto: number
          id?: string
          natureza?: string
          nome: string
          saida_tipo?: string | null
          user_id?: string
          valor?: number
        }
        Update: {
          ativo?: boolean | null
          categoria_id?: string | null
          dia_previsto?: number
          id?: string
          natureza?: string
          nome?: string
          saida_tipo?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_recorrentes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "fin_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_taxas_economicas: {
        Row: {
          atualizado_em: string | null
          data_referencia: string | null
          indicador: string
          valor_anual: number | null
          valor_mensal: number | null
        }
        Insert: {
          atualizado_em?: string | null
          data_referencia?: string | null
          indicador: string
          valor_anual?: number | null
          valor_mensal?: number | null
        }
        Update: {
          atualizado_em?: string | null
          data_referencia?: string | null
          indicador?: string
          valor_anual?: number | null
          valor_mensal?: number | null
        }
        Relationships: []
      }
      goal_items: {
        Row: {
          created_at: string
          done: boolean
          goal_id: string
          id: string
          position: number | null
          text: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          goal_id: string
          id?: string
          position?: number | null
          text?: string | null
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          done?: boolean
          goal_id?: string
          id?: string
          position?: number | null
          text?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_items_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          area: string | null
          created_at: string
          id: string
          label: string | null
          name: string
          progress: number
          user_id: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          id?: string
          label?: string | null
          name: string
          progress?: number
          user_id?: string
        }
        Update: {
          area?: string | null
          created_at?: string
          id?: string
          label?: string | null
          name?: string
          progress?: number
          user_id?: string
        }
        Relationships: []
      }
      habit_exceptions: {
        Row: {
          exception_date: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          exception_date: string
          habit_id: string
          id?: string
          user_id?: string
        }
        Update: {
          exception_date?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_exceptions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          habit_id: string
          id: string
          log_date: string
          user_id: string
        }
        Insert: {
          habit_id: string
          id?: string
          log_date: string
          user_id?: string
        }
        Update: {
          habit_id?: string
          id?: string
          log_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          access_token_cipher: string | null
          connected: boolean
          id: string
          meta: Json | null
          provider: string
          refresh_token_cipher: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_cipher?: string | null
          connected?: boolean
          id?: string
          meta?: Json | null
          provider: string
          refresh_token_cipher?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          access_token_cipher?: string | null
          connected?: boolean
          id?: string
          meta?: Json | null
          provider?: string
          refresh_token_cipher?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_cents: number
          client: string
          created_at: string
          due_date: string | null
          id: string
          service: string
          status: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          client: string
          created_at?: string
          due_date?: string | null
          id?: string
          service: string
          status?: string
          user_id?: string
        }
        Update: {
          amount_cents?: number
          client?: string
          created_at?: string
          due_date?: string | null
          id?: string
          service?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      moto_revenue: {
        Row: {
          amount_cents: number
          category: string | null
          created_at: string
          description: string
          id: string
          kind: string
          notes: string | null
          revenue_date: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          kind?: string
          notes?: string | null
          revenue_date: string
          user_id?: string
        }
        Update: {
          amount_cents?: number
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          kind?: string
          notes?: string | null
          revenue_date?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          body: string | null
          body_json: Json | null
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          body_json?: Json | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          body?: string | null
          body_json?: Json | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pluggy_connections: {
        Row: {
          account_id: string | null
          account_type: string
          bank_name: string
          created_at: string | null
          id: string
          item_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          account_type: string
          bank_name: string
          created_at?: string | null
          id?: string
          item_id: string
          status?: string | null
          user_id?: string
        }
        Update: {
          account_id?: string | null
          account_type?: string
          bank_name?: string
          created_at?: string | null
          id?: string
          item_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          id: string
          marathon_goal: string | null
          name: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id: string
          marathon_goal?: string | null
          name?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          marathon_goal?: string | null
          name?: string
        }
        Relationships: []
      }
      project_checklist: {
        Row: {
          created_at: string
          done: boolean
          id: string
          position: number | null
          project_id: string
          text: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          position?: number | null
          project_id: string
          text?: string | null
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          position?: number | null
          project_id?: string
          text?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_checklist_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          delivered: boolean
          id: string
          meta: string | null
          name: string
          notes: string | null
          progress: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivered?: boolean
          id?: string
          meta?: string | null
          name: string
          notes?: string | null
          progress?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          delivered?: boolean
          id?: string
          meta?: string | null
          name?: string
          notes?: string | null
          progress?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      runs: {
        Row: {
          created_at: string
          distance_m: number
          duration_s: number
          id: string
          kind: string
          notes: string | null
          pace_label: string | null
          run_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          distance_m: number
          duration_s: number
          id?: string
          kind?: string
          notes?: string | null
          pace_label?: string | null
          run_date?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          distance_m?: number
          duration_s?: number
          id?: string
          kind?: string
          notes?: string | null
          pace_label?: string | null
          run_date?: string
          user_id?: string
        }
        Relationships: []
      }
      shopping_items: {
        Row: {
          category: string
          created_at: string
          done: boolean
          id: string
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          done?: boolean
          id?: string
          title: string
          user_id?: string
        }
        Update: {
          category?: string
          created_at?: string
          done?: boolean
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      sport_goals: {
        Row: {
          created_at: string
          distance_km: number | null
          done: boolean
          duration_s: number | null
          id: string
          linked_race_id: string | null
          name: string
          sport: string
          target: string | null
          target_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          distance_km?: number | null
          done?: boolean
          duration_s?: number | null
          id?: string
          linked_race_id?: string | null
          name: string
          sport?: string
          target?: string | null
          target_date?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          distance_km?: number | null
          done?: boolean
          duration_s?: number | null
          id?: string
          linked_race_id?: string | null
          name?: string
          sport?: string
          target?: string | null
          target_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sport_goals_linked_race_id_fkey"
            columns: ["linked_race_id"]
            isOneToOne: false
            referencedRelation: "sport_races"
            referencedColumns: ["id"]
          },
        ]
      }
      sport_races: {
        Row: {
          created_at: string
          distance: string | null
          goal_time: string | null
          id: string
          location: string | null
          name: string
          race_date: string
          registered: boolean
          sport: string
          user_id: string
        }
        Insert: {
          created_at?: string
          distance?: string | null
          goal_time?: string | null
          id?: string
          location?: string | null
          name: string
          race_date: string
          registered?: boolean
          sport?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          distance?: string | null
          goal_time?: string | null
          id?: string
          location?: string | null
          name?: string
          race_date?: string
          registered?: boolean
          sport?: string
          user_id?: string
        }
        Relationships: []
      }
      sport_shopping: {
        Row: {
          created_at: string
          done: boolean
          id: string
          sport: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          sport?: string
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          sport?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      sports: {
        Row: {
          created_at: string
          distance_m: number | null
          duration_s: number
          external_id: string | null
          id: string
          kind: string
          notes: string | null
          pace_label: string | null
          sport: string
          sport_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          distance_m?: number | null
          duration_s: number
          external_id?: string | null
          id?: string
          kind?: string
          notes?: string | null
          pace_label?: string | null
          sport?: string
          sport_date?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          distance_m?: number | null
          duration_s?: number
          external_id?: string | null
          id?: string
          kind?: string
          notes?: string | null
          pace_label?: string | null
          sport?: string
          sport_date?: string
          user_id?: string
        }
        Relationships: []
      }
      studies: {
        Row: {
          created_at: string
          id: string
          meta: string | null
          name: string
          progress: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta?: string | null
          name: string
          progress?: number | null
          status?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          meta?: string | null
          name?: string
          progress?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_files: {
        Row: {
          external_url: string | null
          id: string
          kind: string | null
          name: string
          source: string | null
          study_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          external_url?: string | null
          id?: string
          kind?: string | null
          name: string
          source?: string | null
          study_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          external_url?: string | null
          id?: string
          kind?: string | null
          name?: string
          source?: string | null
          study_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_files_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      system_files: {
        Row: {
          created_at: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_download: boolean | null
          mime_type: string | null
          name: string
          system_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_download?: boolean | null
          mime_type?: string | null
          name: string
          system_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_download?: boolean | null
          mime_type?: string | null
          name?: string
          system_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_files_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      systems: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          stack: string | null
          status: string | null
          tech_stack: string[] | null
          thumbnail_url: string | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          stack?: string | null
          status?: string | null
          tech_stack?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          stack?: string | null
          status?: string | null
          tech_stack?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          task_id: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_projects: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          ordem: number | null
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          name: string
          ordem?: number | null
          user_id?: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          ordem?: number | null
          user_id?: string
        }
        Relationships: []
      }
      task_recurrence: {
        Row: {
          days_of_week: string[] | null
          end_date: string | null
          freq: string
          id: string
          interval_n: number
          next_due: string
          task_id: string
        }
        Insert: {
          days_of_week?: string[] | null
          end_date?: string | null
          freq: string
          id?: string
          interval_n?: number
          next_due: string
          task_id: string
        }
        Update: {
          days_of_week?: string[] | null
          end_date?: string | null
          freq?: string
          id?: string
          interval_n?: number
          next_due?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_recurrence_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          id: string
          ordem: number | null
          parent_id: string | null
          priority: number
          project_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          ordem?: number | null
          parent_id?: string | null
          priority?: number
          project_id?: string | null
          title: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          ordem?: number | null
          parent_id?: string | null
          priority?: number
          project_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "task_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_cents: number
          category: string | null
          created_at: string
          description: string
          id: string
          kind: string
          occurred_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          category?: string | null
          created_at?: string
          description: string
          id?: string
          kind?: string
          occurred_at?: string
          user_id?: string
        }
        Update: {
          amount_cents?: number
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          kind?: string
          occurred_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          enabled_modules: string[]
          is_admin: boolean
          notification_prefs: Json | null
          onboarding_completed: boolean
          theme: string | null
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string | null
          enabled_modules?: string[]
          is_admin?: boolean
          notification_prefs?: Json | null
          onboarding_completed?: boolean
          theme?: string | null
          user_id?: string
          week_start?: string
        }
        Update: {
          created_at?: string | null
          enabled_modules?: string[]
          is_admin?: boolean
          notification_prefs?: Json | null
          onboarding_completed?: boolean
          theme?: string | null
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      user_sports: {
        Row: {
          id: string
          key: string
          label: string
          ordem: number | null
          user_id: string
        }
        Insert: {
          id?: string
          key: string
          label: string
          ordem?: number | null
          user_id?: string
        }
        Update: {
          id?: string
          key?: string
          label?: string
          ordem?: number | null
          user_id?: string
        }
        Relationships: []
      }
      vault_items: {
        Row: {
          created_at: string
          id: string
          kind: string
          password_cipher: string
          password_iv: string
          service: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          password_cipher: string
          password_iv: string
          service: string
          user_id?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          password_cipher?: string
          password_iv?: string
          service?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
