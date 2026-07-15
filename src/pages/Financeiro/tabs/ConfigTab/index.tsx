import { useState } from 'react'
import type { FinAno } from '../../types'
import { useConfigData } from './hooks/useConfigData'
import { CategoriasTab } from './components/CategoriasTab'
import { CartoesTab } from './components/CartoesTab'
import { AnosTab } from './components/AnosTab'
import { PrevisaoTab } from './components/PrevisaoTab'
import { BackupTab } from './components/BackupTab'

interface Props { anos: FinAno[]; onReload: () => void }

export function ConfigTab({ anos, onReload }: Props) {
  const [tab, setTab] = useState<'categorias' | 'cartoes' | 'anos' | 'backup' | 'previsao'>('categorias')
  const {
    categorias, cartoes, previsaoItems, loading,
    addCategoria, delCat, addCartao, delCartao,
    addAno, updateSaldoInicial,
    addPrevisaoItem, delPrevisaoItem, updatePrevisaoValor,
  } = useConfigData(onReload)

  const subtabs = [
    { id: 'categorias',  label: 'Categorias' },
    { id: 'cartoes',     label: 'Cartões' },
    { id: 'anos',        label: 'Anos' },
    { id: 'backup',      label: 'Backup' },
    { id: 'previsao',    label: 'Previsão do diário' },
  ] as const

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-5 h-5 rounded-full border-2 border-[#0EA5E9] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-line overflow-x-auto">
        {subtabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={['px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              tab === t.id ? 'text-[#0EA5E9] border-[#0EA5E9]' : 'text-[#555] border-transparent hover:text-[#999]'].join(' ')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Categorias */}
      {tab === 'categorias' && (
        <CategoriasTab categorias={categorias} onAdd={addCategoria} onDelete={delCat} />
      )}

      {/* Cartões */}
      {tab === 'cartoes' && (
        <CartoesTab cartoes={cartoes} onAdd={addCartao} onDelete={delCartao} />
      )}

      {/* Anos */}
      {tab === 'anos' && (
        <AnosTab anos={anos} onAdd={addAno} onUpdateSaldoInicial={updateSaldoInicial} />
      )}

      {/* Backup */}
      {tab === 'backup' && <BackupTab anos={anos} />}

      {/* Previsão do diário */}
      {tab === 'previsao' && (
        <PrevisaoTab
          previsaoItems={previsaoItems}
          onAdd={addPrevisaoItem}
          onDelete={delPrevisaoItem}
          onUpdateValor={updatePrevisaoValor}
        />
      )}
    </div>
  )
}

