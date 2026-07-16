import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { FinCategoria } from '../../../types'

interface CategoriasTabProps {
  categorias: FinCategoria[]
  onAdd: (nome: string, natureza: string, cor: string, rapida: boolean) => Promise<void>
  onDelete: (id: string) => void
}

export function CategoriasTab({ categorias, onAdd, onDelete }: CategoriasTabProps) {
  const [catForm, setCatForm] = useState({ nome: '', natureza: 'diario', cor: '', rapida: false })

  async function handleAdd() {
    await onAdd(catForm.nome, catForm.natureza, catForm.cor, catForm.rapida)
    setCatForm({ nome: '', natureza: 'diario', cor: '', rapida: false })
  }

  return (
    <div className="space-y-4">
      <div className="bg-bg-2 border border-line rounded-xl p-4 space-y-3">
        <div className="text-xs text-ink-3 font-[Sora] uppercase tracking-wider">Nova categoria</div>
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Nome" value={catForm.nome} onChange={e => setCatForm({ ...catForm, nome: e.target.value })}
            className="flex-1 min-w-32 bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand/60" />
          <select value={catForm.natureza} onChange={e => setCatForm({ ...catForm, natureza: e.target.value })}
            className="bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none">
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="diario">Diário</option>
          </select>
          <input type="color" value={catForm.cor || 'var(--text3)'} onChange={e => setCatForm({ ...catForm, cor: e.target.value })}
            className="w-10 h-9 bg-bg border border-line rounded-lg cursor-pointer" />
          <label className="flex items-center gap-1.5 text-xs text-ink-3 cursor-pointer">
            <input type="checkbox" checked={catForm.rapida} onChange={e => setCatForm({ ...catForm, rapida: e.target.checked })} className="accent-brand" />
            Rápida
          </label>
          <button onClick={handleAdd} className="px-4 py-1.5 text-sm font-medium bg-brand text-black rounded-lg hover:bg-[#38bdf8]">
            <Plus size={14} />
          </button>
        </div>
      </div>

      {(['entrada','saida','diario'] as const).map(nat => {
        const cats = categorias.filter(c => c.natureza === nat)
        if (!cats.length) return null
        const cor = nat === 'entrada' ? '#22c55e' : nat === 'saida' ? '#ef4444' : '#f97316'
        return (
          <div key={nat}>
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: cor }}>
              {nat === 'entrada' ? 'Entrada' : nat === 'saida' ? 'Saída' : 'Diário'}
            </div>
            {cats.map(c => (
              <div key={c.id} className="group flex items-center gap-2 py-2 border-b border-line">
                {c.cor && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.cor }} />}
                <span className="flex-1 text-sm text-ink-2">{c.nome}</span>
                {c.rapida && <span className="text-[10px] text-brand border border-brand/30 rounded px-1.5">rápida</span>}
                <button onClick={() => onDelete(c.id)} className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-[#ef4444] transition-all">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
