import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import './index.css'

/* Registro do service worker — checa periodicamente por versão nova
 * enquanto a aba está visível. Sem isso, o navegador só verifica por
 * conta própria em intervalos que podem ser bem mais longos que o ritmo
 * de deploy do projeto, deixando abas abertas presas numa versão antiga
 * por horas. skipWaiting()+clientsClaim() (já configurados no build do
 * SW) fazem a versão nova assumir sozinha assim que termina de instalar
 * — não precisamos forçar reload aqui: a atualização acontece em segundo
 * plano, sem interromper o que o usuário está fazendo, e a próxima
 * navegação (inclusive o reload automático do ErrorBoundary quando um
 * chunk antigo falha) já pega os assets atuais. */
const SW_UPDATE_CHECK_MS = 60_000

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        const checkForUpdate = () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {})
          }
        }
        setInterval(checkForUpdate, SW_UPDATE_CHECK_MS)
        document.addEventListener('visibilitychange', checkForUpdate)
      })
      .catch((err) => console.error('[ServiceWorker] falha no registro:', err))
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
