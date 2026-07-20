import { Folder, FileText, Pencil, FolderInput, Trash2 } from 'lucide-react'
import type { EstudoItem } from '../hooks/useEstudosItens'

interface Props {
  item: EstudoItem
  onOpen: () => void
  onRename: () => void
  onMove: () => void
  onDelete: () => void
}

export function ItemRow({ item, onOpen, onRename, onMove, onDelete }: Props) {
  const isPasta = item.tipo === 'pasta'

  return (
    <div
      className="group flex items-center gap-3 px-3 border-b border-line last:border-0 hover:bg-bg-3 transition-colors cursor-pointer"
      style={{ minHeight: 52 }}
      onClick={onOpen}
    >
      <div
        className="flex-shrink-0 rounded-lg flex items-center justify-center"
        style={{
          width: 32, height: 32,
          background: isPasta ? 'rgba(14,165,233,.12)' : 'rgba(255,255,255,.06)',
          color: isPasta ? 'var(--blue)' : 'var(--text2)',
        }}
      >
        {isPasta ? <Folder size={15} /> : <FileText size={15} />}
      </div>
      <span className="text-sm text-ink truncate flex-1">{item.nome}</span>
      <div
        className="flex items-center gap-1 flex-shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onRename} className="text-ink-3 hover:text-white p-1.5" title="Renomear">
          <Pencil size={13} />
        </button>
        <button onClick={onMove} className="text-ink-3 hover:text-white p-1.5" title="Mover">
          <FolderInput size={13} />
        </button>
        <button onClick={onDelete} className="text-ink-3 hover:text-red-400 p-1.5" title="Excluir">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
