import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { HelpButton } from '@/components/help/HelpButton'
import { supabase } from '../../lib/supabase'
import type { UserSport } from './types'
import { SPORT_CATALOG } from './constants'
import { WorkoutsSection } from './components/WorkoutsSection'
import { GoalsSection } from './components/GoalsSection'
import { RacesSection } from './components/RacesSection'
import { SportShoppingSection } from './components/SportShoppingSection'

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export function SportsPage() {
  const [userSports,   setUserSports]   = useState<UserSport[]>([])
  const [sport,        setSport]        = useState<string>('')
  const [loadingSports, setLoadingSports] = useState(true)
  const [showAddSport, setShowAddSport] = useState(false)

  useEffect(() => { loadUserSports() }, [])

  async function loadUserSports() {
    const { data } = await (supabase as any).from('user_sports').select('*').order('ordem')
    const sports = data ?? []
    setUserSports(sports)
    if (sports.length > 0 && !sport) setSport(sports[0].key)
    setLoadingSports(false)
  }

  async function addSport(key: string, label: string) {
    await (supabase as any).from('user_sports').insert({ key, label, ordem: userSports.length })
    setShowAddSport(false)
    await loadUserSports()
    setSport(key)
  }

  async function removeSport(id: string, key: string) {
    if (!window.confirm('Remover este esporte? Os treinos registrados não serão apagados.')) return
    await (supabase as any).from('user_sports').delete().eq('id', id)
    const remaining = userSports.filter(s => s.id !== id)
    setUserSports(remaining)
    if (sport === key) setSport(remaining[0]?.key ?? '')
    await loadUserSports()
  }

  return (
    <div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div className="flex items-center gap-2">
        <h1 className="text-2xl lg:text-[30px]" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}>Esportes</h1>
        <HelpButton pageId="esportes" />
      </div>
      <p className="text-ink-2 mt-1 text-sm mb-5">Treinos, metas, provas e gear.</p>

      {/* Sport tabs */}
      <div className="flex gap-1.5 mb-6 p-1 rounded-xl border border-line overflow-x-auto" style={{ background: 'var(--bg2)' }}>
        {userSports.map((s) => (
          <button
            key={s.id}
            onClick={() => setSport(s.key)}
            className="flex items-center gap-2 px-4 sm:px-5 rounded-lg transition-colors font-semibold flex-shrink-0"
            style={{
              minHeight: 40, fontSize: 13,
              background: sport === s.key ? 'var(--border)' : 'transparent',
              color: sport === s.key ? '#fff' : 'var(--text2)',
              border: sport === s.key ? '1px solid rgba(255,255,255,.08)' : '1px solid transparent',
              whiteSpace: 'nowrap',
            }}
          >
            {s.label}
            {sport === s.key && (
              <span
                onClick={(e) => { e.stopPropagation(); removeSport(s.id, s.key) }}
                className="ml-1 text-[#555] hover:text-[#ef4444] transition-colors"
                style={{ fontSize: 16, lineHeight: 1 }}
              >×</span>
            )}
          </button>
        ))}
        <button
          onClick={() => setShowAddSport(true)}
          className="flex items-center gap-1.5 px-3 rounded-lg text-[#555] hover:text-[#0EA5E9] transition-colors flex-shrink-0"
          style={{ minHeight: 40, fontSize: 13 }}
        >
          <Plus size={14} /> Adicionar
        </button>
      </div>

      {/* Empty state */}
      {!loadingSports && userSports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-[#888] text-sm mb-1">Nenhum esporte adicionado ainda.</p>
          <p className="text-[#555] text-xs mb-4">Adicione os esportes que você pratica para começar a registrar treinos.</p>
          <button onClick={() => setShowAddSport(true)} className="flex items-center gap-2 bg-[#0EA5E9] text-black px-4 py-2 rounded-xl text-sm font-semibold">
            <Plus size={14} /> Adicionar esporte
          </button>
        </div>
      )}

      {/* Sections */}
      {sport && userSports.length > 0 && (
        <div className="space-y-3">
          <WorkoutsSection sport={sport} />
          <GoalsSection sport={sport} />
          <RacesSection sport={sport} />
          <SportShoppingSection sport={sport} />
        </div>
      )}

      {/* Add sport modal */}
      {showAddSport && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={() => setShowAddSport(false)}>
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold font-[Sora] text-white">Adicionar esporte</span>
              <button onClick={() => setShowAddSport(false)} className="text-[#555] hover:text-white text-lg">×</button>
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {SPORT_CATALOG
                .filter(c => !userSports.some(s => s.key === c.key))
                .map(c => (
                  <button
                    key={c.key}
                    onClick={() => addSport(c.key, c.label)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-[#ccc] hover:bg-[#1f1f1f] hover:text-white transition-colors"
                  >
                    {c.label}
                  </button>
                ))}
            </div>
            {SPORT_CATALOG.filter(c => !userSports.some(s => s.key === c.key)).length === 0 && (
              <p className="text-[#555] text-sm text-center py-4">Todos os esportes já foram adicionados.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
