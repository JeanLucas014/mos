import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  currentValue: number
  isAjustado: boolean
  onSave: (valor: number) => void
  onRemoveOverride: () => void
  onClose: () => void
}

export function OverrideModal({ title, currentValue, isAjustado, onSave, onRemoveOverride, onClose }: Props) {
  const [value, setValue] = useState(String(currentValue))

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-bg-2 border border-line rounded-xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-white font-[Sora]">{title}</span>
          <button onClick={onClose} className="text-ink-3 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
        <p className="text-xs text-ink-3 mb-4">
          Este ajuste vale só para o mês selecionado — não altera o valor padrão nem outros meses.
        </p>
        <input
          autoFocus
          type="number"
          step="0.01"
          value={value}
          onChange={e => setValue(e.target.value)}
          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand/60"
        />
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onSave(Number(value) || 0)}
            className="flex-1 bg-brand text-black rounded-lg font-semibold text-sm py-2 hover:brightness-110 transition-all"
          >
            Salvar ajuste
          </button>
          {isAjustado && (
            <button
              onClick={onRemoveOverride}
              className="flex-1 bg-bg-3 text-ink-2 rounded-lg text-sm py-2 hover:text-white transition-colors"
            >
              Remover ajuste
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
