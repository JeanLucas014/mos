import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { FinCategoria, FinCartao, Natureza, SaidaTipo } from '../../../types'
import type { AddForm } from '../types'

interface AddPanelProps {
  form: AddForm
  onChange: (f: AddForm) => void
  categorias: FinCategoria[]
  cartoes: FinCartao[]
  categoriasRapidas: FinCategoria[]
  onAdd: () => void
  onCancel: () => void
  saving: boolean
  dia: number
  anoAno: number
  monthNum: number
  onQuickLaunch: (dia: number, cat: FinCategoria, nome: string, valor: string) => void
  onAddQuickCat: (nome: string, cor?: string) => Promise<void>
}

export function AddPanel({
  form, onChange, categorias, cartoes, categoriasRapidas,
  onAdd, onCancel, saving, dia, anoAno, monthNum, onQuickLaunch, onAddQuickCat,
}: AddPanelProps) {
  const [quickNome, setQuickNome]       = useState('')
  const [quickValor, setQuickValor]     = useState('')
  const [quickCat, setQuickCat]         = useState<FinCategoria | null>(null)
  const [showNewCat, setShowNewCat]     = useState(false)
  const [newCatNome, setNewCatNome]     = useState('')
  const [newCatCor, setNewCatCor]       = useState('#f97316')
  const [savingCat, setSavingCat]       = useState(false)

  const set = (k: keyof AddForm, v: unknown) => onChange({ ...form, [k]: v })

  async function saveNewCat() {
    if (!newCatNome.trim()) return
    setSavingCat(true)
    await onAddQuickCat(newCatNome, newCatCor)
    setNewCatNome('')
    setShowNewCat(false)
    setSavingCat(false)
  }

  function fireQuick() {
    if (!quickCat || !quickValor.trim()) return
    onQuickLaunch(dia, quickCat, quickNome || quickCat.nome, quickValor)
    setQuickNome('')
    setQuickValor('')
    setQuickCat(null)
  }

  return (
    <div className="space-y-4">
      {/* ── Quick diary ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] text-ink-3 uppercase tracking-wider">Diário rápido</div>
          <button
            onClick={() => setShowNewCat(v => !v)}
            className="flex items-center gap-0.5 text-[10px] text-brand/60 hover:text-brand transition-colors"
          >
            <Plus size={10} /> nova categoria
          </button>
        </div>

        {/* New quick cat form */}
        {showNewCat && (
          <div className="flex gap-2 mb-2">
            <input
              placeholder="Nome da categoria"
              value={newCatNome}
              onChange={e => setNewCatNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveNewCat()}
              className="flex-1 bg-bg border border-line rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-brand/60"
            />
            <input
              type="color"
              value={newCatCor}
              onChange={e => setNewCatCor(e.target.value)}
              className="w-9 h-7 bg-bg border border-line rounded cursor-pointer p-0.5"
            />
            <button
              onClick={saveNewCat}
              disabled={savingCat || !newCatNome.trim()}
              className="px-2.5 py-1 text-xs bg-brand text-black rounded-lg hover:bg-[#38bdf8] disabled:opacity-40"
            >
              {savingCat ? '…' : 'OK'}
            </button>
          </div>
        )}

        {/* Quick cat buttons */}
        <div className="flex gap-2 flex-wrap">
          {categoriasRapidas.map(cat => (
            <button
              key={cat.id}
              onClick={() => setQuickCat(quickCat?.id === cat.id ? null : cat)}
              style={cat.cor ? {
                borderColor: quickCat?.id === cat.id ? cat.cor + '80' : 'var(--border)',
                color: quickCat?.id === cat.id ? cat.cor : '#666',
              } : {}}
              className={[
                'px-2.5 py-1 text-xs rounded-lg border transition-colors',
                !cat.cor && (quickCat?.id === cat.id
                  ? 'border-brand/50 text-brand'
                  : 'border-line text-[#666] hover:text-white'),
              ].join(' ')}
            >
              {cat.nome}
            </button>
          ))}
        </div>

        {/* Quick launch inputs */}
        {quickCat && (
          <div className="flex gap-2 mt-2">
            <input
              placeholder={quickCat.nome}
              value={quickNome}
              onChange={e => setQuickNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fireQuick()}
              className="flex-1 bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand/60"
            />
            <input
              placeholder="R$ 0,00"
              value={quickValor}
              onChange={e => setQuickValor(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fireQuick()}
              className="w-28 bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand/60 tabular-nums"
              autoFocus
            />
            <button
              onClick={fireQuick}
              disabled={!quickValor.trim()}
              className="bg-brand text-black text-xs font-semibold px-3 rounded-lg hover:bg-[#38bdf8] disabled:opacity-40 transition-colors"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* ── Full form ── */}
      <div className="border-t border-line pt-4">
        <div className="text-[10px] text-ink-3 uppercase tracking-wider mb-3">
          {form.parent_id ? '↳ Subitem do grupo' : 'Lançamento'}
        </div>

        {/* Natureza (hide for subitems) */}
        {!form.parent_id && (
          <div className="flex gap-1 mb-3">
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
        )}

        {/* Saída tipo */}
        {form.natureza === 'saida' && (
          <div className="flex gap-1 mb-3">
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
        )}

        {/* Cartão */}
        {form.natureza === 'saida' && form.saida_tipo === 'cartao' && (
          <select
            value={form.cartao_id}
            onChange={e => set('cartao_id', e.target.value)}
            className="w-full bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none mb-2"
          >
            <option value="">Selecione o cartão</option>
            {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        )}

        {/* Nome + Valor */}
        <div className="flex gap-2 mb-2">
          <input
            placeholder="Nome"
            value={form.nome}
            onChange={e => set('nome', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onAdd()}
            autoFocus
            className="flex-1 bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand/60"
          />
          {!form.is_grupo && (
            <input
              placeholder="R$ 0,00"
              value={form.valor}
              onChange={e => set('valor', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onAdd()}
              className="w-28 bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand/60 tabular-nums"
            />
          )}
        </div>

        {/* Categoria */}
        {categorias.filter(c => c.natureza === form.natureza).length > 0 && (
          <select
            value={form.categoria_id}
            onChange={e => set('categoria_id', e.target.value)}
            className="w-full bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none mb-2"
          >
            <option value="">Sem categoria</option>
            {categorias.filter(c => c.natureza === form.natureza).map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        )}

        {/* Grupo toggle */}
        <label className="flex items-center gap-2 text-xs text-ink-3 cursor-pointer mb-3 select-none">
          <input
            type="checkbox"
            checked={form.is_grupo}
            onChange={e => set('is_grupo', e.target.checked)}
            className="accent-brand"
          />
          Criar como grupo (soma dos subitens)
        </label>

        {/* Recorrência */}
        <div className="border-t border-line pt-3 mb-3">
          <label className="flex items-center gap-2 text-xs text-ink-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.repetir}
              onChange={e => set('repetir', e.target.checked)}
              className="accent-brand"
            />
            Repetir este lançamento
          </label>

          {form.repetir && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-1">
                {(['mensal','quinzenal','semanal'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => set('repeticao_freq', f)}
                    className={[
                      'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                      form.repeticao_freq === f
                        ? 'border-brand/50 text-brand'
                        : 'border-line text-ink-3 hover:text-white',
                    ].join(' ')}
                  >
                    {f === 'mensal' ? 'Mensal' : f === 'quinzenal' ? 'Quinzenal' : 'Semanal'}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-ink-3">
                Repete indefinidamente (aparece automaticamente nos próximos meses ao navegar).
              </p>
              <div>
                <div className="text-[10px] text-ink-3 mb-1">Repetir até (opcional)</div>
                <input
                  type="date"
                  value={form.repeticao_ate}
                  onChange={e => set('repeticao_ate', e.target.value)}
                  min={`${anoAno}-${String(monthNum).padStart(2, '0')}-${String(dia).padStart(2, '0')}`}
                  className="w-full bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand/60"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm text-ink-3 border border-line rounded-lg hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onAdd}
            disabled={saving || !form.nome.trim()}
            className="flex-1 py-1.5 text-sm font-medium bg-brand text-black rounded-lg hover:bg-[#38bdf8] disabled:opacity-40 transition-colors"
          >
            {saving ? 'Salvando…' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}
