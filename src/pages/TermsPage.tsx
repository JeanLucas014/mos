import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e5e5e5', fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>

        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b7280', textDecoration: 'none', fontSize: 14, marginBottom: 40 }}>
          <ArrowLeft size={15} /> Voltar
        </Link>

        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <img src="/logo.png" alt="MOS" style={{ height: 32 }} />
          </div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
            Termos de Uso
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            Última atualização: julho de 2026
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          <Section title="1. Aceitação dos termos">
            <P>Ao criar uma conta e utilizar o MOS (My Operating System), você concorda com estes Termos de Uso. Se não concordar com qualquer parte destes termos, não utilize o serviço.</P>
          </Section>

          <Section title="2. Descrição do serviço">
            <P>O MOS é um sistema pessoal de produtividade e gestão de vida que oferece ferramentas para organização de finanças, tarefas, agenda, hábitos, metas, estudos, esportes e armazenamento seguro de senhas. O serviço é fornecido por Jean Lucas Rodrigues Silva.</P>
            <P>O MOS é uma plataforma em desenvolvimento ativo. Funcionalidades podem ser adicionadas, modificadas ou removidas ao longo do tempo.</P>
          </Section>

          <Section title="3. Cadastro e conta">
            <P>Para utilizar o MOS você deve:</P>
            <ul style={{ color: '#d4d4d4', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li>Ter pelo menos 18 anos ou a maioridade legal aplicável em seu país;</li>
              <li>Fornecer um endereço de e-mail válido e confirmar sua conta;</li>
              <li>Manter a confidencialidade de suas credenciais de acesso;</li>
              <li>Ser responsável por toda atividade realizada em sua conta.</li>
            </ul>
            <P>Você pode criar apenas uma conta por pessoa. Contas duplicadas ou criadas para fins fraudulentos serão encerradas.</P>
          </Section>

          <Section title="4. Uso adequado">
            <P>Você concorda em usar o MOS apenas para fins pessoais e lícitos. É vedado:</P>
            <ul style={{ color: '#d4d4d4', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li>Utilizar o serviço para atividades ilegais ou fraudulentas;</li>
              <li>Tentar acessar dados de outros usuários;</li>
              <li>Realizar engenharia reversa, descompilar ou copiar o código-fonte do MOS;</li>
              <li>Sobrecarregar intencionalmente a infraestrutura do serviço;</li>
              <li>Compartilhar suas credenciais de acesso com terceiros;</li>
              <li>Utilizar bots ou scripts automatizados para interagir com o serviço sem autorização.</li>
            </ul>
          </Section>

          <Section title="5. Dados e privacidade">
            <P>O tratamento dos seus dados pessoais é regido pela nossa <Link to="/privacidade" style={{ color: '#0ea5e9' }}>Política de Privacidade</Link>, que integra estes Termos de Uso. Ao aceitar estes termos, você também aceita nossa política de privacidade.</P>
            <P>Seus dados pertencem a você. O MOS não reivindica propriedade sobre nenhum conteúdo que você insere no sistema.</P>
          </Section>

          <Section title="6. Conexão bancária via Open Finance">
            <P>O MOS oferece integração com instituições financeiras por meio da plataforma Pluggy. Ao conectar uma conta bancária:</P>
            <ul style={{ color: '#d4d4d4', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li>Você autoriza expressamente o acesso às informações da conta selecionada;</li>
              <li>O acesso é de somente leitura — o MOS não realiza transações financeiras em seu nome;</li>
              <li>Você pode revogar essa autorização a qualquer momento nas configurações do app;</li>
              <li>A integração está sujeita também aos termos de uso da Pluggy.</li>
            </ul>
          </Section>

          <Section title="7. Disponibilidade do serviço">
            <P>O MOS é fornecido no estado em que se encontra, sem garantia de disponibilidade ininterrupta. Podemos realizar manutenções, atualizações ou suspender temporariamente o serviço sem aviso prévio, embora nos esforcemos para minimizar interrupções.</P>
            <P>Não nos responsabilizamos por perdas decorrentes de indisponibilidade temporária do serviço.</P>
          </Section>

          <Section title="8. Limitação de responsabilidade">
            <P>O MOS é uma ferramenta de organização pessoal e não substitui aconselhamento financeiro, médico ou jurídico profissional. As informações exibidas no app são baseadas nos dados que você mesmo inseriu.</P>
            <P>Na extensão máxima permitida pela lei brasileira, não nos responsabilizamos por danos indiretos, incidentais ou consequenciais decorrentes do uso ou impossibilidade de uso do serviço.</P>
          </Section>

          <Section title="9. Encerramento de conta">
            <P>Você pode encerrar sua conta a qualquer momento pelo e-mail <a href="mailto:contato@jlmos.com.br" style={{ color: '#0ea5e9' }}>contato@jlmos.com.br</a>. Após o encerramento, seus dados serão eliminados permanentemente em até 30 dias.</P>
            <P>Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos, sem necessidade de aviso prévio.</P>
          </Section>

          <Section title="10. Alterações nos termos">
            <P>Podemos atualizar estes termos periodicamente. Notificaremos sobre alterações relevantes por e-mail ou aviso no app. O uso continuado após as alterações implica aceitação dos novos termos.</P>
          </Section>

          <Section title="11. Lei aplicável">
            <P>Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de Belo Horizonte, Minas Gerais, para dirimir quaisquer controvérsias decorrentes deste instrumento.</P>
          </Section>

          <Section title="12. Contato">
            <P>Para dúvidas sobre estes termos: <a href="mailto:contato@jlmos.com.br" style={{ color: '#0ea5e9' }}>contato@jlmos.com.br</a></P>
          </Section>

        </div>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #1f1f1f', display: 'flex', gap: 16, fontSize: 13, color: '#6b7280' }}>
          <Link to="/privacidade" style={{ color: '#6b7280' }}>Política de Privacidade</Link>
          <Link to="/login" style={{ color: '#6b7280' }}>Voltar ao login</Link>
        </div>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, color: '#f5f5f5', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 15, lineHeight: 1.75, color: '#d4d4d4', margin: 0 }}>{children}</p>
}
