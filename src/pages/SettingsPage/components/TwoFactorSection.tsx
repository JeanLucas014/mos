import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { SectionLabel } from './shared'

/* ══════════════════════════════════════════════════════════════════
   TWO FACTOR SECTION
══════════════════════════════════════════════════════════════════ */
export function TwoFactorSection() {
  const [factors, setFactors] = useState<Array<{ id: string; status: string }>>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<'totp' | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => { loadFactors() }, [])

  async function loadFactors() {
    setLoading(true)
    const { data } = await supabase.auth.mfa.listFactors()
    setFactors(data?.totp ?? [])
    setLoading(false)
  }

  async function startEnrollTotp() {
    setError(null)
    setSuccess(null)
    setEnrolling('totp')
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error || !data) { setError(error?.message ?? 'Erro ao iniciar configuração'); setEnrolling(null); return }
    setQrCode(data.totp.qr_code)
    setSecret(data.totp.secret)
    setFactorId(data.id)
  }

  async function verifyTotp() {
    if (!factorId || verifyCode.length !== 6) return
    setError(null)
    const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeErr || !challengeData) { setError(challengeErr?.message ?? 'Erro'); return }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: verifyCode,
    })
    if (verifyErr) { setError('Código inválido. Tente novamente.'); return }

    setSuccess('Autenticador configurado com sucesso.')
    setEnrolling(null)
    setQrCode(null)
    setVerifyCode('')
    loadFactors()
  }

  async function unenroll(id: string) {
    setError(null)
    setSuccess(null)
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id })
    if (error) { setError(error.message); return }
    setSuccess('Autenticador removido.')
    loadFactors()
  }

  const activeFactor = factors.find(f => f.status === 'verified')

  return (
    <div className="flex flex-col gap-4 mt-2">
      <SectionLabel>Dupla verificação (2FA)</SectionLabel>
      <p className="text-ink-3 text-xs -mt-2">Adicione uma camada extra de segurança exigindo um código do app autenticador ao entrar.</p>

      {loading && <div style={{ fontSize: 13, color: 'var(--text3)' }}>Carregando...</div>}

      {!loading && !enrolling && (
        <>
          {activeFactor ? (
            <div className="rounded-xl border border-line bg-bg-2 p-4 flex items-center justify-between">
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                  App autenticador
                </div>
                <div style={{ fontSize: 12, color: '#22c55e' }}>Ativo</div>
              </div>
              <button
                onClick={() => unenroll(activeFactor.id)}
                style={{ fontSize: 12, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Remover
              </button>
            </div>
          ) : (
            <button
              onClick={startEnrollTotp}
              className="rounded-xl border border-line bg-bg-2 p-4 text-left transition-colors hover:border-brand w-full"
              style={{ cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
                App autenticador
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                Google Authenticator, Authy ou similar
              </div>
            </button>
          )}
        </>
      )}

      {enrolling === 'totp' && qrCode && (
        <div className="flex flex-col gap-4">
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>
            Escaneie o QR Code com seu app autenticador:
          </p>
          <div className="flex justify-center">
            <img src={qrCode} alt="QR Code 2FA" style={{ width: 180, height: 180, borderRadius: 12 }} />
          </div>
          {secret && (
            <div className="rounded-xl border border-line bg-bg p-3 text-center">
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>
                Ou insira o código manualmente:
              </div>
              <div style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--text)', letterSpacing: '0.1em' }}>
                {secret}
              </div>
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 8 }}>
              Código de verificação
            </label>
            <input
              value={verifyCode}
              onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-center outline-none focus:border-brand"
              style={{ fontSize: 24, fontFamily: 'monospace', letterSpacing: '0.3em', color: 'var(--text)' }}
            />
          </div>
          {error && <div style={{ fontSize: 13, color: '#f87171' }}>{error}</div>}
          <div className="flex gap-2">
            <button
              onClick={verifyTotp}
              disabled={verifyCode.length !== 6}
              className="flex-1 rounded-xl py-3 text-sm font-semibold"
              style={{
                background: verifyCode.length === 6 ? '#0ea5e9' : 'var(--bg3)',
                color: verifyCode.length === 6 ? '#0a0a0a' : 'var(--text3)',
                border: 'none', cursor: verifyCode.length === 6 ? 'pointer' : 'default',
                fontFamily: 'inherit',
              }}
            >
              Verificar e ativar
            </button>
            <button
              onClick={() => { setEnrolling(null); setQrCode(null); setVerifyCode('') }}
              className="rounded-xl px-4 py-3 text-sm border border-line"
              style={{ background: 'transparent', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {success && <div style={{ fontSize: 13, color: '#22c55e' }}>{success}</div>}
      {!enrolling && error && <div style={{ fontSize: 13, color: '#f87171' }}>{error}</div>}
    </div>
  )
}
