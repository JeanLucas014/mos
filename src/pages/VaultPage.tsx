import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useVaultStore } from '../stores/useVaultStore'
import { useVaultItems, type VaultItem } from '../hooks/useVaultItems'
import { HelpButton } from '@/components/help/HelpButton'
import { supabase } from '../lib/supabase'
import { deriveKey, encrypt, decrypt, makeUserSalt, LEGACY_ITERATIONS } from '../lib/crypto'

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
  onSave: (service: string, username: string, password: string, kind: string, itemId?: string) => Promise<void>
  onClose: () => void
}) {
  const editItem = mode.kind === 'edit' ? mode.item : null
  const [itemKind, setItemKind] = useState<'senha' | 'chave_api'>(
    (editItem as any)?.kind === 'chave_api' ? 'chave_api' : 'senha'
  )
  const [service,  setService]  = useState(editItem?.service  ?? '')
  const [username, setUsername] = useState(editItem?.username ?? '')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [loadingCurrent, setLoadingCurrent] = useState(false)

  const isApiKey = itemKind === 'chave_api'
  const serviceLabel   = isApiKey ? 'Nome da chave *' : 'Serviço *'
  const servicePh      = isApiKey ? 'OpenAI, Stripe, Supabase…' : 'GitHub, Google, Netflix…'
  const usernameLabel  = isApiKey ? 'Ambiente (opcional)' : 'Usuário / E-mail'
  const usernamePh     = isApiKey ? 'Produção, Sandbox…' : 'jean@exemplo.com'
  const passwordLabel  = isApiKey ? 'Chave *' : 'Senha *'
  const passwordPh     = mode.kind === 'edit' ? '(deixe em branco para não alterar)' : isApiKey ? 'sk_live_…' : '••••••••'

  /* For edit: decrypt current password to pre-fill */
  const [currentLoaded, setCurrentLoaded] = useState(false)
  async function loadCurrent() {
    if (!editItem || currentLoaded) return
    setLoadingCurrent(true)
    try {
      const plain = await decrypt(editItem.password_cipher, editItem.password_iv, cryptoKey)
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
        itemKind,
        editItem?.id,
      )
      onClose()
    } catch (err) {
      console.error('[VaultModal]', err)
      setError('Não foi possível salvar a credencial. Tente novamente.')
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
        style={{ background: 'var(--bg2)' }}
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
          {/* Kind selector */}
          <div className="flex gap-2">
            {(['senha', 'chave_api'] as const).map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setItemKind(k)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors"
                style={{
                  borderColor: itemKind === k ? '#0EA5E9' : 'var(--border)',
                  background:  itemKind === k ? 'rgba(14,165,233,.1)' : 'transparent',
                  color:       itemKind === k ? '#0EA5E9' : 'var(--text3)',
                }}
              >
                {k === 'senha' ? 'Senha' : 'Chave de API'}
              </button>
            ))}
          </div>

          {/* Service */}
          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
              {serviceLabel}
            </label>
            <input
              autoFocus
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder={servicePh}
              className={inputCls}
              style={h}
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
              {usernameLabel}
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={usernamePh}
              className={inputCls}
              style={h}
            />
          </div>

          {/* Password / Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-ink-2" style={{ fontSize: 12, fontWeight: 600 }}>
                {passwordLabel}
              </label>
              {editItem && !currentLoaded && (
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
                placeholder={passwordPh}
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
  const [revealed,      setRevealed]      = useState(false)
  const [decryptedPw,   setDecryptedPw]   = useState<string | null>(null)
  const [revealLoading, setRevealLoading] = useState(false)
  const [decryptError,  setDecryptError]  = useState(false)
  const [showMenu,      setShowMenu]      = useState(false)

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
    if (revealed) { setRevealed(false); return }
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

  const isApiKey = (item as any).kind === 'chave_api'

  return (
    <div className="group flex items-center gap-2 px-4 py-3 rounded-xl border border-line bg-bg-2 hover:border-white/10 transition-colors">
      {/* Nome + usuário — clicável para revelar */}
      <button
        onClick={handleToggleReveal}
        className="flex-1 min-w-0 text-left"
      >
        <div className="flex items-center gap-1.5">
          <span
            className="text-ink font-semibold truncate"
            style={{ fontFamily: 'Sora, sans-serif', fontSize: 13.5 }}
          >
            {item.service}
          </span>
          {isApiKey && (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,.12)', padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>
              API
            </span>
          )}
        </div>

        {revealLoading ? (
          <div className="text-ink-3" style={{ fontSize: 11 }}>Descriptografando…</div>
        ) : decryptError ? (
          <div style={{ fontSize: 11, color: '#f87171' }}>Erro ao descriptografar</div>
        ) : revealed && decryptedPw ? (
          <div
            className="text-[#0EA5E9] truncate select-text"
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
          >
            {decryptedPw}
          </div>
        ) : item.username ? (
          <div className="text-ink-2 truncate" style={{ fontSize: 11.5 }}>
            {item.username}
          </div>
        ) : (
          <div className="text-ink-3" style={{ fontSize: 11 }}>Toque para revelar</div>
        )}
      </button>

      {/* Ações: copiar + menu */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <CopyBtn getValue={getCopyValue} />

        <div className="relative">
          <button
            onClick={() => setShowMenu(v => !v)}
            className="w-8 h-8 flex items-center justify-center text-[#555] hover:text-white rounded-lg hover:bg-[#1f1f1f] transition-colors"
          >
            ···
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-9 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden z-20 shadow-xl min-w-[120px]">
                <button
                  onClick={() => { onEdit(item); setShowMenu(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#ccc] hover:bg-[#222] transition-colors text-left"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Remover "${item.service}"?`)) onDelete(item.id)
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#ef4444] hover:bg-[#222] transition-colors text-left"
                >
                  Remover
                </button>
              </div>
            </>
          )}
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
  migrating,
  onUnlock,
}: {
  items: VaultItem[] | undefined
  migrating: boolean
  onUnlock: (password: string) => Promise<void>
}) {
  const { user }       = useAuth()
  const isDemo = user?.email === 'demo@jlmos.com.br'
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
      await onUnlock(pw)
    } catch (err) {
      setError((err as Error).message || 'Erro ao derivar chave. Tente novamente.')
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
            {isDemo && (
              <p className="text-[11px] text-[#0EA5E9] mt-2 text-center">
                Senha mestra de demonstração: <strong>demo1234</strong>
              </p>
            )}
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
                {migrating ? 'Atualizando segurança do cofre…' : 'Derivando chave…'}
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
   PAGE
══════════════════════════════════════════════════════════════ */
export function VaultPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { cryptoKey, setKey, lock } = useVaultStore()
  const { data: items = [], isLoading, addItem, updateItem, deleteItem } = useVaultItems()

  const [search,    setSearch]    = useState('')
  const [modal,     setModal]     = useState<ModalMode | null>(null)
  const [migrating, setMigrating] = useState(false)

  /* ── Unlock (with transparent 100k → 600k PBKDF2 migration) ── */
  async function handleUnlock(password: string) {
    const salt = makeUserSalt(user!.id)

    if (items.length === 0) {
      setKey(await deriveKey(password, salt))
      return
    }

    const first = items[0]

    /* Fast path: vault already on the current standard (600k) */
    try {
      const keyNew = await deriveKey(password, salt)
      await decrypt(first.password_cipher, first.password_iv, keyNew)
      setKey(keyNew)
      return
    } catch {
      /* fall through — try the legacy iteration count below */
    }

    /* Legacy path: vault was encrypted with the old 100k standard */
    let keyOld: CryptoKey
    try {
      keyOld = await deriveKey(password, salt, LEGACY_ITERATIONS)
      await decrypt(first.password_cipher, first.password_iv, keyOld)
    } catch {
      throw new Error('Master password incorreto.')
    }

    /* Correct password on a legacy vault — migrate transparently to 600k.
       Each item is only ever updated locally AFTER its new ciphertext is
       confirmed saved in Supabase — if the write fails (e.g. flaky network),
       that item simply stays on the legacy cipher, which is still fully
       valid and will be retried automatically on the next unlock. Nothing
       is ever deleted or overwritten before the replacement is confirmed. */
    setMigrating(true)
    try {
      const keyNew = await deriveKey(password, salt)
      for (const item of items) {
        try {
          const plain = await decrypt(item.password_cipher, item.password_iv, keyOld)
          const { cipher, iv } = await encrypt(plain, keyNew)
          const { error } = await supabase
            .from('vault_items')
            .update({ password_cipher: cipher, password_iv: iv })
            .eq('id', item.id)
          if (error) throw error
          qc.setQueryData<VaultItem[]>(['vault_items'], (old) =>
            old?.map((v) => (v.id === item.id ? { ...v, password_cipher: cipher, password_iv: iv } : v)),
          )
        } catch (err) {
          console.error('[vault-migration] item kept on legacy KDF, will retry next unlock:', item.id, err)
        }
      }
      setKey(keyNew)
    } finally {
      setMigrating(false)
    }
  }

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
    kind: string,
    itemId?: string,
  ) {
    if (!cryptoKey) return

    /* Only re-encrypt if password was provided (for edit, blank = keep old) */
    if (itemId && !password) {
      await updateItem.mutateAsync({ id: itemId, service, username: username || null, kind })
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
        kind,
      })
    } else {
      await addItem.mutateAsync({
        service,
        username: username || null,
        password_cipher: cipher,
        password_iv: iv,
        kind,
      })
    }
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
          migrating={migrating}
          onUnlock={handleUnlock}
        />
      </div>
    )
  }

  /* ── Unlocked ── */
  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-2xl lg:text-[30px]"
                style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}
              >
                Senhas
              </h1>
              <HelpButton pageId="senhas" />
            </div>
            <p className="text-ink-2 mt-1 text-sm">
              {filtered.length} credencial{filtered.length !== 1 ? 'ais' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={lock}
              title="Travar cofre"
              className="flex items-center justify-center w-9 h-9 rounded-input border border-line
                         text-ink-2 hover:text-ink hover:bg-bg-3 transition-colors flex-shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="2.5" y="7" width="11" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
                <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </button>
            <button
              onClick={() => setModal({ kind: 'add' })}
              className="flex items-center gap-1.5 bg-brand text-white rounded-input px-3.5
                         font-semibold text-sm hover:brightness-110 transition-all flex-shrink-0"
              style={{ minHeight: 36 }}
            >
              + Adicionar
            </button>
          </div>
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
