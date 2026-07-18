import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { FinAno } from './types'
import { AnoTab } from './tabs/AnoTab'
import { MesTab } from './tabs/MesTab'
import { OrcamentoTab } from './tabs/OrcamentoTab'
import { MetasTab } from './tabs/MetasTab'
import { InvestimentosTab } from './tabs/InvestimentosTab'
import { ConfigTab } from './tabs/ConfigTab'
import { FinanceiroGuide } from './components/FinanceiroGuide'
import { HelpCircle } from 'lucide-react'

type Tab = 'ano' | 'mes' | 'orcamento' | 'metas' | 'investimentos' | 'config'
const TABS: { id: Tab; label: string }[] = [
  { id: 'ano', label: 'Ano' },
  { id: 'mes', label: 'Mês' },
  { id: 'orcamento', label: 'Orçamento' },
  { id: 'metas', label: 'Metas' },
  { id: 'investimentos', label: 'Investimentos' },
  { id: 'config', label: 'Configurações' },
]

export default function FinanceiroPage() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<Tab>(
    (location.state as { initialTab?: Tab } | null)?.initialTab ?? 'ano'
  )
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState<FinAno | null>(null)
  const [anos, setAnos] = useState<FinAno[]>([])
  const [loading, setLoading] = useState(true)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('mos-financeiro-guide-seen')
    if (!seen) setShowGuide(true)
  }, [])

  function closeGuide() {
    localStorage.setItem('mos-financeiro-guide-seen', 'true')
    setShowGuide(false)
  }

  useEffect(() => { loadAnos() }, [])

  useEffect(() => {
    if (anos.length > 0) setAno(anos.find(a => a.ano === selectedYear) ?? null)
  }, [selectedYear, anos])

  async function loadAnos() {
    setLoading(true)
    const { data } = await supabase.from('fin_anos').select('*').order('ano')
    const list = (data ?? []) as FinAno[]
    setAnos(list)
    const cur = list.find(a => a.ano === new Date().getFullYear()) ?? list[list.length - 1] ?? null
    if (cur) { setSelectedYear(cur.ano); setAno(cur) }
    setLoading(false)
  }

  function goToMonth(m: number) { setSelectedMonth(m); setActiveTab('mes') }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="font-[Manrope]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold font-[Sora] text-white">Financeiro</h1>
          <button
            onClick={() => setShowGuide(true)}
            className="text-ink-3 hover:text-brand transition-colors"
            title="Como funciona"
          >
            <HelpCircle size={15} />
          </button>
        </div>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          className="bg-bg-2 border border-line text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-brand/60 transition-colors max-w-[120px] sm:max-w-none"
        >
          {anos.map(a => <option key={a.id} value={a.ano}>{a.ano}</option>)}
        </select>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-line mt-5 mb-6 scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={[
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors shrink-0',
              activeTab === t.id
                ? 'text-brand border-brand'
                : 'text-ink-3 border-transparent hover:text-[#999]',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {!ano && activeTab !== 'config' ? (
        <div className="text-center py-20 text-ink-3">
          <p className="mb-3">Nenhum ano configurado.</p>
          <button onClick={() => setActiveTab('config')} className="text-brand text-sm hover:underline">
            Criar ano em Configurações →
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'ano'          && ano && <AnoTab ano={ano} onGoToMonth={goToMonth} />}
          {activeTab === 'mes'          && ano && <MesTab ano={ano} initialMonth={selectedMonth} />}
          {activeTab === 'orcamento'    && ano && <OrcamentoTab ano={ano} initialMonth={selectedMonth} />}
          {activeTab === 'metas'        && <MetasTab />}
          {activeTab === 'investimentos' && <InvestimentosTab />}
          {activeTab === 'config'       && <ConfigTab anos={anos} onReload={loadAnos} />}
        </>
      )}
      {showGuide && <FinanceiroGuide onClose={closeGuide} />}
    </div>
  )
}
