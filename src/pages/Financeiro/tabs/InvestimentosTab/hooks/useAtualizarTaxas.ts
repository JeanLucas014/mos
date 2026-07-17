import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { today } from '../utils'

/**
 * Busca SELIC/CDI/IPCA no Banco Central (api.bcb.gov.br) e faz upsert em
 * fin_taxas_economicas. Logica de conversao de taxas (diaria -> anual,
 * poupanca) copiada byte-a-byte do original, sem alteracao.
 */
export function useAtualizarTaxas(reload: () => Promise<void>) {
  const [atualizandoTaxas, setAtualizandoTaxas] = useState(false)

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
        await supabase.from('fin_taxas_economicas').upsert(u, { onConflict: 'indicador' })
      }
      await reload()
    } catch {
      alert('Erro ao buscar taxas do Banco Central. Verifique sua conexão.')
    }
    setAtualizandoTaxas(false)
  }

  return { atualizandoTaxas, atualizarTaxas }
}
