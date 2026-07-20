import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { Plus } from 'lucide-react'
import { useShopping } from '../hooks/useShopping'
import { useShoppingCategories } from '../hooks/useShoppingCategories'
import { HelpButton } from '@/components/help/HelpButton'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

function ShoppingSkeleton() {
  return (
    <div className="bg-bg-2 border border-line rounded-card p-4 mt-5 space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3" style={{ minHeight: 44 }}>
          <Skeleton className="w-5 h-5 rounded-md flex-shrink-0" />
          <Skeleton className="h-3 flex-1" style={{ maxWidth: `${50 + i * 15}%` }} />
        </div>
      ))}
    </div>
  )
}

export function ShoppingPage() {
  const { data: items, isLoading, isError, addItem, toggleItem, deleteItem, clearDone } =
    useShopping()
  const { data: categoriesData, isLoading: categoriesLoading, addCategory } = useShoppingCategories()

  const categories = categoriesData ?? []
  const CATEGORIES = ['Todos', ...categories.map(c => c.nome)]
  const ADD_CATEGORIES = categories.map(c => c.nome)
  const CAT_COLORS: Record<string, string> = Object.fromEntries(categories.map(c => [c.nome, c.cor]))

  const [draft, setDraft]         = useState('')
  const [activeTab, setActiveTab] = useState('Todos')
  const [draftCat, setDraftCat]   = useState('Geral')
  const [addingCat, setAddingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleAddCategory(e?: FormEvent) {
    e?.preventDefault()
    const nome = newCatName.trim()
    if (!nome || categories.some(c => c.nome.toLowerCase() === nome.toLowerCase())) return
    addCategory.mutate(nome)
    setNewCatName('')
    setAddingCat(false)
  }

  // Quando muda de aba, pré-seleciona a categoria no form
  function handleTabChange(tab: string) {
    setActiveTab(tab)
    if (tab !== 'Todos') setDraftCat(tab)
  }

  const allItems = items ?? []

  const filtered = activeTab === 'Todos'
    ? allItems
    : allItems.filter(i => i.category === activeTab)

  const sorted = [...filtered].sort((a, b) => {
    if (a.done === b.done) return 0
    return a.done ? 1 : -1
  })

  const doneItems = filtered.filter(i => i.done)
  const totalPending = allItems.filter(i => !i.done).length

  function handleAdd(e?: FormEvent) {
    e?.preventDefault()
    const t = draft.trim()
    if (!t) return
    addItem.mutate({ title: t, category: draftCat })
    setDraft('')
    inputRef.current?.focus()
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd()
  }

  function handleClearDone() {
    if (!doneItems.length) return
    clearDone.mutate(doneItems.map(i => i.id))
  }

  return (
    <div className="pb-[104px] lg:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1
              className="text-2xl lg:text-[30px]"
              style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}
            >
              Lista de compras
            </h1>
            <HelpButton pageId="compras" />
          </div>
          <p className="text-ink-2 mt-1 text-sm">
            {isLoading ? 'Carregando...' : `${totalPending} item${totalPending !== 1 ? 'ns' : ''} pendente${totalPending !== 1 ? 's' : ''}`}
          </p>
        </div>

        {doneItems.length > 0 && !isLoading && (
          <button
            onClick={handleClearDone}
            disabled={clearDone.isPending}
            className="flex-shrink-0 text-ink-3 hover:text-red-400 transition-colors text-xs flex items-center gap-1.5 px-3 py-2 rounded-input hover:bg-bg-3"
            style={{ minHeight: 44, fontFamily: 'Manrope, sans-serif' }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Limpar concluídos
          </button>
        )}
      </div>

      {isError && <ErrorState message="Não foi possível carregar sua lista de compras. Tente novamente." />}
      {(isLoading || categoriesLoading) && <ShoppingSkeleton />}

      {!isLoading && !categoriesLoading && (
        <>
          {/* ── Abas de categoria ── */}
          <div className="flex items-center gap-1 mt-5 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => {
              const catItems = cat === 'Todos' ? allItems : allItems.filter(i => i.category === cat)
              const pending  = catItems.filter(i => !i.done).length
              const isActive = activeTab === cat
              return (
                <button
                  key={cat}
                  onClick={() => handleTabChange(cat)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0"
                  style={{
                    background: isActive ? (cat === 'Todos' ? '#0EA5E9' : CAT_COLORS[cat]) + '22' : 'transparent',
                    border: `1px solid ${isActive ? (cat === 'Todos' ? '#0EA5E9' : CAT_COLORS[cat]) + '80' : 'var(--border)'}`,
                    color: isActive ? (cat === 'Todos' ? '#0EA5E9' : CAT_COLORS[cat]) : 'var(--text3)',
                  }}
                >
                  {cat !== 'Todos' && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: CAT_COLORS[cat] }}
                    />
                  )}
                  {cat}
                  {pending > 0 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: isActive ? (cat === 'Todos' ? '#0EA5E9' : CAT_COLORS[cat]) + '33' : 'var(--border)',
                        color: isActive ? (cat === 'Todos' ? '#0EA5E9' : CAT_COLORS[cat]) : 'var(--text3)',
                      }}
                    >
                      {pending}
                    </span>
                  )}
                </button>
              )
            })}

            {/* ── Nova categoria ── */}
            {addingCat ? (
              <form onSubmit={handleAddCategory} className="flex items-center gap-1 flex-shrink-0">
                <input
                  autoFocus
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') { setAddingCat(false); setNewCatName('') } }}
                  onBlur={() => { if (!newCatName.trim()) setAddingCat(false) }}
                  placeholder="Nome da categoria"
                  className="bg-bg border border-line rounded-lg px-2 text-ink text-xs placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
                  style={{ height: 30, width: 140 }}
                />
                <button
                  type="submit"
                  disabled={!newCatName.trim() || addCategory.isPending}
                  className="text-brand text-xs font-semibold px-2 disabled:opacity-40"
                  style={{ height: 30 }}
                >
                  Criar
                </button>
              </form>
            ) : (
              <button
                onClick={() => setAddingCat(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap text-ink-3 hover:text-ink border border-dashed border-line transition-colors flex-shrink-0"
                title="Nova categoria"
              >
                <Plus size={12} /> Categoria
              </button>
            )}
          </div>

          {/* ── Lista ── */}
          <div className="bg-bg-2 border border-line rounded-card mt-3 overflow-hidden">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-ink-3">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" opacity={0.35}>
                  <path d="M6 7h2.5l2.5 16h14l2.8-10H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="13.5" cy="28" r="2" fill="currentColor" />
                  <circle cx="23.5" cy="28" r="2" fill="currentColor" />
                </svg>
                <p className="text-sm">
                  {activeTab === 'Todos' ? 'Nenhum item na lista.' : `Nenhum item em ${activeTab}.`}
                </p>
              </div>
            ) : (
              <ul>
                {sorted.map((item) => {
                  const cat = item.category ?? 'Geral'
                  return (
                    <li
                      key={item.id}
                      className={['group flex items-center gap-3 px-4 transition-colors', item.done ? 'hover:bg-bg-3/40' : 'hover:bg-bg-3'].join(' ')}
                      style={{ minHeight: 52, borderBottom: '1px solid rgba(255,255,255,.04)' }}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleItem.mutate({ id: item.id, done: !item.done })}
                        className={['w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors', item.done ? 'bg-brand border-brand' : 'border-ink-3 hover:border-ink-2'].join(' ')}
                        style={{ minWidth: 20 }}
                      >
                        {item.done && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>

                      {/* Título + badge de categoria (só na aba Todos) */}
                      <span className={['flex-1 text-sm py-2 min-w-0 flex items-center gap-2', item.done ? 'line-through text-ink-3' : 'text-ink'].join(' ')}>
                        <span className="truncate">{item.title}</span>
                        {activeTab === 'Todos' && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ background: CAT_COLORS[cat] + '22', color: CAT_COLORS[cat] }}
                          >
                            {cat}
                          </span>
                        )}
                      </span>

                      {/* Delete */}
                      <button
                        onClick={() => deleteItem.mutate(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red-400 transition-all text-base flex-shrink-0 w-8 h-8 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            {/* ── Input ── */}
            <form
              onSubmit={handleAdd}
              className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 border-t border-line
                         fixed bottom-0 left-0 right-0 z-20 lg:static"
              style={{ background: 'var(--bg2)' }}
            >
              {/* Linha 1 mobile: select */}
              <div className="flex items-center gap-2">
                <select
                  value={draftCat}
                  onChange={e => setDraftCat(e.target.value)}
                  className="flex-1 sm:flex-none bg-bg border border-line rounded-input px-2
                             text-ink text-sm focus:outline-none focus:border-brand transition-colors"
                  style={{ minHeight: 40 }}
                >
                  {ADD_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {/* Linha 2 mobile: input + botão adicionar */}
              <div className="flex items-center gap-2 flex-1">
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Novo item…"
                  className="flex-1 bg-bg border border-line rounded-input px-3 text-ink text-sm
                             placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
                  style={{ minHeight: 40 }}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || addItem.isPending}
                  className="bg-brand text-white rounded-input px-4 font-semibold text-sm
                             hover:brightness-110 active:scale-[.97] transition-all disabled:opacity-40 flex-shrink-0"
                  style={{ minHeight: 40 }}
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
