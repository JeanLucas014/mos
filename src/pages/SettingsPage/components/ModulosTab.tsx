import { useUserSettings } from '@/hooks/useUserSettings'
import { MODULES, isModuleVisible } from '@/lib/modules'
import { Toggle } from '@/components/ui/Toggle'

/* ══════════════════════════════════════════════════════════════════
   MÓDULOS TAB
══════════════════════════════════════════════════════════════════ */
export function ModulosTab() {
  const { data: settings, isLoading: settingsLoading, toggleModule } = useUserSettings()
  const enabled = settings?.enabled_modules ?? []
  const isAdmin = settings?.is_admin ?? false

  // adminOnly usa isModuleVisible (mesma checagem do Sidebar); hidden
  // "normal" só aparece aqui uma vez já habilitado, pra permitir desligar.
  const visibleModules = MODULES.filter(m =>
    m.adminOnly ? isModuleVisible(m.id, m.adminOnly, enabled, isAdmin) : (!m.hidden || enabled.includes(m.id)),
  )
  const groups = Array.from(new Set(visibleModules.map(m => m.group)))

  return (
    <section className="space-y-4">
      <p className="text-ink-3 text-xs">Ative ou desative módulos do MOS. Módulos essenciais não podem ser removidos.</p>
      {settingsLoading ? (
        <div className="text-ink-3 text-sm py-4">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {groups.map(group => (
            <div key={group}>
              <div className="text-[10px] text-ink-3 uppercase tracking-wider font-[Sora] mb-1.5 px-0.5">{group}</div>
              <div className="bg-bg-2 border border-line rounded-xl overflow-hidden">
                {visibleModules.filter(m => m.group === group).map(mod => {
                  // adminOnly já está sempre visível+ativo pra quem chegou até
                  // aqui (isModuleVisible não depende de enabled_modules pra
                  // esses) — o toggle vira só um indicador, igual core.
                  const isOn = mod.adminOnly ? true : enabled.includes(mod.id)
                  const locked = mod.core || mod.adminOnly
                  return (
                    <div key={mod.id} className="flex items-center justify-between px-4 py-3.5 border-b border-line last:border-0">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="text-sm font-medium text-white">{mod.label}</div>
                        <div className="text-xs text-ink-3 mt-0.5">{mod.description}</div>
                      </div>
                      <Toggle
                        on={isOn}
                        disabled={locked}
                        onClick={() => !locked && toggleModule.mutate(mod.id)}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
