import { useState, type FormEvent, type ChangeEvent } from 'react'
import type { AddBookInput } from '../../../hooks/useBooks'
import type { Book } from '../types'
import { BookFormFields } from './BookFormFields'

/* ── Edit modal ─────────────────────────────────────────────────────── */
export function EditModal({
  book,
  onSave,
  onClose,
  isPending,
}: {
  book: Book
  onSave: (data: Partial<Book> & { id: string; coverFile?: File | null }) => void
  onClose: () => void
  isPending: boolean
}) {
  const [form, setForm] = useState<AddBookInput & { rating: number }>({
    title: book.title,
    author: book.author ?? '',
    status: book.status,
    favorite: book.favorite ?? false,
    category: book.category ?? null,
    total_pages: book.total_pages ?? undefined,
    pages_read: book.pages_read ?? undefined,
    started_at: book.started_at ?? null,
    finished_at: book.finished_at ?? null,
    rating: book.rating ?? 0,
    format: book.format ?? null,
    coverFile: null,
  })
  const [coverPreview, setCoverPreview] = useState<string | null>(book.cover_url ?? null)

  function handleCoverChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setForm((s) => ({ ...s, coverFile: file }))
    if (file) setCoverPreview(URL.createObjectURL(file))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave({
      id: book.id,
      title: form.title.trim(),
      author: form.author?.trim() || null,
      status: form.status,
      favorite: form.favorite ?? false,
      category: form.category ?? null,
      total_pages: form.total_pages ?? null,
      pages_read: form.pages_read ?? null,
      started_at: form.started_at ?? null,
      finished_at: form.finished_at ?? null,
      rating: form.rating || null,
      format: form.format ?? null,
      coverFile: form.coverFile,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.8)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-line p-6"
        style={{ background: 'var(--bg2)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 18 }}>Editar livro</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-input flex items-center justify-center text-ink-3 hover:text-ink hover:bg-bg-3 transition-colors text-lg"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-0">
          <BookFormFields
            state={form}
            setState={setForm}
            coverPreview={coverPreview}
            onCoverChange={handleCoverChange}
          />

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={!form.title.trim() || isPending}
              className="flex-1 bg-brand text-white rounded-input font-semibold text-sm hover:brightness-110 disabled:opacity-40 transition-all"
              style={{ minHeight: 44 }}
            >
              {isPending ? 'Salvando...' : 'Salvar'}
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
