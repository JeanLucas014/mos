import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>

        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text3)', textDecoration: 'none', fontSize: 14, marginBottom: 40 }}>
          <ArrowLeft size={15} /> Voltar
        </Link>

        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <img src="/logo.png" alt="MOS" style={{ height: 32 }} />
          </div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
            Política de Privacidade
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: 14, margin: 0 }}>
            Última atualização: julho de 2026
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          <Section title="1. Quem somos">
            <P>O MOS (My Operating System) é um sistema pessoal de produtividade e gestão de vida desenvolvido e operado por <strong>Jean Lucas Rodrigues Silva</strong>. Para dúvidas relacionadas à privacidade, entre em contato pelo e-mail <a href="mailto:contato@jlmos.com.br" style={{ color: '#0ea5e9' }}>contato@jlmos.com.br</a>.</P>
          </Section>

          <Section title="2. Dados que coletamos">
            <P>Ao utilizar o MOS, coletamos as seguintes categorias de dados:</P>
            <ul style={{ color: 'var(--text)', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li><strong>Dados de cadastro:</strong> nome e endereço de e-mail fornecidos no momento do registro.</li>
              <li><strong>Dados financeiros:</strong> lançamentos, categorias, orçamentos e metas financeiras inseridos manualmente por você.</li>
              <li><strong>Dados bancários via Open Finance:</strong> quando você conecta uma conta bancária pelo recurso Pluggy, coletamos transações, saldos e informações da conta. Esses dados são obtidos com seu consentimento explícito e podem ser revogados a qualquer momento.</li>
              <li><strong>Dados de produtividade:</strong> tarefas, projetos, metas, hábitos, notas e eventos de agenda criados por você.</li>
              <li><strong>Dados de saúde e esportes:</strong> atividades físicas, treinos e métricas de desempenho inseridos manualmente.</li>
              <li><strong>Dados de acesso:</strong> data e hora de login, endereço IP e informações do dispositivo, coletados automaticamente para fins de segurança.</li>
              <li><strong>Senhas armazenadas no Cofre:</strong> senhas e chaves de API são criptografadas localmente com AES-256 antes de serem armazenadas. Não temos acesso ao conteúdo descriptografado.</li>
            </ul>
          </Section>

          <Section title="3. Como usamos seus dados">
            <P>Utilizamos seus dados exclusivamente para:</P>
            <ul style={{ color: 'var(--text)', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li>Fornecer e personalizar as funcionalidades do MOS;</li>
              <li>Garantir a segurança e integridade da sua conta;</li>
              <li>Gerar resumos e análises dentro do próprio app;</li>
              <li>Enviar comunicações relacionadas ao serviço (como confirmação de e-mail);</li>
              <li>Melhorar o produto com base em métricas agregadas e anônimas de uso.</li>
            </ul>
            <P>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais.</P>
          </Section>

          <Section title="4. Compartilhamento de dados">
            <P>Seus dados podem ser compartilhados apenas com os seguintes fornecedores de infraestrutura, estritamente para operação do serviço:</P>
            <ul style={{ color: 'var(--text)', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li><strong>Supabase:</strong> banco de dados, autenticação e armazenamento de arquivos (servidores nos EUA com adequação às normas de proteção de dados).</li>
              <li><strong>Vercel:</strong> hospedagem da aplicação web.</li>
              <li><strong>Pluggy:</strong> plataforma de Open Finance para conexão com contas bancárias, mediante seu consentimento expresso.</li>
            </ul>
          </Section>

          <Section title="5. Segurança">
            <P>Adotamos as seguintes medidas para proteger seus dados:</P>
            <ul style={{ color: 'var(--text)', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li>Transmissão via HTTPS com TLS;</li>
              <li>Autenticação segura com tokens JWT;</li>
              <li>Criptografia AES-256 para senhas armazenadas no Cofre;</li>
              <li>Políticas de segurança em nível de linha (RLS) no banco de dados, garantindo que cada usuário acesse apenas seus próprios dados;</li>
              <li>Cabeçalhos de segurança HTTP configurados no servidor.</li>
            </ul>
          </Section>

          <Section title="6. Seus direitos (LGPD)">
            <P>Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</P>
            <ul style={{ color: 'var(--text)', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li>Confirmar a existência de tratamento dos seus dados;</li>
              <li>Acessar seus dados;</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação dos seus dados;</li>
              <li>Revogar o consentimento para o tratamento de dados bancários via Open Finance;</li>
              <li>Solicitar a portabilidade dos seus dados;</li>
              <li>Solicitar a exclusão completa da sua conta e dados.</li>
            </ul>
            <P>Para exercer qualquer um desses direitos, entre em contato pelo e-mail <a href="mailto:contato@jlmos.com.br" style={{ color: '#0ea5e9' }}>contato@jlmos.com.br</a>. Responderemos em até 15 dias úteis.</P>
          </Section>

          <Section title="7. Retenção de dados">
            <P>Seus dados são mantidos enquanto sua conta estiver ativa. Após a exclusão da conta, os dados são removidos permanentemente em até 30 dias, exceto quando a retenção for exigida por obrigação legal.</P>
          </Section>

          <Section title="8. Cookies e rastreamento">
            <P>O MOS utiliza apenas cookies essenciais para autenticação e funcionamento do app. Não utilizamos cookies de rastreamento, publicidade ou análise comportamental de terceiros.</P>
          </Section>

          <Section title="9. Alterações nesta política">
            <P>Podemos atualizar esta política periodicamente. Quando houver alterações relevantes, notificaremos você por e-mail ou por aviso dentro do app. O uso continuado do MOS após as alterações implica aceitação da nova política.</P>
          </Section>

          <Section title="10. Contato">
            <P>Para dúvidas, solicitações ou reclamações relacionadas à privacidade: <a href="mailto:contato@jlmos.com.br" style={{ color: '#0ea5e9' }}>contato@jlmos.com.br</a></P>
          </Section>

        </div>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', gap: 16, fontSize: 13, color: 'var(--text3)' }}>
          <Link to="/termos" style={{ color: 'var(--text3)' }}>Termos de Uso</Link>
          <Link to="/login" style={{ color: 'var(--text3)' }}>Voltar ao login</Link>
        </div>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--text)', margin: 0 }}>{children}</p>
}
