import type { Status } from '../types'
import { C, STATUS_CFG } from '../constants'

/* ── StatusPill ──────────────────────────────────────────────────── */
export function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CFG[status as Status] ?? { label: status, color: C.dm, bg: 'rgba(136,136,136,.15)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}30`,
    }}>
      {cfg.label}
    </span>
  )
}
