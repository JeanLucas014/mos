/* ── Skeleton ──────────────────────────────────────────────────────── */
export function Skeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl overflow-hidden bg-bg-3 animate-pulse">
          <div style={{ aspectRatio: '2/3' }} />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-bg rounded w-3/4" />
            <div className="h-2 bg-bg rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
