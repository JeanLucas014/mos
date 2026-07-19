import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { todayLocal } from '@/lib/dates'
import type { FinCategoria } from '../../../types'
import type {
  OrcamentoConfig, OrcamentoGrupo, OrcamentoEntrada,
  MetaGuardarTipo, OrcamentoGrupoTipo, OrcamentoGrupoModo,
} from '../types'

function pad2(n: number) { return String(n).padStart(2, '0') }
function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

const DEFAULT_CONFIG: Omit<OrcamentoConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  meta_guardar_tipo: 'percentual',
  meta_guardar_valor: 0,
}

interface LancRow {
  categoria_id: string | null
  natureza: string
  valor: number | null
  is_grupo: boolean | null
}

/**
 * Orçamento é um PLANO ÚNICO, sempre vigente — não existe "orçamento de
 * julho" vs "de agosto". Os valores previstos (entradas, grupos, meta de
 * investimento) são editáveis a qualquer momento, sem histórico por mês
 * nem overrides mensais. A única coisa que muda com o calendário é o
 * "realizado" dos grupos vinculados a categoria, que é sempre recalculado
 * a partir dos lançamentos do MÊS CORRENTE (todayLocal()) — vira o mês,
 * o realizado reseta sozinho sem precisar de nenhuma ação manual.
 */
export function useOrcamento() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const configQuery = useQuery({
    queryKey: ['orcamento_config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orcamento_config').select('*').maybeSingle()
      if (error) throw error
      return data as OrcamentoConfig | null
    },
  })

  const gruposQuery = useQuery({
    queryKey: ['orcamento_grupos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orcamento_grupos').select('*').order('ordem')
      if (error) throw error
      return (data ?? []) as OrcamentoGrupo[]
    },
  })

  const entradasQuery = useQuery({
    queryKey: ['orcamento_entradas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orcamento_entradas').select('*').order('ordem')
      if (error) throw error
      return (data ?? []) as OrcamentoEntrada[]
    },
  })

  // Categorias de "gasto" — saida (aba Mês) E diario (aba Diário).
  const categoriasQuery = useQuery({
    queryKey: ['fin_categorias_gasto'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fin_categorias').select('*').in('natureza', ['saida', 'diario']).order('nome')
      if (error) throw error
      return (data ?? []) as FinCategoria[]
    },
  })

  // Sem parâmetro de mês na queryKey de propósito: "realizado" é sempre
  // o mês corrente no momento em que a query roda. Uma invalidação (ex:
  // Realtime em fin_lancamentos) sempre refaz o cálculo pro mês atual,
  // qualquer que ele seja no momento — nunca fica "preso" num mês antigo.
  const realizadoQuery = useQuery({
    queryKey: ['orcamento_realizado'],
    queryFn: async () => {
      const todayStr = todayLocal() // nunca toISOString().slice(0,10)
      const [yearStr, monthStr] = todayStr.split('-')
      const year = Number(yearStr)
      const month = Number(monthStr)
      const lastDay = daysInMonth(year, month)
      const startDate = `${year}-${pad2(month)}-01`
      const endDate = `${year}-${pad2(month)}-${pad2(lastDay)}`

      // Sem filtro de ano_id de propósito — o Orçamento não é mais
      // vinculado a um "ano" selecionado em outra aba; o intervalo de
      // datas do mês corrente já é suficiente (RLS cuida do escopo por
      // usuário).
      const { data, error } = await supabase
        .from('fin_lancamentos')
        .select('categoria_id, natureza, valor, is_grupo')
        .gte('data', startDate)
        .lte('data', endDate)
      if (error) throw error

      const rows = (data ?? []) as LancRow[]

      // byCategoria (realizado por grupo em modo 'categoria'): soma
      // direta por categoria_id de cada FOLHA. Gotcha já conhecido do
      // projeto: dados importados do Notion têm is_grupo=null, então
      // filtra !r.is_grupo em JS (não .eq no banco). 'saida' E 'diario'
      // contam como realizado — exclui só 'entrada'.
      const byCategoria: Record<string, number> = {}
      for (const r of rows) {
        if (r.is_grupo) continue
        if ((r.natureza !== 'saida' && r.natureza !== 'diario') || !r.categoria_id) continue
        byCategoria[r.categoria_id] = (byCategoria[r.categoria_id] ?? 0) + (Number(r.valor) || 0)
      }

      return { byCategoria }
    },
  })

  // ── Grupos (plano único) ──────────────────────────────────────────
  const addGrupo = useMutation({
    mutationFn: async (g: { nome: string; tipo: OrcamentoGrupoTipo; modo: OrcamentoGrupoModo; valorPrevistoPadrao: number; categoriasVinculadas: string[] }) => {
      const ordem = (gruposQuery.data ?? []).length
      const { error } = await supabase.from('orcamento_grupos').insert({
        nome: g.nome, tipo: g.tipo, modo: g.modo, valor_previsto_padrao: g.valorPrevistoPadrao,
        categorias_vinculadas: g.modo === 'categoria' ? g.categoriasVinculadas : [], ordem,
      })
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['orcamento_grupos'] }),
  })

  const updateGrupo = useMutation({
    mutationFn: async ({ id, ...fields }: { id: string; nome?: string; tipo?: OrcamentoGrupoTipo; modo?: OrcamentoGrupoModo; valorPrevistoPadrao?: number; categoriasVinculadas?: string[] }) => {
      const { error } = await supabase.from('orcamento_grupos').update({
        ...(fields.nome !== undefined ? { nome: fields.nome } : {}),
        ...(fields.tipo !== undefined ? { tipo: fields.tipo } : {}),
        ...(fields.modo !== undefined ? { modo: fields.modo } : {}),
        ...(fields.valorPrevistoPadrao !== undefined ? { valor_previsto_padrao: fields.valorPrevistoPadrao } : {}),
        ...(fields.categoriasVinculadas !== undefined
          ? { categorias_vinculadas: fields.modo === 'manual' ? [] : fields.categoriasVinculadas }
          : {}),
      }).eq('id', id)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['orcamento_grupos'] }),
  })

  const deleteGrupo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('orcamento_grupos').delete().eq('id', id)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['orcamento_grupos'] }),
  })

  // ── Entradas (plano único) ────────────────────────────────────────
  const addEntrada = useMutation({
    mutationFn: async (e: { nome: string; valorPrevistoPadrao: number }) => {
      const ordem = (entradasQuery.data ?? []).length
      const { error } = await supabase.from('orcamento_entradas').insert({
        nome: e.nome, valor_previsto_padrao: e.valorPrevistoPadrao, ordem,
      })
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['orcamento_entradas'] }),
  })

  const updateEntrada = useMutation({
    mutationFn: async ({ id, ...fields }: { id: string; nome?: string; valorPrevistoPadrao?: number }) => {
      const { error } = await supabase.from('orcamento_entradas').update({
        ...(fields.nome !== undefined ? { nome: fields.nome } : {}),
        ...(fields.valorPrevistoPadrao !== undefined ? { valor_previsto_padrao: fields.valorPrevistoPadrao } : {}),
      }).eq('id', id)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['orcamento_entradas'] }),
  })

  const deleteEntrada = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('orcamento_entradas').delete().eq('id', id)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['orcamento_entradas'] }),
  })

  // ── Config (meta de investimento) ─────────────────────────────────
  const saveConfig = useMutation({
    mutationFn: async (c: { tipo: MetaGuardarTipo; valor: number }) => {
      const existing = configQuery.data
      if (existing) {
        const { error } = await supabase.from('orcamento_config')
          .update({ meta_guardar_tipo: c.tipo, meta_guardar_valor: c.valor, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('orcamento_config').insert({
          meta_guardar_tipo: c.tipo, meta_guardar_valor: c.valor,
        })
        if (error) throw error
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['orcamento_config'] }),
  })

  // ── Valores derivados ──────────────────────────────────────────────
  const config = configQuery.data ?? { ...DEFAULT_CONFIG, id: '', user_id: user?.id ?? '', created_at: '', updated_at: '' }
  const grupos = gruposQuery.data ?? []
  const entradas = entradasQuery.data ?? []
  const realizadoPorCategoria = realizadoQuery.data?.byCategoria ?? {}

  function previstoGrupo(g: OrcamentoGrupo): number {
    return Number(g.valor_previsto_padrao)
  }

  /** Só significa algo pra grupos em modo 'categoria'. Modo 'manual' não
   * tem realizado de verdade — ver GrupoRow (sem barra de progresso). */
  function realizadoGrupo(g: OrcamentoGrupo): number {
    return g.categorias_vinculadas.reduce((s, catId) => s + (realizadoPorCategoria[catId] ?? 0), 0)
  }

  const entradasPrevistas = entradas.reduce((s, e) => s + Number(e.valor_previsto_padrao), 0)

  const metaGuardarValor = Number(config.meta_guardar_valor)
  const guardarMes = config.meta_guardar_tipo === 'percentual'
    ? entradasPrevistas * (metaGuardarValor / 100)
    : metaGuardarValor

  // Resultado = entradas previstas - investimento - "saídas do plano":
  // soma de todos os grupos, usando realizado (modo categoria, mês
  // corrente) ou previsto (modo manual, já que não existe realizado
  // nesse modo) — inteiramente baseado no orçamento em si, não mais
  // misturado com fin_lancamentos "cru" (só indiretamente, via realizado
  // dos grupos vinculados).
  const saidasPlano = grupos.reduce((s, g) => {
    const valor = g.modo === 'categoria' ? realizadoGrupo(g) : previstoGrupo(g)
    return s + valor
  }, 0)
  const resultadoMes = entradasPrevistas - guardarMes - saidasPlano

  const isLoading = configQuery.isLoading || gruposQuery.isLoading || entradasQuery.isLoading
    || categoriasQuery.isLoading || realizadoQuery.isLoading

  return {
    isLoading,
    config,
    grupos,
    entradas,
    categoriasGasto: categoriasQuery.data ?? [],
    entradasPrevistas,
    guardarMes,
    resultadoMes,
    metaGuardarValor,
    previstoGrupo,
    realizadoGrupo,
    addGrupo,
    updateGrupo,
    deleteGrupo,
    addEntrada,
    updateEntrada,
    deleteEntrada,
    saveConfig,
  }
}
