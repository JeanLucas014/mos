import { useState } from 'react'
import { X, Folder, ChevronRight, Check } from 'lucide-react'
import { collectDescendants, type EstudoItem } from '../hooks/useEstudosItens'

interface Props {
  items: EstudoItem[]
  cursoNome: string
  itemToMove: EstudoItem
  onMove: (parentId: string | null) => void
  onClose: () => void
}

export function MoveModal({ items, cursoNome, itemToMove, onMove, onClose }: Props) {
  // Não pode mover uma pasta pra dentro dela mesma ou de um descendente dela.
  const blocked = collectDescendants(itemToMove.id, items)
  const [stack, setStack] = useState<{ id: string | null; nome: string }[]>([{ id: null, nome: cursoNome }])
  const current = stack[stack.length - 1]

  const folders = items.filter((it) => it.tipo === 'pasta' && it.parent_id === current.id && !blocked.has(it.id))

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-bg-2 border border-line rounded-xl p-5 w-full max-w-sm max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white font-[Sora] truncate">Mover "{itemToMove.nome}"</span>
          <button onClick={onClose} className="text-ink-3 hover:text-white transition-colors flex-shrink-0 ml-2">
            <X size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1 flex-wrap mb-3">
          {stack.map((s, i) => (
            <span key={s.id ?? 'root'} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={10} className="text-ink-3" />}
              <button
                onClick={() => setStack(stack.slice(0, i + 1))}
                className={['text-xs', i === stack.length - 1 ? 'text-ink font-medium' : 'text-ink-3 hover:text-ink'].join(' ')}
              >
                {s.nome}
              </button>
            </span>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto border border-line rounded-lg bg-bg" style={{ minHeight: 120 }}>
          {folders.length === 0 ? (
            <p className="text-xs text-ink-3 text-center py-6">Nenhuma subpasta aqui.</p>
          ) : (
            folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setStack([...stack, { id: f.id, nome: f.nome }])}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left border-b border-line last:border-0 hover:bg-bg-3 transition-colors"
              >
                <Folder size={14} className="text-brand flex-shrink-0" />
                <span className="text-sm text-ink truncate flex-1">{f.nome}</span>
                <ChevronRight size={12} className="text-ink-3 flex-shrink-0" />
              </button>
            ))
          )}
        </div>

        <button
          onClick={() => onMove(current.id)}
          disabled={current.id === itemToMove.parent_id}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-brand text-black rounded-lg font-semibold text-sm py-2.5 hover:brightness-110 disabled:opacity-40 transition-all"
        >
          <Check size={14} /> Mover para "{current.nome}"
        </button>
      </div>
    </div>
  )
}
