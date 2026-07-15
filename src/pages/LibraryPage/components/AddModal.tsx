import { useState, type FormEvent, type ChangeEvent } from 'react'
import type { AddBookInput } from '../../../hooks/useBooks'
import { BookFormFields, blankForm } from './BookFormFields'

/* ── Add modal ──────────────────────────────────────────────────────── */
export function AddModal({
  onAdd,
  onClose,
  isPending,
}: {
  onAdd: (input: AddBookInput) => void
  onClose: () => void
  isPending: boolean
}) {
  const [form, setForm] = useState<AddBookInput & { rating: number }>(blankForm)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  function handleCoverChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setForm((s) => ({ ...s, coverFile: file }))
    if (file) {
      const url = URL.createObjectURL(file)
      setCoverPreview(url)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    onAdd(form)
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
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 18 }}>Adicionar livro</h2>
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
              {isPending ? 'Salvando...' : 'Adicionar'}
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
