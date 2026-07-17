import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { TipoInv } from '../types'
import { TIPO_CFG } from '../types'
import { BRL } from '../utils'

interface AlocacaoChartProps {
  porTipo: Record<string, number>
  patrimonioTotal: number
}

/** Gráfico de pizza + legenda da alocação por classe de ativo (aba Carteira). */
export function AlocacaoChart({ porTipo, patrimonioTotal }: AlocacaoChartProps) {
  const pieData = Object.entries(porTipo).map(([tipo, val]) => ({
    name: TIPO_CFG[tipo as TipoInv]?.label ?? tipo,
    value: val,
    tipo,
  }))

  if (pieData.length === 0) return null

  return (
    <div className="bg-bg-2 border border-line rounded-xl p-4">
      <div className="text-xs text-ink-3 uppercase tracking-wider font-[Sora] mb-3">
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
                  <span className="text-xs text-ink-2 flex-1">{c?.label}</span>
                  <span
                    className="text-xs tabular-nums text-white font-medium"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {BRL(val)}
                  </span>
                  <span className="text-[10px] text-ink-3 w-10 text-right">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
