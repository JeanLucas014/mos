import type { ChangeEvent } from 'react'
import { Camera } from 'lucide-react'
import type { AddBookInput } from '../../../hooks/useBooks'
import { FORMAT_OPTIONS, CATEGORY_OPTIONS } from '../constants'
import { StarPicker } from './Stars'

/* ── Book form fields (shared by add + edit) ───────────────────────── */
export function BookFormFields({
  state,
  setState,
  coverPreview,
  onCoverChange,
}: {
  state: AddBookInput & { rating: number }
  setState: (s: any) => void
  coverPreview: string | null
  onCoverChange: (e: ChangeEvent<HTMLInputElement>) => void
}) {
  const inputCls = 'w-full bg-bg border border-line rounded-input px-3 text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors'
  const inputH = { minHeight: 44 }

  return (
    <div className="space-y-3">
      {/* Title + Author */}
      <div>
        <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Título *</label>
        <input
          value={state.title}
          onChange={(e) => setState((s: any) => ({ ...s, title: e.target.value }))}
          placeholder="Ex: Hábitos Atômicos"
          className={inputCls}
          style={inputH}
        />
      </div>

      <div>
        <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Autor</label>
        <input
          value={state.author ?? ''}
          onChange={(e) => setState((s: any) => ({ ...s, author: e.target.value }))}
          placeholder="Ex: James Clear"
          className={inputCls}
          style={inputH}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Status</label>
          <select
            value={state.status}
            onChange={(e) => setState((s: any) => ({ ...s, status: e.target.value }))}
            className={inputCls}
            style={inputH}
          >
            <option value="quero_ler">Quero ler</option>
            <option value="lendo">Lendo</option>
            <option value="lido">Lido</option>
            <option value="nao_finalizado">Não finalizado</option>
          </select>
        </div>
        <div>
          <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Formato</label>
          <select
            value={state.format ?? ''}
            onChange={(e) => setState((s: any) => ({ ...s, format: e.target.value || null }))}
            className={inputCls}
            style={inputH}
          >
            <option value="">—</option>
            {FORMAT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Categoria</label>
        <select
          value={state.category ?? ''}
          onChange={(e) => setState((s: any) => ({ ...s, category: e.target.value || null }))}
          className={inputCls}
          style={inputH}
        >
          <option value="">—</option>
          {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Total de páginas</label>
          <input
            type="number"
            min={0}
            value={state.total_pages ?? ''}
            onChange={(e) => setState((s: any) => ({ ...s, total_pages: e.target.value ? parseInt(e.target.value) : null }))}
            placeholder="Ex: 300"
            className={inputCls}
            style={inputH}
          />
        </div>
        <div>
          <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Páginas lidas</label>
          <input
            type="number"
            min={0}
            value={state.pages_read ?? ''}
            onChange={(e) => setState((s: any) => ({ ...s, pages_read: e.target.value ? parseInt(e.target.value) : null }))}
            placeholder="Ex: 150"
            className={inputCls}
            style={inputH}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Início</label>
          <input
            type="date"
            value={state.started_at ?? ''}
            onChange={(e) => setState((s: any) => ({ ...s, started_at: e.target.value || null }))}
            className={inputCls}
            style={inputH}
          />
        </div>
        <div>
          <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Conclusão</label>
          <input
            type="date"
            value={state.finished_at ?? ''}
            onChange={(e) => setState((s: any) => ({ ...s, finished_at: e.target.value || null }))}
            className={inputCls}
            style={inputH}
          />
        </div>
      </div>

      <div>
        <label className="block text-ink-2 mb-2" style={{ fontSize: 12, fontWeight: 600 }}>Avaliação</label>
        <StarPicker value={state.rating ?? 0} onChange={(v) => setState((s: any) => ({ ...s, rating: v }))} />
      </div>

      <div>
        <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Favorito</label>
        <label className="flex items-center gap-2 cursor-pointer" style={{ minHeight: 36 }}>
          <input
            type="checkbox"
            checked={state.favorite ?? false}
            onChange={(e) => setState((s: any) => ({ ...s, favorite: e.target.checked }))}
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#f87171' }}
          />
          <span className="text-ink-2 text-sm">Marcar como favorito</span>
        </label>
      </div>

      {/* Cover upload */}
      <div>
        <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Capa</label>
        <div className="flex items-center gap-3">
          {coverPreview && (
            <img
              src={coverPreview}
              alt="preview"
              style={{ width: 48, height: 72, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', flexShrink: 0 }}
            />
          )}
          <label
            className="flex-1 flex items-center justify-center gap-2 rounded-input border border-dashed border-line text-ink-2 hover:text-ink hover:bg-bg-3 transition-colors cursor-pointer text-sm"
            style={{ minHeight: 44 }}
          >
            <Camera size={14} className="mr-1.5" /> Escolher imagem
            <input
              type="file"
              accept="image/*"
              onChange={onCoverChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
    </div>
  )
}

/* ── Blank form state ───────────────────────────────────────────────── */
export function blankForm(): AddBookInput & { rating: number } {
  return {
    title: '',
    author: '',
    status: 'quero_ler',
    favorite: false,
    category: null,
    total_pages: undefined,
    pages_read: undefined,
    started_at: null,
    finished_at: null,
    rating: 0,
    format: null,
    coverFile: null,
  }
}
