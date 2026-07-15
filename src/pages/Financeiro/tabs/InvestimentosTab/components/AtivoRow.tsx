import { TrendingUp, TrendingDown, Pencil, Trash2 } from 'lucide-react'
import type { Investimento, TipoInv, TIPO_CFG } from '../types'
import { BRL, PCT, fmtDate } from '../utils'

interface AtivoRowProps {
  inv: Investimento
  cfg: (typeof TIPO_CFG)[TipoInv]
  valorPos: number
  rent: number
  onEdit: (inv: Investimento) => void
  onArchive: (inv: Investimento) => void
}

/** Linha de um ativo dentro da lista agrupada por classe (Carteira). */
export function AtivoRow({ inv, cfg, valorPos, rent, onEdit, onArchive }: AtivoRowProps) {
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
          onClick={() => onEdit(inv)}
          className="text-[#555] hover:text-[#0EA5E9] p-1"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={() => onArchive(inv)}
          className="text-[#555] hover:text-[#ef4444] p-1"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}
