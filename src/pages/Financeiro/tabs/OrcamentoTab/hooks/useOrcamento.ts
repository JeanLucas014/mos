import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { FinAno, FinCategoria } from '../../../types'
import type {
  OrcamentoConfig, OrcamentoGrupo, OrcamentoEntrada, OrcamentoMesOverride,
  OverrideTipoReferencia, MetaGuardarTipo, OrcamentoGrupoTipo,
} from '../types'

function pad2(n: number) { return String(n).padStart(2, '0') }
export function mesRefStr(ano: number, month: number): string {
  return `${ano}-${pad2(month)}-01`
}
function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

const DEFAULT_CONFIG: Omit<OrcamentoConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  meta_guardar_tipo: 'percentual',
  meta_guardar_valor: 0,
}

export function useOrcamento(ano: FinAno, month: number) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const mesRef = mesRefStr(ano.ano, month)

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

  const overridesQuery = useQuery({
    queryKey: ['orcamento_overrides', mesRef],
    queryFn: async () => {
      const { data, error } = await supabase.from('orcamento_mes_overrides').select('*').eq('mes_ref', mesRef)
      if (error) throw error
      return (data ?? []) as OrcamentoMesOverride[]
    },
  })

  // Categorias de "gasto" — saida (aba Mês) E diario (aba Diário). Filtrar
  // só 'saida' aqui escondia do seletor de vínculo do orçamento toda
  // categoria usada exclusivamente no Diário (natureza='diario'), que são
  // exatamente as categorias de gasto variável do dia a dia.
  const categoriasQuery = useQuery({
    queryKey: ['fin_categorias_gasto'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fin_categorias').select('*').in('natureza', ['saida', 'diario']).order('nome')
      if (error) throw error
      return (data ?? []) as FinCategoria[]
    },
  })

  const realizadoQuery = useQuery({
    queryKey: ['orcamento_realizado', mesRef],
    queryFn: async () => {
      const lastDay = daysInMonth(ano.ano, month)
      const startDate = `${ano.ano}-${pad2(month)}-01`
      const endDate = `${ano.ano}-${pad2(month)}-${pad2(lastDay)}`
      const { data, error } = await supabase
        .from('fin_lancamentos')
        .select('categoria_id, natureza, valor, is_grupo')
        .eq('ano_id', ano.id)
        .gte('data', startDate)
        .lte('data', endDate)
      if (error) throw error

      // Gotcha já conhecido do projeto: dados importados do Notion têm
      // is_grupo=null, então filtra !r.is_grupo em JS (não .eq no banco).
      // 'saida' (aba Mês) E 'diario' (aba Diário) contam como realizado —
      // mesmo motivo do fix acima: excluir 'diario' aqui zerava o
      // realizado de qualquer grupo vinculado a categoria do Diário.
      const byCategoria: Record<string, number> = {}
      let entradasReais = 0
      let saidasReais = 0
      for (const r of (data ?? []) as { categoria_id: string | null; natureza: string; valor: number | null; is_grupo: boolean | null }[]) {
        if (r.is_grupo) continue
        const v = Number(r.valor) || 0

        if (r.natureza === 'entrada') entradasReais += v
        if (r.natureza === 'saida') saidasReais += v

        if ((r.natureza !== 'saida' && r.natureza !== 'diario') || !r.categoria_id) continue
        byCategoria[r.categoria_id] = (byCategoria[r.categoria_id] ?? 0) + v
      }
      return { byCategoria, entradasReais, saidasReais }
    },
  })

  // ── Overrides: valor específico do mês ──────────────────────────
  function overrideFor(tipo: OverrideTipoReferencia, referenciaId: string | null): OrcamentoMesOverride | undefined {
    return (overridesQuery.data ?? []).find(o =>
      o.tipo_referencia === tipo && o.referencia_id === referenciaId,
    )
  }

  const setOverride = useMutation({
    mutationFn: async ({ tipo, referenciaId, valor }: { tipo: OverrideTipoReferencia; referenciaId: string | null; valor: number }) => {
      const existing = overrideFor(tipo, referenciaId)
      if (existing) {
        const { error } = await supabase.from('orcamento_mes_overrides')
          .update({ valor_override: valor }).eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('orcamento_mes_overrides').insert({
          mes_ref: mesRef, tipo_referencia: tipo, referencia_id: referenciaId, valor_override: valor,
        })
        if (error) throw error
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['orcamento_overrides', mesRef] }),
  })

  const removeOverride = useMutation({
    mutationFn: async ({ tipo, referenciaId }: { tipo: OverrideTipoReferencia; referenciaId: string | null }) => {
      const existing = overrideFor(tipo, referenciaId)
      if (!existing) return
      const { error } = await supabase.from('orcamento_mes_overrides').delete().eq('id', existing.id)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['orcamento_overrides', mesRef] }),
  })

  // ── Grupos (modelo) ──────────────────────────────────────────────
  const addGrupo = useMutation({
    mutationFn: async (g: { nome: string; tipo: OrcamentoGrupoTipo; valorPrevistoPadrao: number; categoriasVinculadas: string[] }) => {
      const ordem = (gruposQuery.data ?? []).length
      const { error } = await supabase.from('orcamento_grupos').insert({
        nome: g.nome, tipo: g.tipo, valor_previsto_padrao: g.valorPrevistoPadrao,
        categorias_vinculadas: g.categoriasVinculadas, ordem,
      })
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['orcamento_grupos'] }),
  })

  const updateGrupo = useMutation({
    mutationFn: async ({ id, ...fields }: { id: string; nome?: string; tipo?: OrcamentoGrupoTipo; valorPrevistoPadrao?: number; categoriasVinculadas?: string[] }) => {
      const { error } = await supabase.from('orcamento_grupos').update({
        ...(fields.nome !== undefined ? { nome: fields.nome } : {}),
        ...(fields.tipo !== undefined ? { tipo: fields.tipo } : {}),
        ...(fields.valorPrevistoPadrao !== undefined ? { valor_previsto_padrao: fields.valorPrevistoPadrao } : {}),
        ...(fields.categoriasVinculadas !== undefined ? { categorias_vinculadas: fields.categoriasVinculadas } : {}),
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

  // ── Entradas (modelo) ────────────────────────────────────────────
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

  // ── Config (meta de guardar) ─────────────────────────────────────
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

  // ── Valores derivados (previsto/realizado considerando overrides) ─
  const config = configQuery.data ?? { ...DEFAULT_CONFIG, id: '', user_id: user?.id ?? '', created_at: '', updated_at: '' }
  const grupos = gruposQuery.data ?? []
  const entradas = entradasQuery.data ?? []
  const realizadoPorCategoria = realizadoQuery.data?.byCategoria ?? {}
  const entradasReais = realizadoQuery.data?.entradasReais ?? 0
  const saidasReais = realizadoQuery.data?.saidasReais ?? 0

  function previstoGrupo(g: OrcamentoGrupo): number {
    const ov = overrideFor('grupo', g.id)
    return ov ? Number(ov.valor_override) : Number(g.valor_previsto_padrao)
  }

  function realizadoGrupo(g: OrcamentoGrupo): number {
    return g.categorias_vinculadas.reduce((s, catId) => s + (realizadoPorCategoria[catId] ?? 0), 0)
  }

  function previstoEntrada(e: OrcamentoEntrada): number {
    const ov = overrideFor('entrada', e.id)
    return ov ? Number(ov.valor_override) : Number(e.valor_previsto_padrao)
  }

  const entradasPrevistas = entradas.reduce((s, e) => s + previstoEntrada(e), 0)

  const metaGuardarOverride = overrideFor('meta_guardar', null)
  const metaGuardarValor = metaGuardarOverride ? Number(metaGuardarOverride.valor_override) : Number(config.meta_guardar_valor)
  // Percentual incide sobre as entradas REAIS do mês (o que de fato entrou),
  // não sobre as previstas — mantém consistência com o card Resultado, que
  // também parte das entradas reais.
  const guardarMes = config.meta_guardar_tipo === 'percentual'
    ? entradasReais * (metaGuardarValor / 100)
    : metaGuardarValor

  // Resultado = entradas reais - meta de guardar do mês - saídas reais
  // (fin_lancamentos natureza='saida', TODAS — não só as vinculadas a
  // algum grupo de orçamento).
  const resultadoMes = entradasReais - guardarMes - saidasReais

  const isLoading = configQuery.isLoading || gruposQuery.isLoading || entradasQuery.isLoading
    || overridesQuery.isLoading || categoriasQuery.isLoading || realizadoQuery.isLoading

  return {
    isLoading,
    mesRef,
    config,
    grupos,
    entradas,
    categoriasGasto: categoriasQuery.data ?? [],
    entradasPrevistas,
    entradasReais,
    saidasReais,
    guardarMes,
    resultadoMes,
    metaGuardarValor,
    isMetaGuardarAjustada: !!metaGuardarOverride,
    previstoGrupo,
    realizadoGrupo,
    previstoEntrada,
    isGrupoAjustado: (id: string) => !!overrideFor('grupo', id),
    isEntradaAjustada: (id: string) => !!overrideFor('entrada', id),
    setOverride,
    removeOverride,
    addGrupo,
    updateGrupo,
    deleteGrupo,
    addEntrada,
    updateEntrada,
    deleteEntrada,
    saveConfig,
  }
}
