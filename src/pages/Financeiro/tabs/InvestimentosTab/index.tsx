import { useState } from 'react'
import type { Investimento, MainTab } from './types'
import { InvestimentoModal } from './components/InvestimentoModal'
import { SimuladorTab } from './components/SimuladorTab'
import { CarteiraTab } from './components/CarteiraTab'
import { TaxasTab } from './components/TaxasTab'
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
        <CarteiraTab
          items={items}
          taxas={taxas}
          porTipo={porTipo}
          patrimonioTotal={patrimonioTotal}
          totalAplicado={totalAplicado}
          rentTotal={rentTotal}
          onNovoAtivo={() => setEditando({ tipo: 'renda_fixa', cor: '#22c55e', ativo: true })}
          onEdit={setEditando}
          onArchive={archiveInvestimento}
        />
      )}

      {/* ── SIMULADOR ── */}
      {activeTab === 'simulador' && <SimuladorTab taxas={taxas} />}

      {/* ── TAXAS ── */}
      {activeTab === 'taxas' && (
        <TaxasTab taxas={taxas} atualizandoTaxas={atualizandoTaxas} onAtualizar={atualizarTaxas} />
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
