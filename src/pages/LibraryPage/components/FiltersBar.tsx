import { Heart } from 'lucide-react'
import { SORT_OPTIONS } from '../constants'

interface FiltersBarProps {
  filterStatus: string
  setFilterStatus: (v: string) => void
  filterYear: string
  setFilterYear: (v: string) => void
  years: number[]
  sortBy: string
  setSortBy: (v: string) => void
  filterFavorites: boolean
  setFilterFavorites: (fn: (v: boolean) => boolean) => void
  viewMode: 'grid' | 'list'
  setViewMode: (v: 'grid' | 'list') => void
  gridCols: number
  setGridCols: (n: number) => void
}

/** Barra de filtros da Biblioteca: status/ano/ordenação/favoritos/colunas/grid-lista. */
export function FiltersBar({
  filterStatus, setFilterStatus,
  filterYear, setFilterYear, years,
  sortBy, setSortBy,
  filterFavorites, setFilterFavorites,
  viewMode, setViewMode,
  gridCols, setGridCols,
}: FiltersBarProps) {
  return (
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
  )
}
