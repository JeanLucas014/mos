import { Link } from 'react-router-dom'
import { ArrowRight, DollarSign } from 'lucide-react'
import { useDashFinancas, useDashRecorrentes } from '../../../hooks/useDashboard'

/* ══════════════════════════════════════════════════════════════════
   WIDGET — FINANCEIRO
══════════════════════════════════════════════════════════════════ */
export function FinanceiroWidget() {
  const financas    = useDashFinancas()
  const recorrentes = useDashRecorrentes()

  const saldo     = financas.data?.saldo    ?? 0
  const receitas  = financas.data?.receitas ?? 0
  const despesas  = financas.data?.despesas ?? 0
  const vencidas  = recorrentes.data?.vencidas  ?? []
  const venceHoje = recorrentes.data?.venceHoje ?? []
  const alertas   = [...vencidas, ...venceHoje]

  const today = new Date().getDate()

  return (
    <Link to="/financeiro" className="block rounded-2xl border border-line bg-bg-2 p-[18px] hover:border-line/60 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <DollarSign size={13} className="text-ink-3" />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Financeiro
          </span>
        </div>
        <ArrowRight size={13} className="text-ink-3" />
      </div>

      {/* Saldo */}
      <div className="mb-4">
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>
          {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </div>
        <div style={{
          fontSize: 22,
          fontWeight: 500,
          fontFamily: 'Sora, sans-serif',
          lineHeight: 1,
          color: saldo >= 0 ? 'var(--text)' : '#ef4444',
        }}>
          {saldo < 0 ? '-' : ''}R$ {Math.abs(saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex gap-3 mt-1.5">
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            ↑ R$ {receitas.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            ↓ R$ {despesas.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Alertas — só se houver */}
      {alertas.length > 0 && (
        <>
          <div style={{ height: 1, background: 'var(--bg3)', marginBottom: 12 }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 8 }}>
            Atenção
          </div>
          <div>
            {vencidas.map((r: any, i: number) => (
              <div
                key={r.id}
                className="flex items-center justify-between"
                style={{ padding: '8px 0', borderBottom: i < vencidas.length - 1 || venceHoje.length > 0 ? '1px solid var(--border)' : undefined }}
              >
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)' }}>{r.nome}</div>
                  <div style={{ fontSize: 10.5, color: '#ef4444', marginTop: 1 }}>
                    Venceu há {today - r.dia_previsto} dia(s)
                  </div>
                </div>
                {r.valor > 0 && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
                    R$ {Number(r.valor).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </div>
                )}
              </div>
            ))}
            {venceHoje.map((r: any, i: number) => (
              <div
                key={r.id}
                className="flex items-center justify-between"
                style={{ padding: '8px 0', borderBottom: i < venceHoje.length - 1 ? '1px solid var(--border)' : undefined }}
              >
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)' }}>{r.nome}</div>
                  <div style={{ fontSize: 10.5, color: '#f59e0b', marginTop: 1 }}>Vence hoje</div>
                </div>
                {r.valor > 0 && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
                    R$ {Number(r.valor).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Sem alertas */}
      {alertas.length === 0 && !financas.isLoading && (
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>Nenhuma conta vencida ou com vencimento hoje.</div>
      )}
    </Link>
  )
}
