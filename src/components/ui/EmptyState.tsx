import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

/* ══════════════════════════════════════════════════════════════════
   EMPTY STATE — ícone opcional + título + descrição + ação opcional
══════════════════════════════════════════════════════════════════ */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-ink-3 py-10 text-center">
      {icon}
      <p className="text-sm">{title}</p>
      {description && <p className="text-xs text-ink-3 max-w-xs whitespace-pre-line">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="text-brand text-sm font-medium hover:brightness-110 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
