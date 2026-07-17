// src/pages/Financeiro/components/HorizonteSaldos.tsx
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { FinAno } from '../types'

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmt(v: number): string {
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(2).replace(/\.?0+$/, '') + 'K'
  const s = v.toFixed(1)
  return s.endsWith('.0') ? String(Math.round(v)) : s
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function cellBg(v: number | null): string {
  if (v === null) return 'transparent'
  if (v < -1500) return '#3b0000'
  if (v <  -700) return '#7f1d1d'
  if (v <  -250) return '#991b1b'
  if (v <     0) return '#c0394b'
  if (v <   300) return '#14532d'
  if (v <   800) return '#166534'
  if (v <  1500) return '#15803d'
  return '#16a34a'
}

interface MonthData { mi: number; days: number; cells: number[] }

interface LancNode {
  id: string
  parent_id: string | null
  data: string
  natureza: string
  valor: number | null
  is_grupo: boolean | null
  children: LancNode[]
}

interface Props { ano: FinAno }

export function HorizonteSaldos({ ano }: Props) {
  const [monthsData, setMonthsData] = useState<MonthData[]>([])
  const [loading, setLoading]       = useState(true)
  const [mobilePage, setMobilePage] = useState(0)

  const today   = new Date()
  const curM    = ano.ano === today.getFullYear() ? today.getMonth() : -1
  const curD    = today.getDate()
  const PAGE_LABELS = ['Jan–Mar', 'Abr–Jun', 'Jul–Set', 'Out–Dez']

  useEffect(() => { load() }, [ano.id])

  async function load() {
    setLoading(true)

    const { data: allRows, error } = await supabase
      .from('fin_lancamentos')
      .select('id, parent_id, data, natureza, valor, is_grupo')
      .eq('ano_id', ano.id)

    if (error || !allRows) { setLoading(false); return }

    // Monta árvore global
    const map = new Map<string, LancNode>()
    for (const r of allRows) map.set(r.id, { ...r, children: [] })
    const roots: LancNode[] = []
    for (const node of map.values()) {
      const parent = node.parent_id ? map.get(node.parent_id) : undefined
      if (parent) {
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    }

    // CORREÇÃO: atribui cada folha à DATA DA PRÓPRIA FOLHA,
    // não à data do grupo-pai. Isso evita que grupos com filhos
    // em outros meses contaminem a data do grupo.
    const netByDate: Record<string, number> = {}

    function addLeaves(node: LancNode): void {
      const hasChildren = node.children && node.children.length > 0
      if (node.is_grupo && hasChildren) {
        // Grupo com filhos: desce para as folhas
        for (const child of node.children) addLeaves(child)
      } else {
        // Folha (ou grupo sem filhos): usa valor e DATA DESTA FOLHA
        const v   = Number(node.valor) || 0
        const net = node.natureza === 'entrada' ? v : -v
        netByDate[node.data] = (netByDate[node.data] ?? 0) + net
      }
    }

    for (const root of roots) addLeaves(root)

    // Acumula saldo dia a dia
    let balance = Number(ano.saldo_inicial)
    const result: MonthData[] = []

    for (let mi = 0; mi < 12; mi++) {
      const month = mi + 1
      const days  = daysInMonth(ano.ano, month)
      const cells: number[] = []
      for (let d = 1; d <= days; d++) {
        const key  = `${ano.ano}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
        balance   += netByDate[key] ?? 0
        cells.push(Math.round(balance * 100) / 100)
      }
      result.push({ mi, days, cells })
    }

    setMonthsData(result)
    if (ano.ano === today.getFullYear()) setMobilePage(Math.floor(today.getMonth() / 3))
    setLoading(false)
  }

  // ── Grid compartilhado ──────────────────────────────────────────
  function Grid({ months, narrow }: { months: MonthData[]; narrow: boolean }) {
    const DAY_W = narrow ? 28 : 36
    const ROW_H = narrow ? 28 : 22
    const HDR_H = narrow ? 34 : 28
    const fSize = narrow ? 11 : 12
    const MAX   = 31

    return (
      <div style={{ display: 'flex', width: '100%' }}>
        {/* Dias */}
        <div style={{ width: DAY_W, flexShrink: 0 }}>
          <div style={{ height: HDR_H, borderRight: '1px solid var(--border)' }} />
          {Array.from({ length: MAX }, (_, i) => {
            const isToday = months.some(m => m.mi === curM) && i + 1 === curD
            return (
              <div key={i} style={{
                height: ROW_H,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10,
                color: isToday ? '#0EA5E9' : 'var(--text3)',
                fontWeight: isToday ? 700 : 400,
                fontVariantNumeric: 'tabular-nums',
                borderBottom: '1px solid #111',
                borderRight: '1px solid var(--border)',
              }}>
                {i + 1}
              </div>
            )
          })}
        </div>

        {/* Meses */}
        {months.map((m, ci) => {
          const isCur = m.mi === curM
          return (
            <div key={m.mi} style={{
              flex: 1,
              minWidth: narrow ? 95 : 55,
              overflow: 'hidden',
              borderRight: ci < months.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <div style={{
                height: HDR_H,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: narrow ? 12 : 13, fontWeight: 700,
                fontFamily: 'Sora, sans-serif',
                background: isCur ? 'var(--blue)' : 'transparent',
                color: isCur ? 'var(--text)' : 'var(--text3)',
              }}>
                {MONTHS[m.mi]}/{String(ano.ano).slice(2)}
              </div>

              {Array.from({ length: MAX }, (_, di) => {
                const val     = di < m.days ? m.cells[di] : null
                const isToday = isCur && di + 1 === curD
                return (
                  <div key={di} style={{
                    height: ROW_H,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: fSize, fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    background: cellBg(val),
                    color: val !== null ? '#fff' : 'transparent',
                    borderBottom: '1px solid rgba(0,0,0,0.18)',
                    outline: isToday ? '2px solid #0EA5E9' : 'none',
                    outlineOffset: '-2px',
                  }}>
                    {val !== null ? fmt(val) : ''}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="w-4 h-4 rounded-full border-2 border-[#0EA5E9] border-t-transparent animate-spin" />
    </div>
  )

  const mobilePages = [
    monthsData.slice(0, 3),
    monthsData.slice(3, 6),
    monthsData.slice(6, 9),
    monthsData.slice(9, 12),
  ]

  return (
    <div style={{ width: '100%' }}>
      {/* Cabeçalho + legenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
        <span className="text-sm font-semibold font-[Sora] text-white">Horizonte de saldos</span>
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { bg: '#7f1d1d', label: 'Negativo' },
            { bg: '#14532d', label: '0–300'    },
            { bg: '#166534', label: '300–800'  },
            { bg: '#15803d', label: '800–1.5K' },
            { bg: '#16a34a', label: '1.5K+'    },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="inline-block w-2.5 h-2.5 rounded-[2px]" style={{ background: l.bg }} />
              <span className="text-[10px] text-[#555]">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop — 12 meses, full width */}
      <div className="hidden sm:block overflow-x-auto" style={{ borderRadius: 8, border: '1px solid var(--border)', width: '100%' }}>
        <Grid months={monthsData} narrow={false} />
      </div>

      {/* Mobile — 3 meses por página */}
      <div className="sm:hidden">
        <div className="flex border-b border-[#111] mb-0 overflow-x-auto">
          {PAGE_LABELS.map((l, i) => (
            <button
              key={i}
              onClick={() => setMobilePage(i)}
              className={[
                'flex-1 py-2 text-[10px] font-bold font-[Sora] whitespace-nowrap',
                'border-b-2 -mb-px transition-colors',
                mobilePage === i ? 'text-[#0EA5E9] border-[#0EA5E9]' : 'text-[#444] border-transparent',
              ].join(' ')}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto" style={{ maxHeight: '70vh', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          <div style={{ minWidth: 3 * 100 + 30 }}>
            <Grid months={mobilePages[mobilePage]} narrow={true} />
          </div>
        </div>
      </div>
    </div>
  )
}
