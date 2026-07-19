import { Pencil, Trash2 } from 'lucide-react'
import type { OrcamentoGrupo } from '../types'
import { BRL, progressPct, progressColor } from '../utils'

interface Props {
  grupo: OrcamentoGrupo
  previsto: number
  realizado: number
  onEditGrupo: () => void
  onDelete: () => void
}

export function GrupoRow({ grupo, previsto, realizado, onEditGrupo, onDelete }: Props) {
  const isManual = grupo.modo === 'manual'
  const pct = progressPct(realizado, previsto)
  const color = progressColor(pct)
  const barWidth = Math.min(pct, 100)

  return (
    <div className="group bg-bg-2 border border-line rounded-xl p-3.5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-white truncate">{grupo.nome}</span>
          {isManual ? (
            // Modo manual não tem "realizado" de verdade — mostrar só o
            // valor previsto evita uma barra sempre em 100% (comparando
            // previsto contra ele mesmo), que não comunicaria nada útil.
            <div className="text-xs tabular-nums text-ink-2 mt-0.5">{BRL(previsto)}</div>
          ) : (
            <div className="text-xs tabular-nums text-ink-2 mt-0.5">
              {BRL(realizado)} <span className="text-ink-3">/ {BRL(previsto)}</span>
            </div>
          )}
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
      {!isManual && (
        <div style={{ height: 6, background: 'rgba(255,255,255,.07)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${barWidth}%`, background: color, borderRadius: 4, transition: 'width .2s' }} />
        </div>
      )}
    </div>
  )
}
