import { BookOpen, Heart } from 'lucide-react'
import type { Book, BookStatus } from '../types'
import { STATUS_CFG } from '../constants'
import { hashGradient } from '../utils'
import { Stars } from './Stars'

/* ── BookRow (list mode) ────────────────────────────────────────────── */
export function BookRow({ book, onFavorite, onDelete, onClick }: {
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
