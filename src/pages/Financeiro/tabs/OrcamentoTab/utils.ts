export const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function progressPct(realizado: number, previsto: number): number {
  if (previsto <= 0) return realizado > 0 ? 100 : 0
  return (realizado / previsto) * 100
}

export function progressColor(pct: number): string {
  if (pct > 100) return '#ef4444'
  if (pct >= 90) return '#f59e0b'
  return '#22c55e'
}
