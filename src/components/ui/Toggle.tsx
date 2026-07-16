interface ToggleProps {
  on: boolean
  onClick: () => void
  disabled?: boolean
}

/* ══════════════════════════════════════════════════════════════════
   TOGGLE SWITCH — padrão visual único (antes duplicado em
   SettingsPage/Toggle e inline em NotificacoesTab)
══════════════════════════════════════════════════════════════════ */
export function Toggle({ on, onClick, disabled }: ToggleProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative shrink-0 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: on ? 'var(--blue)' : 'var(--border)',
        border: 'none', cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <span
        className="absolute top-1/2 rounded-full bg-white shadow-md transition-all duration-200"
        style={{ width: 16, height: 16, left: on ? 21 : 3, transform: 'translateY(-50%)' }}
      />
    </button>
  )
}
