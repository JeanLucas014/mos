import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Download, Upload, AlertTriangle } from 'lucide-react'
import type { FinAno } from '../../../types'
import type { ImportState, PreviewData } from '../types'
import { countLegacy, countMosV1 } from '../backup/utils'
import { importarFormatoAntigo } from '../backup/importLegacy'
import { importarMosV1 } from '../backup/importMosV1'

export function BackupTab({ anos }: { anos: FinAno[] }) {
  const [exporting, setExporting] = useState(false)
  const [importState, setImportState] = useState<ImportState>('idle')
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [progress, setProgress] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const [selectedAnoId, setSelectedAnoId] = useState(anos[anos.length - 1]?.id ?? '')
  const fileRef = useRef<HTMLInputElement>(null)

  async function exportBackup() {
    setExporting(true)
    try {
      const [
        { data: anosD }, { data: lancsD }, { data: metasD },
        { data: invsD }, { data: catsD }, { data: cardsD }, { data: recsD },
      ] = await Promise.all([
        supabase.from('fin_anos').select('*'),
        supabase.from('fin_lancamentos').select('*'),
        supabase.from('fin_metas').select('*'),
        supabase.from('fin_investimentos').select('*'),
        supabase.from('fin_categorias').select('*'),
        supabase.from('fin_cartoes').select('*'),
        supabase.from('fin_recorrentes').select('*'),
      ])
      const payload = {
        version: 'mos-v1',
        exportedAt: new Date().toISOString(),
        data: {
          anos: anosD ?? [],
          lancamentos: lancsD ?? [],
          metas: metasD ?? [],
          investimentos: invsD ?? [],
          categorias: catsD ?? [],
          cartoes: cardsD ?? [],
          recorrentes: recsD ?? [],
        },
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `financeiro-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportState('reading')
    setPreview(null)
    setLog([])
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      if (json.version === 'mos-v1') {
        setPreview({ format: 'mos-v1', json, counts: countMosV1(json) })
      } else if (json.months) {
        setPreview({ format: 'legacy', json, counts: countLegacy(json) })
      } else {
        setLog(['Formato de arquivo não reconhecido.'])
        setImportState('error')
        return
      }
      setImportState('preview')
    } catch {
      setLog(['Erro ao ler o arquivo. Verifique se é um JSON válido.'])
      setImportState('error')
    }
  }

  async function doImport() {
    if (!preview) return
    setImportState('importing')
    setProgress(0)
    setLog([])
    try {
      let erros: string[]
      if (preview.format === 'mos-v1') {
        erros = await importarMosV1(preview.json, setProgress)
      } else {
        if (!selectedAnoId) {
          setLog(['Selecione um ano de destino.'])
          setImportState('error')
          return
        }
        erros = await importarFormatoAntigo(preview.json, selectedAnoId, setProgress)
      }
      setProgress(100)
      setLog(erros.length ? erros : ['Importação concluída com sucesso!'])
      setImportState('done')
    } catch (err) {
      setLog([String(err)])
      setImportState('error')
    }
  }

  function reset() {
    setImportState('idle')
    setPreview(null)
    setProgress(0)
    setLog([])
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-5">

      {/* ── Seção A: Exportar ── */}
      <div className="bg-bg-2 border border-line rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-ink-3 font-[Sora] uppercase tracking-wider mb-1">Exportar backup</div>
            <div className="text-sm text-ink-2">
              Baixa todos os dados financeiros como JSON — anos, lançamentos, metas, investimentos, categorias, cartões e recorrentes.
            </div>
          </div>
          <button
            onClick={exportBackup}
            disabled={exporting}
            className="flex items-center gap-2 shrink-0 px-4 py-2 text-sm font-medium bg-brand text-black rounded-lg hover:bg-[#38bdf8] disabled:opacity-40 transition-colors"
          >
            <Download size={14} />
            {exporting ? 'Exportando…' : 'Baixar backup'}
          </button>
        </div>
      </div>

      {/* ── Seção B: Importar ── */}
      <div className="bg-bg-2 border border-line rounded-xl p-5 space-y-4">
        <div className="text-xs text-ink-3 font-[Sora] uppercase tracking-wider">Restaurar backup</div>

        {/* Aviso */}
        <div className="flex gap-2.5 bg-[#f59e0b]/5 border border-[#f59e0b]/20 rounded-lg px-3 py-2.5">
          <AlertTriangle size={14} className="text-[#f59e0b] shrink-0 mt-0.5" />
          <div className="text-xs text-[#f59e0b]/80">
            A importação <strong>adiciona</strong> dados ao existente sem apagar nada. Se quiser substituir tudo, exporte um backup dos dados atuais antes de importar.
          </div>
        </div>

        {/* Upload */}
        {importState === 'idle' && (
          <label className="flex flex-col items-center gap-3 py-8 border border-dashed border-[#2a2a2a] rounded-xl cursor-pointer hover:border-brand/40 transition-colors">
            <Upload size={20} className="text-[#444]" />
            <span className="text-sm text-ink-3">Selecionar arquivo JSON</span>
            <input ref={fileRef} type="file" accept=".json" className="sr-only" onChange={onFileChange} />
          </label>
        )}

        {/* Reading */}
        {importState === 'reading' && (
          <div className="flex items-center gap-2 text-sm text-ink-3 py-4">
            <div className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            Lendo arquivo…
          </div>
        )}

        {/* Preview */}
        {importState === 'preview' && preview && (
          <div className="space-y-3">
            <div className="bg-bg border border-line rounded-lg px-4 py-3 space-y-1.5">
              <div className="text-[10px] text-ink-3 uppercase tracking-wider mb-2">
                {preview.format === 'mos-v1' ? 'Formato MOS v1' : 'Formato legado'}{preview.counts.extras ? ` · ${preview.counts.extras}` : ''}
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-ink-2">Lançamentos: <strong className="text-white">{preview.counts.lancamentos}</strong></span>
                <span className="text-ink-2">Metas: <strong className="text-white">{preview.counts.metas}</strong></span>
                <span className="text-ink-2">Investimentos: <strong className="text-white">{preview.counts.investimentos}</strong></span>
              </div>
            </div>

            {/* Ano destino (formato legado) */}
            {preview.format === 'legacy' && (
              <div>
                <div className="text-[10px] text-ink-3 uppercase tracking-wider mb-1.5">Ano de destino</div>
                <select
                  value={selectedAnoId}
                  onChange={e => setSelectedAnoId(e.target.value)}
                  className="w-full bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                >
                  <option value="">Selecione…</option>
                  {anos.map(a => <option key={a.id} value={a.id}>{a.ano}</option>)}
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={reset} className="px-4 py-2 text-sm text-ink-3 border border-line rounded-lg hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={doImport}
                disabled={preview.format === 'legacy' && !selectedAnoId}
                className="flex-1 py-2 text-sm font-medium bg-brand text-black rounded-lg hover:bg-[#38bdf8] disabled:opacity-40 transition-colors"
              >
                Importar
              </button>
            </div>
          </div>
        )}

        {/* Progress */}
        {importState === 'importing' && (
          <div className="space-y-3">
            <div className="text-sm text-ink-3">Importando… {progress}%</div>
            <div className="h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Done / Error */}
        {(importState === 'done' || importState === 'error') && (
          <div className="space-y-3">
            <div className="h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
              <div className={['h-full rounded-full', importState === 'done' ? 'bg-[#22c55e]' : 'bg-[#ef4444]'].join(' ')} style={{ width: '100%' }} />
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {log.map((l, i) => (
                <div key={i} className={['text-xs', l.includes('sucesso') ? 'text-[#22c55e]' : l.startsWith('Importação') ? 'text-[#22c55e]' : 'text-[#ef4444]/80'].join(' ')}>
                  {l}
                </div>
              ))}
            </div>
            <button onClick={reset} className="px-4 py-1.5 text-sm text-brand border border-brand/30 rounded-lg hover:border-brand/60 transition-colors">
              Importar outro arquivo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
