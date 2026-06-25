import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { TaskProject } from '../types'

const COLORS = [
  '#22c55e', '#f97316', '#0EA5E9', '#a78bfa', '#ef4444',
  '#f59e0b', '#ec4899', '#14b8a6', '#6366f1', '#84cc16',
]

interface Props {
  project: TaskProject
  onSave: (p: Partial<TaskProject>) => void
  onDelete: () => void
  onClose: () => void
}

export function ProjectModal({ project, onSave, onDelete, onClose }: Props) {
  const [name, setName]   = useState(project.name)
  const [color, setColor] = useState(project.color || '#0EA5E9')
  const isNew = !project.id || project.id === 'new'

  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 w-80 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold font-[Sora] text-white">
            {isNew ? 'Novo projeto' : 'Editar projeto'}
          </span>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && onSave({ ...project, name: name.trim(), color })}
          placeholder="Nome do projeto"
          autoFocus
          className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#0EA5E9]/60"
        />

        <div>
          <div className="text-[10px] text-[#555] mb-2 uppercase tracking-wider">Cor</div>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                style={{
                  background:    c,
                  outline:       color === c ? `2px solid ${c}` : 'none',
                  outlineOffset: color === c ? '2px' : '0',
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {!isNew && (
            <button
              onClick={() => {
                if (window.confirm('Excluir projeto e remover tarefas do projeto?')) {
                  onDelete()
                  onClose()
                }
              }}
              className="text-[#555] hover:text-[#ef4444] transition-colors p-1"
              title="Excluir projeto"
            >
              <Trash2 size={14} />
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-[#555] border border-[#1f1f1f] rounded-lg hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => name.trim() && onSave({ ...project, name: name.trim(), color })}
            disabled={!name.trim()}
            className="px-4 py-1.5 text-sm font-semibold bg-[#0EA5E9] text-black rounded-lg disabled:opacity-40 hover:bg-[#38bdf8] transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
