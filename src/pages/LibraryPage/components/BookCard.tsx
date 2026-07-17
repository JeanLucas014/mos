import { BookOpen, Heart } from 'lucide-react'
import type { Book, BookStatus } from '../types'
import { STATUS_CFG } from '../constants'
import { hashGradient } from '../utils'
import { Stars } from './Stars'

/* ── BookCard ──────────────────────────────────────────────────────── */
export function BookCard({
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
              background: 'rgba(0,0,0,.65)', color: 'var(--text2)',
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
                      background: 'var(--blue)', borderRadius: 4,
                    }}
                  />
                </div>
                <div style={{ fontSize: 9, color: 'var(--blue)', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
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
                  style={{ width: '100%', accentColor: 'var(--blue)', cursor: 'pointer', height: 3 }}
                />
                <div style={{ fontSize: 9, color: 'var(--blue)', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', marginTop: 1 }}>
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
