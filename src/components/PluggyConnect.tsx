import { useState, useEffect } from 'react'
import { PluggyConnect as PluggyWidget } from 'react-pluggy-connect'
import { supabase } from '@/lib/supabase'
import { formatDateBR } from '@/lib/dates'
import { Link2, Trash2, CheckCircle, Loader2 } from 'lucide-react'

interface Connection {
  id: string
  item_id: string
  bank_name: string
  account_type: 'credit' | 'debit'
  status: string
  created_at: string
}

const BANKS = [
  { name: 'Bradesco',  type: 'credit' as const, color: '#cc0000', desc: 'Crédito → agrupa por fatura (vence dia 5)' },
  { name: 'Santander', type: 'debit'  as const, color: '#ec0000', desc: 'Débito → entra no diário no dia da compra' },
  { name: 'Inter',     type: 'debit'  as const, color: '#ff8700', desc: 'Débito → entra no diário no dia da compra' },
]

export function PluggyConnect() {
  const [connections, setConnections]     = useState<Connection[]>([])
  const [loading, setLoading]             = useState(true)
  const [connectToken, setConnectToken]   = useState<string | null>(null)
  const [pendingBank, setPendingBank]     = useState<typeof BANKS[0] | null>(null)

  useEffect(() => { loadConnections() }, [])

  async function loadConnections() {
    const { data, error } = await supabase.from('pluggy_connections').select('*').order('created_at')
    if (error) console.error('PluggyConnect error:', error)
    setConnections((data ?? []) as Connection[])
    setLoading(false)
  }

  async function handleConnect(bank: typeof BANKS[0]) {
    setPendingBank(bank)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pluggy-connect-token`,
        { headers: { Authorization: `Bearer ${session!.access_token}` } }
      )
      const { accessToken } = await resp.json()
      setConnectToken(accessToken)
    } catch (e) {
      console.error(e)
      setPendingBank(null)
    }
  }

  async function handleSuccess(itemData: any) {
    if (!pendingBank) return
    const item = itemData.item ?? itemData

    // Busca account_id via pluggy-connect-token (apenas para leitura do item)
    let accountId = ''
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const r = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pluggy-connect-token`,
        { headers: { Authorization: `Bearer ${session!.access_token}` } }
      )
      const { accessToken: tok } = await r.json()
      const ar = await fetch(`https://api.pluggy.ai/accounts?itemId=${item.id}`, {
        headers: { 'X-API-KEY': tok },
      })
      const ad = await ar.json()
      accountId = ad.results?.[0]?.id ?? ''
    } catch {}

    await supabase.from('pluggy_connections').insert({
      item_id:      item.id,
      bank_name:    pendingBank.name,
      account_type: pendingBank.type,
      account_id:   accountId,
    })

    setConnectToken(null)
    setPendingBank(null)
    await loadConnections()
  }

  async function handleDisconnect(id: string) {
    if (!confirm('Desconectar este banco? Transações já inseridas são mantidas.')) return
    await supabase.from('pluggy_connections').delete().eq('id', id)
    loadConnections()
  }

  if (loading) return (
    <div className="text-white text-sm py-4">Carregando Open Finance...</div>
  )

  return (
    <div className="space-y-3">
      {/* Widget Pluggy (abre quando connectToken está disponível) */}
      {connectToken && (
        <PluggyWidget
          connectToken={connectToken}
          includeSandbox={true}
          onSuccess={handleSuccess}
          onError={(e: any) => { console.error(e); setConnectToken(null); setPendingBank(null) }}
          onClose={() => { setConnectToken(null); setPendingBank(null) }}
        />
      )}

      {/* Conexões ativas */}
      {connections.length > 0 && (
        <div className="space-y-0 mb-4">
          <div className="text-[10px] text-ink-3 uppercase tracking-wider font-[Sora] mb-2">Conectados</div>
          {connections.map(conn => (
            <div key={conn.id} className="group flex items-center gap-3 py-2.5 border-b border-[#1f1f1f]">
              <CheckCircle size={13} className="text-[#22c55e] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium">{conn.bank_name}</div>
                <div className="text-[10px] text-ink-3">
                  {conn.account_type === 'credit' ? 'Cartão crédito' : 'Débito'} ·
                  desde {formatDateBR(conn.created_at)}
                </div>
              </div>
              <button
                onClick={() => handleDisconnect(conn.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-3 hover:text-[#ef4444]"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botões para conectar */}
      <div className="text-[10px] text-ink-3 uppercase tracking-wider font-[Sora] mb-2">Conectar banco</div>
      {BANKS.map(bank => {
        const connected = connections.some(c => c.bank_name === bank.name)
        const isLoading = pendingBank?.name === bank.name
        return (
          <button
            key={bank.name}
            onClick={() => !connected && !pendingBank && handleConnect(bank)}
            disabled={connected || !!pendingBank}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left"
            style={{
              background:  'var(--bg2)',
              borderColor: connected ? '#22c55e44' : 'var(--border)',
              opacity:     connected || (!!pendingBank && !isLoading) ? 0.5 : 1,
              cursor:      connected || !!pendingBank ? 'default' : 'pointer',
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: bank.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white font-medium">{bank.name}</div>
              <div className="text-[10px] text-ink-3">{bank.desc}</div>
            </div>
            {connected
              ? <CheckCircle size={13} className="text-[#22c55e] shrink-0" />
              : isLoading
              ? <Loader2 size={13} className="animate-spin text-brand shrink-0" />
              : <Link2 size={13} className="text-brand shrink-0" />
            }
          </button>
        )
      })}

      <div className="text-[10px] text-[#333] pt-1">
        Conexão via Open Finance · suas senhas nunca passam pelo MOS
      </div>
    </div>
  )
}
