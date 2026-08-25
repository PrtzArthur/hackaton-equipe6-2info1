<script setup>
import { useRouter } from 'vue-router'
import PolicySection from '../components/PolicySection.vue'
import { privacyData } from '../data/termsData.js'

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
          <h1>{{ privacyData.title }}</h1>
        </div>
        <span class="sub-title">IFCHAT</span>
      </header>

      <div class="scroll-content">
        
        <p class="last-updated">
          <strong>Última atualização:</strong> {{ privacyData.lastUpdated }}
        </p>

        <p class="intro-text">
          Esta Política de Privacidade descreve como <strong>IFchat</strong> ("nós", "nosso" ou "nossos") coleta, usa e protege as informações quando você visita nosso site 
          <a :href="privacyData.url" target="_blank" rel="noopener">{{ privacyData.url }}</a> (o "Serviço") operado por <strong>{{ privacyData.team }}</strong>.
        </p>

        <hr class="divider" />

        <PolicySection 
          v-for="(section, index) in privacyData.sections" 
          :key="index"
          :title="section.title"
          :content="section.content"
          :items="section.items"
        />

        <PolicySection 
          title="Contato"
          content="Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco:"
          :items="[
            `<strong>E-mail:</strong> <a href='mailto:${privacyData.email}'>${privacyData.email}</a>`,
            `<strong>Site:</strong> <a href='${privacyData.url}' target='_blank' rel='noopener'>Acessar plataforma</a>`
          ]"
          :is-contact="true"
        />

        <p class="effective-date">
          <em>Esta política é efetiva a partir de {{ privacyData.lastUpdated }}.</em>
        </p>

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

.intro-text a {
  color: #000000;
  text-decoration: underline;
  word-break: break-all;
}

.divider {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 0;
}

.effective-date {
  font-size: 0.8rem;
  color: #666666;
  text-align: center;
  margin-top: 8px;
}

@media (max-width: 768px) {
  main {
    margin-left: 0;
    width: 100%;
    padding: 12px;
  }

  .policy-card {
    height: 90vh;
    max-width: 100%;
  }

  .policy-header {
    padding: 12px 14px;
  }

  .policy-header h1 {
    font-size: 1.1rem;
  }

  .scroll-content {
    padding: 14px;
    gap: 12px;
  }
}
</style>