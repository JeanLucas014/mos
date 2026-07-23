import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { JSONContent } from '@tiptap/react'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useStudies } from '@/hooks/useStudies'
import type { Json } from '@/types/db'
import { useEstudosItens, type EstudoItem, type EstudoItemTipo } from './hooks/useEstudosItens'
import { Breadcrumb, type Crumb } from './components/Breadcrumb'
import { ItemsExplorer } from './components/ItemsExplorer'
import { PageEditor } from './components/PageEditor'
import { CourseCard } from './components/CourseCard'

/** Nível "raiz" do curso é representado por tipo 'root' — o restante da
 * pilha alterna livremente entre 'pasta' e 'pagina', já que uma página
 * também pode conter sub-itens (ver PageEditor). */
type StackEntry = { id: string | null; nome: string; tipo: 'root' | EstudoItemTipo }

export function StudyDetailPage() {
  const { studyId } = useParams<{ studyId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { studies: studiesQ, updateStudy } = useStudies()
  const store = useEstudosItens(studyId ?? '')

  const study = (studiesQ.data ?? []).find((s) => s.id === studyId)
  const items = store.data ?? []

  const [stack, setStack] = useState<StackEntry[]>([{ id: null, nome: study?.name ?? '', tipo: 'root' }])
  const current = stack[stack.length - 1]
  const currentItem = current.tipo !== 'root' ? items.find((it) => it.id === current.id) ?? null : null

  function openItem(item: EstudoItem) {
    setStack((s) => [...s, { id: item.id, nome: item.nome, tipo: item.tipo as EstudoItemTipo }])
  }

  function navigateTo(index: number) {
    setStack((s) => s.slice(0, index + 1))
  }

  function goBack() {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
  }

  function handleSaveConteudo(id: string, conteudo: JSONContent) {
    store.updateItem.mutate({ id, conteudo: conteudo as unknown as Json })
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

  // Nome de cada crumb é sempre lido fresco de `items` (ou de `study` na
  // raiz) — assim um rename reflete imediatamente no breadcrumb, mesmo
  // pra níveis que não são o atual.
  const crumbs: Crumb[] = stack.map((e) => {
    if (e.tipo === 'root') return { id: e.id, nome: study.name }
    const fresh = items.find((it) => it.id === e.id)
    return { id: e.id, nome: fresh?.nome ?? e.nome }
  })

  // Página/pasta atual pode ter sido excluída enquanto estava aberta —
  // se sumiu do cache, volta pro nível anterior em vez de travar a tela.
  if (current.tipo !== 'root' && !currentItem) {
    if (stack.length > 1) {
      setStack((s) => s.slice(0, -1))
    }
    return null
  }

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
          Estudos
        </h1>
      </div>

      <CourseCard
        study={study}
        onRename={(nome) => updateStudy.mutate({ id: study.id, name: nome })}
        onStatusChange={(status) => updateStudy.mutate({ id: study.id, status })}
        onManualProgressChange={(v) => updateStudy.mutate({ id: study.id, progress: v })}
      />

      {/* Breadcrumb */}
      <div className="mb-3">
        <Breadcrumb crumbs={crumbs} onNavigate={navigateTo} />
      </div>

      {/* Conteúdo: explorer de pastas/páginas OU editor da página aberta */}
      {currentItem && currentItem.tipo === 'pagina' ? (
        <PageEditor
          item={currentItem}
          items={items}
          cursoNome={study.name}
          store={store}
          userId={user?.id}
          onRename={(nome) => store.updateItem.mutate({ id: currentItem.id, nome })}
          onSaveConteudo={handleSaveConteudo}
          onOpenChild={openItem}
          onBack={goBack}
        />
      ) : (
        <ItemsExplorer
          items={items}
          cursoNome={study.name}
          parentId={current.id}
          store={store}
          onOpenItem={openItem}
        />
      )}
    </div>
  )
}
