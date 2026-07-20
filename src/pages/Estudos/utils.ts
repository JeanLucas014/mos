export function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function fileExt(nome: string): string {
  const parts = nome.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : ''
}
