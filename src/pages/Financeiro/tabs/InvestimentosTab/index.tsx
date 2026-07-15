import { useState } from 'react'
import {
  Plus, RefreshCw,
  ChevronDown, ChevronRight,
} from 'lucide-react'
import type { TipoInv, Investimento, MainTab } from './types'
import { TIPO_CFG } from './types'
import {
  BRL, PCT, fmtDate,
  calcRentabilidadeRF, valorEstimadoRF, rentabilidadeVariavel, valorPosicao,
} from './utils'
import { InvestimentoModal } from './components/InvestimentoModal'
import { SimuladorTab } from './components/SimuladorTab'
import { AtivoRow } from './components/AtivoRow'
import { AlocacaoChart } from './components/AlocacaoChart'
import { useInvestimentosData } from './hooks/useInvestimentosData'
import { useAtualizarTaxas } from './hooks/useAtualizarTaxas'
import { useInvestimentoActions } from './hooks/useInvestimentoActions'

// ─── InvestimentosTab ─────────────────────────────────────────────────────────

export function InvestimentosTab() {
  const {
    items, taxas, loading,
    porTipo, patrimonioTotal, totalAplicado, rentTotal,
    reload: load,
  } = useInvestimentosData()
  const { atualizandoTaxas, atualizarTaxas } = useAtualizarTaxas(load)
  const { saveInvestimento, archiveInvestimento } = useInvestimentoActions(load)
  const [activeTab, setActiveTab]             = useState<MainTab>('carteira')
  const [editando, setEditando]               = useState<Partial<Investimento> | null>(null)
  const [collapsed, setCollapsed]             = useState<Set<string>>(new Set())

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
          <AlocacaoChart porTipo={porTipo} patrimonioTotal={patrimonioTotal} />

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

                        return (
                          <AtivoRow
                            key={inv.id}
                            inv={inv}
                            cfg={cfg}
                            valorPos={valorPos}
                            rent={rent}
                            onEdit={setEditando}
                            onArchive={archiveInvestimento}
                          />
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
            await saveInvestimento(data)
            setEditando(null)
          }}
        />
      )}
    </div>
  )
}
