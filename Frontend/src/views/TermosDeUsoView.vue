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
          <h1>Termos de Uso</h1>
        </div>
        <span class="sub-title">IFCHAT</span>
      </header>

      <div class="scroll-content">
        
        <p class="last-updated"> <strong>Última atualização:</strong> 11 de agosto de 2026</p>

        <p class="intro-text">
          Bem-vindo ao <strong>IFchat</strong>. Estes Termos de Uso ("Termos") regem o uso do nosso site localizado em 
          <a href="https://hackaton-equipe6-2info1-4ot6.vercel.app/" target="_blank" rel="noopener">https://hackaton-equipe6-2info1-4ot6.vercel.app/</a> (o "Serviço") operado por <strong>Equipe6-2info1</strong>.
        </p>

        <hr class="divider" />

        <section class="policy-section">
          <h2> Aceitação dos Termos</h2>
          <p>
            Ao acessar e usar este site, você aceita e concorda em cumprir os termos e condições deste acordo. Se você não concordar com qualquer parte destes termos, não deve usar nosso Serviço.
          </p>
        </section>

        <section class="policy-section">
          <h2> Uso Permitido</h2>
          <p>Você pode usar nosso site para:</p>
          <ul>
            <li>Visualizar e navegar pelo conteúdo;</li>
            <li>Acessar informações públicas;</li>
            <li>Interagir com recursos disponíveis;</li>
            <li>Entrar em contato conosco através dos meios fornecidos.</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2> Uso Proibido</h2>
          <p>Você concorda em <strong>NÃO</strong> usar o site para:</p>
          <ul>
            <li>Violar qualquer lei local, estadual, nacional ou internacional;</li>
            <li>Transmitir material que seja difamatório, ofensivo ou inadequado;</li>
            <li>Tentar obter acesso não autorizado ao site ou sistemas relacionados;</li>
            <li>Interferir ou interromper o site ou servidores conectados;</li>
            <li>Coletar informações sobre outros usuários.</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2> Propriedade Intelectual</h2>
          <p>
            O conteúdo deste site, incluindo textos, gráficos, logotipos, imagens, clipes de áudio, downloads digitais e compilações de dados, é propriedade de <strong>Equipe6-2info1</strong> e está protegido por leis de direitos autorais.
          </p>
        </section>

        <section class="policy-section">
          <h2> Limitação de Responsabilidade</h2>
          <p>
            Em nenhuma circunstância Equipe6-2info1 será responsável por quaisquer danos diretos, indiretos, incidentais, especiais, consequenciais ou punitivos resultantes do uso ou incapacidade de usar o Serviço.
          </p>
        </section>

        <section class="policy-section">
          <h2> Modificações dos Termos</h2>
          <p>
            Reservamo-nos o direito, a nosso critério exclusivo, de modificar ou substituir estes Termos a qualquer momento. Se uma revisão for material, tentaremos fornecer pelo menos 30 dias de aviso antes de quaisquer novos termos entrarem em vigor.
          </p>
        </section>

        <section class="policy-section">
          <h2> Rescisão</h2>
          <p>
            Podemos encerrar ou suspender seu acesso imediatamente, sem aviso prévio ou responsabilidade, por qualquer motivo, incluindo, sem limitação, se você violar os Termos.
          </p>
        </section>

        <section class="policy-section">
          <h2> Lei Aplicável</h2>
          <p>
            Estes Termos serão interpretados e regidos de acordo com as leis do Brasil, sem levar em conta suas disposições sobre conflito de leis.
          </p>
        </section>

        <section class="policy-section contact-box">
          <h2> Contato</h2>
          <p>Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco:</p>
          <ul>
            <li><strong>E-mail:</strong> <a href="mailto:ifchat@gmail.com">ifchat@gmail.com</a></li>
            <li><strong>Site:</strong> <a href="https://hackaton-equipe6-2info1-4ot6.vercel.app/" target="_blank" rel="noopener">Acessar plataforma</a></li>
          </ul>
        </section>

        <p class="effective-date"><em>Estes termos são efetivos a partir de 11 de agosto de 2026.</em></p>

      </div>
    </div>
  </main>
</template>

<style scoped>
/* MAIN INTACTO */
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

/* Card Principal */
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