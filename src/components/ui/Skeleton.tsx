import type { CSSProperties } from 'react'

interface SkeletonProps {
  className?: string
  style?: CSSProperties
}

/* ══════════════════════════════════════════════════════════════════
   SKELETON — barra/bloco pulsante genérico, para compor loading
   states específicos de cada módulo (era duplicado ad-hoc)
══════════════════════════════════════════════════════════════════ */
export function Skeleton({ className = '', style }: SkeletonProps) {
  return <div className={`bg-bg-3 rounded animate-pulse ${className}`} style={style} />
}
