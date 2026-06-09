import { useState, useRef, type FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Plus, Edit2, Trash2, ExternalLink, Paperclip, X, Upload, ChevronDown, ChevronUp } from 'lucide-react'

/* ── Palette ─────────────────────────────────────────────────────── */
const C = {
  bg:     '#0a0a0a',
  card:   '#111111',
  card2:  '#161616',
  border: '#1f1f1f',
  b:      '#0EA5E9',
  g:      '#34d399',
  r:      '#f87171',
  a:      '#fbbf24',
  p:      '#a78bfa',
  dm:     '#888888',
  dm2:    '#555555',
  ink:    '#e5e5e5',
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
  stack: string[] | null
  thumbnail_url: string | null
  created_at: string
}

interface SystemFile {
  id: string
  system_id: string
  name: string
  type: string
  url: string
}

const CATEGORIES = ['App', 'API', 'Site', 'Dashboard', 'CLI', 'Library', 'Automação', 'Outro']
const STATUSES   = ['Ativo', 'Em desenvolvimento', 'Pausado', 'Arquivado']

const STATUS_COLOR: Record<string, string> = {
  'Ativo':             C.g,
  'Em desenvolvimento': C.a,
  'Pausado':           C.dm,
  'Arquivado':         C.r,
}

/* ── Hooks ───────────────────────────────────────────────────────── */
function useSystems() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['systems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('systems')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as System[]
    },
  })

  const add = useMutation<void, Error, Omit<System, 'id' | 'created_at'>>({
    mutationFn: async (payload) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('systems') as any).insert(payload)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['systems'] }),
  })

  const update = useMutation<void, Error, Partial<System> & { id: string }>({
    mutationFn: async ({ id, ...payload }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('systems') as any).update(payload).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['systems'] }),
  })

  const remove = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('systems') as any).delete().eq('id', id)
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
      const { data, error } = await supabase
        .from('system_files')
        .select('*')
        .eq('system_id', systemId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as SystemFile[]
    },
  })

  const add = useMutation<void, Error, { name: string; type: string; url: string }>({
    mutationFn: async (payload) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('system_files') as any).insert({ ...payload, system_id: systemId })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system_files', systemId] }),
  })

  const remove = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('system_files') as any).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system_files', systemId] }),
  })

  return { query, add, remove }
}

/* ── Thumbnail upload ─────────────────────────────────────────────── */
async function uploadThumbnail(file: File): Promise<string> {
  const ext  = file.name.split('.').pop()
  const path = `thumbnails/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('systems').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('systems').getPublicUrl(path)
  return data.publicUrl
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
  const [name,        setName]        = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category,    setCategory]    = useState(initial?.category ?? 'App')
  const [status,      setStatus]      = useState(initial?.status ?? 'Ativo')
  const [url,         setUrl]         = useState(initial?.url ?? '')
  const [stackRaw,    setStackRaw]    = useState((initial?.stack ?? []).join(', '))
  const [thumbUrl,    setThumbUrl]    = useState(initial?.thumbnail_url ?? '')
  const [uploading,   setUploading]   = useState(false)
  const [err,         setErr]         = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const isPending = add.isPending || update.isPending

  async function handleThumb(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadThumbnail(file)
      setThumbUrl(url)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setErr(null)
    const stack = stackRaw.split(',').map(s => s.trim()).filter(Boolean)
    const payload = {
      name:          name.trim(),
      description:   description.trim() || null,
      category,
      status,
      url:           url.trim() || null,
      stack:         stack.length ? stack : null,
      thumbnail_url: thumbUrl || null,
    }
    if (initial) {
      update.mutate({ id: initial.id, ...payload }, {
        onSuccess: onClose,
        onError: (e) => setErr((e as Error).message),
      })
    } else {
      add.mutate(payload, {
        onSuccess: onClose,
        onError: (e) => setErr((e as Error).message),
      })
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,.7)', display: 'flex',
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
              {thumbUrl
                ? <img src={thumbUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                : <Upload size={22} color={C.dm} />}
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.ink2, marginBottom: 4 }}>Thumbnail</div>
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ fontSize: 11, color: C.b, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                {uploading ? 'Enviando…' : 'Escolher imagem'}
              </button>
              {thumbUrl && (
                <button type="button" onClick={() => setThumbUrl('')}
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
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, color: C.dm, textTransform: 'uppercase', letterSpacing: '.06em' }}>Status</span>
              <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>

          {/* URL */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, color: C.dm, textTransform: 'uppercase', letterSpacing: '.06em' }}>URL</span>
            <input value={url} onChange={e => setUrl(e.target.value)} type="url"
              style={inputStyle} placeholder="https://…" />
          </label>

          {/* Stack */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, color: C.dm, textTransform: 'uppercase', letterSpacing: '.06em' }}>Stack (vírgula)</span>
            <input value={stackRaw} onChange={e => setStackRaw(e.target.value)}
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

/* ── Files section (expandable) ──────────────────────────────────── */
function FilesSection({ systemId }: { systemId: string }) {
  const { query, add, remove } = useSystemFiles(systemId)
  const [open,    setOpen]    = useState(false)
  const [name,    setName]    = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [type,    setType]    = useState('Link')
  const [err,     setErr]     = useState<string | null>(null)

  const files = query.data ?? []

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !fileUrl.trim()) return
    setErr(null)
    add.mutate({ name: name.trim(), url: fileUrl.trim(), type }, {
      onSuccess: () => { setName(''); setFileUrl('') },
      onError: (e) => setErr((e as Error).message),
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
              padding: '5px 0', borderBottom: '1px solid ' + C.border,
            }}>
              <a href={f.url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: C.b, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ExternalLink size={10} />
                {f.name}
                <span style={{ fontSize: 10, color: C.dm2, marginLeft: 4 }}>{f.type}</span>
              </a>
              <button onClick={() => remove.mutate(f.id)}
                style={{ background: 'none', border: 'none', color: C.dm2, cursor: 'pointer', padding: 2 }}>
                <X size={12} />
              </button>
            </div>
          ))}

          <form onSubmit={handleAdd} style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Nome" style={{ ...inputStyle, fontSize: 11, padding: '5px 8px', flex: '0 0 100px' }} />
            <input value={fileUrl} onChange={e => setFileUrl(e.target.value)}
              placeholder="URL" style={{ ...inputStyle, fontSize: 11, padding: '5px 8px', flex: 1 }} />
            <select value={type} onChange={e => setType(e.target.value)}
              style={{ ...inputStyle, fontSize: 11, padding: '5px 8px', flex: '0 0 68px' }}>
              {['Link', 'Repo', 'Doc', 'Design', 'Video', 'Outro'].map(t => <option key={t}>{t}</option>)}
            </select>
            <button type="submit" disabled={add.isPending}
              style={{ ...btnStyle, fontSize: 11, padding: '5px 10px', background: C.b, color: '#fff', flexShrink: 0 }}>
              +
            </button>
          </form>
          {err && <div style={{ fontSize: 10, color: C.r, marginTop: 4 }}>{err}</div>}
        </div>
      )}
    </div>
  )
}

/* ── System Card ─────────────────────────────────────────────────── */
function SystemCard({ sys, onEdit, onDelete }: { sys: System; onEdit: () => void; onDelete: () => void }) {
  const stack = sys.stack ?? []

  return (
    <div style={{
      background: C.card, border: '1px solid ' + C.border,
      borderRadius: 14, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Thumbnail */}
      {sys.thumbnail_url && (
        <div style={{ width: '100%', height: 140, overflow: 'hidden', flexShrink: 0 }}>
          <img src={sys.thumbnail_url} alt={sys.name}
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
              <a href={sys.url} target="_blank" rel="noopener noreferrer"
                style={{
                  width: 28, height: 28, borderRadius: 7,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.b, background: C.card2 + '80', border: '1px solid ' + C.border,
                  textDecoration: 'none',
                }}>
                <ExternalLink size={13} />
              </a>
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

        {/* Stack tags */}
        {stack.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
            {stack.map(tag => (
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

/* ── Shared styles ───────────────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0f0f0f',
  border: '1px solid #262626',
  borderRadius: 8,
  color: '#e5e5e5',
  fontSize: 13,
  padding: '8px 10px',
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

/* ── Page ────────────────────────────────────────────────────────── */
export default function SistemasPage() {
  const { query, remove } = useSystems()
  const [modal, setModal] = useState<System | null | false>(false)

  const systems = query.data ?? []

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
          Erro: {(query.error as Error).message}
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
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal !== false && (
        <SystemModal
          initial={modal}
          onClose={() => setModal(false)}
        />
      )}
    </div>
  )
}
