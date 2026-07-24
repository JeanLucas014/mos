import { Component, type ReactNode } from 'react'
import { isChunkLoadError, shouldAutoReload } from '@/lib/chunkErrorDetection'

interface Props {
  children: ReactNode
}

type Mode = 'ok' | 'error' | 'chunk-updating'

interface State {
  mode: Mode
  error: Error | null
}

const RELOAD_DELAY_MS = 400

export class ErrorBoundary extends Component<Props, State> {
  state: State = { mode: 'ok', error: null }

  // Classificação pura (só regex, sem sessionStorage/setTimeout) — decide
  // já no primeiro render qual tela mostrar, sem flash da tela de erro
  // genérica antes de trocar pra "Atualizando…".
  static getDerivedStateFromError(error: Error): State {
    return { error, mode: isChunkLoadError(error) ? 'chunk-updating' : 'error' }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)

    if (this.state.mode !== 'chunk-updating') return

    // Chunk antigo após deploy: recarrega automaticamente. Protegido contra
    // loop infinito — se isso já aconteceu demais em pouco tempo, o
    // problema provavelmente não é chunk desatualizado (pode ser o
    // servidor fora do ar, ou um bug real disfarçado de erro de módulo) e
    // insistir só pioraria. Nesse caso, cai pra tela de erro normal.
    if (shouldAutoReload()) {
      setTimeout(() => window.location.reload(), RELOAD_DELAY_MS)
    } else {
      this.setState({ mode: 'error' })
    }
  }

  reset = () => this.setState({ mode: 'ok', error: null })

  render() {
    if (this.state.mode === 'chunk-updating') {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-bg text-center px-6" style={{ gap: 16 }}>
          <div
            className="rounded-full border-2 border-brand border-t-transparent animate-spin"
            style={{ width: 24, height: 24 }}
          />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'Sora, sans-serif' }}>
            Atualizando…
          </div>
        </div>
      )
    }

    if (this.state.mode === 'error') {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-bg text-center px-6" style={{ gap: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'Sora, sans-serif' }}>
            Algo deu errado
          </div>
          <p className="text-ink-3" style={{ fontSize: 13, maxWidth: 360 }}>
            Ocorreu um erro inesperado nesta tela. Você pode tentar novamente ou recarregar a página.
          </p>
          <div className="flex gap-2">
            <button
              onClick={this.reset}
              className="bg-brand text-white rounded-input px-4 text-sm font-semibold hover:brightness-110 transition-all"
              style={{ minHeight: 40 }}
            >
              Tentar novamente
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-bg-3 text-ink-2 rounded-input px-4 text-sm hover:text-ink transition-colors"
              style={{ minHeight: 40 }}
            >
              Recarregar página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
