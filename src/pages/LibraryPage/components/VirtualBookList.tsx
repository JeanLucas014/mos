import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Book } from '../types'
import { BookRow } from './BookRow'

export type BookListRow =
  | { type: 'header'; key: string; label: string; color: string; count: number }
  | { type: 'book'; key: string; book: Book }

interface Props {
  rows: BookListRow[]
  onFavorite: (id: string, fav: boolean) => void
  onDelete: (id: string) => void
  onClick: (book: Book) => void
}

/** Lista virtualizada (modo lista da Biblioteca) — suporta tanto a versão
 * agrupada por status (com linhas de cabeçalho) quanto a lista plana. */
export function VirtualBookList({ rows, onFavorite, onDelete, onClick }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => (rows[i].type === 'header' ? 44 : 73),
    overscan: 8,
  })

  return (
    <div
      ref={parentRef}
      className="bg-bg-2 border border-line rounded-xl overflow-y-auto"
      style={{ maxHeight: '70vh' }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
        {virtualizer.getVirtualItems().map((vi) => {
          const row = rows[vi.index]
          return (
            <div
              key={row.key}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%',
                transform: `translateY(${vi.start}px)`,
              }}
            >
              {row.type === 'header' ? (
                <div className="flex items-center gap-2 px-4 py-3 border-b border-line" style={{ background: 'var(--bg2)' }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.color }} />
                  <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15 }}>{row.label}</h2>
                  <span className="text-ink-3 ml-1" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                    {row.count}
                  </span>
                </div>
              ) : (
                <BookRow book={row.book} onFavorite={onFavorite} onDelete={onDelete} onClick={onClick} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
