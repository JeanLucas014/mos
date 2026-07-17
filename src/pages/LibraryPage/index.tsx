import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { useBooks, type AddBookInput } from '../../hooks/useBooks'
import type { Book, BookStatus } from './types'
import { SECTIONS } from './constants'
import { Skeleton } from './components/Skeleton'
import { AddModal } from './components/AddModal'
import { EditModal } from './components/EditModal'
import { BookCard } from './components/BookCard'
import { VirtualBookList, type BookListRow } from './components/VirtualBookList'
import { FiltersBar } from './components/FiltersBar'
import { useLibraryFilters } from './hooks/useLibraryFilters'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'

/* ── Page ──────────────────────────────────────────────────────────── */
export function LibraryPage() {
  const { data: books, isLoading, isError, addBook, updateBook, deleteBook } = useBooks()
  const [showAdd, setShowAdd]     = useState(false)
  const [editBook, setEditBook]   = useState<Book | null>(null)
  const [viewMode, setViewMode]   = useState<'grid' | 'list'>('grid')
  const [gridCols, setGridCols]   = useState<number>(4)

  const allBooks = books ?? []
  const total     = allBooks.length
  const readCount = allBooks.filter((b) => b.status === 'lido').length

  /* ── Filters ── */
  const {
    filterStatus, setFilterStatus,
    filterYear, setFilterYear,
    filterFavorites, setFilterFavorites,
    sortBy, setSortBy,
    years,
    filtered,
    useGroups,
  } = useLibraryFilters(allBooks)

  /* Handlers */
  function handleAdd(input: AddBookInput) {
    addBook.mutate(input, { onSuccess: () => setShowAdd(false) })
  }

  function handleSave(data: Partial<Book> & { id: string; coverFile?: File | null }) {
    updateBook.mutate(data, { onSuccess: () => setEditBook(null) })
  }

  function handleStatus(id: string, status: BookStatus) {
    updateBook.mutate({ id, status })
  }

  function handleProgress(id: string, progress: number) {
    updateBook.mutate({ id, progress })
  }

  function handleFavorite(id: string, favorite: boolean) {
    updateBook.mutate({ id, favorite })
  }

  function handleDelete(id: string) {
    deleteBook.mutate(id)
  }

  /* Linhas achatadas pra lista virtualizada (com ou sem cabeçalhos de seção) */
  const listRows: BookListRow[] = useGroups
    ? SECTIONS.flatMap(({ key, label, color }) => {
        const section = filtered.filter((b) => b.status === key)
        if (section.length === 0) return []
        return [
          { type: 'header' as const, key: `h-${key}`, label, color, count: section.length },
          ...section.map((book) => ({ type: 'book' as const, key: book.id, book })),
        ]
      })
    : filtered.map((book) => ({ type: 'book' as const, key: book.id, book }))

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1
            className="text-2xl lg:text-[30px]"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}
          >
            Biblioteca
          </h1>
          <p className="text-ink-2 mt-1 text-sm">
            {isLoading
              ? 'Carregando...'
              : `${total} livro${total !== 1 ? 's' : ''} · ${readCount} lido${readCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-brand text-white rounded-input px-4 font-semibold text-sm hover:brightness-110 active:scale-[.97] transition-all flex-shrink-0"
          style={{ minHeight: 44 }}
        >
          + Adicionar
        </button>
      </div>

      <FiltersBar
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterYear={filterYear}
        setFilterYear={setFilterYear}
        years={years}
        sortBy={sortBy}
        setSortBy={setSortBy}
        filterFavorites={filterFavorites}
        setFilterFavorites={setFilterFavorites}
        viewMode={viewMode}
        setViewMode={setViewMode}
        gridCols={gridCols}
        setGridCols={setGridCols}
      />

      {isError && (
        <ErrorState message="Não foi possível carregar sua biblioteca. Tente novamente." />
      )}

      {isLoading && <Skeleton />}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={<BookOpen size={40} className="text-ink-3" />}
          title={total === 0 ? 'Nenhum livro ainda.\nAdicione o primeiro à sua estante.' : 'Nenhum livro encontrado com esses filtros.'}
          action={total === 0 ? { label: '+ Adicionar livro', onClick: () => setShowAdd(true) } : undefined}
        />
      )}

      {/* Grid or sectioned */}
      {!isLoading && filtered.length > 0 && (
        viewMode === 'list' ? (
          <div className="mt-6">
            <VirtualBookList
              rows={listRows}
              onFavorite={handleFavorite}
              onDelete={handleDelete}
              onClick={setEditBook}
            />
          </div>
        ) : useGroups ? (
          SECTIONS.map(({ key, label, color }) => {
            const section = filtered.filter((b) => b.status === key)
            if (section.length === 0) return null
            return (
              <div key={key} className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15 }}>{label}</h2>
                  <span className="text-ink-3 ml-1" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                    {section.length}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`, gap: 12 }}>
                  {section.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onStatus={handleStatus}
                      onProgress={handleProgress}
                      onFavorite={handleFavorite}
                      onDelete={handleDelete}
                      onClick={setEditBook}
                    />
                  ))}
                </div>
              </div>
            )
          })
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`, gap: 12 }}>
            {filtered.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onStatus={handleStatus}
                onProgress={handleProgress}
                onFavorite={handleFavorite}
                onDelete={handleDelete}
                onClick={setEditBook}
              />
            ))}
          </div>
        )
      )}

      {/* Modals */}
      {showAdd && (
        <AddModal
          onAdd={handleAdd}
          onClose={() => setShowAdd(false)}
          isPending={addBook.isPending}
        />
      )}
      {editBook && (
        <EditModal
          book={editBook}
          onSave={handleSave}
          onClose={() => setEditBook(null)}
          isPending={updateBook.isPending}
        />
      )}
    </div>
  )
}
