import { Step } from './shared'

/* ══════════════════════════════════════════════════════════════════
   INSTALAR APP TAB
══════════════════════════════════════════════════════════════════ */
export function InstalarAppTab() {
  return (
    <div className="max-w-xl space-y-4">
      <p className="text-xs text-ink-3">Instale o MOS como um app nativo na tela inicial — sem precisar de loja de aplicativos.</p>

      <div className="bg-bg-2 border border-line rounded-xl p-5 space-y-3">
        <div className="text-[10px] text-ink-3 font-[Sora] uppercase tracking-wider">iPhone / Safari</div>
        <Step n={1} text='No Safari, toque no ícone de Compartilhar (quadrado com seta para cima) na barra inferior.' />
        <Step n={2} text='Role para baixo e toque em "Adicionar à Tela de Início".' />
        <Step n={3} text='Toque em "Adicionar" no canto superior direito.' />
        <p className="text-[11px] text-ink-3 mt-1">Funciona apenas no Safari — outros navegadores no iPhone não suportam essa opção.</p>
      </div>

      <div className="bg-bg-2 border border-line rounded-xl p-5 space-y-3">
        <div className="text-[10px] text-ink-3 font-[Sora] uppercase tracking-wider">Android / Chrome</div>
        <Step n={1} text='No Chrome, toque nos três pontinhos no canto superior direito.' />
        <Step n={2} text='Toque em "Instalar app" ou "Adicionar à tela inicial".' />
        <Step n={3} text='Confirme tocando em "Instalar".' />
      </div>

      <div className="bg-bg-2 border border-line rounded-xl p-5 space-y-3">
        <div className="text-[10px] text-ink-3 font-[Sora] uppercase tracking-wider">Desktop</div>
        <Step n={1} text='No Chrome ou Edge, clique no ícone de instalação na barra de endereço (ícone de tela com seta).' />
        <Step n={2} text='Clique em "Instalar".' />
        <p className="text-[11px] text-ink-3 mt-1">Você também pode acessar pelo celular — acesse app.jlmos.com.br no navegador do seu telefone.</p>
      </div>
    </div>
  )
}
