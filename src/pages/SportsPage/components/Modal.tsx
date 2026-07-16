/* ── Small modal ───────────────────────────────────────────────── */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.8)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-line p-6 space-y-4" style={{ background: 'var(--bg2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between">
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 17 }}>{title}</h3>
          <button onClick={onClose} aria-label="Fechar" className="w-8 h-8 flex items-center justify-center text-ink-3 hover:text-ink rounded-input hover:bg-bg-3 transition-colors text-lg">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
