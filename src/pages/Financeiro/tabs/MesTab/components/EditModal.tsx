import { useState } from 'react'
import { X } from 'lucide-react'
import type { FinLancamento, FinCategoria, FinCartao, Natureza, SaidaTipo } from '../../../types'

export interface EditFormState {
  nome: string
  valor: string
  data: string
  natureza: Natureza
  saida_tipo: SaidaTipo
  cartao_id: string
  categoria_id: string
}

interface EditModalProps {
  item: FinLancamento
  categorias: FinCategoria[]
  cartoes: FinCartao[]
  onSave: (form: EditFormState) => Promise<void>
  onClose: () => void
}

export function EditModal({ item, categorias, cartoes, onSave, onClose }: EditModalProps) {
  const [form, setForm] = useState<EditFormState>({
    nome:         item.nome,
    valor:        String(item.valor ?? ''),
    data:         item.data,
    natureza:     item.natureza,
    saida_tipo:   (item.saida_tipo as SaidaTipo) ?? 'fixa',
    cartao_id:    item.cartao_id ?? '',
    categoria_id: item.categoria_id ?? '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k: keyof EditFormState, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handle() {
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const filteredCats = categorias.filter(c => c.natureza === form.natureza)

  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-2 border border-line rounded-xl p-5 w-full max-w-sm space-y-3.5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white font-[Sora]">Editar lançamento</div>
          <button onClick={onClose} className="text-ink-3 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Nome */}
        <input
          value={form.nome}
          onChange={e => set('nome', e.target.value)}
          placeholder="Nome"
          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand/60"
        />

        {/* Data */}
        <div>
          <div className="text-[10px] text-ink-3 mb-1.5">Data</div>
          <input
            type="date"
            value={form.data}
            onChange={e => set('data', e.target.value)}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand/60"
            style={{ maxWidth: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <input
          value={form.valor}
          onChange={e => set('valor', e.target.value)}
          placeholder="Valor"
          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand/60 tabular-nums"
        />

        {/* Natureza (somente raízes) */}
        {!item.parent_id && (
          <div>
            <div className="text-[10px] text-ink-3 mb-1.5">Natureza</div>
            <div className="flex gap-1">
              {(['entrada','saida','diario'] as Natureza[]).map(n => (
                <button
                  key={n}
                  onClick={() => set('natureza', n)}
                  className={[
                    'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                    form.natureza === n ? 'border-brand/50 text-brand' : 'border-line text-ink-3 hover:text-white',
                  ].join(' ')}
                >
                  {n === 'entrada' ? 'Entrada' : n === 'saida' ? 'Saída' : 'Diário'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Saída tipo */}
        {form.natureza === 'saida' && (
          <div>
            <div className="text-[10px] text-ink-3 mb-1.5">Tipo</div>
            <div className="flex gap-1">
              {(['fixa','cartao'] as SaidaTipo[]).map(t => (
                <button
                  key={t}
                  onClick={() => set('saida_tipo', t)}
                  className={[
                    'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                    form.saida_tipo === t ? 'border-[#a78bfa]/50 text-[#a78bfa]' : 'border-line text-ink-3 hover:text-white',
                  ].join(' ')}
                >
                  {t === 'fixa' ? 'Fixa' : 'Cartão'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cartão */}
        {form.natureza === 'saida' && form.saida_tipo === 'cartao' && (
          <select
            value={form.cartao_id}
            onChange={e => set('cartao_id', e.target.value)}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-white outline-none"
          >
            <option value="">Selecione o cartão</option>
            {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        )}

        {/* Categoria */}
        {filteredCats.length > 0 && (
          <select
            value={form.categoria_id}
            onChange={e => set('categoria_id', e.target.value)}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-white outline-none"
          >
            <option value="">Sem categoria</option>
            {filteredCats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-ink-3 border border-line rounded-lg hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handle}
            disabled={saving || !form.nome.trim()}
            className="flex-1 py-2 text-sm font-medium bg-brand text-black rounded-lg hover:bg-[#38bdf8] disabled:opacity-40 transition-colors"
          >
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
