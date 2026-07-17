function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-brand/15 text-brand text-xs font-bold flex items-center justify-center shrink-0">
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

export { Step, SectionLabel }
