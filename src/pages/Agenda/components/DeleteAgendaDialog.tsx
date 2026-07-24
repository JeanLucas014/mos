import { useState } from 'react'
import { X } from 'lucide-react'
import type { Agenda } from '../types'

interface Props {
  agenda: Agenda
  otherAgendas: Agenda[]
  eventCount: number
  onConfirm: (reassignToId: string | null) => void
  onClose: () => void
}

export function DeleteAgendaDialog({ agenda, otherAgendas, eventCount, onConfirm, onClose }: Props) {
  const [mode, setMode] = useState<'move' | 'delete'>(eventCount > 0 ? 'move' : 'delete')
  const [target, setTarget] = useState(otherAgendas[0]?.id ?? '')

  return (
    <div className="fixed inset-0 bg-black/75 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#111111] border border-[#1f1f1f] rounded-2xl w-full max-w-sm p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold font-[Sora] text-white">Excluir agenda "{agenda.nome}"?</span>
          <button onClick={onClose} className="text-ink-3 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {eventCount > 0 ? (
          <>
            <p className="text-xs text-ink-3 mb-4">
              Esta agenda tem {eventCount} evento{eventCount !== 1 ? 's' : ''}. O que você quer fazer com {eventCount !== 1 ? 'eles' : 'ele'}?
            </p>

            <div className="space-y-2 mb-4">
              <label className="flex items-center gap-2 text-sm text-ink-2 cursor-pointer">
                <input type="radio" name="mode" checked={mode === 'move'} onChange={() => setMode('move')} className="accent-brand" />
                Mover para outra agenda
              </label>
              {mode === 'move' && (
                <select
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  className="w-full ml-6 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-brand/60"
                >
                  {otherAgendas.map(a => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              )}
              <label className="flex items-center gap-2 text-sm text-ink-2 cursor-pointer">
                <input type="radio" name="mode" checked={mode === 'delete'} onChange={() => setMode('delete')} className="accent-brand" />
                Apagar todos os eventos
              </label>
            </div>
          </>
        ) : (
          <p className="text-xs text-ink-3 mb-4">Esta agenda não tem eventos.</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm text-ink-3 border border-[#1f1f1f] rounded-xl hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(mode === 'move' ? target : null)}
            disabled={mode === 'move' && !target}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
            style={{ background: '#ef4444', color: '#fff' }}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}
