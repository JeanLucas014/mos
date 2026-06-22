// src/pages/Financeiro/components/HorizonteSaldos.tsx
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { FinAno } from '../types'

// ── Utils ──────────────────────────────────────────────────────────────────

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
  if (v < -1500) return '#4a0404'
  if (v < -700)  return '#7f1d1d'
  if (v < -250)  return '#991b1b'
  if (v <    0)  return '#c0394b'
  if (v <  950)  return '#92400e'
  if (v < 1600)  return '#1a7a52'
  return '#22a86e'
}

// ── Tipos internos ─────────────────────────────────────────────────────────

interface MonthData {
  mi: number        // 0–11
  days: number
  cells: (number | null)[]  // índice 0 = dia 1, null = dia não pertence ao mês
}

// ── Grid compartilhado (desktop e mobile) ──────────────────────────────────

interface GridProps {
  months: MonthData[]
  ano: number
  colW: number
  rowH: number
  hdrH: number
  narrow: boolean
}

function HorizonGrid({ months, ano, colW, rowH, hdrH, narrow }: GridProps) {
  const DAY_W  = narrow ? 28 : 36
  const fSize  = narrow ? 11 : 12
  const today  = new Date()
  const curM   = ano === today.getFullYear() ? today.getMonth() : -1
  const curD   = today.getDate()
  const MAX    = 31

  return (
    <div style={{ display: 'flex', minWidth: DAY_W + months.length * colW }}>

      {/* Coluna de dias */}
      <div style={{ width: DAY_W, flexShrink: 0 }}>
        <div style={{ height: hdrH, borderRight: '1px solid #1f1f1f' }} />
        {Array.from({ length: MAX }, (_, i) => {
          const isToday = months.some(m => m.mi === curM) && i + 1 === curD
          return (
            <div
              key={i}
              style={{
                height: rowH,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10,
                color: isToday ? '#0EA5E9' : '#555',
                fontWeight: isToday ? 700 : 400,
                fontVariantNumeric: 'tabular-nums',
                borderBottom: '1px solid #111',
                borderRight: '1px solid #1f1f1f',
              }}
            >
              {i + 1}
            </div>
          )
        })}
      </div>

      {/* Colunas dos meses */}
      {months.map((m, ci) => {
        const isCur = m.mi === curM
        return (
          <div
            key={m.mi}
            style={{
              width: colW, flexShrink: 0,
              borderRight: ci < months.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
          >
            {/* Header */}
            <div style={{
              height: hdrH,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: narrow ? 12 : 13, fontWeight: 700,
              fontFamily: 'Sora, sans-serif',
              background: isCur ? '#ffffff' : 'transparent',
              color: isCur ? '#000000' : '#777',
            }}>
              {MONTHS[m.mi]}/{String(ano).slice(2)}
            </div>

            {/* Células */}
            {Array.from({ length: MAX }, (_, di) => {
              const val     = di < m.days ? m.cells[di] : null
              const isToday = isCur && di + 1 === curD
              return (
                <div
                  key={di}
                  style={{
                    height: rowH,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: fSize, fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    background: cellBg(val),
                    color: val !== null ? '#fff' : 'transparent',
                    borderBottom: '1px solid rgba(0,0,0,0.18)',
                    outline: isToday ? '2px solid #0EA5E9' : 'none',
                    outlineOffset: '-2px',
                  }}
                >
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

// ── Legenda de cores ───────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {[
        { bg: '#7f1d1d', label: 'Negativo' },
        { bg: '#92400e', label: '0–950'    },
        { bg: '#1a7a52', label: '950–1.6K' },
        { bg: '#22a86e', label: '1.6K+'    },
      ].map(l => (
        <div key={l.label} className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-[2px]" style={{ background: l.bg }} />
          <span className="text-[10px] text-[#555]">{l.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────

interface Props { ano: FinAno }

export function HorizonteSaldos({ ano }: Props) {
  const [monthsData, setMonthsData] = useState<MonthData[]>([])
  const [loading, setLoading]       = useState(true)
  const [mobilePage, setMobilePage] = useState(0)

  const PAGE_LABELS = ['Jan–Mar', 'Abr–Jun', 'Jul–Set', 'Out–Dez']

  useEffect(() => { loadData() }, [ano.id])

  async function loadData() {
    setLoading(true)

    // Buscar TODOS os lançamentos do ano (sem filtro is_grupo)
    const { data: rows } = await supabase
      .from('fin_lancamentos')
      .select('id, parent_id, data, natureza, valor, is_grupo')
      .eq('ano_id', ano.id)
      .order('data')

    if (!rows) { setLoading(false); return }

    interface LRow { id: string; parent_id: string | null; data: string; natureza: string; valor: number | null; is_grupo: boolean }
    interface LNode extends LRow { children: LNode[] }

    const typedRows = rows as unknown as LRow[]

    function buildTree(items: LRow[]): LNode[] {
      const map = new Map<string, LNode>(items.map(i => [i.id, { ...i, children: [] }]))
      const roots: LNode[] = []
      for (const node of map.values()) {
        if (node.parent_id && map.has(node.parent_id)) {
          map.get(node.parent_id)!.children.push(node)
        } else {
          roots.push(node)
        }
      }
      return roots
    }

    function sumLeaves(node: LNode): number {
      if (!node.is_grupo) return Number(node.valor) || 0
      return node.children.reduce((s, c) => s + sumLeaves(c), 0)
    }

    // Agrupar por data
    const byDate: Record<string, LRow[]> = {}
    for (const r of typedRows) {
      if (!byDate[r.data]) byDate[r.data] = []
      byDate[r.data].push(r)
    }

    // Calcular net por data usando árvore (apenas raízes)
    const netByDate: Record<string, number> = {}
    for (const [date, items] of Object.entries(byDate)) {
      const roots = buildTree(items)
      let net = 0
      for (const root of roots) {
        const v = sumLeaves(root)
        net += root.natureza === 'entrada' ? v : -v
      }
      netByDate[date] = net
    }

    // Percorrer dia a dia acumulando saldo
    let balance = Number(ano.saldo_inicial)
    const result: MonthData[] = []

    for (let mi = 0; mi < 12; mi++) {
      const month = mi + 1
      const days  = daysInMonth(ano.ano, month)
      const cells: number[] = []

      for (let d = 1; d <= days; d++) {
        const key  = `${ano.ano}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        balance   += netByDate[key] ?? 0
        cells.push(Math.round(balance * 100) / 100)
      }

      result.push({ mi, days, cells })
    }

    setMonthsData(result)

    const today = new Date()
    if (ano.ano === today.getFullYear()) {
      setMobilePage(Math.floor(today.getMonth() / 3))
    }

    setLoading(false)
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
    <div>
      {/* ── Cabeçalho ── */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold font-[Sora] text-white">
          Horizonte de saldos
        </span>
        <Legend />
      </div>

      {/* ── Desktop: todos os 12 meses ── */}
      <div
        className="hidden sm:block overflow-x-auto rounded-lg"
        style={{ border: '1px solid #1a1a1a' }}
      >
        <HorizonGrid
          months={monthsData}
          ano={ano.ano}
          colW={66}
          rowH={22}
          hdrH={28}
          narrow={false}
        />
      </div>

      {/* ── Mobile: 3 meses por página ── */}
      <div className="sm:hidden">
        {/* Tabs de navegação por trimestre */}
        <div
          className="flex border-b border-[#111] mb-0"
          style={{ overflowX: 'auto' }}
        >
          {PAGE_LABELS.map((l, i) => (
            <button
              key={i}
              onClick={() => setMobilePage(i)}
              className={[
                'flex-1 py-2 text-[10px] font-bold font-[Sora] whitespace-nowrap',
                'border-b-2 -mb-px transition-colors',
                mobilePage === i
                  ? 'text-[#0EA5E9] border-[#0EA5E9]'
                  : 'text-[#444] border-transparent',
              ].join(' ')}
            >
              {l}
            </button>
          ))}
        </div>

        <div
          className="overflow-x-auto overflow-y-auto"
          style={{ maxHeight: '70vh', WebkitOverflowScrolling: 'touch' }}
        >
          <HorizonGrid
            months={mobilePages[mobilePage]}
            ano={ano.ano}
            colW={112}
            rowH={28}
            hdrH={34}
            narrow={true}
          />
        </div>
      </div>
    </div>
  )
}
