import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
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
