import { scoreColor, scoreLabel } from '../scoreUtils'

/* ── Score Gauge SVG ────────────────────────────────────────────── */
export function ScoreGauge({ score, size = 176 }: { score: number; size?: number }) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.36
  const sw = 4
  const color = scoreColor(score)
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const pt = (deg: number) => ({
    x: cx + r * Math.cos(toRad(deg)),
    y: cy + r * Math.sin(toRad(deg)),
  })
  const arc = (from: number, to: number) => {
    const s = pt(from); const e = pt(to)
    const la = to - from > 180 ? 1 : 0
    return `M${s.x.toFixed(1)},${s.y.toFixed(1)} A${r},${r} 0 ${la} 1 ${e.x.toFixed(1)},${e.y.toFixed(1)}`
  }
  const end = 135 + Math.min((score / 100) * 270, 270)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={arc(135, 405)} fill="none" stroke="var(--bg3)" strokeWidth={sw} strokeLinecap="round" />
      {score > 0 && (
        <path d={arc(135, end)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      )}
      <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size * 0.273} fontWeight="700"
        fontFamily="Sora, sans-serif">{score}</text>
      <text x={cx} y={cy + 18} textAnchor="middle"
        fill="var(--text3)" fontSize={13} fontFamily="Manrope, sans-serif">
        {scoreLabel(score)}
      </text>
    </svg>
  )
}
