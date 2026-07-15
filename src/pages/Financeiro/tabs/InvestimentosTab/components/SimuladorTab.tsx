import { useState, useMemo } from 'react'
import type { Taxa } from '../types'
import { BRL } from '../utils'

type SimIndexador = 'CDI' | 'SELIC' | 'IPCA_MAIS' | 'PERSONALIZADO'

export function SimuladorTab({ taxas }: { taxas: Taxa[] }) {
  const [valorInicial, setValorInicial] = useState('10000')
  const [aporteMensal, setAporteMensal] = useState('500')
  const [prazoAnos, setPrazoAnos]       = useState('5')
  const [taxa, setTaxa]                 = useState<SimIndexador>('CDI')
  const [taxaPersonalizada, setTaxaP]   = useState('12')
  const [percentualCDI, setPercentualCDI] = useState('115')

  const inp =
    'w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#0EA5E9]/60'

  const resultado = useMemo(() => {
    const VI  = parseFloat(valorInicial) || 0
    const PMT = parseFloat(aporteMensal) || 0
    const N   = (parseFloat(prazoAnos) || 1) * 12

    let taxaAnual = 0
    if (taxa === 'CDI') {
      const cdi = taxas.find(t => t.indicador === 'CDI')?.valor_anual ?? 13.65
      taxaAnual = cdi * (parseFloat(percentualCDI) / 100)
    } else if (taxa === 'SELIC') {
      taxaAnual = taxas.find(t => t.indicador === 'SELIC')?.valor_anual ?? 13.75
    } else if (taxa === 'IPCA_MAIS') {
      const ipca = taxas.find(t => t.indicador === 'IPCA')?.valor_anual ?? 4.83
      taxaAnual = ((1 + ipca / 100) * (1 + parseFloat(taxaPersonalizada) / 100) - 1) * 100
    } else {
      taxaAnual = parseFloat(taxaPersonalizada) || 0
    }

    const taxaMensal = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1
    const montante =
      VI * Math.pow(1 + taxaMensal, N) +
      PMT * (Math.pow(1 + taxaMensal, N) - 1) / taxaMensal
    const totalAportado = VI + PMT * N
    const rendimento    = montante - totalAportado
    const rentTotal     = totalAportado > 0 ? (rendimento / totalAportado) * 100 : 0

    return { montante, totalAportado, rendimento, rentTotal, taxaAnual }
  }, [valorInicial, aporteMensal, prazoAnos, taxa, taxaPersonalizada, percentualCDI, taxas])

  const simTabs: { id: SimIndexador; label: string }[] = [
    {
      id: 'CDI',
      label: `CDI (${taxas.find(t => t.indicador === 'CDI')?.valor_anual?.toFixed(2) ?? '–'}%)`,
    },
    {
      id: 'SELIC',
      label: `SELIC (${taxas.find(t => t.indicador === 'SELIC')?.valor_anual?.toFixed(2) ?? '–'}%)`,
    },
    { id: 'IPCA_MAIS',    label: 'IPCA+' },
    { id: 'PERSONALIZADO', label: 'Personalizado' },
  ]

  return (
    <div className="space-y-5">
      <div className="bg-bg-2 border border-line rounded-xl p-5 space-y-4">
        <div className="text-xs text-[#555] uppercase tracking-wider font-[Sora]">Parâmetros</div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-[#555] uppercase tracking-wider mb-1">
              Valor inicial (R$)
            </label>
            <input
              type="number"
              value={valorInicial}
              onChange={e => setValorInicial(e.target.value)}
              className={inp}
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#555] uppercase tracking-wider mb-1">
              Aporte mensal (R$)
            </label>
            <input
              type="number"
              value={aporteMensal}
              onChange={e => setAporteMensal(e.target.value)}
              className={inp}
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#555] uppercase tracking-wider mb-1">
              Prazo (anos)
            </label>
            <input
              type="number"
              min="1"
              max="40"
              value={prazoAnos}
              onChange={e => setPrazoAnos(e.target.value)}
              className={inp}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-[#555] uppercase tracking-wider mb-2">
            Indexador
          </label>
          <div className="flex gap-2 flex-wrap">
            {simTabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTaxa(t.id)}
                className="px-3 py-1.5 text-xs rounded-lg border transition-colors"
                style={{
                  borderColor: taxa === t.id ? '#0EA5E9' : 'var(--border)',
                  background: taxa === t.id ? 'rgba(14,165,233,.12)' : 'transparent',
                  color: taxa === t.id ? '#0EA5E9' : 'var(--text3)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {taxa === 'CDI' && (
          <div>
            <label className="block text-[11px] text-[#555] uppercase tracking-wider mb-1">
              % do CDI
            </label>
            <input
              type="number"
              value={percentualCDI}
              onChange={e => setPercentualCDI(e.target.value)}
              placeholder="115"
              className={inp + ' max-w-[120px]'}
            />
          </div>
        )}
        {(taxa === 'IPCA_MAIS' || taxa === 'PERSONALIZADO') && (
          <div>
            <label className="block text-[11px] text-[#555] uppercase tracking-wider mb-1">
              {taxa === 'IPCA_MAIS' ? 'IPCA + (% a.a.)' : 'Taxa anual (%)'}
            </label>
            <input
              type="number"
              step="0.1"
              value={taxaPersonalizada}
              onChange={e => setTaxaP(e.target.value)}
              className={inp + ' max-w-[120px]'}
            />
          </div>
        )}
      </div>

      {/* Resultado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Montante final',  value: BRL(resultado.montante),      color: '#0EA5E9' },
          { label: 'Total aportado',  value: BRL(resultado.totalAportado), color: 'var(--text2)' },
          { label: 'Rendimento',      value: BRL(resultado.rendimento),    color: '#22c55e' },
        ].map((c, i) => (
          <div key={i} className="bg-bg-2 border border-line rounded-xl p-4">
            <div className="text-[11px] text-[#555] uppercase tracking-wider mb-1">{c.label}</div>
            <div
              className="text-xl font-bold tabular-nums"
              style={{ color: c.color, fontFamily: 'JetBrains Mono, monospace' }}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-bg-2 border border-line rounded-xl p-4 text-center text-xs text-[#555]">
        Taxa efetiva:{' '}
        <span className="text-white font-medium">
          {resultado.taxaAnual.toFixed(2)}% a.a.
        </span>{' '}
        · Rentabilidade total:{' '}
        <span className="text-[#22c55e] font-medium">
          +{resultado.rentTotal.toFixed(1)}%
        </span>{' '}
        em {prazoAnos} {Number(prazoAnos) === 1 ? 'ano' : 'anos'}
      </div>
    </div>
  )
}
