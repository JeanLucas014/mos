function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-[#0EA5E9]/15 text-[#0EA5E9] text-xs font-bold flex items-center justify-center shrink-0">
        {n}
      </div>
      <p className="text-sm text-[#ccc] leading-relaxed pt-0.5">{text}</p>
    </div>
  )
}

export const inputCls =
  'w-full bg-bg border border-line rounded-input px-3 text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors'
export const inputH = { minHeight: 44 }

/* ── Section label ────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-ink-2" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>
      {children}
    </p>
  )
}

/* ── Toggle switch ────────────────────────────────────────────── */
function Toggle({ on, disabled, onClick }: { on: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative shrink-0 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        width: 44, height: 26, borderRadius: 999,
        background: on ? '#0EA5E9' : '#222222',
        border: '1px solid',
        borderColor: on ? '#0EA5E9' : '#2a2a2a',
      }}
    >
      <span
        className="absolute top-1/2 rounded-full bg-white shadow-md transition-all duration-200"
        style={{ width: 18, height: 18, left: on ? 22 : 4, transform: 'translateY(-50%)' }}
      />
    </button>
  )
}

export { Step, SectionLabel, Toggle }
