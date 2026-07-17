import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

/* ══════════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
══════════════════════════════════════════════════════════════════ */

export function Sk({ w = 'w-full', h = 'h-3' }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} bg-bg-3 rounded animate-pulse`} />
}

export function Bar({ pct, color = 'var(--blue)' }: { pct: number; color?: string }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: 'var(--border)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
      />
    </div>
  )
}

export function Widget({
  icon,
  title,
  to,
  children,
  className = '',
}: {
  icon: React.ReactNode
  title: string
  to: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      to={to}
      className={`block rounded-2xl border border-line bg-bg-2 p-5 hover:border-white/12 hover:bg-bg-3 transition-all group ${className}`}
      style={{ textDecoration: 'none' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-ink-2">{icon}</span>
          <span
            className="text-ink-2 group-hover:text-ink transition-colors"
            style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}
          >
            {title}
          </span>
        </div>
        <ArrowRight size={12} className="text-ink-3 group-hover:text-ink-2 transition-colors" />
      </div>
      {children}
    </Link>
  )
}

export function BigStat({ value, label, color = 'var(--text)' }: { value: string | number; label?: string; color?: string }) {
  return (
    <div className="mb-1">
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 26, color, lineHeight: 1 }}>
        {value}
      </div>
      {label && <div className="text-ink-3 mt-0.5" style={{ fontSize: 11 }}>{label}</div>}
    </div>
  )
}
