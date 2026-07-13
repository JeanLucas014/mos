import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { FinAno } from '../types'
import { HorizonteSaldos } from '../components/HorizonteSaldos'

const MS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MS_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

interface MonthSummary { mes: number; entrada: number; fixa: number; diario: number; cartao: number }
interface Props { ano: FinAno; onGoToMonth: (m: number) => void }

export function AnoTab({ ano, onGoToMonth }: Props) {
  const [data, setData] = useState<MonthSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [ano.id])

  async function load() {
    setLoading(true)
    const { data: rows } = await supabase
      .from('fin_lancamentos')
      .select('data, natureza, valor, saida_tipo, is_grupo')
      .eq('ano_id', ano.id)
      .eq('is_grupo', false)

    const map: Record<number, MonthSummary> = {}
    for (let m = 1; m <= 12; m++) map[m] = { mes: m, entrada: 0, fixa: 0, diario: 0, cartao: 0 }

    type LRow = { data: string; natureza: string; valor: number | null; saida_tipo: string | null; is_grupo: boolean }
    for (const r of (rows ?? []) as LRow[]) {
      const v = Number(r.valor) || 0
      const m = new Date(r.data + 'T00:00:00').getMonth() + 1
      if (r.natureza === 'entrada') map[m].entrada += v
      else if (r.natureza === 'diario') map[m].diario += v
      else if (r.natureza === 'saida') {
        if (r.saida_tipo === 'cartao') map[m].cartao += v
        else map[m].fixa += v
      }
    }
    setData(Object.values(map))
    setLoading(false)
  }

  const totE = data.reduce((a, m) => a + m.entrada, 0)
  const totF = data.reduce((a, m) => a + m.fixa, 0)
  const totD = data.reduce((a, m) => a + m.diario, 0)
  const totC = data.reduce((a, m) => a + m.cartao, 0)
  const res  = totE - totF - totD - totC

  const cards = [
    { label: 'Entradas',   value: totE, color: '#22c55e' },
    { label: 'Fixas',      value: totF, color: '#ef4444' },
    { label: 'Variáveis',  value: totD, color: '#f97316' },
    { label: 'Cartões',    value: totC, color: '#a78bfa' },
    { label: 'Resultado',  value: res,  color: res >= 0 ? '#22c55e' : '#ef4444' },
  ]

  const chartData = data.map((m, i) => ({
    mes: MS[i],
    Fixas: m.fixa,
    'Variáveis': m.diario,
    'Cartões': m.cartao,
    Entradas: m.entrada,
  }))

  const today = new Date()
  const currentMonth = ano.ano === today.getFullYear() ? today.getMonth() + 1 : -1

  if (loading) return <div className="flex justify-center py-16"><div className="w-5 h-5 rounded-full border-2 border-[#0EA5E9] border-t-transparent animate-spin" /></div>

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((c, idx) => (
          <div
            key={c.label}
            className={[
              'bg-bg-2 border border-line rounded-xl p-4 relative',
              idx === cards.length - 1 ? 'col-span-2 sm:col-span-1' : '',
            ].join(' ')}
          >
            <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full" style={{ background: c.color }} />
            <div className="text-[10px] text-[#555] uppercase tracking-wider font-[Sora] mb-2">{c.label}</div>
            <div className="text-base font-bold tabular-nums" style={{ color: c.color }}>{BRL(c.value)}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-bg-2 border border-line rounded-xl p-5">
        <div className="text-xs text-[#555] font-[Sora] uppercase tracking-wider mb-4">
          Entradas vs Saídas · {ano.ano}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData} barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bg3)" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => v === 0 ? '' : `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#aaa' }}
              formatter={(v, name) => [BRL(Number(v)), String(name)]}
            />
            <Bar dataKey="Fixas"      stackId="s" fill="#ef4444" fillOpacity={0.75} />
            <Bar dataKey="Variáveis"  stackId="s" fill="#f97316" fillOpacity={0.75} />
            <Bar dataKey="Cartões"    stackId="s" fill="#a78bfa" fillOpacity={0.75} radius={[3, 3, 0, 0]} />
            <Line dataKey="Entradas"  stroke="#22c55e" strokeWidth={2} dot={false} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {data.map((m, i) => {
          const resultado = m.entrada - m.fixa - m.diario - m.cartao
          const isCurrent = m.mes === currentMonth
          return (
            <button
              key={m.mes}
              onClick={() => onGoToMonth(m.mes)}
              className={[
                'bg-bg-2 border rounded-xl p-4 text-left transition-colors hover:border-[#0EA5E9]/40 focus:outline-none',
                isCurrent ? 'border-[#0EA5E9]/50' : 'border-line',
              ].join(' ')}
            >
              <div className={['text-sm font-semibold font-[Sora] mb-3', isCurrent ? 'text-[#0EA5E9]' : 'text-white'].join(' ')}>
                {MS_FULL[i]}
              </div>
              <div className="space-y-1 text-[11px] tabular-nums">
                {[
                  { label: 'Entrada', value: m.entrada,         color: '#22c55e' },
                  { label: 'Saída',   value: m.fixa + m.cartao, color: '#ef4444' },
                  { label: 'Diário',  value: m.diario,          color: '#f97316' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-[#555]">{row.label}</span>
                    <span style={{ color: row.color }}>{BRL(row.value)}</span>
                  </div>
                ))}
                <div className="border-t border-line my-1" />
                <div className="flex justify-between">
                  <span className="text-[#555]">Resultado</span>
                  <span style={{ color: resultado >= 0 ? '#22c55e' : '#ef4444' }}>{BRL(resultado)}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Horizonte de saldos ── */}
      <div className="mt-6 -mx-4 lg:-mx-7 border-t border-line pt-6 px-4 lg:px-7">
        <HorizonteSaldos ano={ano} />
      </div>
    </div>
  )
}
