import { useState, type FormEvent } from 'react'
import { useBooks } from '../hooks/useBooks'
import type { Database } from '../types/db'

type Book = Database['public']['Tables']['books']['Row']
type BookStatus = 'lendo' | 'lido' | 'quero_ler'

/* ── Status config ─────────────────────────────────────────────────── */
const STATUS_CFG: Record<BookStatus, { label: string; color: string; bg: string }> = {
  lendo:     { label: 'Lendo',     color: '#0EA5E9', bg: 'rgba(14,165,233,.14)' },
  lido:      { label: 'Lido',      color: '#34d399', bg: 'rgba(52,211,153,.12)' },
  quero_ler: { label: 'Quero ler', color: '#888',    bg: 'rgba(255,255,255,.06)' },
}

const SECTIONS: { key: BookStatus; label: string; icon: string }[] = [
  { key: 'lendo',     label: 'Lendo',     icon: '📖' },
  { key: 'quero_ler', label: 'Quero ler', icon: '📋' },
  { key: 'lido',      label: 'Lidos',     icon: '✅' },
]

/* cover placeholder gradients — cycled by book title hash */
const GRADIENTS = [
  'linear-gradient(145deg,#0EA5E9,#0369a1)',
  'linear-gradient(145deg,#a78bfa,#6d28d9)',
  'linear-gradient(145deg,#34d399,#047857)',
  'linear-gradient(145deg,#f59e0b,#b45309)',
  'linear-gradient(145deg,#f87171,#b91c1c)',
  'linear-gradient(145deg,#818cf8,#3730a3)',
]

function hashGradient(title: string) {
  let h = 0
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

/* ── Skeleton ─────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl overflow-hidden bg-bg-3 animate-pulse">
          <div style={{ aspectRatio: '2/3' }} />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-bg rounded w-3/4" />
            <div className="h-2 bg-bg rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── BookCard ─────────────────────────────────────────────────────── */
function BookCard({
  book,
  onStatus,
  onProgress,
  onDelete,
}: {
  book: Book
  onStatus: (id: string, s: BookStatus) => void
  onProgress: (id: string, p: number) => void
  onDelete: (id: string) => void
}) {
  const st = (book.status as BookStatus) in STATUS_CFG ? (book.status as BookStatus) : 'quero_ler'
  const cfg = STATUS_CFG[st]

  return (
    <div
      className="group relative flex flex-col rounded-xl overflow-hidden border border-line bg-bg-2 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-white/10"
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
            <span style={{ fontSize: 26, lineHeight: 1 }}>📚</span>
            <span style={{
              fontFamily: 'Sora, sans-serif', fontWeight: 700,
              fontSize: 11, color: 'rgba(255,255,255,.9)',
              textAlign: 'center', lineHeight: 1.35, wordBreak: 'break-word',
            }}>
              {book.title}
            </span>
          </div>
        )}
        {/* Delete overlay */}
        <button
          onClick={() => {
            if (window.confirm(`Remover "${book.title}"?`)) onDelete(book.id)
          }}
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: 'rgba(248,113,113,.22)', color: '#f87171' }}
          title="Remover"
        >
          ×
        </button>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
        <div
          className="line-clamp-2"
          style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 12, color: '#fff', lineHeight: 1.35 }}
        >
          {book.title}
        </div>
        {book.author && (
          <div style={{ fontSize: 10, color: '#888', fontFamily: 'Manrope, sans-serif', lineHeight: 1.3 }}>
            {book.author}
          </div>
        )}

        {/* Status selector */}
        <select
          value={book.status}
          onChange={(e) => onStatus(book.id, e.target.value as BookStatus)}
          style={{
            marginTop: 4,
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
          <option value="lendo">📖 Lendo</option>
          <option value="lido">✅ Lido</option>
          <option value="quero_ler">📋 Quero ler</option>
        </select>

        {/* Progress — only for 'lendo' */}
        {book.status === 'lendo' && (
          <div style={{ marginTop: 2 }}>
            <input
              type="range"
              min={0}
              max={100}
              value={book.progress ?? 0}
              onChange={(e) => onProgress(book.id, parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#0EA5E9', cursor: 'pointer', height: 3 }}
            />
            <div style={{
              fontSize: 9, color: '#0EA5E9',
              textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', marginTop: 1,
            }}>
              {book.progress ?? 0}%
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Add modal ────────────────────────────────────────────────────── */
function AddModal({
  onAdd,
  onClose,
  isPending,
}: {
  onAdd: (title: string, author: string, status: BookStatus) => void
  onClose: () => void
  isPending: boolean
}) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState<BookStatus>('quero_ler')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd(title.trim(), author.trim(), status)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.75)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-line p-6"
        style={{ background: '#111111' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 18 }}>
            Adicionar livro
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-input flex items-center justify-center text-ink-3 hover:text-ink hover:bg-bg-3 transition-colors text-lg"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
              Título *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Hábitos Atômicos"
              autoFocus
              className="w-full bg-bg border border-line rounded-input px-3 text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
              style={{ minHeight: 44 }}
            />
          </div>

          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
              Autor
            </label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Ex: James Clear"
              className="w-full bg-bg border border-line rounded-input px-3 text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
              style={{ minHeight: 44 }}
            />
          </div>

          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BookStatus)}
              className="w-full bg-bg border border-line rounded-input px-3 text-ink text-sm focus:outline-none focus:border-brand transition-colors"
              style={{ minHeight: 44 }}
            >
              <option value="quero_ler">📋 Quero ler</option>
              <option value="lendo">📖 Lendo</option>
              <option value="lido">✅ Lido</option>
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={!title.trim() || isPending}
              className="flex-1 bg-brand text-white rounded-input font-semibold text-sm hover:brightness-110 active:scale-[.97] transition-all disabled:opacity-40"
              style={{ minHeight: 44 }}
            >
              Adicionar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-bg-3 text-ink-2 rounded-input text-sm hover:text-ink transition-colors"
              style={{ minHeight: 44 }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────────────── */
export function LibraryPage() {
  const { data: books, isLoading, isError, error, addBook, updateBook, deleteBook } = useBooks()
  const [showModal, setShowModal] = useState(false)

  const total     = (books ?? []).length
  const readCount = (books ?? []).filter((b) => b.status === 'lido').length

  function handleAdd(title: string, author: string, status: BookStatus) {
    addBook.mutate({ title, author, status }, { onSuccess: () => setShowModal(false) })
  }

  function handleStatus(id: string, status: BookStatus) {
    updateBook.mutate({ id, status })
  }

  function handleProgress(id: string, progress: number) {
    updateBook.mutate({ id, progress })
  }

  function handleDelete(id: string) {
    deleteBook.mutate(id)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-1">
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
          onClick={() => setShowModal(true)}
          className="bg-brand text-white rounded-input px-4 font-semibold text-sm hover:brightness-110 active:scale-[.97] transition-all flex-shrink-0"
          style={{ minHeight: 44 }}
        >
          + Adicionar
        </button>
      </div>

      {isError && (
        <p className="text-red-400 text-sm mt-3">Erro: {(error as Error).message}</p>
      )}

      {/* Loading skeleton */}
      {isLoading && <Skeleton />}

      {/* Empty state */}
      {!isLoading && total === 0 && (
        <div className="mt-8 flex flex-col items-center gap-3 text-ink-3 py-12">
          <span style={{ fontSize: 40 }}>📚</span>
          <p className="text-sm text-center">Nenhum livro ainda.<br />Adicione o primeiro à sua estante.</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-brand text-sm font-medium hover:brightness-110 transition-all mt-1"
          >
            + Adicionar livro
          </button>
        </div>
      )}

      {/* Sections */}
      {!isLoading &&
        SECTIONS.map(({ key, label, icon }) => {
          const section = (books ?? []).filter((b) => b.status === key)
          if (section.length === 0) return null
          return (
            <div key={key} className="mt-7">
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: 16 }}>{icon}</span>
                <h2
                  style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15 }}
                >
                  {label}
                </h2>
                <span
                  className="text-ink-3 ml-1"
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
                >
                  {section.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {section.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onStatus={handleStatus}
                    onProgress={handleProgress}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )
        })}

      {/* Modal */}
      {showModal && (
        <AddModal
          onAdd={handleAdd}
          onClose={() => setShowModal(false)}
          isPending={addBook.isPending}
        />
      )}
    </div>
  )
}
