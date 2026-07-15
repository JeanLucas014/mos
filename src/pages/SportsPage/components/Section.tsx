import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

/* ── Section card ──────────────────────────────────────────────── */
export function Section({
  title, icon, count, children, defaultOpen = true, extra,
}: {
  title: string; icon: React.ReactNode; count?: number | string
  children: React.ReactNode; defaultOpen?: boolean; extra?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-bg-2 border border-line rounded-card overflow-hidden">
      <div className="flex items-center pr-4" style={{ minHeight: 56 }}>
        <button
          onClick={() => setOpen(!open)}
          className="flex-1 flex items-center justify-between px-5 py-4 hover:bg-bg-3 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-ink-2">{icon}</span>
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14 }}>{title}</span>
            {count !== undefined && (
              <span className="text-ink-3" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{count}</span>
            )}
          </div>
          <ChevronDown size={16} className={`text-ink-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
        {extra && <div style={{ flexShrink: 0 }}>{extra}</div>}
      </div>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}
