<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function voltar() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<template>
  <main>
    <div class="policy-card">
      
      <header class="policy-header">
        <div class="header-left">
          <button class="back-btn" @click="voltar" title="Voltar">
            ←
          </button>
          <h1>Política de Privacidade</h1>
        </div>
        <span class="sub-title">IFCHAT</span>
      </header>

      <div class="scroll-content">
        
        <p class="last-updated"> <strong>Última atualização:</strong> 11 de agosto de 2026</p>

        <p class="intro-text">
          Esta Política de Privacidade descreve como <strong>IFchat</strong> ("nós", "nosso" ou "nossos") coleta, usa e protege as informações quando você visita nosso site 
          <a href="https://hackaton-equipe6-2info1-4ot6.vercel.app/" target="_blank" rel="noopener">https://hackaton-equipe6-2info1-4ot6.vercel.app/</a> (o "Serviço") operado por <strong>Equipe6-2info1</strong>.
        </p>

        <hr class="divider" />

        <section class="policy-section">
          <h2> Informações que Coletamos</h2>
          <p>Coletamos informações que você nos fornece diretamente, como quando você:</p>
          <ul>
            <li>Preenche formulários em nosso site;</li>
            <li>Entra em contato conosco;</li>
            <li>Se inscreve em nossos serviços;</li>
            <li>Navega pelo nosso site.</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2> Tipos de Dados Coletados</h2>
          <ul>
            <li><strong>Dados Pessoais:</strong> nome, endereço de e-mail, telefone;</li>
            <li><strong>Dados de Uso:</strong> informações sobre como você usa nosso site;</li>
            <li><strong>Dados Técnicos:</strong> endereço IP, tipo de navegador, sistema operacional.</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2> Como Usamos suas Informações</h2>
          <p>Utilizamos as informações coletadas para:</p>
          <ul>
            <li>Fornecer e manter nosso Serviço;</li>
            <li>Notificá-lo sobre mudanças em nosso Serviço;</li>
            <li>Permitir que você participe de recursos interativos;</li>
            <li>Fornecer suporte ao cliente;</li>
            <li>Coletar análises ou informações valiosas para melhorar o Serviço.</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2> Uso de Cookies</h2>
          <p>
            Nosso site utiliza cookies para melhorar sua experiência. Cookies são pequenos arquivos de texto que são colocados no seu computador pelos sites que você visita.
          </p>
        </section>

        <section class="policy-section">
          <h2> Compartilhamento de Dados</h2>
          <p>
            Não vendemos, trocamos ou transferimos suas informações pessoais para terceiros sem seu consentimento, exceto quando necessário para fornecer nossos serviços ou quando exigido por lei.
          </p>
        </section>

        <section class="policy-section">
          <h2> Segurança dos Dados</h2>
          <p>
            Implementamos medidas de segurança adequadas para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
          </p>
        </section>

        <section class="policy-section">
          <h2> Seus Direitos (LGPD)</h2>
          <p>Você tem o direito de:</p>
          <ul>
            <li>Confirmar a existência de tratamento;</li>
            <li>Acessar os dados;</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>Anonimizar, bloquear ou eliminar dados desnecessários;</li>
            <li>Solicitar a portabilidade dos dados;</li>
            <li>Eliminar os dados pessoais tratados com o consentimento;</li>
            <li>Obter informações sobre o compartilhamento;</li>
            <li>Obter informações sobre a possibilidade de não fornecer consentimento;</li>
            <li>Revogar o consentimento.</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2> Retenção de Dados</h2>
          <p>
            Manteremos suas informações pessoais apenas pelo tempo necessário para os fins estabelecidos nesta Política de Privacidade.
          </p>
        </section>

        <section class="policy-section">
          <h2> Alterações nesta Política</h2>
          <p>
            Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você sobre quaisquer mudanças publicando a nova Política de Privacidade nesta página.
          </p>
        </section>

        <section class="policy-section contact-box">
          <h2> Contato</h2>
          <p>Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco:</p>
          <ul>
            <li><strong>E-mail:</strong> <a href="mailto:ifchatemail@gmail.com">ifchatemail@gmail.com</a></li>
            <li><strong>Site:</strong> <a href="https://hackaton-equipe6-2info1-4ot6.vercel.app/" target="_blank" rel="noopener">Acessar plataforma</a></li>
          </ul>
        </section>

        <p class="effective-date"><em>Esta política é efetiva a partir de 11 de agosto de 2026.</em></p>

      </div>
    </div>
  </main>
</template>

<style scoped>
main {
  background-color: rgba(85, 255, 51, 0.14);
  height: 100vh;
  flex-grow: 1;
  padding: 1.5vw;
  margin-left: 12vw;
  width: calc(100% - 12vw);
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  box-sizing: border-box;
  overflow: hidden;
  overflow-x: hidden;
}

.policy-card {
  width: 100%;
  max-width: 580px;
  height: 80vh;
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  margin: 0 auto;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
}

.policy-header {
  padding: 16px 20px;
  border-bottom: 1px solid #000000;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  font-weight: bold;
  color: #000000;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s ease;
}

.back-btn:hover {
  transform: translateX(-2px);
}

.policy-header h1 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: bold;
  color: #000000;
}

.sub-title {
  font-size: 0.85rem;
  font-weight: bold;
  color: #55ff33;
  background-color: #000000;
  padding: 2px 8px;
  border-radius: 4px;
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.last-updated {
  font-size: 0.85rem;
  color: #444444;
  margin: 0;
  background-color: #f5f5f5;
  padding: 8px 12px;
  border-radius: 4px;
}

.intro-text {
  font-size: 0.88rem;
  line-height: 1.5;
  color: #333333;
  margin: 0;
}

.intro-text a, .contact-box a {
  color: #000000;
  text-decoration: underline;
  word-break: break-all;
}

.divider {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 0;
}

.policy-section h2 {
  font-size: 1rem;
  font-weight: bold;
  margin: 0 0 8px 0;
  color: #000000;
}

.policy-section p {
  font-size: 0.88rem;
  color: #333333;
  line-height: 1.5;
  margin: 0 0 8px 0;
}

.policy-section ul {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.policy-section li {
  font-size: 0.85rem;
  color: #333333;
  line-height: 1.4;
}

.contact-box {
  background-color: #f9f9f9;
  border: 1px dashed #000000;
  padding: 12px;
  border-radius: 6px;
}

.effective-date {
  font-size: 0.8rem;
  color: #666666;
  text-align: center;
  margin-top: 8px;
}
</style>