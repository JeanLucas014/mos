import { useState, type FormEvent } from 'react'
import { FileText, Film, Link as LinkIcon, Paperclip, GraduationCap, FolderOpen } from 'lucide-react'
import { useStudies } from '../hooks/useStudies'
import type { Database } from '../types/db'
import { LibraryPage } from '@/pages/LibraryPage'
import { HelpButton } from '@/components/help/HelpButton'

type Study = Database['public']['Tables']['studies']['Row']
type StudyFile = Database['public']['Tables']['study_files']['Row']
type StudyStatus = 'ativo' | 'no prazo' | 'concluido'

/* ── helpers ──────────────────────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  ativo:     { label: 'Ativo',    color: '#0EA5E9', bg: 'rgba(14,165,233,.14)' },
  'no prazo':{ label: 'No prazo', color: '#34d399', bg: 'rgba(52,211,153,.12)' },
  concluido: { label: 'Concluído',color: '#888',    bg: 'rgba(255,255,255,.06)' },
}

const KIND_CFG: Record<string, { icon: React.ReactNode; color: string }> = {
  PDF:    { icon: <FileText size={15} />, color: '#f87171' },
  DOC:    { icon: <FileText size={15} />, color: '#60a5fa' },
  MD:     { icon: <FileText size={15} />, color: '#34d399' },
  VIDEO:  { icon: <Film size={15} />,     color: '#a78bfa' },
  LINK:   { icon: <LinkIcon size={15} />, color: '#fbbf24' },
}

function kindCfg(kind: string | null): { icon: React.ReactNode; color: string } {
  return KIND_CFG[kind ?? ''] ?? { icon: <Paperclip size={15} />, color: '#888' }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

/* ── Pill ─────────────────────────────────────────────────────────── */
function Pill({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG['ativo']
  return (
    <span style={{
      padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
      color: cfg.color, background: cfg.bg, fontFamily: 'Manrope, sans-serif',
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

/* ── Progress bar ─────────────────────────────────────────────────── */
function ProgressBar({
  value,
  color = '#0EA5E9',
  onChange,
}: {
  value: number
  color?: string
  onChange?: (v: number) => void
}) {
  return (
    <div className="space-y-0.5">
      <div style={{ position: 'relative', height: 5, background: 'rgba(255,255,255,.07)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3, transition: 'width .3s' }} />
        {onChange && (
          <input
            type="range" min={0} max={100} value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              opacity: 0, cursor: 'pointer', margin: 0, padding: 0,
            }}
          />
        )}
      </div>
      <div style={{ textAlign: 'right', fontSize: 9, color, fontFamily: 'JetBrains Mono, monospace' }}>
        {value}%
      </div>
    </div>
  )
}

/* ── Skeleton ─────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
      {[1, 2].map((i) => (
        <div key={i} className="bg-bg-2 border border-line rounded-card p-5 space-y-3 animate-pulse">
          <div className="h-5 bg-bg-3 rounded w-1/3" />
          {[1, 2, 3].map((j) => (
            <div key={j} className="h-14 bg-bg-3 rounded-input" />
          ))}
        </div>
      ))}
    </div>
  )
}

/* ── StudyRow ─────────────────────────────────────────────────────── */
function StudyRow({
  study,
  onProgressChange,
  onStatusChange,
  onDelete,
}: {
  study: Study
  onProgressChange: (id: string, v: number) => void
  onStatusChange: (id: string, s: StudyStatus) => void
  onDelete: (id: string) => void
}) {
  const [showEdit, setShowEdit] = useState(false)

  return (
    <div
      className="group border border-line rounded-xl p-4 bg-bg-3 hover:border-white/10 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Icon */}
          <div
            className="flex-shrink-0 rounded-lg flex items-center justify-center text-brand"
            style={{ width: 38, height: 38, background: 'rgba(14,165,233,.12)' }}
          >
            <GraduationCap size={18} />
          </div>
          {/* Name + meta */}
          <div className="min-w-0">
            <div
              className="text-ink font-semibold truncate"
              style={{ fontFamily: 'Sora, sans-serif', fontSize: 14 }}
            >
              {study.name}
            </div>
            {study.meta && (
              <div
                className="text-ink-2 truncate"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, marginTop: 2 }}
              >
                {study.meta}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Status selector — visible on hover or click */}
          {showEdit ? (
            <select
              autoFocus
              value={study.status}
              onChange={(e) => { onStatusChange(study.id, e.target.value as StudyStatus); setShowEdit(false) }}
              onBlur={() => setShowEdit(false)}
              className="text-ink text-xs rounded-input bg-bg border border-line focus:outline-none focus:border-brand"
              style={{ padding: '3px 6px', fontFamily: 'Manrope, sans-serif' }}
            >
              <option value="ativo">Ativo</option>
              <option value="no prazo">No prazo</option>
              <option value="concluido">Concluído</option>
            </select>
          ) : (
            <button onClick={() => setShowEdit(true)} title="Editar status">
              <Pill status={study.status} />
            </button>
          )}
          <button
            onClick={() => { if (window.confirm(`Remover "${study.name}"?`)) onDelete(study.id) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-3 hover:text-red-400 w-8 h-8 flex items-center justify-center text-base"
            title="Remover"
          >
            ×
          </button>
        </div>
      </div>

      {/* Progress */}
      <ProgressBar
        value={study.progress ?? 0}
        color={study.status === 'concluido' ? '#34d399' : '#0EA5E9'}
        onChange={(v) => onProgressChange(study.id, v)}
      />
    </div>
  )
}

/* ── FileRow ──────────────────────────────────────────────────────── */
function FileRow({
  file,
  studyName,
  onDelete,
}: {
  file: StudyFile
  studyName: string | undefined
  onDelete: (id: string) => void
}) {
  const kc = kindCfg(file.kind)
  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-input hover:bg-bg-3 transition-colors" style={{ minHeight: 48 }}>
      <span style={{ color: kc.color, flexShrink: 0, display: 'flex' }}>{kc.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-ink truncate">{file.name}</div>
        <div className="flex items-center gap-2 mt-0.5">
          {studyName && (
            <span className="text-ink-3" style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}>
              {studyName}
            </span>
          )}
          {file.kind && (
            <span style={{ fontSize: 9, color: kc.color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
              {file.kind}
            </span>
          )}
          {file.source && (
            <span className="text-ink-3" style={{ fontSize: 9 }}>
              · {file.source}
            </span>
          )}
          <span className="text-ink-3" style={{ fontSize: 9 }}>
            · {timeAgo(file.updated_at)}
          </span>
        </div>
      </div>
      {file.external_url && (
        <a
          href={file.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-brand hover:brightness-110 transition-all"
          style={{ fontSize: 12 }}
          title="Abrir"
        >
          ↗
        </a>
      )}
      <button
        onClick={() => onDelete(file.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-3 hover:text-red-400 w-7 h-7 flex items-center justify-center text-sm flex-shrink-0"
        title="Remover"
      >
        ×
      </button>
    </div>
  )
}

/* ── AddStudyForm ─────────────────────────────────────────────────── */
function AddStudyForm({
  onAdd,
  isPending,
}: {
  onAdd: (name: string, meta: string, status: StudyStatus) => void
  isPending: boolean
}) {
  const [name, setName] = useState('')
  const [meta, setMeta] = useState('')
  const [status, setStatus] = useState<StudyStatus>('ativo')
  const [open, setOpen] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name.trim(), meta.trim(), status)
    setName(''); setMeta(''); setStatus('ativo'); setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-input text-ink-2 hover:bg-bg-3 hover:text-ink transition-colors border border-dashed border-line"
        style={{ minHeight: 44, fontSize: 13 }}
      >
        <span className="text-brand font-bold">+</span> Novo estudo
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-line rounded-xl p-4 bg-bg-3 space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do estudo…"
        autoFocus
        className="w-full bg-bg border border-line rounded-input px-3 text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
        style={{ minHeight: 40 }}
      />
      <input
        value={meta}
        onChange={(e) => setMeta(e.target.value)}
        placeholder="Meta — ex: módulo 4 de 8"
        className="w-full bg-bg border border-line rounded-input px-3 text-ink-2 text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
        style={{ minHeight: 40, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as StudyStatus)}
        className="w-full bg-bg border border-line rounded-input px-3 text-ink text-sm focus:outline-none focus:border-brand transition-colors"
        style={{ minHeight: 40 }}
      >
        <option value="ativo">Ativo</option>
        <option value="no prazo">No prazo</option>
        <option value="concluido">Concluído</option>
      </select>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!name.trim() || isPending}
          className="flex-1 bg-brand text-white rounded-input text-sm font-semibold hover:brightness-110 disabled:opacity-40 transition-all"
          style={{ minHeight: 40 }}
        >
          Adicionar
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 bg-bg border border-line rounded-input text-ink-2 text-sm hover:text-ink transition-colors"
          style={{ minHeight: 40 }}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

/* ── AddFileForm ──────────────────────────────────────────────────── */
function AddFileForm({
  studies,
  onAdd,
  isPending,
}: {
  studies: Study[]
  onAdd: (studyId: string, name: string, kind: string, source: string, url: string) => void
  isPending: boolean
}) {
  const [open, setOpen] = useState(false)
  const [studyId, setStudyId] = useState(studies[0]?.id ?? '')
  const [name, setName] = useState('')
  const [kind, setKind] = useState('PDF')
  const [source, setSource] = useState('drive')
  const [url, setUrl] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !studyId) return
    onAdd(studyId, name.trim(), kind, source, url.trim())
    setName(''); setUrl(''); setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-input text-ink-2 hover:bg-bg-3 hover:text-ink transition-colors border border-dashed border-line"
        style={{ minHeight: 44, fontSize: 13 }}
        disabled={studies.length === 0}
        title={studies.length === 0 ? 'Crie um estudo primeiro' : ''}
      >
        <span className="text-brand font-bold">+</span> Novo arquivo
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-line rounded-xl p-4 bg-bg-3 space-y-3">
      <select
        value={studyId}
        onChange={(e) => setStudyId(e.target.value)}
        className="w-full bg-bg border border-line rounded-input px-3 text-ink text-sm focus:outline-none focus:border-brand transition-colors"
        style={{ minHeight: 40 }}
      >
        {studies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do arquivo…"
        autoFocus
        className="w-full bg-bg border border-line rounded-input px-3 text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
        style={{ minHeight: 40 }}
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="bg-bg border border-line rounded-input px-3 text-ink text-sm focus:outline-none focus:border-brand transition-colors"
          style={{ minHeight: 40 }}
        >
          <option value="PDF">PDF</option>
          <option value="DOC">DOC</option>
          <option value="MD">MD</option>
          <option value="VIDEO">VIDEO</option>
          <option value="LINK">LINK</option>
        </select>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="bg-bg border border-line rounded-input px-3 text-ink text-sm focus:outline-none focus:border-brand transition-colors"
          style={{ minHeight: 40 }}
        >
          <option value="drive">Google Drive</option>
          <option value="storage">Supabase</option>
          <option value="notion">Notion</option>
          <option value="local">Local</option>
        </select>
      </div>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="URL (opcional)"
        className="w-full bg-bg border border-line rounded-input px-3 text-ink-2 text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
        style={{ minHeight: 40, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!name.trim() || !studyId || isPending}
          className="flex-1 bg-brand text-white rounded-input text-sm font-semibold hover:brightness-110 disabled:opacity-40 transition-all"
          style={{ minHeight: 40 }}
        >
          Adicionar
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 bg-bg border border-line rounded-input text-ink-2 text-sm hover:text-ink transition-colors"
          style={{ minHeight: 40 }}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

/* ── Page ─────────────────────────────────────────────────────────── */
export function StudiesPage() {
  const [tab, setTab] = useState<'estudos' | 'biblioteca'>('estudos')
  const { studies: studiesQ, files: filesQ, addStudy, updateStudy, deleteStudy, addFile, deleteFile } = useStudies()

  const studies = studiesQ.data ?? []
  const files   = filesQ.data ?? []
  const isLoading = studiesQ.isLoading || filesQ.isLoading

  const activeCount    = studies.filter((s) => s.status !== 'concluido').length
  const completedCount = studies.filter((s) => s.status === 'concluido').length

  function handleAddStudy(name: string, meta: string, status: StudyStatus) {
    addStudy.mutate({ name, meta, status })
  }

  function handleProgress(id: string, progress: number) {
    updateStudy.mutate({ id, progress })
  }

  function handleStatus(id: string, status: StudyStatus) {
    updateStudy.mutate({ id, status })
  }

  function handleDeleteStudy(id: string) {
    deleteStudy.mutate(id)
  }

  function handleAddFile(studyId: string, name: string, kind: string, source: string, external_url: string) {
    addFile.mutate({ study_id: studyId, name, kind, source, external_url })
  }

  function handleDeleteFile(id: string) {
    deleteFile.mutate(id)
  }

  const TABS: { id: 'estudos' | 'biblioteca'; label: string }[] = [
    { id: 'estudos',   label: 'Estudos' },
    { id: 'biblioteca', label: 'Biblioteca' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2">
        <h1
          className="text-2xl lg:text-[30px]"
          style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}
        >
          {tab === 'biblioteca' ? 'Biblioteca' : 'Estudos'}
        </h1>
        <HelpButton pageId="estudos" />
      </div>
      {tab === 'estudos' && (
        <p className="text-ink-2 mt-1 text-sm">
          {isLoading
            ? 'Carregando...'
            : `${activeCount} em curso · ${completedCount} concluído${completedCount !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-line mt-4 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-brand text-ink'
                : 'border-transparent text-ink-3 hover:text-ink-2',
            ].join(' ')}
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'biblioteca' && <LibraryPage />}

      {tab === 'estudos' && (studiesQ.isError || filesQ.isError) && (
        <p className="text-red-400 text-sm mt-3">
          Erro: {((studiesQ.error || filesQ.error) as Error).message}
        </p>
      )}

      {tab === 'estudos' && isLoading && <Skeleton />}

      {tab === 'estudos' && !isLoading && studies.length === 0 && files.length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-3 text-ink-3 py-12">
          <GraduationCap size={40} className="text-ink-3" />
          <p className="text-sm text-center">Nenhum estudo ainda.<br />Adicione o primeiro abaixo.</p>
        </div>
      )}

      {/* Two-column grid */}
      {tab === 'estudos' && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">

          {/* ── Em curso ── */}
          <div className="bg-bg-2 border border-line rounded-card p-4 lg:p-5 flex flex-col gap-3">
            <h2
              className="flex items-center gap-2"
              style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15 }}
            >
              <GraduationCap size={15} className="text-brand" /> Em curso
              <span className="text-ink-3 ml-auto" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 400 }}>
                {studies.length}
              </span>
            </h2>

            {studies.length === 0 ? (
              <p className="text-ink-3 text-sm text-center py-4">Nenhum estudo cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {studies.map((study) => (
                  <StudyRow
                    key={study.id}
                    study={study}
                    onProgressChange={handleProgress}
                    onStatusChange={handleStatus}
                    onDelete={handleDeleteStudy}
                  />
                ))}
              </div>
            )}

            <div className="pt-1">
              <AddStudyForm onAdd={handleAddStudy} isPending={addStudy.isPending} />
            </div>
          </div>

          {/* ── Arquivos & anotações ── */}
          <div className="bg-bg-2 border border-line rounded-card p-4 lg:p-5 flex flex-col gap-3">
            <h2
              className="flex items-center gap-2"
              style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15 }}
            >
              <FolderOpen size={15} className="text-ink-2" /> Arquivos & anotações
              <span className="text-ink-3 ml-auto" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 400 }}>
                {files.length}
              </span>
            </h2>

            {files.length === 0 ? (
              <p className="text-ink-3 text-sm text-center py-4">Nenhum arquivo vinculado.</p>
            ) : (
              <div>
                {files.map((file) => {
                  const study = studies.find((s) => s.id === file.study_id)
                  return (
                    <FileRow
                      key={file.id}
                      file={file}
                      studyName={study?.name}
                      onDelete={handleDeleteFile}
                    />
                  )
                })}
              </div>
            )}

            <div className="pt-1">
              <AddFileForm
                studies={studies}
                onAdd={handleAddFile}
                isPending={addFile.isPending}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
