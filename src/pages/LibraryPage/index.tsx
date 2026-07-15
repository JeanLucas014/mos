import { useState } from 'react'
import { BookOpen, Heart } from 'lucide-react'
import { useBooks, type AddBookInput } from '../../hooks/useBooks'
import type { Book, BookStatus } from './types'
import { SECTIONS, SORT_OPTIONS } from './constants'
import { Skeleton } from './components/Skeleton'
import { AddModal } from './components/AddModal'
import { EditModal } from './components/EditModal'
import { BookCard } from './components/BookCard'
import { BookRow } from './components/BookRow'

/* ── Page ──────────────────────────────────────────────────────────── */
export function LibraryPage() {
  const { data: books, isLoading, isError, error, addBook, updateBook, deleteBook } = useBooks()
  const [showAdd, setShowAdd]     = useState(false)
  const [editBook, setEditBook]   = useState<Book | null>(null)
  const [viewMode, setViewMode]   = useState<'grid' | 'list'>('grid')
  const [gridCols, setGridCols]   = useState<number>(4)

  /* ── Filters ── */
  const [filterStatus,    setFilterStatus]    = useState<string>('all')
  const [filterYear,      setFilterYear]      = useState<string>('all')
  const [filterFavorites, setFilterFavorites] = useState(false)
  const [sortBy,          setSortBy]          = useState<string>('created_at')

  const allBooks = books ?? []
  const total     = allBooks.length
  const readCount = allBooks.filter((b) => b.status === 'lido').length

  /* Compute years from data */
  const years = [...new Set(
    allBooks
      .map((b) => b.finished_at ?? b.started_at ?? b.created_at)
      .filter(Boolean)
      .map((d) => new Date(d!).getFullYear())
  )].sort((a, b) => b - a)

  /* Apply filters */
  let filtered = allBooks
  if (filterStatus !== 'all')   filtered = filtered.filter((b) => b.status === filterStatus)
  if (filterFavorites)          filtered = filtered.filter((b) => b.favorite)
  if (filterYear !== 'all') {
    const yr = parseInt(filterYear)
    filtered = filtered.filter((b) => {
      const d = b.finished_at ?? b.started_at ?? b.created_at
      return d ? new Date(d).getFullYear() === yr : false
    })
  }

  /* Sort */
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'title')        return (a.title ?? '').localeCompare(b.title ?? '')
    if (sortBy === 'rating')       return (b.rating ?? 0) - (a.rating ?? 0)
    if (sortBy === 'finished_at')  return (b.finished_at ?? '').localeCompare(a.finished_at ?? '')
    return (b.created_at ?? '').localeCompare(a.created_at ?? '')
  })

  /* Group by section (only if no status filter active) */
  const useGroups = filterStatus === 'all'

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

      {/* Filters bar */}
      <div className="flex flex-wrap gap-2 mb-5">
        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-bg-2 border border-line rounded-input px-3 text-ink-2 text-xs focus:outline-none focus:border-brand transition-colors"
          style={{ minHeight: 36, minWidth: 130, fontFamily: 'Manrope, sans-serif' }}
        >
          <option value="all">Todos os status</option>
          <option value="lendo">Lendo</option>
          <option value="lido">Lidos</option>
          <option value="quero_ler">Quero ler</option>
          <option value="nao_finalizado">Não finalizados</option>
        </select>

        {/* Year filter */}
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="bg-bg-2 border border-line rounded-input px-3 text-ink-2 text-xs focus:outline-none focus:border-brand transition-colors"
          style={{ minHeight: 36, minWidth: 110, fontFamily: 'Manrope, sans-serif' }}
        >
          <option value="all">Todos os anos</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-bg-2 border border-line rounded-input px-3 text-ink-2 text-xs focus:outline-none focus:border-brand transition-colors"
          style={{ minHeight: 36, minWidth: 140, fontFamily: 'Manrope, sans-serif' }}
        >
          {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {/* Favorites toggle */}
        <button
          onClick={() => setFilterFavorites((v) => !v)}
          className="flex items-center gap-1.5 rounded-input px-3 text-xs font-semibold transition-colors"
          style={{
            minHeight: 36,
            background: filterFavorites ? 'rgba(248,113,113,.14)' : 'var(--bg2)',
            border: filterFavorites ? '1px solid rgba(248,113,113,.4)' : '1px solid var(--border)',
            color: filterFavorites ? '#f87171' : 'var(--text2)',
            fontFamily: 'Manrope, sans-serif',
          }}
        >
          <Heart size={12} className="mr-1 inline" /> Favoritos
        </button>

        {/* Separador — só visível em desktop */}
        <div className="hidden sm:block sm:flex-1" />

        {/* Seletor de colunas (só no grid) */}
        {viewMode === 'grid' && (
          <div className="flex items-center gap-1">
            {[2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => setGridCols(n)}
                className="w-7 h-7 rounded text-xs font-bold transition-colors"
                style={{
                  background: gridCols === n ? '#0EA5E9' : 'var(--bg2)',
                  color: gridCols === n ? '#000' : 'var(--text3)',
                  border: '1px solid',
                  borderColor: gridCols === n ? '#0EA5E9' : 'var(--border)',
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {/* Toggle grid/lista */}
        <div className="flex rounded-lg border border-[#1f1f1f] overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className="px-2.5 h-7 flex items-center transition-colors"
            style={{ background: viewMode === 'grid' ? '#0EA5E9' : 'var(--bg2)' }}
            title="Grade"
          >
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
              <rect x="0" y="0" width="5" height="5" rx="1" fill={viewMode === 'grid' ? '#000' : 'var(--text3)'} />
              <rect x="7" y="0" width="5" height="5" rx="1" fill={viewMode === 'grid' ? '#000' : 'var(--text3)'} />
              <rect x="0" y="7" width="5" height="5" rx="1" fill={viewMode === 'grid' ? '#000' : 'var(--text3)'} />
              <rect x="7" y="7" width="5" height="5" rx="1" fill={viewMode === 'grid' ? '#000' : 'var(--text3)'} />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="px-2.5 h-7 flex items-center transition-colors"
            style={{ background: viewMode === 'list' ? '#0EA5E9' : 'var(--bg2)' }}
            title="Lista"
          >
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
              <rect x="0" y="1" width="12" height="2" rx="1" fill={viewMode === 'list' ? '#000' : 'var(--text3)'} />
              <rect x="0" y="5" width="12" height="2" rx="1" fill={viewMode === 'list' ? '#000' : 'var(--text3)'} />
              <rect x="0" y="9" width="12" height="2" rx="1" fill={viewMode === 'list' ? '#000' : 'var(--text3)'} />
            </svg>
          </button>
        </div>
      </div>

      {isError && (
        <p className="text-red-400 text-sm mt-3">Erro: {(error as Error).message}</p>
      )}

      {isLoading && <Skeleton />}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-3 text-ink-3 py-12">
          <BookOpen size={40} className="text-ink-3" />
          <p className="text-sm text-center">
            {total === 0
              ? 'Nenhum livro ainda.\nAdicione o primeiro à sua estante.'
              : 'Nenhum livro encontrado com esses filtros.'}
          </p>
          {total === 0 && (
            <button
              onClick={() => setShowAdd(true)}
              className="text-brand text-sm font-medium hover:brightness-110 transition-all mt-1"
            >
              + Adicionar livro
            </button>
          )}
        </div>
      )}

      {/* Grid or sectioned */}
      {!isLoading && filtered.length > 0 && (
        useGroups ? (
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
                {viewMode === 'list' ? (
                  <div className="bg-bg-2 border border-line rounded-xl overflow-hidden">
                    {section.map((book) => (
                      <BookRow
                        key={book.id}
                        book={book}
                        onFavorite={handleFavorite}
                        onDelete={handleDelete}
                        onClick={setEditBook}
                      />
                    ))}
                  </div>
                ) : (
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
                )}
              </div>
            )
          })
        ) : (
          viewMode === 'list' ? (
            <div className="bg-bg-2 border border-line rounded-xl overflow-hidden">
              {filtered.map((book) => (
                <BookRow
                  key={book.id}
                  book={book}
                  onFavorite={handleFavorite}
                  onDelete={handleDelete}
                  onClick={setEditBook}
                />
              ))}
            </div>
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
