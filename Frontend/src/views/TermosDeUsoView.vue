<script setup>
import { useRouter } from 'vue-router'
import PolicySection from '../components/PolicySection.vue'
import { termsData } from '../data/termsData.js'

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

        <p class="last-updated">
          <strong>Última atualização:</strong> {{ termsData.lastUpdated }}
        </p>

        <p class="intro-text">
          Bem-vindo ao <strong>IFchat</strong>. Estes Termos de Uso ("Termos") regem o uso do nosso site localizado em
          <a :href="termsData.url" target="_blank" rel="noopener">{{ termsData.url }}</a> (o "Serviço") operado por <strong>{{ termsData.team }}</strong>.
        </p>

        <hr class="divider" />

        <PolicySection
          v-for="(section, index) in termsData.sections"
          :key="index"
          :title="section.title"
          :content="section.content"
          :items="section.items"
        />

        <PolicySection
          title="Contato"
          content="Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco:"
          :items="[
            `<strong>E-mail:</strong> <a href='mailto:${termsData.email}'>${termsData.email}</a>`,
            `<strong>Site:</strong> <a href='${termsData.url}' target='_blank' rel='noopener'>Acessar plataforma</a>`
          ]"
          :is-contact="true"
        />

        <p class="effective-date">
          <em>Estes termos são efetivos a partir de {{ termsData.lastUpdated }}.</em>
        </p>

      </div>
    </div>
  </main>
</template>

<style scoped>
main {
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
  background-color: var(--fundo-card);
  border: var(--borda-padrao);
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
  border-bottom: var(--borda-padrao);
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
  color: var(--texto-principal);
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
  color: var(--texto-principal);
}

.sub-title {
  font-size: 0.85rem;
  font-weight: bold;
  color: #fff;
  background-color: var(--fundo-card-va);
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
  color: var(--texto-suave);
  margin: 0;
  background-color: var(--hover-botoes);
  padding: 8px 12px;
  border-radius: 4px;
}

.intro-text {
  font-size: 0.88rem;
  line-height: 1.5;
  color: var(--texto-suave);
  margin: 0;
}

.intro-text a {
  color: var(--texto-principal);
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
  color: var(--texto-suave);
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
