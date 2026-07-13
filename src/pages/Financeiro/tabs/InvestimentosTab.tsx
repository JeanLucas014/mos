import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Plus, RefreshCw, TrendingUp, TrendingDown,
  ChevronDown, ChevronRight, Trash2, Pencil, X,
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

// ─── Formatters ──────────────────────────────────────────────────────────────

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const PCT = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(2).replace('.', ',') + '%'
const fmtDate = (s: string) =>
  new Date(s + 'T12:00:00').toLocaleDateString('pt-BR')
const today = () => new Date().toISOString().slice(0, 10)

// ─── Types ───────────────────────────────────────────────────────────────────

type TipoInv =
  | 'renda_fixa'
  | 'acoes'
  | 'fiis'
  | 'etfs'
  | 'fundos'
  | 'cripto'
  | 'previdencia'
  | 'outros'

const TIPO_CFG: Record<TipoInv, { label: string; color: string }> = {
  renda_fixa:  { label: 'Renda Fixa',   color: '#22c55e' },
  acoes:       { label: 'Ações',        color: '#0EA5E9' },
  fiis:        { label: 'FIIs',         color: '#f97316' },
  etfs:        { label: 'ETFs',         color: '#a78bfa' },
  fundos:      { label: 'Fundos',       color: '#f59e0b' },
  cripto:      { label: 'Criptomoedas', color: '#ec4899' },
  previdencia: { label: 'Previdência',  color: '#14b8a6' },
  outros:      { label: 'Outros',       color: 'var(--text3)' },
}

const CORES = [
  '#22c55e', '#0EA5E9', '#f97316', '#a78bfa',
  '#f59e0b', '#ec4899', '#14b8a6', 'var(--text3)',
  '#ef4444', '#64748b',
]

const INDEXADORES = ['CDI', 'SELIC', 'IPCA', 'IGPM', 'PREFIXADO', 'OUTRO']

const SUBTIPOS: Record<string, string[]> = {
  renda_fixa:  ['Tesouro Selic', 'Tesouro IPCA+', 'Tesouro Prefixado', 'CDB', 'LCI', 'LCA', 'LC', 'CRI', 'CRA', 'Debênture', 'Poupança'],
  acoes:       ['Ação Ordinária (ON)', 'Ação Preferencial (PN)', 'BDR'],
  fiis:        ['FII Tijolo', 'FII Papel', 'FII Híbrido', 'FOF (Fundo de Fundos)'],
  etfs:        ['ETF Renda Variável', 'ETF Renda Fixa', 'ETF Internacional', 'ETF Cripto'],
  fundos:      ['Fundo de Ações', 'Fundo Multimercado', 'Fundo Renda Fixa', 'Fundo Cambial', 'Fundo Internacional'],
  cripto:      ['Bitcoin (BTC)', 'Ethereum (ETH)', 'Stablecoin', 'Altcoin'],
  previdencia: ['PGBL', 'VGBL'],
  outros:      ['Ouro', 'Dólar', 'Prata', 'Imóvel', 'Outro'],
}

interface Investimento {
  id: string
  user_id: string
  nome: string
  tipo: TipoInv
  subtipo?: string
  ticker?: string
  instituicao?: string
  cor: string
  quantidade?: number
  preco_medio?: number
  valor_atual?: number
  valor_aplicado?: number
  data_atualizacao?: string
  indexador?: string
  taxa_adicional?: number
  data_compra?: string
  data_vencimento?: string
  liquidez?: string
  ativo: boolean
  notas?: string
  criado_em: string
}

interface Taxa {
  indicador: string
  valor_anual: number
  valor_mensal: number
  data_referencia: string
  atualizado_em: string
}

// ─── Cálculos ────────────────────────────────────────────────────────────────

function calcRentabilidadeRF(inv: Investimento, taxas: Taxa[]): number | null {
  if (!inv.data_compra || !inv.valor_aplicado) return null
  const dias = Math.max(
    0,
    (Date.now() - new Date(inv.data_compra + 'T12:00:00').getTime()) / 86400000,
  )
  const anos = dias / 365

  let taxaAnual = 0
  if (inv.indexador === 'PREFIXADO') {
    taxaAnual = (inv.taxa_adicional ?? 0) / 100
  } else if (inv.indexador === 'CDI') {
    const cdi = taxas.find(t => t.indicador === 'CDI')?.valor_anual ?? 13.65
    taxaAnual = (cdi * (inv.taxa_adicional ?? 100)) / 10000
  } else if (inv.indexador === 'SELIC') {
    const selic = taxas.find(t => t.indicador === 'SELIC')?.valor_anual ?? 13.75
    taxaAnual = (selic + (inv.taxa_adicional ?? 0)) / 100
  } else if (inv.indexador === 'IPCA') {
    const ipca = taxas.find(t => t.indicador === 'IPCA')?.valor_anual ?? 4.83
    taxaAnual = (1 + ipca / 100) * (1 + (inv.taxa_adicional ?? 0) / 100) - 1
  }

  const valorCalculado = inv.valor_aplicado * Math.pow(1 + taxaAnual, anos)
  return ((valorCalculado - inv.valor_aplicado) / inv.valor_aplicado) * 100
}

function valorEstimadoRF(inv: Investimento, taxas: Taxa[]): number {
  if (!inv.valor_aplicado) return 0
  if (!inv.data_compra) return inv.valor_aplicado
  const pct = calcRentabilidadeRF(inv, taxas) ?? 0
  return inv.valor_aplicado * (1 + pct / 100)
}

function rentabilidadeVariavel(inv: Investimento): number | null {
  if (!inv.valor_atual || !inv.valor_aplicado || inv.valor_aplicado === 0) return null
  return ((inv.valor_atual - inv.valor_aplicado) / inv.valor_aplicado) * 100
}

function valorPosicao(inv: Investimento): number {
  if (inv.tipo === 'renda_fixa' || inv.tipo === 'previdencia') return 0
  if (inv.valor_atual) return inv.valor_atual
  if (inv.quantidade && inv.preco_medio) return inv.quantidade * inv.preco_medio
  return inv.valor_aplicado ?? 0
}

// ─── InvestimentoModal ────────────────────────────────────────────────────────

function InvestimentoModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Partial<Investimento>
  onClose: () => void
  onSave: (data: Partial<Investimento>) => void
}) {
  const isEdit = !!(initial as Investimento).id
  const [form, setForm] = useState<Partial<Investimento>>({
    tipo: 'renda_fixa',
    cor: '#22c55e',
    ativo: true,
    liquidez: 'no_vencimento',
    ...initial,
  })
  const [saving, setSaving] = useState(false)
  const isRF = form.tipo === 'renda_fixa' || form.tipo === 'previdencia'
  const isVariavel = ['acoes', 'fiis', 'etfs'].includes(form.tipo ?? '')

  const inp =
    'w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#0EA5E9]/60 transition-colors'
  const lbl = 'block text-[11px] text-[#555] uppercase tracking-wider mb-1'

  function upd<K extends keyof Investimento>(k: K, v: Investimento[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    if (!form.nome?.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-2 border border-line rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-bg-2">
          <span className="text-sm font-semibold font-[Sora] text-white">
            {isEdit ? 'Editar ativo' : 'Novo ativo'}
          </span>
          <button onClick={onClose} className="text-[#555] hover:text-white">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4 flex-1">
          {/* Tipo de ativo */}
          <div>
            <label className={lbl}>Classe de ativo</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {Object.entries(TIPO_CFG).map(([tipo, c]) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => upd('tipo', tipo as TipoInv)}
                  className="py-2 px-1 rounded-xl border text-xs transition-colors"
                  style={{
                    borderColor: form.tipo === tipo ? c.color : 'var(--border)',
                    background: form.tipo === tipo ? c.color + '15' : 'transparent',
                    color: form.tipo === tipo ? c.color : 'var(--text3)',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subtipo */}
          <div>
            <label className={lbl}>Tipo específico</label>
            <select
              value={form.subtipo ?? ''}
              onChange={e => upd('subtipo', e.target.value)}
              className={inp}
              style={{ colorScheme: 'dark' }}
            >
              <option value="">Selecionar...</option>
              {(SUBTIPOS[form.tipo ?? 'renda_fixa'] ?? []).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Nome e ticker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Nome</label>
              <input
                value={form.nome ?? ''}
                onChange={e => upd('nome', e.target.value)}
                placeholder={isRF ? 'Tesouro IPCA+ 2029' : 'PETR4 - Petrobras'}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Ticker (opcional)</label>
              <input
                value={form.ticker ?? ''}
                onChange={e => upd('ticker', e.target.value.toUpperCase())}
                placeholder={isRF ? 'TNLP3F' : 'PETR4'}
                className={inp}
              />
            </div>
          </div>

          {/* Instituição e cor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Corretora / Banco</label>
              <input
                value={form.instituicao ?? ''}
                onChange={e => upd('instituicao', e.target.value)}
                placeholder="XP, Nu Invest, BTG..."
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Cor</label>
              <div className="flex gap-2 flex-wrap">
                {CORES.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => upd('cor', c)}
                    className="w-6 h-6 rounded-full hover:scale-110 transition-transform"
                    style={{
                      background: c,
                      outline: form.cor === c ? `2px solid ${c}` : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Renda Fixa */}
          {isRF && (
            <>
              <div className="border-t border-line pt-3">
                <div className="text-[11px] text-[#0EA5E9] uppercase tracking-wider mb-3">
                  Dados da aplicação
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Valor aplicado (R$)</label>
                    <input
                      type="number"
                      value={form.valor_aplicado ?? ''}
                      onChange={e => upd('valor_aplicado', +e.target.value)}
                      placeholder="10000.00"
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className={lbl}>Data da aplicação</label>
                    <input
                      type="date"
                      value={form.data_compra ?? ''}
                      onChange={e => upd('data_compra', e.target.value)}
                      className={inp}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Indexador</label>
                  <select
                    value={form.indexador ?? ''}
                    onChange={e => upd('indexador', e.target.value)}
                    className={inp}
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="">Selecionar...</option>
                    {INDEXADORES.map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>
                    {form.indexador === 'PREFIXADO'
                      ? 'Taxa anual (%)'
                      : form.indexador === 'CDI'
                      ? '% do CDI (ex: 115)'
                      : form.indexador === 'SELIC'
                      ? 'SELIC + (%)'
                      : form.indexador === 'IPCA'
                      ? 'IPCA + (%)'
                      : 'Taxa adicional'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.taxa_adicional ?? ''}
                    onChange={e => upd('taxa_adicional', +e.target.value)}
                    placeholder={form.indexador === 'CDI' ? '115' : '5.50'}
                    className={inp}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Vencimento</label>
                  <input
                    type="date"
                    value={form.data_vencimento ?? ''}
                    onChange={e => upd('data_vencimento', e.target.value)}
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>Liquidez</label>
                  <select
                    value={form.liquidez ?? 'no_vencimento'}
                    onChange={e => upd('liquidez', e.target.value)}
                    className={inp}
                    style={{ colorScheme: 'dark' }}
                  >
                    {[
                      ['D0', 'Diária (D+0)'],
                      ['D+1', 'D+1'],
                      ['D+30', 'D+30'],
                      ['no_vencimento', 'No vencimento'],
                    ].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Renda Variável */}
          {isVariavel && (
            <div className="border-t border-line pt-3">
              <div className="text-[11px] text-[#0EA5E9] uppercase tracking-wider mb-3">
                Posição atual
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Quantidade</label>
                  <input
                    type="number"
                    step="any"
                    value={form.quantidade ?? ''}
                    onChange={e => upd('quantidade', +e.target.value)}
                    placeholder="100"
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>Preço médio (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.preco_medio ?? ''}
                    onChange={e => upd('preco_medio', +e.target.value)}
                    placeholder="32.50"
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>Preço atual (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={
                      form.valor_atual && form.quantidade && form.quantidade > 0
                        ? +(form.valor_atual / form.quantidade).toFixed(2)
                        : ''
                    }
                    onChange={e => {
                      const ua = +e.target.value
                      upd('valor_atual', form.quantidade ? ua * (form.quantidade ?? 1) : ua)
                    }}
                    placeholder="35.20"
                    className={inp}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className={lbl}>Total aplicado (R$)</label>
                <input
                  type="number"
                  value={form.valor_aplicado ?? ''}
                  onChange={e => upd('valor_aplicado', +e.target.value)}
                  placeholder={
                    form.quantidade && form.preco_medio
                      ? String((form.quantidade * form.preco_medio).toFixed(2))
                      : ''
                  }
                  className={inp}
                />
              </div>
            </div>
          )}

          {/* Cripto e Fundos */}
          {(form.tipo === 'cripto' || form.tipo === 'fundos' || form.tipo === 'outros') && (
            <div className="border-t border-line pt-3">
              <div className="text-[11px] text-[#0EA5E9] uppercase tracking-wider mb-3">
                Posição
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Total aplicado (R$)</label>
                  <input
                    type="number"
                    value={form.valor_aplicado ?? ''}
                    onChange={e => upd('valor_aplicado', +e.target.value)}
                    placeholder="5000.00"
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>Valor atual (R$)</label>
                  <input
                    type="number"
                    value={form.valor_atual ?? ''}
                    onChange={e => upd('valor_atual', +e.target.value)}
                    placeholder="6200.00"
                    className={inp}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className={lbl}>Notas (opcional)</label>
            <textarea
              value={form.notas ?? ''}
              onChange={e => upd('notas', e.target.value)}
              rows={2}
              placeholder="Observações sobre este ativo..."
              className={inp + ' resize-none'}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-line sticky bottom-0 bg-bg-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#555] border border-line rounded-xl hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.nome?.trim()}
            className="flex-1 py-2 text-sm font-semibold bg-[#0EA5E9] text-black rounded-xl hover:bg-[#38bdf8] disabled:opacity-40"
          >
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Adicionar ativo'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SimuladorTab ─────────────────────────────────────────────────────────────

type SimIndexador = 'CDI' | 'SELIC' | 'IPCA_MAIS' | 'PERSONALIZADO'

function SimuladorTab({ taxas }: { taxas: Taxa[] }) {
  const [valorInicial, setValorInicial] = useState('10000')
  const [aporteMensal, setAporteMensal] = useState('500')
  const [prazoAnos, setPrazoAnos]       = useState('5')
  const [taxa, setTaxa]                 = useState<SimIndexador>('CDI')
  const [taxaPersonalizada, setTaxaP]   = useState('12')
  const [percentualCDI, setPercentualCDI] = useState('115')

  const inp =
    'w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#0EA5E9]/60'

  const resultado = useMemo(() => {
    const VI  = parseFloat(valorInicial) || 0
    const PMT = parseFloat(aporteMensal) || 0
    const N   = (parseFloat(prazoAnos) || 1) * 12

    let taxaAnual = 0
    if (taxa === 'CDI') {
      const cdi = taxas.find(t => t.indicador === 'CDI')?.valor_anual ?? 13.65
      taxaAnual = cdi * (parseFloat(percentualCDI) / 100)
    } else if (taxa === 'SELIC') {
      taxaAnual = taxas.find(t => t.indicador === 'SELIC')?.valor_anual ?? 13.75
    } else if (taxa === 'IPCA_MAIS') {
      const ipca = taxas.find(t => t.indicador === 'IPCA')?.valor_anual ?? 4.83
      taxaAnual = ((1 + ipca / 100) * (1 + parseFloat(taxaPersonalizada) / 100) - 1) * 100
    } else {
      taxaAnual = parseFloat(taxaPersonalizada) || 0
    }

    const taxaMensal = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1
    const montante =
      VI * Math.pow(1 + taxaMensal, N) +
      PMT * (Math.pow(1 + taxaMensal, N) - 1) / taxaMensal
    const totalAportado = VI + PMT * N
    const rendimento    = montante - totalAportado
    const rentTotal     = totalAportado > 0 ? (rendimento / totalAportado) * 100 : 0

    return { montante, totalAportado, rendimento, rentTotal, taxaAnual }
  }, [valorInicial, aporteMensal, prazoAnos, taxa, taxaPersonalizada, percentualCDI, taxas])

  const simTabs: { id: SimIndexador; label: string }[] = [
    {
      id: 'CDI',
      label: `CDI (${taxas.find(t => t.indicador === 'CDI')?.valor_anual?.toFixed(2) ?? '–'}%)`,
    },
    {
      id: 'SELIC',
      label: `SELIC (${taxas.find(t => t.indicador === 'SELIC')?.valor_anual?.toFixed(2) ?? '–'}%)`,
    },
    { id: 'IPCA_MAIS',    label: 'IPCA+' },
    { id: 'PERSONALIZADO', label: 'Personalizado' },
  ]

  return (
    <div className="space-y-5">
      <div className="bg-bg-2 border border-line rounded-xl p-5 space-y-4">
        <div className="text-xs text-[#555] uppercase tracking-wider font-[Sora]">Parâmetros</div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-[#555] uppercase tracking-wider mb-1">
              Valor inicial (R$)
            </label>
            <input
              type="number"
              value={valorInicial}
              onChange={e => setValorInicial(e.target.value)}
              className={inp}
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#555] uppercase tracking-wider mb-1">
              Aporte mensal (R$)
            </label>
            <input
              type="number"
              value={aporteMensal}
              onChange={e => setAporteMensal(e.target.value)}
              className={inp}
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#555] uppercase tracking-wider mb-1">
              Prazo (anos)
            </label>
            <input
              type="number"
              min="1"
              max="40"
              value={prazoAnos}
              onChange={e => setPrazoAnos(e.target.value)}
              className={inp}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-[#555] uppercase tracking-wider mb-2">
            Indexador
          </label>
          <div className="flex gap-2 flex-wrap">
            {simTabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTaxa(t.id)}
                className="px-3 py-1.5 text-xs rounded-lg border transition-colors"
                style={{
                  borderColor: taxa === t.id ? '#0EA5E9' : 'var(--border)',
                  background: taxa === t.id ? 'rgba(14,165,233,.12)' : 'transparent',
                  color: taxa === t.id ? '#0EA5E9' : 'var(--text3)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {taxa === 'CDI' && (
          <div>
            <label className="block text-[11px] text-[#555] uppercase tracking-wider mb-1">
              % do CDI
            </label>
            <input
              type="number"
              value={percentualCDI}
              onChange={e => setPercentualCDI(e.target.value)}
              placeholder="115"
              className={inp + ' max-w-[120px]'}
            />
          </div>
        )}
        {(taxa === 'IPCA_MAIS' || taxa === 'PERSONALIZADO') && (
          <div>
            <label className="block text-[11px] text-[#555] uppercase tracking-wider mb-1">
              {taxa === 'IPCA_MAIS' ? 'IPCA + (% a.a.)' : 'Taxa anual (%)'}
            </label>
            <input
              type="number"
              step="0.1"
              value={taxaPersonalizada}
              onChange={e => setTaxaP(e.target.value)}
              className={inp + ' max-w-[120px]'}
            />
          </div>
        )}
      </div>

      {/* Resultado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Montante final',  value: BRL(resultado.montante),      color: '#0EA5E9' },
          { label: 'Total aportado',  value: BRL(resultado.totalAportado), color: 'var(--text2)' },
          { label: 'Rendimento',      value: BRL(resultado.rendimento),    color: '#22c55e' },
        ].map((c, i) => (
          <div key={i} className="bg-bg-2 border border-line rounded-xl p-4">
            <div className="text-[11px] text-[#555] uppercase tracking-wider mb-1">{c.label}</div>
            <div
              className="text-xl font-bold tabular-nums"
              style={{ color: c.color, fontFamily: 'JetBrains Mono, monospace' }}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-bg-2 border border-line rounded-xl p-4 text-center text-xs text-[#555]">
        Taxa efetiva:{' '}
        <span className="text-white font-medium">
          {resultado.taxaAnual.toFixed(2)}% a.a.
        </span>{' '}
        · Rentabilidade total:{' '}
        <span className="text-[#22c55e] font-medium">
          +{resultado.rentTotal.toFixed(1)}%
        </span>{' '}
        em {prazoAnos} {Number(prazoAnos) === 1 ? 'ano' : 'anos'}
      </div>
    </div>
  )
}

// ─── InvestimentosTab ─────────────────────────────────────────────────────────

type MainTab = 'carteira' | 'simulador' | 'taxas'

export function InvestimentosTab() {
  const [items, setItems]                     = useState<Investimento[]>([])
  const [taxas, setTaxas]                     = useState<Taxa[]>([])
  const [loading, setLoading]                 = useState(true)
  const [atualizandoTaxas, setAtualizandoTaxas] = useState(false)
  const [activeTab, setActiveTab]             = useState<MainTab>('carteira')
  const [editando, setEditando]               = useState<Partial<Investimento> | null>(null)
  const [collapsed, setCollapsed]             = useState<Set<string>>(new Set())

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: inv }, { data: tax }] = await Promise.all([
      (supabase.from('fin_investimentos') as any)
        .select('*')
        .eq('ativo', true)
        .order('criado_em'),
      (supabase.from('fin_taxas_economicas') as any).select('*'),
    ])
    setItems((inv ?? []) as Investimento[])
    setTaxas((tax ?? []) as Taxa[])
    setLoading(false)
  }

  const porTipo = useMemo(() => {
    const m: Record<string, number> = {}
    for (const inv of items) {
      const isRF = inv.tipo === 'renda_fixa' || inv.tipo === 'previdencia'
      const val = isRF ? valorEstimadoRF(inv, taxas) : valorPosicao(inv)
      m[inv.tipo] = (m[inv.tipo] ?? 0) + val
    }
    return m
  }, [items, taxas])

  const patrimonioTotal = Object.values(porTipo).reduce((a, b) => a + b, 0)
  const totalAplicado   = items.reduce((a, i) => a + (i.valor_aplicado ?? 0), 0)
  const rentTotal       =
    totalAplicado > 0 ? ((patrimonioTotal - totalAplicado) / totalAplicado) * 100 : 0

  async function atualizarTaxas() {
    setAtualizandoTaxas(true)
    try {
      const [selicR, cdiR, ipcaR] = await Promise.all([
        fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json').then(r => r.json()),
        fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4391/dados/ultimos/1?formato=json').then(r => r.json()),
        fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1?formato=json').then(r => r.json()),
      ]) as [{ valor: string; data: string }[], { valor: string; data: string }[], { valor: string; data: string }[]]

      const selicDiaria = parseFloat(selicR[0]?.valor ?? '0') / 100
      const cdiDiaria   = parseFloat(cdiR[0]?.valor  ?? '0') / 100
      const ipcaMensal  = parseFloat(ipcaR[0]?.valor ?? '0') / 100

      const selicAnual = (Math.pow(1 + selicDiaria, 252) - 1) * 100
      const cdiAnual   = (Math.pow(1 + cdiDiaria,   252) - 1) * 100
      const ipcaAnual  = (Math.pow(1 + ipcaMensal,  12)  - 1) * 100
      const poupanca   = selicAnual > 8.5 ? selicAnual * 0.70 : 6.17

      const updates = [
        { indicador: 'SELIC',    valor_anual: +selicAnual.toFixed(4), valor_mensal: +((Math.pow(1 + selicDiaria, 21) - 1) * 100).toFixed(6), data_referencia: selicR[0]?.data ?? today() },
        { indicador: 'CDI',      valor_anual: +cdiAnual.toFixed(4),   valor_mensal: +((Math.pow(1 + cdiDiaria,   21) - 1) * 100).toFixed(6), data_referencia: cdiR[0]?.data   ?? today() },
        { indicador: 'IPCA',     valor_anual: +ipcaAnual.toFixed(4),  valor_mensal: +(ipcaMensal * 100).toFixed(6),                           data_referencia: ipcaR[0]?.data  ?? today() },
        { indicador: 'POUPANCA', valor_anual: +poupanca.toFixed(4),   valor_mensal: +((Math.pow(1 + poupanca / 100, 1 / 12) - 1) * 100).toFixed(6), data_referencia: today() },
      ]
      for (const u of updates) {
        await (supabase.from('fin_taxas_economicas') as any).upsert(u, { onConflict: 'indicador' })
      }
      await load()
    } catch {
      alert('Erro ao buscar taxas do Banco Central. Verifique sua conexão.')
    }
    setAtualizandoTaxas(false)
  }

  function toggleCollapse(tipo: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(tipo) ? next.delete(tipo) : next.add(tipo)
      return next
    })
  }

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <div className="w-5 h-5 rounded-full border-2 border-[#0EA5E9] border-t-transparent animate-spin" />
      </div>
    )

  const pieData = Object.entries(porTipo).map(([tipo, val]) => ({
    name: TIPO_CFG[tipo as TipoInv]?.label ?? tipo,
    value: val,
    tipo,
  }))

  return (
    <div className="space-y-4 font-[Manrope]">
      {/* Sub-abas */}
      <div className="flex gap-1 border-b border-line mb-4">
        {([
          { id: 'carteira',  label: 'Carteira'  },
          { id: 'simulador', label: 'Simulador'  },
          { id: 'taxas',     label: 'Taxas'      },
        ] as { id: MainTab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap"
            style={{
              color: activeTab === t.id ? '#0EA5E9' : 'var(--text3)',
              borderColor: activeTab === t.id ? '#0EA5E9' : 'transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CARTEIRA ── */}
      {activeTab === 'carteira' && (
        <div className="space-y-5">
          {/* Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                label: 'Patrimônio total',
                value: BRL(patrimonioTotal),
                color: '#0EA5E9',
                sub: `${items.length} ativo${items.length !== 1 ? 's' : ''}`,
              },
              {
                label: 'Total aplicado',
                value: BRL(totalAplicado),
                color: '#22c55e',
                sub: 'Aportes acumulados',
              },
              {
                label: 'Rentabilidade',
                value: PCT(rentTotal),
                color: rentTotal >= 0 ? '#22c55e' : '#ef4444',
                sub: BRL(patrimonioTotal - totalAplicado) + ' em ganhos',
              },
            ].map((c, i) => (
              <div key={i} className="bg-bg-2 border border-line rounded-xl p-4">
                <div className="text-[11px] text-[#555] uppercase tracking-wider mb-1">{c.label}</div>
                <div
                  className="text-xl font-bold tabular-nums"
                  style={{ color: c.color, fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {c.value}
                </div>
                <div className="text-[11px] text-[#555] mt-1">{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Gráfico de alocação */}
          {pieData.length > 0 && (
            <div className="bg-bg-2 border border-line rounded-xl p-4">
              <div className="text-xs text-[#555] uppercase tracking-wider font-[Sora] mb-3">
                Alocação por classe
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={TIPO_CFG[entry.tipo as TipoInv]?.color ?? 'var(--text3)'}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => BRL(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5 w-full">
                  {Object.entries(porTipo)
                    .sort((a, b) => b[1] - a[1])
                    .map(([tipo, val]) => {
                      const c = TIPO_CFG[tipo as TipoInv]
                      const pct = patrimonioTotal > 0 ? (val / patrimonioTotal) * 100 : 0
                      return (
                        <div key={tipo} className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ background: c?.color }}
                          />
                          <span className="text-xs text-[#aaa] flex-1">{c?.label}</span>
                          <span
                            className="text-xs tabular-nums text-white font-medium"
                            style={{ fontFamily: 'JetBrains Mono, monospace' }}
                          >
                            {BRL(val)}
                          </span>
                          <span className="text-[10px] text-[#555] w-10 text-right">
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Header da lista */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#555] uppercase tracking-wider font-[Sora]">
              Meus ativos
            </span>
            <button
              onClick={() =>
                setEditando({ tipo: 'renda_fixa', cor: '#22c55e', ativo: true })
              }
              className="flex items-center gap-1.5 text-sm text-[#0EA5E9] hover:text-white transition-colors"
            >
              <Plus size={14} /> Adicionar ativo
            </button>
          </div>

          {/* Lista por tipo */}
          {(Object.entries(TIPO_CFG) as [TipoInv, typeof TIPO_CFG[TipoInv]][]).map(
            ([tipo, cfg]) => {
              const ativos = items.filter(i => i.tipo === tipo)
              if (ativos.length === 0) return null
              const totalTipo = porTipo[tipo] ?? 0
              const isOpen = !collapsed.has(tipo)

              return (
                <div
                  key={tipo}
                  className="bg-bg-2 border border-line rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleCollapse(tipo)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a] transition-colors"
                  >
                    <span className="text-sm font-semibold text-white flex-1 text-left">
                      {cfg.label}
                    </span>
                    <span
                      className="text-xs tabular-nums font-bold"
                      style={{ color: cfg.color, fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {BRL(totalTipo)}
                    </span>
                    <span className="text-[10px] text-[#555]">
                      {ativos.length} ativo{ativos.length !== 1 ? 's' : ''}
                    </span>
                    {isOpen ? (
                      <ChevronDown size={14} className="text-[#555]" />
                    ) : (
                      <ChevronRight size={14} className="text-[#555]" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-line">
                      {ativos.map(inv => {
                        const isRF =
                          inv.tipo === 'renda_fixa' || inv.tipo === 'previdencia'
                        const valorPos = isRF
                          ? valorEstimadoRF(inv, taxas)
                          : valorPosicao(inv)
                        const rent = isRF
                          ? (calcRentabilidadeRF(inv, taxas) ?? 0)
                          : (rentabilidadeVariavel(inv) ?? 0)
                        const rentPos = rent >= 0

                        return (
                          <div
                            key={inv.id}
                            className="group flex items-start gap-3 px-4 py-3 border-b border-line last:border-0 hover:bg-[#141414] transition-colors"
                          >
                            <div
                              className="w-1.5 h-8 rounded-full shrink-0 mt-0.5"
                              style={{ background: inv.cor ?? cfg.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-white truncate">
                                  {inv.nome}
                                </span>
                                {inv.ticker && (
                                  <span
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                    style={{
                                      background: (inv.cor ?? cfg.color) + '22',
                                      color: inv.cor ?? cfg.color,
                                    }}
                                  >
                                    {inv.ticker}
                                  </span>
                                )}
                                {inv.subtipo && (
                                  <span className="text-[10px] text-[#555]">
                                    {inv.subtipo}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                {inv.instituicao && (
                                  <span className="text-[11px] text-[#666]">
                                    {inv.instituicao}
                                  </span>
                                )}
                                {inv.indexador && (
                                  <span className="text-[11px] text-[#666]">
                                    {inv.indexador === 'PREFIXADO'
                                      ? `${inv.taxa_adicional?.toFixed(2)}% a.a.`
                                      : inv.indexador === 'CDI'
                                      ? `${inv.taxa_adicional ?? 100}% do CDI`
                                      : `${inv.indexador}+${inv.taxa_adicional?.toFixed(2)}%`}
                                  </span>
                                )}
                                {inv.data_vencimento && (
                                  <span className="text-[11px] text-[#666]">
                                    Vence {fmtDate(inv.data_vencimento)}
                                  </span>
                                )}
                                {inv.quantidade && (
                                  <span className="text-[11px] text-[#666]">
                                    {inv.quantidade.toLocaleString('pt-BR')} cotas
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div
                                className="text-sm font-bold tabular-nums text-white"
                                style={{ fontFamily: 'JetBrains Mono, monospace' }}
                              >
                                {BRL(valorPos)}
                              </div>
                              {inv.valor_aplicado && inv.valor_aplicado > 0 && (
                                <div
                                  className="text-[11px] tabular-nums flex items-center gap-1 justify-end"
                                  style={{ color: rentPos ? '#22c55e' : '#ef4444' }}
                                >
                                  {rentPos ? (
                                    <TrendingUp size={10} />
                                  ) : (
                                    <TrendingDown size={10} />
                                  )}
                                  {PCT(rent)}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditando(inv)}
                                className="text-[#555] hover:text-[#0EA5E9] p-1"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm(`Arquivar "${inv.nome}"?`)) return
                                  await (supabase.from('fin_investimentos') as any)
                                    .update({ ativo: false })
                                    .eq('id', inv.id)
                                  load()
                                }}
                                className="text-[#555] hover:text-[#ef4444] p-1"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            },
          )}

          {items.length === 0 && (
            <div className="flex flex-col items-center py-16 text-center text-[#555]">
              <p className="text-sm mb-1">Nenhum investimento cadastrado</p>
              <p className="text-xs mb-4">
                Adicione ações, renda fixa, criptos e muito mais
              </p>
              <button
                onClick={() =>
                  setEditando({ tipo: 'renda_fixa', cor: '#22c55e', ativo: true })
                }
                className="bg-[#0EA5E9] text-black text-sm font-semibold px-4 py-2 rounded-xl"
              >
                Adicionar primeiro ativo
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── SIMULADOR ── */}
      {activeTab === 'simulador' && <SimuladorTab taxas={taxas} />}

      {/* ── TAXAS ── */}
      {activeTab === 'taxas' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#555] uppercase tracking-wider font-[Sora]">
              Indicadores econômicos
            </span>
            <button
              onClick={atualizarTaxas}
              disabled={atualizandoTaxas}
              className="flex items-center gap-1.5 text-xs text-[#0EA5E9] hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={12}
                className={atualizandoTaxas ? 'animate-spin' : ''}
              />
              {atualizandoTaxas ? 'Atualizando...' : 'Atualizar via BCB'}
            </button>
          </div>
          <p className="text-[11px] text-[#555]">
            Dados do Banco Central do Brasil. Clique em "Atualizar" para buscar as
            taxas mais recentes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {taxas.map(t => (
              <div
                key={t.indicador}
                className="bg-bg-2 border border-line rounded-xl p-4"
              >
                <div className="text-xs text-[#555] mb-1">{t.indicador}</div>
                <div
                  className="text-2xl font-bold tabular-nums text-white"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {t.valor_anual.toFixed(2).replace('.', ',')}%
                </div>
                <div className="text-[11px] text-[#555] mt-1">
                  ao ano · {t.valor_mensal.toFixed(4).replace('.', ',')}% ao mês
                </div>
                {t.data_referencia && (
                  <div className="text-[10px] text-[#444] mt-1">
                    Ref.: {fmtDate(t.data_referencia)}
                  </div>
                )}
              </div>
            ))}
            {taxas.length === 0 && (
              <div className="col-span-2 text-center py-8 text-[#555] text-sm">
                Nenhuma taxa cadastrada.{' '}
                <button
                  onClick={atualizarTaxas}
                  className="text-[#0EA5E9] hover:underline"
                >
                  Buscar agora →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {editando !== null && (
        <InvestimentoModal
          initial={editando}
          onClose={() => setEditando(null)}
          onSave={async data => {
            const { id, ...rest } = data as Investimento & { id?: string }
            if (id) {
              await (supabase.from('fin_investimentos') as any)
                .update(rest)
                .eq('id', id)
            } else {
              await (supabase.from('fin_investimentos') as any).insert(data)
            }
            setEditando(null)
            load()
          }}
        />
      )}
    </div>
  )
}
