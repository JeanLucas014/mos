import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { FinCartao } from '../../../types'

interface CartoesTabProps {
  cartoes: FinCartao[]
  onAdd: (nome: string, cor: string) => Promise<void>
  onDelete: (id: string) => void
}

export function CartoesTab({ cartoes, onAdd, onDelete }: CartoesTabProps) {
  const [cardForm, setCardForm] = useState({ nome: '', cor: '' })

  async function handleAdd() {
    await onAdd(cardForm.nome, cardForm.cor)
    setCardForm({ nome: '', cor: '' })
  }

  return (
    <div className="space-y-4">
      <div className="bg-bg-2 border border-line rounded-xl p-4 space-y-3">
        <div className="text-xs text-ink-3 font-[Sora] uppercase tracking-wider">Novo cartão</div>
        <div className="flex gap-2">
          <input placeholder="Nome" value={cardForm.nome} onChange={e => setCardForm({ ...cardForm, nome: e.target.value })}
            className="flex-1 bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand/60" />
          <input type="color" value={cardForm.cor || 'var(--text3)'} onChange={e => setCardForm({ ...cardForm, cor: e.target.value })}
            className="w-10 h-9 bg-bg border border-line rounded-lg cursor-pointer" />
          <button onClick={handleAdd} className="px-4 py-1.5 text-sm font-medium bg-brand text-black rounded-lg hover:bg-[#38bdf8]">
            <Plus size={14} />
          </button>
        </div>
      </div>
      {cartoes.map(c => (
        <div key={c.id} className="group flex items-center gap-3 py-2.5 border-b border-line">
          {c.cor && <span className="w-3 h-3 rounded-full shrink-0" style={{ background: c.cor }} />}
          <span className="flex-1 text-sm text-white">{c.nome}</span>
          <button onClick={() => onDelete(c.id)} className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-[#ef4444] transition-all">
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
