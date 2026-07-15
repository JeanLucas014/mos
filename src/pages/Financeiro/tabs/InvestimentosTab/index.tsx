import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Plus, RefreshCw, TrendingUp, TrendingDown,
  ChevronDown, ChevronRight, Trash2, Pencil,
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { TipoInv, Investimento, Taxa, MainTab } from './types'
import { TIPO_CFG } from './types'
import {
  BRL, PCT, fmtDate, today,
  calcRentabilidadeRF, valorEstimadoRF, rentabilidadeVariavel, valorPosicao,
} from './utils'
import { InvestimentoModal } from './components/InvestimentoModal'
import { SimuladorTab } from './components/SimuladorTab'

// ─── InvestimentosTab ─────────────────────────────────────────────────────────

export function InvestimentosTab() {
  const [items, setItems]                     = useState<Investimento[]>([])
  const [taxas, setTaxas]                     = useState<Taxa[]>([])
  const [loading, setLoading]                 = useState(true)
  const [atualizandoTaxas, setAtualizandoTaxas] = useState(false)
  const [activeTab, setActiveTab]             = useState<MainTab>('carteira')
  const [editando, setEditando]               = useState<Partial<Investimento> | null>(null)
  const [collapsed, setCollapsed]             = useState<Set<string>>(new Set())

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: inv }, { data: tax }] = await Promise.all([
      (supabase.from('fin_investimentos') as any)
        .select('*')
        .eq('ativo', true)
        .order('criado_em'),
      (supabase.from('fin_taxas_economicas') as any).select('*'),
    ])
    setItems((inv ?? []) as Investimento[])
    setTaxas((tax ?? []) as Taxa[])
    setLoading(false)
  }

  const porTipo = useMemo(() => {
    const m: Record<string, number> = {}
    for (const inv of items) {
      const isRF = inv.tipo === 'renda_fixa' || inv.tipo === 'previdencia'
      const val = isRF ? valorEstimadoRF(inv, taxas) : valorPosicao(inv)
      m[inv.tipo] = (m[inv.tipo] ?? 0) + val
    }
    return m
  }, [items, taxas])

  const patrimonioTotal = Object.values(porTipo).reduce((a, b) => a + b, 0)
  const totalAplicado   = items.reduce((a, i) => a + (i.valor_aplicado ?? 0), 0)
  const rentTotal       =
    totalAplicado > 0 ? ((patrimonioTotal - totalAplicado) / totalAplicado) * 100 : 0

  async function atualizarTaxas() {
    setAtualizandoTaxas(true)
    try {
      const [selicR, cdiR, ipcaR] = await Promise.all([
        fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json').then(r => r.json()),
        fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4391/dados/ultimos/1?formato=json').then(r => r.json()),
        fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1?formato=json').then(r => r.json()),
      ]) as [{ valor: string; data: string }[], { valor: string; data: string }[], { valor: string; data: string }[]]

      const selicDiaria = parseFloat(selicR[0]?.valor ?? '0') / 100
      const cdiDiaria   = parseFloat(cdiR[0]?.valor  ?? '0') / 100
      const ipcaMensal  = parseFloat(ipcaR[0]?.valor ?? '0') / 100

      const selicAnual = (Math.pow(1 + selicDiaria, 252) - 1) * 100
      const cdiAnual   = (Math.pow(1 + cdiDiaria,   252) - 1) * 100
      const ipcaAnual  = (Math.pow(1 + ipcaMensal,  12)  - 1) * 100
      const poupanca   = selicAnual > 8.5 ? selicAnual * 0.70 : 6.17

      const updates = [
        { indicador: 'SELIC',    valor_anual: +selicAnual.toFixed(4), valor_mensal: +((Math.pow(1 + selicDiaria, 21) - 1) * 100).toFixed(6), data_referencia: selicR[0]?.data ?? today() },
        { indicador: 'CDI',      valor_anual: +cdiAnual.toFixed(4),   valor_mensal: +((Math.pow(1 + cdiDiaria,   21) - 1) * 100).toFixed(6), data_referencia: cdiR[0]?.data   ?? today() },
        { indicador: 'IPCA',     valor_anual: +ipcaAnual.toFixed(4),  valor_mensal: +(ipcaMensal * 100).toFixed(6),                           data_referencia: ipcaR[0]?.data  ?? today() },
        { indicador: 'POUPANCA', valor_anual: +poupanca.toFixed(4),   valor_mensal: +((Math.pow(1 + poupanca / 100, 1 / 12) - 1) * 100).toFixed(6), data_referencia: today() },
      ]
      for (const u of updates) {
        await (supabase.from('fin_taxas_economicas') as any).upsert(u, { onConflict: 'indicador' })
      }
      await load()
    } catch {
      alert('Erro ao buscar taxas do Banco Central. Verifique sua conexão.')
    }
    setAtualizandoTaxas(false)
  }

  function toggleCollapse(tipo: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(tipo) ? next.delete(tipo) : next.add(tipo)
      return next
    })
  }

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <div className="w-5 h-5 rounded-full border-2 border-[#0EA5E9] border-t-transparent animate-spin" />
      </div>
    )

  const pieData = Object.entries(porTipo).map(([tipo, val]) => ({
    name: TIPO_CFG[tipo as TipoInv]?.label ?? tipo,
    value: val,
    tipo,
  }))

  return (
    <div className="space-y-4 font-[Manrope]">
      {/* Sub-abas */}
      <div className="flex gap-1 border-b border-line mb-4">
        {([
          { id: 'carteira',  label: 'Carteira'  },
          { id: 'simulador', label: 'Simulador'  },
          { id: 'taxas',     label: 'Taxas'      },
        ] as { id: MainTab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap"
            style={{
              color: activeTab === t.id ? '#0EA5E9' : 'var(--text3)',
              borderColor: activeTab === t.id ? '#0EA5E9' : 'transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CARTEIRA ── */}
      {activeTab === 'carteira' && (
        <div className="space-y-5">
          {/* Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                label: 'Patrimônio total',
                value: BRL(patrimonioTotal),
                color: '#0EA5E9',
                sub: `${items.length} ativo${items.length !== 1 ? 's' : ''}`,
              },
              {
                label: 'Total aplicado',
                value: BRL(totalAplicado),
                color: '#22c55e',
                sub: 'Aportes acumulados',
              },
              {
                label: 'Rentabilidade',
                value: PCT(rentTotal),
                color: rentTotal >= 0 ? '#22c55e' : '#ef4444',
                sub: BRL(patrimonioTotal - totalAplicado) + ' em ganhos',
              },
            ].map((c, i) => (
              <div key={i} className="bg-bg-2 border border-line rounded-xl p-4">
                <div className="text-[11px] text-[#555] uppercase tracking-wider mb-1">{c.label}</div>
                <div
                  className="text-xl font-bold tabular-nums"
                  style={{ color: c.color, fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {c.value}
                </div>
                <div className="text-[11px] text-[#555] mt-1">{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Gráfico de alocação */}
          {pieData.length > 0 && (
            <div className="bg-bg-2 border border-line rounded-xl p-4">
              <div className="text-xs text-[#555] uppercase tracking-wider font-[Sora] mb-3">
                Alocação por classe
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={TIPO_CFG[entry.tipo as TipoInv]?.color ?? 'var(--text3)'}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => BRL(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5 w-full">
                  {Object.entries(porTipo)
                    .sort((a, b) => b[1] - a[1])
                    .map(([tipo, val]) => {
                      const c = TIPO_CFG[tipo as TipoInv]
                      const pct = patrimonioTotal > 0 ? (val / patrimonioTotal) * 100 : 0
                      return (
                        <div key={tipo} className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ background: c?.color }}
                          />
                          <span className="text-xs text-[#aaa] flex-1">{c?.label}</span>
                          <span
                            className="text-xs tabular-nums text-white font-medium"
                            style={{ fontFamily: 'JetBrains Mono, monospace' }}
                          >
                            {BRL(val)}
                          </span>
                          <span className="text-[10px] text-[#555] w-10 text-right">
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Header da lista */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#555] uppercase tracking-wider font-[Sora]">
              Meus ativos
            </span>
            <button
              onClick={() =>
                setEditando({ tipo: 'renda_fixa', cor: '#22c55e', ativo: true })
              }
              className="flex items-center gap-1.5 text-sm text-[#0EA5E9] hover:text-white transition-colors"
            >
              <Plus size={14} /> Adicionar ativo
            </button>
          </div>

          {/* Lista por tipo */}
          {(Object.entries(TIPO_CFG) as [TipoInv, typeof TIPO_CFG[TipoInv]][]).map(
            ([tipo, cfg]) => {
              const ativos = items.filter(i => i.tipo === tipo)
              if (ativos.length === 0) return null
              const totalTipo = porTipo[tipo] ?? 0
              const isOpen = !collapsed.has(tipo)

              return (
                <div
                  key={tipo}
                  className="bg-bg-2 border border-line rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleCollapse(tipo)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a] transition-colors"
                  >
                    <span className="text-sm font-semibold text-white flex-1 text-left">
                      {cfg.label}
                    </span>
                    <span
                      className="text-xs tabular-nums font-bold"
                      style={{ color: cfg.color, fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {BRL(totalTipo)}
                    </span>
                    <span className="text-[10px] text-[#555]">
                      {ativos.length} ativo{ativos.length !== 1 ? 's' : ''}
                    </span>
                    {isOpen ? (
                      <ChevronDown size={14} className="text-[#555]" />
                    ) : (
                      <ChevronRight size={14} className="text-[#555]" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-line">
                      {ativos.map(inv => {
                        const isRF =
                          inv.tipo === 'renda_fixa' || inv.tipo === 'previdencia'
                        const valorPos = isRF
                          ? valorEstimadoRF(inv, taxas)
                          : valorPosicao(inv)
                        const rent = isRF
                          ? (calcRentabilidadeRF(inv, taxas) ?? 0)
                          : (rentabilidadeVariavel(inv) ?? 0)
                        const rentPos = rent >= 0

                        return (
                          <div
                            key={inv.id}
                            className="group flex items-start gap-3 px-4 py-3 border-b border-line last:border-0 hover:bg-[#141414] transition-colors"
                          >
                            <div
                              className="w-1.5 h-8 rounded-full shrink-0 mt-0.5"
                              style={{ background: inv.cor ?? cfg.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-white truncate">
                                  {inv.nome}
                                </span>
                                {inv.ticker && (
                                  <span
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                    style={{
                                      background: (inv.cor ?? cfg.color) + '22',
                                      color: inv.cor ?? cfg.color,
                                    }}
                                  >
                                    {inv.ticker}
                                  </span>
                                )}
                                {inv.subtipo && (
                                  <span className="text-[10px] text-[#555]">
                                    {inv.subtipo}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                {inv.instituicao && (
                                  <span className="text-[11px] text-[#666]">
                                    {inv.instituicao}
                                  </span>
                                )}
                                {inv.indexador && (
                                  <span className="text-[11px] text-[#666]">
                                    {inv.indexador === 'PREFIXADO'
                                      ? `${inv.taxa_adicional?.toFixed(2)}% a.a.`
                                      : inv.indexador === 'CDI'
                                      ? `${inv.taxa_adicional ?? 100}% do CDI`
                                      : `${inv.indexador}+${inv.taxa_adicional?.toFixed(2)}%`}
                                  </span>
                                )}
                                {inv.data_vencimento && (
                                  <span className="text-[11px] text-[#666]">
                                    Vence {fmtDate(inv.data_vencimento)}
                                  </span>
                                )}
                                {inv.quantidade && (
                                  <span className="text-[11px] text-[#666]">
                                    {inv.quantidade.toLocaleString('pt-BR')} cotas
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div
                                className="text-sm font-bold tabular-nums text-white"
                                style={{ fontFamily: 'JetBrains Mono, monospace' }}
                              >
                                {BRL(valorPos)}
                              </div>
                              {inv.valor_aplicado && inv.valor_aplicado > 0 && (
                                <div
                                  className="text-[11px] tabular-nums flex items-center gap-1 justify-end"
                                  style={{ color: rentPos ? '#22c55e' : '#ef4444' }}
                                >
                                  {rentPos ? (
                                    <TrendingUp size={10} />
                                  ) : (
                                    <TrendingDown size={10} />
                                  )}
                                  {PCT(rent)}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditando(inv)}
                                className="text-[#555] hover:text-[#0EA5E9] p-1"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm(`Arquivar "${inv.nome}"?`)) return
                                  await (supabase.from('fin_investimentos') as any)
                                    .update({ ativo: false })
                                    .eq('id', inv.id)
                                  load()
                                }}
                                className="text-[#555] hover:text-[#ef4444] p-1"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            },
          )}

          {items.length === 0 && (
            <div className="flex flex-col items-center py-16 text-center text-[#555]">
              <p className="text-sm mb-1">Nenhum investimento cadastrado</p>
              <p className="text-xs mb-4">
                Adicione ações, renda fixa, criptos e muito mais
              </p>
              <button
                onClick={() =>
                  setEditando({ tipo: 'renda_fixa', cor: '#22c55e', ativo: true })
                }
                className="bg-[#0EA5E9] text-black text-sm font-semibold px-4 py-2 rounded-xl"
              >
                Adicionar primeiro ativo
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── SIMULADOR ── */}
      {activeTab === 'simulador' && <SimuladorTab taxas={taxas} />}

      {/* ── TAXAS ── */}
      {activeTab === 'taxas' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#555] uppercase tracking-wider font-[Sora]">
              Indicadores econômicos
            </span>
            <button
              onClick={atualizarTaxas}
              disabled={atualizandoTaxas}
              className="flex items-center gap-1.5 text-xs text-[#0EA5E9] hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={12}
                className={atualizandoTaxas ? 'animate-spin' : ''}
              />
              {atualizandoTaxas ? 'Atualizando...' : 'Atualizar via BCB'}
            </button>
          </div>
          <p className="text-[11px] text-[#555]">
            Dados do Banco Central do Brasil. Clique em "Atualizar" para buscar as
            taxas mais recentes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {taxas.map(t => (
              <div
                key={t.indicador}
                className="bg-bg-2 border border-line rounded-xl p-4"
              >
                <div className="text-xs text-[#555] mb-1">{t.indicador}</div>
                <div
                  className="text-2xl font-bold tabular-nums text-white"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {t.valor_anual.toFixed(2).replace('.', ',')}%
                </div>
                <div className="text-[11px] text-[#555] mt-1">
                  ao ano · {t.valor_mensal.toFixed(4).replace('.', ',')}% ao mês
                </div>
                {t.data_referencia && (
                  <div className="text-[10px] text-[#444] mt-1">
                    Ref.: {fmtDate(t.data_referencia)}
                  </div>
                )}
              </div>
            ))}
            {taxas.length === 0 && (
              <div className="col-span-2 text-center py-8 text-[#555] text-sm">
                Nenhuma taxa cadastrada.{' '}
                <button
                  onClick={atualizarTaxas}
                  className="text-[#0EA5E9] hover:underline"
                >
                  Buscar agora →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {editando !== null && (
        <InvestimentoModal
          initial={editando}
          onClose={() => setEditando(null)}
          onSave={async data => {
            const { id, ...rest } = data as Investimento & { id?: string }
            if (id) {
              await (supabase.from('fin_investimentos') as any)
                .update(rest)
                .eq('id', id)
            } else {
              await (supabase.from('fin_investimentos') as any).insert(data)
            }
            setEditando(null)
            load()
          }}
        />
      )}
    </div>
  )
}
