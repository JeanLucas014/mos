import { useState, type FormEvent } from 'react'
import { CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { inputCls, inputH } from './shared'

/* ══════════════════════════════════════════════════════════════════
   CHANGE PASSWORD MODAL
══════════════════════════════════════════════════════════════════ */
export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [next,    setNext]    = useState('')
  const [confirm, setConfirm] = useState('')
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPw,  setShowPw]  = useState(false)
  const { user } = useAuth()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (next.length < 6)  { setError('A nova senha deve ter ao menos 6 caracteres.'); return }
    if (next !== confirm) { setError('As senhas não conferem.'); return }
    setLoading(true)
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user!.email!, password: current })
    if (signInErr) { setLoading(false); setError('Senha atual incorreta.'); return }
    const { error: updateErr } = await supabase.auth.updateUser({ password: next })
    setLoading(false)
    if (updateErr) {
      console.error('[ChangePasswordModal]', updateErr)
      setError('Não foi possível alterar sua senha. Tente novamente.')
    }
    else setSuccess(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.8)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-line p-6" style={{ background: 'var(--bg2)' }}>
        {success ? (
          <div className="text-center py-6">
            <div className="flex justify-center mb-3"><CheckCircle size={40} className="text-ok" /></div>
            <p className="text-ok font-semibold" style={{ fontSize: 15 }}>Senha alterada com sucesso!</p>
            <button onClick={onClose} className="mt-5 bg-bg-3 text-ink-2 rounded-input px-6 text-sm hover:text-ink transition-colors" style={inputH}>Fechar</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 17 }}>Alterar senha</h3>
              <button onClick={onClose} aria-label="Fechar" className="w-8 h-8 flex items-center justify-center text-ink-3 hover:text-ink hover:bg-bg-3 rounded-input transition-colors text-lg">×</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Senha atual</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" required className={inputCls + ' pr-10'} style={inputH} />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Nova senha</label>
                <input type={showPw ? 'text' : 'password'} value={next} onChange={(e) => setNext(e.target.value)} placeholder="••••••••" required className={inputCls} style={inputH} />
              </div>
              <div>
                <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Confirmar nova senha</label>
                <input type={showPw ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required className={inputCls} style={inputH} />
              </div>
              {error && <p className="text-red-400" style={{ fontSize: 12.5 }}>{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading || !current || !next || !confirm} className="flex-1 bg-brand text-white rounded-input font-semibold text-sm hover:brightness-110 disabled:opacity-40 transition-all" style={inputH}>{loading ? 'Salvando…' : 'Salvar'}</button>
                <button type="button" onClick={onClose} className="flex-1 bg-bg-3 text-ink-2 rounded-input text-sm hover:text-ink transition-colors" style={inputH}>Cancelar</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
