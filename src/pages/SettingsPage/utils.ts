/* ── helpers ──────────────────────────────────────────────────── */
export function initials(name: string | null | undefined, email: string | null | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase()
  }
  return (email?.[0] ?? '?').toUpperCase()
}
