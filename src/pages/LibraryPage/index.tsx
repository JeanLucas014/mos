import { useState } from 'react'
import { BookOpen, Heart } from 'lucide-react'
import { useBooks, type AddBookInput } from '../../hooks/useBooks'
import type { Book, BookStatus } from './types'
import { STATUS_CFG, SECTIONS, SORT_OPTIONS } from './constants'
import { hashGradient } from './utils'
import { Stars } from './components/Stars'
import { Skeleton } from './components/Skeleton'
import { AddModal } from './components/AddModal'
import { EditModal } from './components/EditModal'

/* ── BookCard ──────────────────────────────────────────────────────── */
function BookCard({
  book,
  onStatus,
  onProgress,
  onFavorite,
  onDelete,
  onClick,
}: {
  book: Book
  onStatus: (id: string, s: BookStatus) => void
  onProgress: (id: string, p: number) => void
  onFavorite: (id: string, fav: boolean) => void
  onDelete: (id: string) => void
  onClick: (book: Book) => void
}) {
  const st = (book.status as BookStatus) in STATUS_CFG ? (book.status as BookStatus) : 'quero_ler'
  const cfg = STATUS_CFG[st]

  return (
    <div
      className="group relative flex flex-col rounded-xl overflow-hidden border border-line bg-bg-2 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-white/10 cursor-pointer"
      onClick={() => onClick(book)}
    >
      {/* Cover */}
      <div style={{ aspectRatio: '2/3', position: 'relative', flexShrink: 0 }}>
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%', height: '100%',
              background: hashGradient(book.title),
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '12px 10px', gap: 8,
            }}
          >
            <BookOpen size={26} color="rgba(255,255,255,.8)" />
            <span style={{
              fontFamily: 'Sora, sans-serif', fontWeight: 700,
              fontSize: 11, color: 'rgba(255,255,255,.9)',
              textAlign: 'center', lineHeight: 1.35, wordBreak: 'break-word',
            }}>
              {book.title}
            </span>
          </div>
        )}

        {/* Favorite heart */}
        <button
          onClick={(e) => { e.stopPropagation(); onFavorite(book.id, !book.favorite) }}
          className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{
            background: book.favorite ? 'rgba(248,113,113,.22)' : 'rgba(0,0,0,.4)',
            color: book.favorite ? '#f87171' : 'rgba(255,255,255,.3)',
            fontSize: 14,
          }}
          title={book.favorite ? 'Remover dos favoritos' : 'Favoritar'}
        >
          <Heart size={14} fill={book.favorite ? '#f87171' : 'none'} color={book.favorite ? '#f87171' : 'rgba(255,255,255,.3)'} />
        </button>

        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (window.confirm(`Remover "${book.title}"?`)) onDelete(book.id)
          }}
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: 'rgba(248,113,113,.22)', color: '#f87171' }}
          title="Remover"
        >
          ×
        </button>

        {/* Format badge */}
        {book.format && (
          <div
            className="absolute bottom-1.5 right-1.5"
            style={{
              fontSize: 8, fontWeight: 700, fontFamily: 'Manrope, sans-serif',
              background: 'rgba(0,0,0,.65)', color: '#aaa',
              padding: '2px 5px', borderRadius: 4, letterSpacing: '.03em',
            }}
          >
            {book.format}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="line-clamp-2"
          style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 12, color: '#fff', lineHeight: 1.35 }}
        >
          {book.title}
        </div>
        {book.author && (
          <div style={{ fontSize: 10, color: 'var(--text2)', fontFamily: 'Manrope, sans-serif', lineHeight: 1.3 }}>
            {book.author}
          </div>
        )}

        {/* Stars */}
        {book.rating ? <Stars value={book.rating} /> : null}

        {/* Status selector */}
        <select
          value={book.status}
          onChange={(e) => { e.stopPropagation(); onStatus(book.id, e.target.value as BookStatus) }}
          style={{
            marginTop: 2,
            background: cfg.bg,
            border: 'none',
            borderRadius: 6,
            color: cfg.color,
            fontSize: 10,
            fontWeight: 600,
            padding: '4px 6px',
            cursor: 'pointer',
            width: '100%',
            outline: 'none',
            fontFamily: 'Manrope, sans-serif',
          }}
        >
          <option value="lendo">Lendo</option>
          <option value="lido">Lido</option>
          <option value="quero_ler">Quero ler</option>
          <option value="nao_finalizado">Não finalizado</option>
        </select>

        {/* Progress — for 'lendo' */}
        {book.status === 'lendo' && (
          <div style={{ marginTop: 2 }}>
            {book.total_pages && book.pages_read ? (
              <>
                <div style={{ position: 'relative', height: 3, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      position: 'absolute', top: 0, left: 0, height: '100%',
                      width: `${Math.min(100, (book.pages_read / book.total_pages) * 100)}%`,
                      background: '#0EA5E9', borderRadius: 4,
                    }}
                  />
                </div>
                <div style={{ fontSize: 9, color: '#0EA5E9', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                  {book.pages_read}/{book.total_pages}p
                </div>
              </>
            ) : (
              <>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={book.progress ?? 0}
                  onChange={(e) => onProgress(book.id, parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#0EA5E9', cursor: 'pointer', height: 3 }}
                />
                <div style={{ fontSize: 9, color: '#0EA5E9', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', marginTop: 1 }}>
                  {book.progress ?? 0}%
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


/* ── BookRow (list mode) ────────────────────────────────────────────── */
function BookRow({ book, onFavorite, onDelete, onClick }: {
  book: Book
  onFavorite: (id: string, fav: boolean) => void
  onDelete: (id: string) => void
  onClick: (book: Book) => void
}) {
  const st = (book.status as BookStatus) in STATUS_CFG
    ? (book.status as BookStatus) : 'quero_ler'
  const cfg = STATUS_CFG[st]
  return (
    <div
      className="group flex items-center gap-3 px-4 py-3 border-b border-line hover:bg-bg-3 cursor-pointer transition-colors"
      onClick={() => onClick(book)}
    >
      {/* Mini capa */}
      <div style={{ width: 32, height: 48, flexShrink: 0, borderRadius: 4, overflow: 'hidden' }}>
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%', background: hashGradient(book.title),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={12} color="rgba(255,255,255,.7)" />
          </div>
        )}
      </div>

      {/* Título + autor */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="truncate" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 13, color: '#fff' }}>
          {book.title}
        </div>
        {book.author && (
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>{book.author}</div>
        )}
      </div>

      {/* Categoria */}
      {book.category && (
        <span className="hidden sm:inline text-[10px] text-[#555] shrink-0">{book.category}</span>
      )}

      {/* Stars */}
      <div className="hidden sm:flex shrink-0"><Stars value={book.rating} /></div>

      {/* Status badge */}
      <span style={{
        fontSize: 10, fontWeight: 700, color: cfg.color,
        background: cfg.bg, padding: '3px 8px', borderRadius: 6, flexShrink: 0,
      }}>
        {cfg.label}
      </span>

      {/* Favorito */}
      <button
        onClick={e => { e.stopPropagation(); onFavorite(book.id, !book.favorite) }}
        style={{ color: book.favorite ? '#f87171' : '#333', flexShrink: 0 }}
      >
        <Heart size={13} fill={book.favorite ? '#f87171' : 'none'} color={book.favorite ? '#f87171' : '#333'} />
      </button>

      {/* Delete */}
      <button
        onClick={e => {
          e.stopPropagation()
          if (window.confirm(`Remover "${book.title}"?`)) onDelete(book.id)
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-[#555] hover:text-red-400 text-base w-6 flex items-center justify-center shrink-0"
      >×</button>
    </div>
  )
}

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
