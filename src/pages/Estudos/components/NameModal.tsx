import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  initialValue?: string
  confirmLabel?: string
  onSave: (nome: string) => void
  onClose: () => void
}

export function NameModal({ title, initialValue = '', confirmLabel = 'Salvar', onSave, onClose }: Props) {
  const [nome, setNome] = useState(initialValue)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    onSave(nome.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="bg-bg-2 border border-line rounded-xl p-5 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-white font-[Sora]">{title}</span>
          <button type="button" onClick={onClose} className="text-ink-3 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        <input
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome…"
          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand/60"
        />

        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            disabled={!nome.trim()}
            className="flex-1 bg-brand text-black rounded-lg font-semibold text-sm py-2 hover:brightness-110 disabled:opacity-40 transition-all"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-bg border border-line rounded-lg text-ink-2 text-sm hover:text-white transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
