import { useState } from 'react'
import { SectionLabel } from './shared'
import { TwoFactorSection } from './TwoFactorSection'
import { ChangePasswordModal } from './ChangePasswordModal'

/* ══════════════════════════════════════════════════════════════════
   SEGURANÇA TAB
══════════════════════════════════════════════════════════════════ */
export function SegurancaTab() {
  const [showChangePw, setShowChangePw] = useState(false)

  return (
    <section className="space-y-3">
      <div className="rounded-xl border border-line p-5 space-y-3" style={{ background: 'var(--bg2)' }}>
        <SectionLabel>Segurança da conta</SectionLabel>
        <p className="text-ink-3 text-xs">Sua senha nunca é armazenada em texto puro. Para alterá-la, informe a senha atual e defina uma nova.</p>
        <button
          onClick={() => setShowChangePw(true)}
          className="flex items-center gap-2.5 w-full px-4 rounded-input border border-line text-ink-2 hover:text-ink hover:border-white/20 hover:bg-bg-3 transition-colors text-sm text-left"
          style={{ minHeight: 44 }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
            <rect x="2.5" y="7" width="11" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="8" cy="10.3" r="1" fill="currentColor" />
          </svg>
          Alterar senha
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto">
            <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
        <TwoFactorSection />
      </div>
      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </section>
  )
}
