import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { JSONContent } from '@tiptap/react'
import { ArrowLeft, GraduationCap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useStudies } from '@/hooks/useStudies'
import type { Json } from '@/types/db'
import { Pill, ProgressBar } from '@/pages/StudiesPage'
import { useEstudosItens, type EstudoItem } from './hooks/useEstudosItens'
import { Breadcrumb, type Crumb } from './components/Breadcrumb'
import { ItemsExplorer } from './components/ItemsExplorer'
import { PageEditor } from './components/PageEditor'

type StudyStatus = 'ativo' | 'no prazo' | 'concluido'

export function StudyDetailPage() {
  const { studyId } = useParams<{ studyId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { studies: studiesQ, updateStudy } = useStudies()
  const store = useEstudosItens(studyId ?? '')

  const study = (studiesQ.data ?? []).find((s) => s.id === studyId)
  const items = store.data ?? []

  const [folderStack, setFolderStack] = useState<Crumb[]>([{ id: null, nome: study?.name ?? '' }])
  const [openPageId, setOpenPageId] = useState<string | null>(null)

  const currentFolder = folderStack[folderStack.length - 1]
  const openItem = openPageId ? items.find((it) => it.id === openPageId) ?? null : null

  function openFolder(item: EstudoItem) {
    setFolderStack((s) => [...s, { id: item.id, nome: item.nome }])
    setOpenPageId(null)
  }

  function openPage(item: EstudoItem) {
    setOpenPageId(item.id)
  }

  function handleSaveConteudo(id: string, conteudo: JSONContent) {
    store.updateItem.mutate({ id, conteudo: conteudo as unknown as Json })
  }

  function navigateBreadcrumb(index: number) {
    setFolderStack((s) => s.slice(0, index + 1))
    setOpenPageId(null)
  }

  if (studiesQ.isLoading || store.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-5 h-5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!study) {
    return (
      <div className="text-center py-20 text-ink-3">
        <p className="mb-3">Estudo não encontrado.</p>
        <button onClick={() => navigate('/estudos')} className="text-brand text-sm hover:underline">
          Voltar para Estudos →
        </button>
      </div>
    )
  }

  const crumbs: Crumb[] = openItem
    ? [...folderStack.map((c, i) => (i === 0 ? { ...c, nome: study.name } : c)), { id: openItem.id, nome: openItem.nome }]
    : folderStack.map((c, i) => (i === 0 ? { ...c, nome: study.name } : c))

  return (
    <div className="flex flex-col" style={{ minHeight: '70vh' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => navigate('/estudos')}
          className="flex items-center justify-center w-8 h-8 -ml-1.5 text-ink-2 hover:text-ink transition-colors flex-shrink-0"
          aria-label="Voltar para Estudos"
        >
          <ArrowLeft size={17} />
        </button>
        <h1
          className="text-xl lg:text-2xl truncate"
          style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}
        >
          {study.name}
        </h1>
      </div>

      {/* Progress card — lógica existente, intocada */}
      <div className="bg-bg-2 border border-line rounded-card p-4 mb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex-shrink-0 rounded-lg flex items-center justify-center text-brand"
              style={{ width: 34, height: 34, background: 'rgba(14,165,233,.12)' }}
            >
              <GraduationCap size={16} />
            </div>
            {study.meta && (
              <span className="text-ink-2 truncate" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                {study.meta}
              </span>
            )}
          </div>
          <Pill status={study.status ?? 'ativo'} />
        </div>
        <ProgressBar
          value={study.progress ?? 0}
          color={study.status === 'concluido' ? '#34d399' : 'var(--blue)'}
          onChange={(v) => updateStudy.mutate({ id: study.id, progress: v })}
        />
        <div className="flex justify-end mt-2">
          <select
            value={study.status ?? 'ativo'}
            onChange={(e) => updateStudy.mutate({ id: study.id, status: e.target.value as StudyStatus })}
            className="text-ink-2 text-xs rounded-input bg-bg border border-line focus:outline-none focus:border-brand"
            style={{ padding: '3px 6px', fontFamily: 'Manrope, sans-serif' }}
          >
            <option value="ativo">Ativo</option>
            <option value="no prazo">No prazo</option>
            <option value="concluido">Concluído</option>
          </select>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="mb-3">
        <Breadcrumb crumbs={crumbs} onNavigate={navigateBreadcrumb} />
      </div>

      {/* Conteúdo: explorer de pastas/páginas OU editor da página aberta */}
      {openItem ? (
        <PageEditor
          item={openItem}
          userId={user?.id}
          onRename={(nome) => store.updateItem.mutate({ id: openItem.id, nome })}
          onSaveConteudo={handleSaveConteudo}
          onBack={() => setOpenPageId(null)}
        />
      ) : (
        <ItemsExplorer
          items={items}
          cursoNome={study.name}
          parentId={currentFolder.id}
          store={store}
          onOpenFolder={openFolder}
          onOpenPage={openPage}
        />
      )}
    </div>
  )
}
