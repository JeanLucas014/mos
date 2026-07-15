export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  )
}
