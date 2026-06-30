import { X } from 'lucide-react'
import type { HelpContent } from '@/lib/helpContent'

interface Props {
  content: HelpContent
  onClose: () => void
}

export function HelpModal({ content, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111111] border border-[#1f1f1f] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f1f] sticky top-0 bg-[#111111]">
          <div>
            <span className="text-sm font-semibold font-[Sora] text-white">{content.title}</span>
            <p className="text-[11px] text-[#555] mt-0.5">{content.subtitle}</p>
          </div>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {content.sections.map((s, i) => (
            <div key={i} className="flex gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: s.color + '18', color: s.color }}
              >
                {s.icon}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white mb-0.5">{s.title}</div>
                <p className="text-[12.5px] text-[#888] leading-relaxed">{s.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-[#1f1f1f] sticky bottom-0 bg-[#111111]">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#0EA5E9] text-black font-semibold text-sm rounded-xl hover:bg-[#38bdf8] transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}
