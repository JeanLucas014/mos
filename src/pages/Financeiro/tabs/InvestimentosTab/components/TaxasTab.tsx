import { RefreshCw } from 'lucide-react'
import type { Taxa } from '../types'
import { fmtDate } from '../utils'

interface TaxasTabProps {
  taxas: Taxa[]
  atualizandoTaxas: boolean
  onAtualizar: () => void
}

/** Aba Taxas: lista de indicadores economicos + botao de atualizar via BCB. */
export function TaxasTab({ taxas, atualizandoTaxas, onAtualizar }: TaxasTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#555] uppercase tracking-wider font-[Sora]">
          Indicadores econômicos
        </span>
        <button
          onClick={onAtualizar}
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
              onClick={onAtualizar}
              className="text-[#0EA5E9] hover:underline"
            >
              Buscar agora →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
