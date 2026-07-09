import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MODULES, DEFAULT_NEW_USER_MODULES } from '@/lib/modules'
import { useUserSettings } from '@/hooks/useUserSettings'
import { Check } from 'lucide-react'

const SELECTABLE_MODULES = MODULES.filter(m => !m.core && !m.hidden)

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { completeOnboarding } = useUserSettings()
  const [step, setStep] = useState<0 | 1>(0)
  const [selected, setSelected] = useState<string[]>(DEFAULT_NEW_USER_MODULES)
  const [saving, setSaving] = useState(false)

  function toggle(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  async function handleFinish() {
    setSaving(true)
    const finalModules = Array.from(new Set([
      ...selected,
      ...MODULES.filter(m => m.core).map(m => m.id),
    ]))
    await completeOnboarding.mutateAsync(finalModules)
    setSaving(false)
    navigate('/dashboard', { replace: true })
  }

  const groups = Array.from(new Set(SELECTABLE_MODULES.map(m => m.group)))

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <span
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 900, fontSize: 28, color: '#0EA5E9', letterSpacing: '-0.04em' }}
          >
            mos
          </span>
        </div>

        {step === 0 && (
          <div className="text-center">
            <h1 className="text-3xl font-bold font-[Sora] text-white mb-3">
              Bem-vindo ao MOS
            </h1>
            <p className="text-[#888] text-base mb-10 max-w-md mx-auto">
              Seu sistema operacional pessoal. Vamos configurar o MOS
              com o que você realmente vai usar — você pode mudar isso
              a qualquer momento nas Configurações.
            </p>
            <button
              onClick={() => setStep(1)}
              className="bg-[#0EA5E9] text-black font-semibold px-8 py-3 rounded-xl hover:bg-[#38bdf8] transition-colors"
            >
              Começar
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold font-[Sora] text-white mb-2 text-center">
              Quais módulos você quer usar?
            </h1>
            <p className="text-[#888] text-sm mb-8 text-center">
              Selecione o que faz sentido para sua rotina.
            </p>

            <div className="space-y-6 mb-10 max-h-[50vh] overflow-y-auto px-1">
              {groups.map(group => (
                <div key={group}>
                  <div className="text-[11px] text-[#555] uppercase tracking-wider font-[Sora] mb-2">
                    {group}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SELECTABLE_MODULES.filter(m => m.group === group).map(mod => {
                      const isOn = selected.includes(mod.id)
                      return (
                        <button
                          key={mod.id}
                          onClick={() => toggle(mod.id)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors"
                          style={{
                            background: isOn ? 'rgba(14,165,233,.08)' : '#111111',
                            borderColor: isOn ? '#0EA5E9' : 'var(--border)',
                          }}
                        >
                          <div
                            className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors"
                            style={{
                              background: isOn ? '#0EA5E9' : 'transparent',
                              borderColor: isOn ? '#0EA5E9' : '#333',
                            }}
                          >
                            {isOn && <Check size={12} color="#000" strokeWidth={3} />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-white truncate">{mod.label}</div>
                            <div className="text-[11px] text-[#555] truncate">{mod.description}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(0)}
                className="text-sm text-[#555] hover:text-white transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="bg-[#0EA5E9] text-black font-semibold px-8 py-3 rounded-xl hover:bg-[#38bdf8] disabled:opacity-50 transition-colors"
              >
                {saving ? 'Configurando...' : 'Entrar no MOS'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
