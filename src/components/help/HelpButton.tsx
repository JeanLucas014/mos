import { HelpCircle } from 'lucide-react'
import { useHelpGuide } from '@/hooks/useHelpGuide'
import { HelpModal } from './HelpModal'
import { HELP_CONTENT } from '@/lib/helpContent'

export function HelpButton({ pageId }: { pageId: string }) {
  const content = HELP_CONTENT[pageId]
  const { open, close, reopen } = useHelpGuide(pageId)

  if (!content) return null

  return (
    <>
      <button
        onClick={reopen}
        className="text-ink-3 hover:text-brand transition-colors shrink-0"
        title="Como funciona"
      >
        <HelpCircle size={15} />
      </button>
      {open && <HelpModal content={content} onClose={close} />}
    </>
  )
}
