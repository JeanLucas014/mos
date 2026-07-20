import { useRef, useState } from 'react'
import { Paperclip, Download, Trash2, Loader2 } from 'lucide-react'
import { useEstudosAnexos } from '../hooks/useEstudosAnexos'
import { uploadEstudoAnexo, resolveEstudoAnexoUrl } from '../lib/uploadEstudoAnexo'
import { formatBytes, fileExt } from '../utils'

interface Props {
  itemId: string
  userId: string | undefined
}

export function AttachmentsPanel({ itemId, userId }: Props) {
  const { data: anexos, isLoading, addAnexo, deleteAnexo } = useEstudosAnexos(itemId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !userId) return
    setUploading(true)
    try {
      const path = await uploadEstudoAnexo(file, userId)
      addAnexo.mutate({ path, nomeArquivo: file.name, tipoArquivo: file.type || fileExt(file.name), tamanhoBytes: file.size })
    } catch (err) {
      console.error('[AttachmentsPanel] falha ao enviar anexo', err)
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(id: string, path: string) {
    setDownloadingId(id)
    try {
      const url = await resolveEstudoAnexoUrl(path)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
    } finally {
      setDownloadingId(null)
    }
  }

  function handleDelete(anexo: NonNullable<typeof anexos>[number]) {
    if (window.confirm(`Remover "${anexo.nome_arquivo}"?`)) deleteAnexo.mutate(anexo)
  }

  return (
    <div className="border border-line rounded-xl bg-bg-2 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-line">
        <span className="text-ink-2 flex items-center gap-1.5" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 12 }}>
          <Paperclip size={12} /> Anexos
        </span>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-brand hover:brightness-110 transition-colors text-xs font-medium disabled:opacity-40 flex items-center gap-1"
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : null}
          {uploading ? 'Enviando…' : '+ Adicionar'}
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChosen} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="text-xs text-ink-3 text-center py-4">Carregando…</p>
        ) : !anexos || anexos.length === 0 ? (
          <p className="text-xs text-ink-3 text-center py-4">Nenhum anexo ainda.</p>
        ) : (
          anexos.map((a) => (
            <div key={a.id} className="group flex items-center gap-2.5 px-3 py-2.5 border-b border-line last:border-0">
              <div
                className="flex-shrink-0 rounded-lg flex items-center justify-center text-ink-2"
                style={{ width: 30, height: 30, background: 'rgba(255,255,255,.06)', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}
              >
                {fileExt(a.nome_arquivo).slice(0, 4)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-ink truncate">{a.nome_arquivo}</div>
                <div className="text-ink-3" style={{ fontSize: 10 }}>{formatBytes(a.tamanho_bytes)}</div>
              </div>
              <button
                onClick={() => handleDownload(a.id, a.url)}
                disabled={downloadingId === a.id}
                className="text-ink-3 hover:text-brand p-1.5 flex-shrink-0"
                title="Baixar"
              >
                {downloadingId === a.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              </button>
              <button
                onClick={() => handleDelete(a)}
                className="text-ink-3 hover:text-red-400 p-1.5 flex-shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                title="Remover"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
