import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, Lock, Upload } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useVaultStore } from '../stores/useVaultStore'
import { useVaultItems, type VaultItem } from '../hooks/useVaultItems'
import { deriveKey, encrypt, decrypt, makeUserSalt } from '../lib/crypto'

/* ══════════════════════════════════════════════════════════════
   SERVICE ICON — coloured circle with first letter
══════════════════════════════════════════════════════════════ */
const ICON_COLORS = [
  '#0EA5E9', '#34d399', '#a78bfa', '#fbbf24',
  '#f87171', '#60a5fa', '#f59e0b', '#6ee7b7',
]

function serviceColor(service: string): string {
  let h = 0
  for (let i = 0; i < service.length; i++) h = (h * 31 + service.charCodeAt(i)) >>> 0
  return ICON_COLORS[h % ICON_COLORS.length]
}

function ServiceIcon({ name }: { name: string }) {
  const color = serviceColor(name)
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-xl text-white font-bold"
      style={{
        width: 40, height: 40,
        background: color + '22',
        color,
        fontSize: 15,
        fontFamily: 'Sora, sans-serif',
        border: `1px solid ${color}33`,
      }}
    >
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   ICON BUTTONS
══════════════════════════════════════════════════════════════ */
function IconBtn({
  title,
  onClick,
  danger,
  children,
}: {
  title: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={[
        'flex-shrink-0 flex items-center justify-center rounded-lg transition-colors',
        danger
          ? 'text-ink-3 hover:text-red-400 hover:bg-red-400/10'
          : 'text-ink-3 hover:text-ink hover:bg-bg-3',
      ].join(' ')}
      style={{ width: 34, height: 34 }}
    >
      {children}
    </button>
  )
}

/* ══════════════════════════════════════════════════════════════
   COPY BUTTON with feedback
══════════════════════════════════════════════════════════════ */
function CopyBtn({ getValue }: { getValue: () => Promise<string | null> }) {
  const [state, setState] = useState<'idle' | 'ok' | 'err'>('idle')

  async function handleCopy() {
    const val = await getValue()
    if (!val) { setState('err'); setTimeout(() => setState('idle'), 2000); return }
    await navigator.clipboard.writeText(val)
    setState('ok')
    setTimeout(() => setState('idle'), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copiar senha"
      className={[
        'flex-shrink-0 flex items-center justify-center rounded-lg transition-colors text-xs font-mono',
        state === 'ok'  ? 'text-ok bg-ok/10' :
        state === 'err' ? 'text-red-400 bg-red-400/10' :
        'text-ink-3 hover:text-ink hover:bg-bg-3',
      ].join(' ')}
      style={{ width: 34, height: 34 }}
    >
      {state === 'ok' ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="5" y="5" width="9" height="10" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
          <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-7A1.5 1.5 0 0 0 1 3.5v8A1.5 1.5 0 0 0 2.5 13H4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}

/* ══════════════════════════════════════════════════════════════
   ADD / EDIT MODAL
══════════════════════════════════════════════════════════════ */
type ModalMode = { kind: 'add' } | { kind: 'edit'; item: VaultItem }

function VaultModal({
  mode,
  cryptoKey,
  onSave,
  onClose,
}: {
  mode: ModalMode
  cryptoKey: CryptoKey
  onSave: (service: string, username: string, password: string, itemId?: string) => Promise<void>
  onClose: () => void
}) {
  const [service,  setService]  = useState(mode.kind === 'edit' ? mode.item.service  : '')
  const [username, setUsername] = useState(mode.kind === 'edit' ? (mode.item.username ?? '') : '')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [loadingCurrent, setLoadingCurrent] = useState(false)

  /* For edit: decrypt current password to pre-fill */
  const [currentLoaded, setCurrentLoaded] = useState(false)
  async function loadCurrent() {
    if (mode.kind !== 'edit' || currentLoaded) return
    setLoadingCurrent(true)
    try {
      const plain = await decrypt(mode.item.password_cipher, mode.item.password_iv, cryptoKey)
      setPassword(plain)
      setCurrentLoaded(true)
    } catch {
      setError('Não foi possível descriptografar a senha atual.')
    }
    setLoadingCurrent(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!service.trim() || !password) return
    setError('')
    setLoading(true)
    try {
      await onSave(
        service.trim(),
        username.trim(),
        password,
        mode.kind === 'edit' ? mode.item.id : undefined,
      )
      onClose()
    } catch (err) {
      setError((err as Error).message)
    }
    setLoading(false)
  }

  const inputCls = 'w-full bg-bg border border-line rounded-input px-3 text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors text-sm'
  const h = { minHeight: 44 }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-line p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        style={{ background: '#111111' }}
      >
        <div className="flex items-center justify-between">
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 17 }}>
            {mode.kind === 'add' ? 'Nova credencial' : 'Editar credencial'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-ink-3 hover:text-ink hover:bg-bg-3 rounded-input transition-colors text-lg"
          >×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Service */}
          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
              Serviço *
            </label>
            <input
              autoFocus
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="GitHub, Google, Netflix…"
              className={inputCls}
              style={h}
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
              Usuário / E-mail
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="jean@exemplo.com"
              className={inputCls}
              style={h}
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-ink-2" style={{ fontSize: 12, fontWeight: 600 }}>
                Senha *
              </label>
              {mode.kind === 'edit' && !currentLoaded && (
                <button
                  type="button"
                  onClick={loadCurrent}
                  disabled={loadingCurrent}
                  className="text-brand text-xs hover:brightness-110 transition-all"
                >
                  {loadingCurrent ? 'Carregando…' : 'Carregar atual'}
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode.kind === 'edit' ? '(deixe em branco para não alterar)' : '••••••••'}
                className={inputCls + ' pr-10'}
                style={{ ...h, fontFamily: showPw ? 'JetBrains Mono, monospace' : undefined }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors"
                style={{ fontSize: 14 }}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400" style={{ fontSize: 12 }}>{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading || !service.trim() || (mode.kind === 'add' && !password)}
              className="flex-1 bg-brand text-white rounded-input font-semibold text-sm hover:brightness-110 disabled:opacity-40 transition-all"
              style={h}
            >
              {loading ? 'Salvando…' : mode.kind === 'add' ? 'Adicionar' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-bg-3 text-ink-2 rounded-input text-sm hover:text-ink transition-colors"
              style={h}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   VAULT ITEM ROW
══════════════════════════════════════════════════════════════ */
function VaultRow({
  item,
  cryptoKey,
  onEdit,
  onDelete,
}: {
  item: VaultItem
  cryptoKey: CryptoKey
  onEdit: (item: VaultItem) => void
  onDelete: (id: string) => void
}) {
  const [revealed,         setRevealed]         = useState(false)
  const [decryptedPw,      setDecryptedPw]      = useState<string | null>(null)
  const [revealLoading,    setRevealLoading]     = useState(false)
  const [decryptError,     setDecryptError]      = useState(false)

  async function tryDecrypt(): Promise<string | null> {
    if (decryptedPw !== null) return decryptedPw
    try {
      const plain = await decrypt(item.password_cipher, item.password_iv, cryptoKey)
      setDecryptedPw(plain)
      return plain
    } catch {
      setDecryptError(true)
      return null
    }
  }

  async function handleToggleReveal() {
    if (revealed) {
      setRevealed(false)
      return
    }
    setRevealLoading(true)
    setDecryptError(false)
    const plain = await tryDecrypt()
    setRevealLoading(false)
    if (plain !== null) setRevealed(true)
  }

  async function getCopyValue(): Promise<string | null> {
    setDecryptError(false)
    return tryDecrypt()
  }

  return (
    <div className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-line bg-bg-2 hover:border-white/10 transition-colors">
      <ServiceIcon name={item.service} />

      {/* Service + username */}
      <div className="flex-1 min-w-0">
        <div
          className="text-ink font-semibold truncate"
          style={{ fontFamily: 'Sora, sans-serif', fontSize: 13.5 }}
        >
          {item.service}
        </div>
        {item.username && (
          <div className="text-ink-2 truncate" style={{ fontSize: 11.5 }}>
            {item.username}
          </div>
        )}
      </div>

      {/* Password area */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {decryptError && (
          <span style={{ fontSize: 10, color: '#f87171' }}>
            Senha incorreta
          </span>
        )}
        {!decryptError && (
          <div
            className="text-ink-2 select-none"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
              letterSpacing: revealed ? '0.02em' : '0.15em',
              minWidth: 80,
              maxWidth: 140,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {revealed && decryptedPw ? decryptedPw : '••••••••'}
          </div>
        )}

        {/* Reveal button */}
        <IconBtn
          title={revealed ? 'Ocultar senha' : 'Revelar senha'}
          onClick={handleToggleReveal}
        >
          {revealLoading ? (
            <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
          ) : revealed ? (
            /* eye-off */
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M6.5 6.6A2 2 0 0 0 9.4 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M4.2 4.3C2.7 5.2 1.5 6.5 1 8c1.1 3.2 4 5 7 5a7 7 0 0 0 3.2-.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M9.8 3.5A7 7 0 0 1 15 8c-.4 1.1-1 2.1-1.8 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          ) : (
            /* eye */
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="8" rx="7" ry="4" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          )}
        </IconBtn>

        {/* Copy button */}
        <CopyBtn getValue={getCopyValue} />

        {/* Edit + delete (always visible on mobile, hover on desktop) */}
        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <IconBtn title="Editar" onClick={() => onEdit(item)}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </IconBtn>
          <IconBtn
            title="Remover"
            danger
            onClick={() => {
              if (window.confirm(`Remover "${item.service}"?`)) onDelete(item.id)
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 4h10M5 4V3h6v1M6 7v5M10 7v5M4 4l.6 9h6.8L12 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconBtn>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   UNLOCK SCREEN
══════════════════════════════════════════════════════════════ */
function UnlockScreen({
  items,
  onUnlock,
}: {
  items: VaultItem[] | undefined
  onUnlock: (key: CryptoKey) => void
}) {
  const { user }       = useAuth()
  const [pw,     setPw]     = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error,  setError]  = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!pw) return
    setError('')
    setLoading(true)

    try {
      const salt = makeUserSalt(user!.id)
      const key  = await deriveKey(pw, salt)

      /* Validate against first item if vault has entries */
      if (items && items.length > 0) {
        try {
          await decrypt(items[0].password_cipher, items[0].password_iv, key)
        } catch {
          setError('Master password incorreto.')
          setLoading(false)
          return
        }
      }

      onUnlock(key)
    } catch {
      setError('Erro ao derivar chave. Tente novamente.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-start pt-[20vh] sm:items-center sm:pt-0 sm:min-h-[60vh] justify-center px-4">
      <div className="w-full max-w-[360px]">
        {/* Icon */}
        <div
          className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-2xl"
          style={{ background: 'rgba(14,165,233,.1)', border: '1px solid rgba(14,165,233,.2)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <circle cx="12" cy="16" r="1" fill="#0EA5E9" />
          </svg>
        </div>

        <h2
          className="text-center mb-1"
          style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em' }}
        >
          Cofre de Senhas
        </h2>
        <p className="text-ink-2 text-center mb-7 text-sm">
          {items && items.length > 0
            ? `${items.length} credencial${items.length !== 1 ? 'ais' : ''} protegida${items.length !== 1 ? 's' : ''}. Digite seu master password para desbloquear.`
            : 'Digite seu master password para desbloquear o cofre.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
              Master Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••••••"
                autoFocus
                className="w-full bg-bg-3 border border-line rounded-input px-3 py-2.5 pr-10 text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
                style={{ fontSize: 14, fontFamily: showPw ? 'JetBrains Mono, monospace' : undefined }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors"
                style={{ fontSize: 14 }}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !pw}
            className="w-full bg-brand text-white rounded-input font-semibold py-[11px] hover:brightness-110 active:scale-[.97] transition-all disabled:opacity-50"
            style={{ fontSize: 14 }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Derivando chave…
              </span>
            ) : 'Desbloquear'}
          </button>

          <p className="text-ink-3 text-center" style={{ fontSize: 11 }}>
            O master password nunca é enviado ao servidor.
          </p>
        </form>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   NOTION IMPORT
══════════════════════════════════════════════════════════════ */
interface NotionEntry { service: string; username: string | null; password: string }

function parseNotionPasswords(text: string): NotionEntry[] {
  const entries: NotionEntry[] = []
  const lines = text.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    if (line.startsWith('- ')) {
      const service = line.slice(2).trim()
      if (!service) { i++; continue }

      const sublines: string[] = []
      i++
      while (i < lines.length && (lines[i].startsWith('    ') || lines[i].startsWith('\t') || lines[i].trim() === '')) {
        const sub = lines[i].trim()
        if (sub) sublines.push(sub)
        i++
      }

      // First subline that is not a URL and not a 2FA code and has content
      const password = sublines.find(s =>
        s.length > 0 &&
        !s.startsWith('http://') &&
        !s.startsWith('https://') &&
        !/^\d{4}[\s-]\d{4}$/.test(s),
      ) ?? sublines[0] ?? ''

      if (password) {
        entries.push({ service, username: null, password })
      }
    } else {
      i++
    }
  }

  return entries
}

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */
export function VaultPage() {
  const { cryptoKey, setKey, lock } = useVaultStore()
  const { data: items = [], isLoading, addItem, updateItem, deleteItem } = useVaultItems()

  const [search,   setSearch]   = useState('')
  const [modal,    setModal]    = useState<ModalMode | null>(null)

  /* ── Filter ── */
  const filtered = search.trim()
    ? items.filter((i) =>
        i.service.toLowerCase().includes(search.toLowerCase()) ||
        (i.username ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : items

  /* ── Handlers ── */
  async function handleSave(
    service: string,
    username: string,
    password: string,
    itemId?: string,
  ) {
    if (!cryptoKey) return

    /* Only re-encrypt if password was provided (for edit, blank = keep old) */
    if (itemId && !password) {
      await updateItem.mutateAsync({ id: itemId, service, username: username || null })
      return
    }

    const { cipher, iv } = await encrypt(password, cryptoKey)

    if (itemId) {
      await updateItem.mutateAsync({
        id: itemId,
        service,
        username: username || null,
        password_cipher: cipher,
        password_iv: iv,
      })
    } else {
      await addItem.mutateAsync({
        service,
        username: username || null,
        password_cipher: cipher,
        password_iv: iv,
      })
    }
  }

  /* ── Notion import ── */
  async function handleNotionImport(e: React.ChangeEvent<HTMLInputElement>) {
    if (!cryptoKey) return
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const entries = parseNotionPasswords(text)

    if (entries.length === 0) {
      alert('Nenhuma senha encontrada no arquivo.')
      e.target.value = ''
      return
    }

    if (!window.confirm(`Importar ${entries.length} senha${entries.length !== 1 ? 's' : ''} do Notion?`)) {
      e.target.value = ''
      return
    }

    let imported = 0
    let errors = 0

    for (const entry of entries) {
      try {
        const { cipher, iv } = await encrypt(entry.password, cryptoKey)
        await addItem.mutateAsync({
          service: entry.service,
          username: entry.username,
          password_cipher: cipher,
          password_iv: iv,
        })
        imported++
      } catch {
        errors++
      }
    }

    alert(`Importação concluída: ${imported} senha${imported !== 1 ? 's' : ''} importada${imported !== 1 ? 's' : ''}${errors > 0 ? `, ${errors} erro${errors !== 1 ? 's' : ''}` : ''}.`)
    e.target.value = ''
  }

  /* ── Locked ── */
  if (!cryptoKey) {
    return (
      <div>
        <h1
          className="text-2xl lg:text-[30px] mb-1"
          style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}
        >
          Senhas
        </h1>
        <UnlockScreen
          items={isLoading ? undefined : items}
          onUnlock={setKey}
        />
      </div>
    )
  }

  /* ── Unlocked ── */
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1
            className="text-2xl lg:text-[30px]"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}
          >
            Senhas
          </h1>
          <p className="text-ink-2 mt-1 text-sm">
            {filtered.length} credencial{filtered.length !== 1 ? 'ais' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Lock */}
          <button
            onClick={lock}
            title="Travar cofre"
            className="flex items-center gap-1.5 px-3 rounded-input border border-line text-ink-2 hover:text-ink hover:border-white/20 hover:bg-bg-3 transition-colors text-sm"
            style={{ minHeight: 40 }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <rect x="2.5" y="7" width="11" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
              <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            Travar
          </button>

          {/* Import from Notion */}
          <label
            className="flex items-center gap-1.5 text-xs text-ink-2 hover:text-ink cursor-pointer transition-colors px-3 rounded-input border border-line hover:bg-bg-3 hover:border-white/20"
            style={{ minHeight: 40 }}
            title="Importar senhas de arquivo .md exportado do Notion"
          >
            <Upload size={13} />
            Importar Notion
            <input type="file" accept=".md,.txt" className="hidden" onChange={handleNotionImport} />
          </label>

          {/* Add */}
          <button
            onClick={() => setModal({ kind: 'add' })}
            className="flex items-center gap-1.5 bg-brand text-white rounded-input px-4 font-semibold text-sm hover:brightness-110 transition-all"
            style={{ minHeight: 40 }}
          >
            + Adicionar
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
          width="14" height="14" viewBox="0 0 16 16" fill="none"
        >
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar serviço ou e-mail…"
          className="w-full bg-bg-2 border border-line rounded-input pl-9 pr-4 text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
          style={{ minHeight: 42 }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors"
          >×</button>
        )}
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-bg-2 border border-line rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-ink-3">
          <Lock size={36} className="text-ink-3" />
          <p className="text-sm text-center">
            {items.length === 0
              ? 'Nenhuma senha salva.\nAdicione sua primeira credencial.'
              : 'Nenhum resultado para esta busca.'}
          </p>
          {items.length === 0 && (
            <button
              onClick={() => setModal({ kind: 'add' })}
              className="text-brand text-sm font-medium hover:brightness-110 mt-1"
            >
              + Adicionar credencial
            </button>
          )}
        </div>
      )}

      {/* List */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((item) => (
            <VaultRow
              key={item.id}
              item={item}
              cryptoKey={cryptoKey}
              onEdit={(i) => setModal({ kind: 'edit', item: i })}
              onDelete={(id) => deleteItem.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Security note */}
      <p
        className="text-ink-3 text-center mt-6"
        style={{ fontSize: 11 }}
      >
        Senhas criptografadas com AES-GCM · chave nunca sai do dispositivo
      </p>

      {/* Modal */}
      {modal && (
        <VaultModal
          mode={modal}
          cryptoKey={cryptoKey}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
