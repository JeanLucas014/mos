import { useState, lazy, Suspense } from 'react'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import type { TipoInv, Investimento, Taxa } from '../types'
import { TIPO_CFG } from '../types'
import { BRL, PCT, calcRentabilidadeRF, valorEstimadoRF, rentabilidadeVariavel, valorPosicao } from '../utils'
import { AtivoRow } from './AtivoRow'
import { Skeleton } from '@/components/ui/Skeleton'

/* AlocacaoChart puxa recharts (biblioteca pesada) — Suspense próprio pra
   não atrasar o resumo/lista de ativos, que já têm os dados prontos. */
const AlocacaoChart = lazy(() => import('./AlocacaoChart').then(m => ({ default: m.AlocacaoChart })))

interface CarteiraTabProps {
  items: Investimento[]
  taxas: Taxa[]
  porTipo: Record<string, number>
  patrimonioTotal: number
  totalAplicado: number
  rentTotal: number
  onNovoAtivo: () => void
  onEdit: (inv: Investimento) => void
  onArchive: (inv: Investimento) => void
}

/** Aba Carteira: resumo, grafico de alocacao e lista de ativos agrupada por classe. */
export function CarteiraTab({
  items, taxas, porTipo, patrimonioTotal, totalAplicado, rentTotal,
  onNovoAtivo, onEdit, onArchive,
}: CarteiraTabProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  function toggleCollapse(tipo: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(tipo) ? next.delete(tipo) : next.add(tipo)
      return next
    })
  }

  return (
    <div className="space-y-5">
      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: 'Patrimônio total',
            value: BRL(patrimonioTotal),
            color: 'var(--blue)',
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
            <div className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">{c.label}</div>
            <div
              className="text-xl font-bold tabular-nums"
              style={{ color: c.color, fontFamily: 'JetBrains Mono, monospace' }}
            >
              {c.value}
            </div>
            <div className="text-[11px] text-ink-3 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Gráfico de alocação */}
      <Suspense fallback={<Skeleton className="h-48 rounded-xl" />}>
        <AlocacaoChart porTipo={porTipo} patrimonioTotal={patrimonioTotal} />
      </Suspense>

      {/* Header da lista */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-3 uppercase tracking-wider font-[Sora]">
          Meus ativos
        </span>
        <button
          onClick={onNovoAtivo}
          className="flex items-center gap-1.5 text-sm text-brand hover:text-white transition-colors"
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
                <span className="text-[10px] text-ink-3">
                  {ativos.length} ativo{ativos.length !== 1 ? 's' : ''}
                </span>
                {isOpen ? (
                  <ChevronDown size={14} className="text-ink-3" />
                ) : (
                  <ChevronRight size={14} className="text-ink-3" />
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
                        onEdit={onEdit}
                        onArchive={onArchive}
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
        <div className="flex flex-col items-center py-16 text-center text-ink-3">
          <p className="text-sm mb-1">Nenhum investimento cadastrado</p>
          <p className="text-xs mb-4">
            Adicione ações, renda fixa, criptos e muito mais
          </p>
          <button
            onClick={onNovoAtivo}
            className="bg-brand text-black text-sm font-semibold px-4 py-2 rounded-xl"
          >
            Adicionar primeiro ativo
          </button>
        </div>
      )}
    </div>
  )
}
