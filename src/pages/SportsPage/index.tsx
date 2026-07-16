import { useState } from 'react'
import { Plus } from 'lucide-react'
import { HelpButton } from '@/components/help/HelpButton'
import { SPORT_CATALOG } from './constants'
import { WorkoutsSection } from './components/WorkoutsSection'
import { GoalsSection } from './components/GoalsSection'
import { RacesSection } from './components/RacesSection'
import { SportShoppingSection } from './components/SportShoppingSection'
import { useUserSports } from './hooks/useUserSports'
import { EmptyState } from '@/components/ui/EmptyState'

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export function SportsPage() {
  const {
    userSports, sport, setSport, loadingSports,
    addSport: addSportAction, removeSport,
  } = useUserSports()
  const [showAddSport, setShowAddSport] = useState(false)

  async function addSport(key: string, label: string) {
    await addSportAction(key, label)
    setShowAddSport(false)
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
        <EmptyState
          title="Nenhum esporte adicionado ainda."
          description="Adicione os esportes que você pratica para começar a registrar treinos."
          action={{ label: '+ Adicionar esporte', onClick: () => setShowAddSport(true) }}
        />
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
