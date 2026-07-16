import { useState, type FormEvent } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useSportShopping } from '../../../hooks/useSportShopping'
import { Section } from './Section'

/* ══════════════════════════════════════════════════════════════════
   SECTION 4 — LISTA DE COMPRAS
══════════════════════════════════════════════════════════════════ */
export function SportShoppingSection({ sport }: { sport: string }) {
  const { data: items = [], isLoading, addItem, toggleItem, deleteItem } = useSportShopping(sport as any)
  const [draft, setDraft] = useState('')
  const [addErr, setAddErr] = useState<string | null>(null)
  const sorted = [...items].sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    setAddErr(null)
    addItem.mutate(draft.trim(), { onSuccess: () => setDraft(''), onError: (err) => setAddErr((err as Error).message ?? 'Erro') })
  }

  return (
    <Section title="Lista de Compras" icon={<ShoppingBag size={16} />} count={items.filter((i) => !i.done).length + '/' + items.length} defaultOpen={false}>
      {isLoading ? (
        <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-10 bg-bg-3 rounded-input animate-pulse" />)}</div>
      ) : sorted.length === 0 ? (
        <p className="text-ink-3 text-sm text-center py-3">Lista vazia.</p>
      ) : (
        <div className="space-y-0.5 mb-4">
          {sorted.map((item) => (
            <div key={item.id} className="group flex items-center gap-3 px-3 py-2.5 rounded-input hover:bg-bg-3 transition-colors" style={{ minHeight: 44 }}>
              <button onClick={() => toggleItem.mutate({ id: item.id, done: !item.done })} className={['w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors', item.done ? 'bg-brand border-brand' : 'border-ink-3 hover:border-ink-2'].join(' ')}>
                {item.done && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
              <span className={`flex-1 text-sm ${item.done ? 'line-through text-ink-3' : 'text-ink'}`}>{item.title}</span>
              <button onClick={() => deleteItem.mutate(item.id)} aria-label="Excluir item" className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red-400 transition-opacity w-7 h-7 flex items-center justify-center text-sm flex-shrink-0">×</button>
            </div>
          ))}
        </div>
      )}
      {addErr && <div style={{ marginBottom: 8, padding: '6px 12px', borderRadius: 8, background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', fontSize: 12, color: '#f87171' }}>{addErr}</div>}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ex: Tênis novo…" className="flex-1 bg-bg border border-line rounded-input px-3 text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors" style={{ minHeight: 40 }} />
        <button type="submit" disabled={!draft.trim() || addItem.isPending} className="bg-brand text-white rounded-input px-4 text-sm font-semibold hover:brightness-110 disabled:opacity-40 transition-all flex-shrink-0" style={{ minHeight: 40 }}>+</button>
      </form>
    </Section>
  )
}
