import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { useShopping } from '../hooks/useShopping'

/* ── Skeleton ──────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="bg-bg-2 border border-line rounded-card p-4 mt-5 space-y-2 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3" style={{ minHeight: 44 }}>
          <div className="w-5 h-5 rounded-md bg-bg-3 flex-shrink-0" />
          <div className="h-3 bg-bg-3 rounded flex-1" style={{ maxWidth: `${50 + i * 15}%` }} />
        </div>
      ))}
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────────────── */
export function ShoppingPage() {
  const { data: items, isLoading, isError, error, addItem, toggleItem, deleteItem, clearDone } =
    useShopping()
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  /* sorted: not done → done */
  const sorted = [...(items ?? [])].sort((a, b) => {
    if (a.done === b.done) return 0
    return a.done ? 1 : -1
  })

  const pendingCount = (items ?? []).filter((i) => !i.done).length
  const doneItems    = (items ?? []).filter((i) => i.done)

  function handleAdd(e?: FormEvent) {
    e?.preventDefault()
    const t = draft.trim()
    if (!t) return
    addItem.mutate(t)
    setDraft('')
    inputRef.current?.focus()
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd()
  }

  function handleClearDone() {
    if (!doneItems.length) return
    clearDone.mutate(doneItems.map((i) => i.id))
  }

  return (
    /* Extra bottom padding on mobile so content doesn't hide behind fixed input */
    <div className="pb-[88px] lg:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl lg:text-[30px]"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}
          >
            Lista de compras
          </h1>
          <p className="text-ink-2 mt-1 text-sm">
            {isLoading
              ? 'Carregando...'
              : `${pendingCount} item${pendingCount !== 1 ? 'ns' : ''} no carrinho`}
          </p>
        </div>

        {/* Clear done — only when there are done items */}
        {doneItems.length > 0 && !isLoading && (
          <button
            onClick={handleClearDone}
            disabled={clearDone.isPending}
            className="flex-shrink-0 text-ink-3 hover:text-red-400 transition-colors text-xs flex items-center gap-1.5 px-3 py-2 rounded-input hover:bg-bg-3"
            style={{ minHeight: 44, fontFamily: 'Manrope, sans-serif' }}
            title="Remover todos os itens concluídos"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Limpar concluídos
          </button>
        )}
      </div>

      {isError && (
        <p className="text-red-400 text-sm mt-3">Erro: {(error as Error).message}</p>
      )}

      {isLoading && <Skeleton />}

      {/* List card */}
      {!isLoading && (
        <div className="bg-bg-2 border border-line rounded-card mt-5 overflow-hidden">
          {/* Empty state */}
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-ink-3">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" opacity={0.35}>
                <path d="M6 7h2.5l2.5 16h14l2.8-10H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="13.5" cy="28" r="2" fill="currentColor" />
                <circle cx="23.5" cy="28" r="2" fill="currentColor" />
              </svg>
              <p className="text-sm">Nenhum item na lista.</p>
            </div>
          ) : (
            <ul>
              {sorted.map((item) => (
                <li
                  key={item.id}
                  className={[
                    'group flex items-center gap-3 px-4 transition-colors',
                    item.done ? 'hover:bg-bg-3/40' : 'hover:bg-bg-3',
                  ].join(' ')}
                  style={{ minHeight: 52, borderBottom: '1px solid rgba(255,255,255,.04)' }}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleItem.mutate({ id: item.id, done: !item.done })}
                    className={[
                      'w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors',
                      item.done
                        ? 'bg-brand border-brand'
                        : 'border-ink-3 hover:border-ink-2',
                    ].join(' ')}
                    style={{ minWidth: 20 }}
                    aria-label={item.done ? 'Desmarcar' : 'Marcar'}
                  >
                    {item.done && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  {/* Title */}
                  <span
                    className={[
                      'flex-1 text-sm py-2 min-w-0',
                      item.done ? 'line-through text-ink-3' : 'text-ink',
                    ].join(' ')}
                  >
                    {item.title}
                  </span>

                  {/* Delete */}
                  <button
                    onClick={() => deleteItem.mutate(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red-400 transition-all text-base flex-shrink-0 w-8 h-8 flex items-center justify-center"
                    title="Remover"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* ── Input — desktop: inside card, mobile: fixed bottom ── */}
          <form
            onSubmit={handleAdd}
            /* On desktop: normal in-card form, separated by border */
            /* On mobile: fixed to bottom of viewport (z-20, below sidebar z-30) */
            className="lg:flex lg:items-center lg:gap-2 lg:px-4 lg:py-3 lg:border-t lg:border-line lg:static
                       fixed bottom-0 left-0 right-0 z-20 flex items-center gap-2 px-4 py-3 border-t border-line lg:rounded-none"
            style={{ background: '#111111' }}
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Novo item…"
              className="flex-1 bg-bg border border-line rounded-input px-3 text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
              style={{ minHeight: 44 }}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!draft.trim() || addItem.isPending}
              className="bg-brand text-white rounded-input px-4 font-semibold text-sm hover:brightness-110 active:scale-[.97] transition-all disabled:opacity-40 flex-shrink-0"
              style={{ minHeight: 44 }}
            >
              Adicionar
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
