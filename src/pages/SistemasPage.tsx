import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Plus, Edit2, Trash2, ExternalLink, Paperclip, X, Upload, ChevronDown, ChevronUp, Download } from 'lucide-react'

/* ── Palette ─────────────────────────────────────────────────────── */
const C = {
  bg:     'var(--bg)',
  card:   'var(--bg2)',
  card2:  'var(--bg3)',
  border: 'var(--border)',
  b:      '#0EA5E9',
  g:      '#34d399',
  r:      '#f87171',
  a:      '#fbbf24',
  p:      '#a78bfa',
  dm:     'var(--text2)',
  dm2:    'var(--text3)',
  ink:    'var(--text)',
  ink2:   '#a3a3a3',
}

/* ── Types ───────────────────────────────────────────────────────── */
interface System {
  id: string
  name: string
  description: string | null
  category: string
  status: string
  url: string | null
  tech_stack: string[] | null
  thumbnail_url: string | null
  created_at: string
}

interface SystemFile {
  id: string
  system_id: string
  name: string
  file_type: string
  file_url: string
  is_download: boolean | null
}

const CATEGORIES = ['App', 'API', 'Site', 'Dashboard', 'CLI', 'Library', 'Automação', 'Ferramenta', 'Outro']
const STATUSES   = ['Ativo', 'Em desenvolvimento', 'Pausado', 'Arquivado']

const STATUS_COLOR: Record<string, string> = {
  'Ativo':             C.g,
  'Em desenvolvimento': C.a,
  'Pausado':           C.dm,
  'Arquivado':         C.r,
}

/* ── Shared input style (dark) ───────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg3)',
  border: '0.5px solid #2a2a2a',
  borderRadius: 8,
  color: 'var(--text)',
  fontSize: 13,
  padding: '9px 11px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'Manrope, sans-serif',
}

const btnStyle: React.CSSProperties = {
  borderRadius: 8,
  border: 'none',
  padding: '8px 18px',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'Manrope, sans-serif',
}

/* ── Hooks ───────────────────────────────────────────────────────── */
function useSystems() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['systems'],
    queryFn: async () => {
      const { data, error } = await supabase.from('systems')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as System[]
    },
  })

  const add = useMutation<void, Error, Omit<System, 'id' | 'created_at'>>({
    mutationFn: async (payload) => {
      const { error } = await supabase.from('systems').insert(payload)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['systems'] }),
  })

  const update = useMutation<void, Error, Partial<System> & { id: string }>({
    mutationFn: async ({ id, ...payload }) => {
      const { error } = await supabase.from('systems').update(payload).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['systems'] }),
  })

  const remove = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('systems').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['systems'] }),
  })

  return { query, add, update, remove }
}

function useSystemFiles(systemId: string) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['system_files', systemId],
    queryFn: async () => {
      const { data, error } = await supabase.from('system_files')
        .select('*')
        .eq('system_id', systemId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as SystemFile[]
    },
  })

  const add = useMutation<void, Error, { name: string; file_type: string; file_url: string; is_download: boolean }>({
    mutationFn: async (payload) => {
      const { error } = await supabase.from('system_files').insert({ ...payload, system_id: systemId })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system_files', systemId] }),
  })

  const remove = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('system_files').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system_files', systemId] }),
  })

  return { query, add, remove }
}

/* ── Storage uploads ──────────────────────────────────────────────── */
/* Bucket "systems" é privado — armazenamos o path e resolvemos uma
   signed URL sob demanda (nas queries abaixo), nunca uma URL pública. */
const SIGNED_URL_TTL = 60 * 60 // 1h

async function uploadToStorage(file: File, folder: string): Promise<string> {
  const ext  = file.name.split('.').pop()
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('systems').upload(path, file, { upsert: true })
  if (error) throw error
  return path
}

async function resolveSignedUrl(path: string | null): Promise<string | null> {
  if (!path) return null
  if (/^https?:\/\//.test(path)) return path // legado: já era URL completa
  const { data, error } = await supabase.storage.from('systems').createSignedUrl(path, SIGNED_URL_TTL)
  if (error) return null
  return data.signedUrl
}

function useSignedUrl(path: string | null) {
  return useQuery({
    queryKey: ['signed-url', 'systems', path],
    queryFn: () => resolveSignedUrl(path),
    enabled: !!path,
    staleTime: 1000 * 60 * 45, // re-assina antes do TTL de 1h expirar
  })
}

/* ── Iframe Tool Modal (fullscreen) ─────────────────────────────── */
function IframeModal({ title, url, onClose }: { title: string; url: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg)',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 48, flexShrink: 0,
        borderBottom: '1px solid var(--border)', background: 'var(--bg2)',
      }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', fontFamily: 'Manrope, sans-serif' }}>
          {title}
        </span>
        <button
          onClick={onClose}
          title="Fechar (ESC)"
          style={{
            background: 'none', border: 'none', color: 'var(--text2)',
            cursor: 'pointer', padding: 6, borderRadius: 6,
            display: 'flex', alignItems: 'center',
          }}
        >
          <X size={18} />
        </button>
      </div>
      {/* Iframe */}
      <iframe
        src={url}
        title={title}
        style={{ flex: 1, width: '100%', border: 'none', display: 'block' }}
      />
    </div>
  )
}

/* ── System Modal (add/edit) ─────────────────────────────────────── */
function SystemModal({
  initial,
  onClose,
}: {
  initial: System | null
  onClose: () => void
}) {
  const { add, update } = useSystems()
  const [name,         setName]         = useState(initial?.name ?? '')
  const [description,  setDescription]  = useState(initial?.description ?? '')
  const [category,     setCategory]     = useState(initial?.category ?? 'App')
  const [status,       setStatus]       = useState(initial?.status ?? 'Ativo')
  const [url,          setUrl]          = useState(initial?.url ?? '')
  const [techStackRaw, setTechStackRaw] = useState(() => {
    const ts = initial?.tech_stack
    if (!ts) return ''
    if (Array.isArray(ts)) return ts.join(', ')
    return String(ts)
  })
  const [thumbPath,    setThumbPath]    = useState(initial?.thumbnail_url ?? '')
  const [uploading,    setUploading]    = useState(false)
  const [err,          setErr]          = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { data: thumbPreviewUrl } = useSignedUrl(thumbPath || null)

  const isPending = add.isPending || update.isPending

  async function handleThumb(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const path = await uploadToStorage(file, 'thumbnails')
      setThumbPath(path)
    } catch (ex) {
      console.error('[SystemModal]', ex)
      setErr('Não foi possível enviar a imagem. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setErr(null)
    const tech_stack = techStackRaw.split(',').map(s => s.trim()).filter(Boolean)
    const payload = {
      name:          name.trim(),
      description:   description.trim() || null,
      category,
      status,
      url:           url.trim() || null,
      tech_stack:    tech_stack.length ? tech_stack : null,
      thumbnail_url: thumbPath || null,
    }
    if (initial) {
      update.mutate({ id: initial.id, ...payload }, {
        onSuccess: onClose,
        onError: (ex) => {
          console.error('[SystemModal]', ex)
          setErr('Não foi possível salvar o sistema. Tente novamente.')
        },
      })
    } else {
      add.mutate(payload, {
        onSuccess: onClose,
        onError: (ex) => {
          console.error('[SystemModal]', ex)
          setErr('Não foi possível salvar o sistema. Tente novamente.')
        },
      })
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,.75)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: C.card, border: '1px solid ' + C.border,
        borderRadius: 14, width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflowY: 'auto', padding: 24,
        fontFamily: 'Manrope, sans-serif',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>
            {initial ? 'Editar sistema' : 'Novo sistema'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.dm2, cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Thumbnail */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 10,
              background: C.card2, border: '1px solid ' + C.border,
              overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} onClick={() => fileRef.current?.click()}>
              {thumbPreviewUrl
                ? <img src={thumbPreviewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                : <Upload size={22} color={C.dm} />}
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.ink2, marginBottom: 4 }}>Thumbnail</div>
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ fontSize: 11, color: C.b, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                {uploading ? 'Enviando…' : 'Escolher imagem'}
              </button>
              {thumbPath && (
                <button type="button" onClick={() => setThumbPath('')}
                  style={{ fontSize: 11, color: C.r, background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 8px' }}>
                  Remover
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleThumb} />
            </div>
          </div>

          {/* Name */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, color: C.dm, textTransform: 'uppercase', letterSpacing: '.06em' }}>Nome *</span>
            <input value={name} onChange={e => setName(e.target.value)} required
              style={inputStyle} placeholder="Nome do sistema" />
          </label>

          {/* Description */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, color: C.dm, textTransform: 'uppercase', letterSpacing: '.06em' }}>Descrição</span>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              style={{ ...inputStyle, height: 72, resize: 'vertical' }} placeholder="Breve descrição" />
          </label>

          {/* Category + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, color: C.dm, textTransform: 'uppercase', letterSpacing: '.06em' }}>Categoria</span>
              <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c} value={c} style={{ background: 'var(--bg3)' }}>{c}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, color: C.dm, textTransform: 'uppercase', letterSpacing: '.06em' }}>Status</span>
              <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
                {STATUSES.map(s => <option key={s} value={s} style={{ background: 'var(--bg3)' }}>{s}</option>)}
              </select>
            </label>
          </div>

          {/* URL */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, color: C.dm, textTransform: 'uppercase', letterSpacing: '.06em' }}>URL</span>
            <input value={url} onChange={e => setUrl(e.target.value)}
              style={inputStyle} placeholder="https://…" />
          </label>

          {/* Tech Stack */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, color: C.dm, textTransform: 'uppercase', letterSpacing: '.06em' }}>Stack (vírgula)</span>
            <input value={techStackRaw} onChange={e => setTechStackRaw(e.target.value)}
              style={inputStyle} placeholder="React, TypeScript, Supabase" />
          </label>

          {err && <div style={{ fontSize: 11, color: C.r }}>{err}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose}
              style={{ ...btnStyle, background: C.card2, color: C.ink2, border: '1px solid ' + C.border }}>
              Cancelar
            </button>
            <button type="submit" disabled={isPending || uploading}
              style={{ ...btnStyle, background: C.b, color: '#fff', opacity: (isPending || uploading) ? .6 : 1 }}>
              {isPending ? '…' : initial ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── File link (resolves signed URL for storage paths) ───────────── */
function FileLink({ path, name, isDownload }: { path: string; name: string; isDownload: boolean }) {
  const { data: href } = useSignedUrl(path)
  return (
    <a href={href ?? '#'} target="_blank" rel="noopener noreferrer" download={isDownload ? name : undefined}
      style={{
        fontSize: 11, color: C.b, textDecoration: 'none',
        display: 'flex', alignItems: 'center', gap: 3,
        padding: '3px 8px', borderRadius: 5,
        background: C.b + '18', border: '1px solid ' + C.b + '33',
        opacity: href ? 1 : 0.5, pointerEvents: href ? 'auto' : 'none',
      }}>
      {isDownload ? <><Download size={10} /> Baixar</> : <><ExternalLink size={10} /> Abrir</>}
    </a>
  )
}

/* ── Files section (expandable) ──────────────────────────────────── */
function FilesSection({ systemId }: { systemId: string }) {
  const { query, add, remove } = useSystemFiles(systemId)
  const [open,       setOpen]       = useState(false)
  const [mode,       setMode]       = useState<'link' | 'upload'>('link')
  const [name,       setName]       = useState('')
  const [fileUrl,    setFileUrl]    = useState('')
  const [fileType,   setFileType]   = useState('Link')
  const [uploading,  setUploading]  = useState(false)
  const [err,        setErr]        = useState<string | null>(null)
  const uploadRef = useRef<HTMLInputElement>(null)

  const files = query.data ?? []

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setErr(null)
    try {
      const path      = await uploadToStorage(file, 'files')
      const autoName  = name.trim() || file.name
      add.mutate({ name: autoName, file_type: fileType, file_url: path, is_download: true }, {
        onSuccess: () => { setName(''); setFileUrl(''); if (uploadRef.current) uploadRef.current.value = '' },
        onError: (ex) => {
          console.error('[FilesSection]', ex)
          setErr('Não foi possível adicionar o arquivo. Tente novamente.')
        },
      })
    } catch (ex) {
      console.error('[FilesSection]', ex)
      setErr('Não foi possível enviar o arquivo. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  function handleAddLink(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !fileUrl.trim()) return
    setErr(null)
    add.mutate({ name: name.trim(), file_url: fileUrl.trim(), file_type: fileType, is_download: false }, {
      onSuccess: () => { setName(''); setFileUrl('') },
      onError: (ex) => {
        console.error('[FilesSection]', ex)
        setErr('Não foi possível adicionar o link. Tente novamente.')
      },
    })
  }

  return (
    <div style={{ borderTop: '1px solid ' + C.border, marginTop: 12, paddingTop: 10 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', color: C.dm, cursor: 'pointer',
          fontSize: 11, fontFamily: 'Manrope, sans-serif', padding: 0,
        }}>
        <Paperclip size={12} />
        Arquivos ({files.length})
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div style={{ marginTop: 10 }}>
          {files.map(f => (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 0', borderBottom: '1px solid ' + C.border,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: C.card2, color: C.dm2, flexShrink: 0 }}>{f.file_type}</span>
                <span style={{ fontSize: 12, color: C.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                <FileLink path={f.file_url} name={f.name} isDownload={!!f.is_download} />
                <button onClick={() => remove.mutate(f.id)}
                  style={{ background: 'none', border: 'none', color: C.dm2, cursor: 'pointer', padding: 4 }}>
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}

          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, marginBottom: 8 }}>
            {(['link', 'upload'] as const).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                  background: mode === m ? C.b + '20' : 'transparent',
                  border: mode === m ? '1px solid ' + C.b + '50' : '1px solid ' + C.border,
                  color: mode === m ? C.b : C.dm,
                }}>
                {m === 'link' ? '🔗 Link' : '📎 Arquivo'}
              </button>
            ))}
          </div>

          {mode === 'link' ? (
            <form onSubmit={handleAddLink} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Nome" style={{ ...inputStyle, fontSize: 11, padding: '5px 8px', flex: '0 0 100px' }} />
              <input value={fileUrl} onChange={e => setFileUrl(e.target.value)}
                placeholder="URL" style={{ ...inputStyle, fontSize: 11, padding: '5px 8px', flex: 1 }} />
              <select value={fileType} onChange={e => setFileType(e.target.value)}
                style={{ ...inputStyle, fontSize: 11, padding: '5px 8px', flex: '0 0 68px' }}>
                {['Link', 'Repo', 'Doc', 'Design', 'Video', 'Outro'].map(t => <option key={t} style={{ background: 'var(--bg3)' }}>{t}</option>)}
              </select>
              <button type="submit" disabled={add.isPending}
                style={{ ...btnStyle, fontSize: 11, padding: '5px 10px', background: C.b, color: '#fff', flexShrink: 0 }}>
                +
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Nome (opcional)" style={{ ...inputStyle, fontSize: 11, padding: '5px 8px', flex: '0 0 130px' }} />
              <select value={fileType} onChange={e => setFileType(e.target.value)}
                style={{ ...inputStyle, fontSize: 11, padding: '5px 8px', flex: '0 0 68px' }}>
                {['Doc', 'PDF', 'ZIP', 'IMG', 'Video', 'Outro'].map(t => <option key={t} style={{ background: 'var(--bg3)' }}>{t}</option>)}
              </select>
              <button type="button" onClick={() => uploadRef.current?.click()} disabled={uploading}
                style={{ ...btnStyle, fontSize: 11, padding: '5px 12px', background: C.g + '20', color: C.g, border: '1px solid ' + C.g + '40', flexShrink: 0 }}>
                {uploading ? 'Enviando…' : '↑ Enviar'}
              </button>
              <input ref={uploadRef} type="file"
                accept=".zip,.pdf,.docx,.doc,.png,.jpg,.jpeg,.gif,.svg,.txt,.csv,.xlsx"
                style={{ display: 'none' }} onChange={handleFileUpload} />
            </div>
          )}
          {err && <div style={{ fontSize: 10, color: C.r, marginTop: 4 }}>{err}</div>}
        </div>
      )}
    </div>
  )
}

/* ── System Card ─────────────────────────────────────────────────── */
function SystemCard({
  sys, onEdit, onDelete, onOpenTool,
}: {
  sys: System
  onEdit: () => void
  onDelete: () => void
  onOpenTool: (title: string, url: string) => void
}) {
  const techStack: string[] = Array.isArray(sys.tech_stack)
    ? sys.tech_stack
    : typeof sys.tech_stack === 'string' && sys.tech_stack
      ? (sys.tech_stack as string).split(',').map((s: string) => s.trim()).filter(Boolean)
      : []

  const { data: thumbSrc } = useSignedUrl(sys.thumbnail_url)

  return (
    <div style={{
      background: C.card, border: '1px solid ' + C.border,
      borderRadius: 14, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Thumbnail */}
      {thumbSrc && (
        <div style={{ width: '100%', height: 140, overflow: 'hidden', flexShrink: 0 }}>
          <img src={thumbSrc} alt={sys.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {sys.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px',
                borderRadius: 20, background: C.card2,
                border: '1px solid ' + C.border, color: C.ink2,
              }}>{sys.category}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px',
                borderRadius: 20, color: STATUS_COLOR[sys.status] ?? C.dm,
                background: (STATUS_COLOR[sys.status] ?? C.dm) + '22',
                border: '1px solid ' + (STATUS_COLOR[sys.status] ?? C.dm) + '44',
              }}>{sys.status}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {sys.url && (
              sys.url.startsWith('/') ? (
                <button
                  onClick={() => onOpenTool(sys.name, sys.url!)}
                  title="Abrir ferramenta"
                  style={{
                    width: 28, height: 28, borderRadius: 7, border: '1px solid ' + C.border,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: C.g, background: C.card2 + '80', cursor: 'pointer',
                  }}
                >
                  <ExternalLink size={13} />
                </button>
              ) : (
                <a href={sys.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    width: 28, height: 28, borderRadius: 7,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: C.b, background: C.card2 + '80', border: '1px solid ' + C.border,
                    textDecoration: 'none',
                  }}>
                  <ExternalLink size={13} />
                </a>
              )
            )}
            <button onClick={onEdit} style={{
              width: 28, height: 28, borderRadius: 7, border: '1px solid ' + C.border,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: C.card2 + '80', color: C.ink2, cursor: 'pointer',
            }}>
              <Edit2 size={12} />
            </button>
            <button onClick={onDelete} style={{
              width: 28, height: 28, borderRadius: 7, border: '1px solid ' + C.border,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: C.card2 + '80', color: C.r, cursor: 'pointer',
            }}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Description */}
        {sys.description && (
          <div style={{ fontSize: 12, color: C.ink2, marginBottom: 10, lineHeight: 1.5 }}>
            {sys.description}
          </div>
        )}

        {/* Tech stack tags */}
        {techStack.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
            {techStack.map(tag => (
              <span key={tag} style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 20,
                background: C.b + '18', color: C.b,
                border: '1px solid ' + C.b + '33',
              }}>{tag}</span>
            ))}
          </div>
        )}

        {/* Files */}
        <FilesSection systemId={sys.id} />
      </div>
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function SistemasPage() {
  const navigate = useNavigate()
  const { query, add, remove } = useSystems()
  const [modal, setModal] = useState<System | null | false>(false)
  const [iframeTool, setIframeTool] = useState<{ title: string; url: string } | null>(null)
  const autoInserted = useRef(false)

  const systems = query.data ?? []

  /* Auto-insert built-in tools on first load */
  useEffect(() => {
    if (!query.isSuccess || autoInserted.current) return
    autoInserted.current = true
    if (!systems.some(s => s.name === 'Otimizador de Imagens')) {
      add.mutate({
        name: 'Otimizador de Imagens',
        description: 'Comprime e otimiza imagens diretamente no browser. Suporta JPG, PNG, WebP e exportação em lote via ZIP.',
        category: 'Ferramenta',
        status: 'Ativo',
        url: '/otimizador.html',
        tech_stack: ['HTML', 'JavaScript', 'JSZip'],
        thumbnail_url: null,
      })
    }
    if (!systems.some(s => s.name === 'WP Speed Audit')) {
      add.mutate({
        name: 'WP Speed Audit',
        description: 'Analise a velocidade de sites WordPress e gere um plano de ação com o PageSpeed Insights do Google.',
        category: 'Ferramenta',
        status: 'Ativo',
        url: '/sistemas/wp-speed-audit',
        tech_stack: ['React', 'PageSpeed API'],
        thumbnail_url: null,
      })
    }
  }, [query.isSuccess, systems]) // eslint-disable-line react-hooks/exhaustive-deps

  /* URLs ending in .html are static files → open in IframeModal.
     Other internal paths (React routes) → navigate directly. */
  function handleOpenTool(title: string, url: string) {
    if (url.endsWith('.html')) {
      setIframeTool({ title, url })
    } else {
      navigate(url)
    }
  }

  function handleDelete(sys: System) {
    if (!confirm(`Excluir "${sys.name}"?`)) return
    remove.mutate(sys.id)
  }

  return (
    <div style={{ fontFamily: 'Manrope, sans-serif', maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: C.ink, margin: 0 }}>Sistemas</h1>
          <div style={{ fontSize: 12, color: C.dm, marginTop: 3 }}>
            {systems.length} sistema{systems.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button onClick={() => setModal(null)}
          style={{ ...btnStyle, background: C.b, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} />
          Novo sistema
        </button>
      </div>

      {/* Loading / empty */}
      {query.isLoading && (
        <div style={{ textAlign: 'center', color: C.dm, fontSize: 13, padding: '48px 0' }}>
          Carregando…
        </div>
      )}
      {query.isError && (
        <div style={{ textAlign: 'center', color: C.r, fontSize: 13, padding: '48px 0' }}>
          Não foi possível carregar os sistemas. Tente novamente.
        </div>
      )}
      {!query.isLoading && !query.isError && systems.length === 0 && (
        <div style={{
          textAlign: 'center', color: C.dm, fontSize: 13,
          padding: '56px 24px', background: C.card, borderRadius: 14,
          border: '1px solid ' + C.border,
        }}>
          Nenhum sistema cadastrado
        </div>
      )}

      {/* Grid */}
      {systems.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {systems.map(sys => (
            <SystemCard
              key={sys.id}
              sys={sys}
              onEdit={() => setModal(sys)}
              onDelete={() => handleDelete(sys)}
              onOpenTool={handleOpenTool}
            />
          ))}
        </div>
      )}

      {/* Edit/create modal */}
      {modal !== false && (
        <SystemModal
          initial={modal}
          onClose={() => setModal(false)}
        />
      )}

      {/* Fullscreen iframe tool modal */}
      {iframeTool && (
        <IframeModal
          title={iframeTool.title}
          url={iframeTool.url}
          onClose={() => setIframeTool(null)}
        />
      )}
    </div>
  )
}
