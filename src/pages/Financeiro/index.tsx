import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { FinAno } from './types'
import { AnoTab } from './tabs/AnoTab'
import { MesTab } from './tabs/MesTab'
import { MetasTab } from './tabs/MetasTab'
import { InvestimentosTab } from './tabs/InvestimentosTab'
import { ConfigTab } from './tabs/ConfigTab'

type Tab = 'ano' | 'mes' | 'metas' | 'investimentos' | 'config'
const TABS: { id: Tab; label: string }[] = [
  { id: 'ano', label: 'Ano' },
  { id: 'mes', label: 'Mês' },
  { id: 'metas', label: 'Metas' },
  { id: 'investimentos', label: 'Investimentos' },
  { id: 'config', label: 'Config' },
]

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ano')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState<FinAno | null>(null)
  const [anos, setAnos] = useState<FinAno[]>([])
  const [loading, setLoading] = useState(true)

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
      <div className="w-5 h-5 rounded-full border-2 border-[#0EA5E9] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="font-[Manrope]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold font-[Sora] text-white">Financeiro</h1>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          className="bg-[#111111] border border-[#1f1f1f] text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-[#0EA5E9]/60 transition-colors"
        >
          {anos.map(a => <option key={a.id} value={a.ano}>{a.ano}</option>)}
        </select>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-[#1f1f1f] mt-5 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={[
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors shrink-0',
              activeTab === t.id
                ? 'text-[#0EA5E9] border-[#0EA5E9]'
                : 'text-[#555] border-transparent hover:text-[#999]',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {!ano && activeTab !== 'config' ? (
        <div className="text-center py-20 text-[#555]">
          <p className="mb-3">Nenhum ano configurado.</p>
          <button onClick={() => setActiveTab('config')} className="text-[#0EA5E9] text-sm hover:underline">
            Criar ano em Configurações →
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'ano'          && ano && <AnoTab ano={ano} onGoToMonth={goToMonth} />}
          {activeTab === 'mes'          && ano && <MesTab ano={ano} initialMonth={selectedMonth} />}
          {activeTab === 'metas'        && <MetasTab />}
          {activeTab === 'investimentos' && <InvestimentosTab />}
          {activeTab === 'config'       && <ConfigTab anos={anos} onReload={loadAnos} />}
        </>
      )}
    </div>
  )
}
