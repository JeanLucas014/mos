import { Pencil, Trash2, SlidersHorizontal } from 'lucide-react'
import type { OrcamentoGrupo } from '../types'
import { BRL, progressPct, progressColor } from '../utils'

interface Props {
  grupo: OrcamentoGrupo
  previsto: number
  realizado: number
  ajustado: boolean
  onEditValor: () => void
  onEditGrupo: () => void
  onDelete: () => void
}

export function GrupoRow({ grupo, previsto, realizado, ajustado, onEditValor, onEditGrupo, onDelete }: Props) {
  const pct = progressPct(realizado, previsto)
  const color = progressColor(pct)
  const barWidth = Math.min(pct, 100)

  return (
    <div className="group bg-bg-2 border border-line rounded-xl p-3.5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-white truncate">{grupo.nome}</span>
            {ajustado && (
              <span
                className="flex items-center gap-1 flex-shrink-0"
                style={{ fontSize: 9, color: 'var(--blue)', border: '1px solid rgba(14,165,233,.3)', borderRadius: 6, padding: '1px 5px' }}
                title="Valor previsto ajustado só neste mês"
              >
                <SlidersHorizontal size={9} /> ajustado
              </span>
            )}
          </div>
          <button
            onClick={onEditValor}
            className="text-xs tabular-nums text-ink-2 hover:text-brand transition-colors mt-0.5"
            title="Ajustar valor previsto só neste mês"
          >
            {BRL(realizado)} <span className="text-ink-3">/ {BRL(previsto)}</span>
          </button>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEditGrupo} className="text-ink-3 hover:text-white p-1" title="Editar grupo">
            <Pencil size={12} />
          </button>
          <button onClick={onDelete} className="text-ink-3 hover:text-red-400 p-1" title="Remover grupo">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,.07)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${barWidth}%`, background: color, borderRadius: 4, transition: 'width .2s' }} />
      </div>
    </div>
  )
}
