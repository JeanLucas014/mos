import { useState } from 'react'
import { X } from 'lucide-react'

export type RecurrenceScope = 'this' | 'this_and_following' | 'all'

interface Props {
  mode: 'edit' | 'delete' | 'move' | 'resize'
  onConfirm: (scope: RecurrenceScope) => void
  onClose: () => void
}

export function RecurrenceDialog({ mode, onConfirm, onClose }: Props) {
  const [scope, setScope] = useState<RecurrenceScope>('this')

  return (
    <div
      className="fixed inset-0 bg-black/75 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111111] border border-[#1f1f1f] rounded-2xl w-full max-w-sm p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm font-semibold font-[Sora] text-white">
            {mode === 'delete' ? 'Excluir evento recorrente' : mode === 'move' ? 'Mover evento recorrente' : mode === 'resize' ? 'Redimensionar evento recorrente' : 'Editar evento recorrente'}
          </span>
          <button onClick={onClose} className="text-ink-3 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {[
            { id: 'this',               label: 'Este evento' },
            { id: 'this_and_following', label: 'Este e os eventos seguintes' },
            { id: 'all',                label: 'Todos os eventos' },
          ].map(opt => (
            <label
              key={opt.id}
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setScope(opt.id as RecurrenceScope)}
            >
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                style={{ borderColor: scope === opt.id ? 'var(--blue)' : '#333' }}
              >
                {scope === opt.id && (
                  <div className="w-2.5 h-2.5 rounded-full bg-brand" />
                )}
              </div>
              <span className="text-sm text-[#ccc] group-hover:text-white transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm text-ink-3 border border-[#1f1f1f] rounded-xl hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(scope)}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors"
            style={{ background: mode === 'delete' ? '#ef4444' : 'var(--blue)', color: '#000' }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
