import { ChevronRight } from 'lucide-react'

export interface Crumb {
  id: string | null
  nome: string
}

interface Props {
  crumbs: Crumb[]
  onNavigate: (index: number) => void
}

export function Breadcrumb({ crumbs, onNavigate }: Props) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0" style={{ WebkitOverflowScrolling: 'touch' }}>
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <div key={c.id ?? 'root'} className="flex items-center gap-1 flex-shrink-0">
            {i > 0 && <ChevronRight size={12} className="text-ink-3 flex-shrink-0" />}
            <button
              onClick={() => onNavigate(i)}
              disabled={isLast}
              className={[
                'text-sm truncate max-w-[160px] transition-colors',
                isLast ? 'text-ink font-medium cursor-default' : 'text-ink-3 hover:text-ink',
              ].join(' ')}
              style={{ fontFamily: 'Manrope, sans-serif' }}
              title={c.nome}
            >
              {c.nome}
            </button>
          </div>
        )
      })}
    </div>
  )
}
