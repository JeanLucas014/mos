import { X, Calendar, TrendingUp, CreditCard, Tag, Target, PiggyBank } from 'lucide-react'

interface Props {
  onClose: () => void
}

const SECTIONS = [
  {
    icon: <Calendar size={16} />,
    color: 'var(--blue)',
    title: 'Ano e Mês',
    text: 'A aba "Ano" mostra a visão geral de saldo, projeção e gráfico anual. A aba "Mês" mostra o detalhe dia a dia, onde você lança suas movimentações.',
  },
  {
    icon: <Tag size={16} />,
    color: '#22c55e',
    title: 'Diário, Saída fixa e Cartão',
    text: 'Diário: gastos do dia a dia (mercado, almoço, uber). Saída fixa: contas recorrentes (aluguel, internet). Cartão: compras de crédito, que se agrupam automaticamente na fatura do mês de vencimento.',
  },
  {
    icon: <CreditCard size={16} />,
    color: '#f97316',
    title: 'Cartões de crédito',
    text: 'Cadastre seus cartões em Configurações com o dia de fechamento e vencimento. Compras feitas após o fechamento entram automaticamente na fatura do mês seguinte.',
  },
  {
    icon: <PiggyBank size={16} />,
    color: '#a78bfa',
    title: 'Orçamentos por categoria',
    text: 'Em Configurações → Orçamentos, defina um limite mensal por categoria (ex: Alimentação = R$800). O MOS te avisa quando estiver perto de estourar.',
  },
  {
    icon: <Target size={16} />,
    color: '#14b8a6',
    title: 'Metas',
    text: 'Defina metas financeiras (ex: juntar R$10.000) e acompanhe o progresso automaticamente com base no seu saldo.',
  },
  {
    icon: <TrendingUp size={16} />,
    color: '#f59e0b',
    title: 'Investimentos',
    text: 'Registre seus investimentos para ter uma visão consolidada do seu patrimônio, separado do fluxo de caixa do dia a dia.',
  },
]

export function FinanceiroGuide({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-2 border border-line rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-bg-2">
          <div>
            <span className="text-sm font-semibold font-[Sora] text-white">
              Como funciona o Financeiro
            </span>
            <p className="text-[11px] text-ink-3 mt-0.5">
              Um guia rápido pelos principais conceitos
            </p>
          </div>
          <button onClick={onClose} className="text-ink-3 hover:text-white transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {SECTIONS.map((s, i) => (
            <div key={i} className="flex gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: s.color + '18', color: s.color }}
              >
                {s.icon}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white mb-0.5">{s.title}</div>
                <p className="text-[12.5px] text-[#888] leading-relaxed">{s.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-line sticky bottom-0 bg-bg-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-brand text-black font-semibold text-sm rounded-xl hover:bg-[#38bdf8] transition-colors"
          >
            Entendi, começar
          </button>
        </div>
      </div>
    </div>
  )
}
