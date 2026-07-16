interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

/* ══════════════════════════════════════════════════════════════════
   ERROR STATE — mensagem amigável (nunca e.message cru) + retry opcional
══════════════════════════════════════════════════════════════════ */
export function ErrorState({ message = 'Não foi possível carregar os dados. Tente novamente.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-center gap-3 text-red-400 text-sm mt-3">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="underline hover:brightness-110 transition-all">
          Tentar de novo
        </button>
      )}
    </div>
  )
}
