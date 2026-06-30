import { useUserSettings } from '@/hooks/useUserSettings'
import { MODULES } from '@/lib/modules'

export default function SettingsPage() {
  const { data: settings, isLoading, toggleModule } = useUserSettings()
  const enabled = settings?.enabled_modules ?? []

  const groups = Array.from(new Set(MODULES.map(m => m.group)))

  if (isLoading) {
    return <div className="text-[#555] text-sm py-8 text-center">Carregando...</div>
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold font-[Sora] text-white mb-1">Configurações</h1>
      <p className="text-sm text-[#888] mb-8">Ative ou desative módulos do MOS</p>

      {groups.map(group => (
        <div key={group} className="mb-6">
          <div className="text-[11px] text-[#555] uppercase tracking-wider font-[Sora] mb-2">
            {group}
          </div>
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
            {MODULES.filter(m => m.group === group).map(mod => {
              const isOn = enabled.includes(mod.id)
              return (
                <div
                  key={mod.id}
                  className="flex items-center justify-between px-4 py-3.5 border-b border-[#1f1f1f] last:border-0"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="text-sm font-medium text-white">{mod.label}</div>
                    <div className="text-xs text-[#555] mt-0.5">{mod.description}</div>
                  </div>
                  <button
                    onClick={() => !mod.core && toggleModule.mutate(mod.id)}
                    disabled={mod.core}
                    className="relative w-10 h-6 rounded-full transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: isOn ? '#0EA5E9' : '#2a2a2a' }}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                      style={{ transform: isOn ? 'translateX(18px)' : 'translateX(2px)' }}
                    />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <p className="text-[11px] text-[#444] mt-2">
        Módulos marcados como essenciais não podem ser desativados.
      </p>
    </div>
  )
}
