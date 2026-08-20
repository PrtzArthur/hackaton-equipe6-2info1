<script setup>
import { ref, onMounted } from 'vue'

const notificacoes = ref([]);
const meuIdLogado = ref(localStorage.getItem('ifchat_user_id') || '');

async function carregarNotificacoes() {
  if (!meuIdLogado.value) return

  try {
    const resposta = await fetch(`http://localhost:3000/api/usuario/notificacoes/${meuIdLogado.value}`)

    if (resposta.ok) {
      notificacoes.value = await resposta.json()
    }
  } catch (erro) {
    console.error("Erro ao carregar avisos do servidor:", erro)
  }
}
onMounted(() => {
  carregarNotificacoes()
})
</script>

<template>
  <main>
    <section class="notifications-card">
      <header class="notifications-header">
        <h2>Notificações</h2>
      </header>
      <div class="notifications-body">
        <p v-if="notificacoes.length === 0" class="empty-text">
          Nenhuma notificação por enquanto.
        </p>
        <div v-else class="notifications-list-container">
          <div v-for="item in notificacoes" :key="item.id" class="card-notificacao-item">
          <div class="notificacao-icone-container">
            <img :src="item.autor_foto || '/src/icons/userBlackFull.svg'" alt="Avatar" class="avatar-notificacao-autor">
          </div>
          <div class="notificacao-conteudo-bloco">
            <p class="notificacao-texto-usuario">
              <strong>{{ item.autor_nome }}</strong>
              <span class="handle-mini">@{{ item.autor_username }}</span> publicou um novo post:
            </p>
            <p class="notificacao-texto-conteudo-post">"{{ item.post_conteudo }}"</p>
            <span class="notificacao-data-legenda">
              {{ new Date(item.data_notificacao).toLocaleDateString('pt-BR') }} às
              {{ new Date(item.data_notificacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }}
            </span>
          </div>
          <div class="marcador-novidade-linha"></div>
        </div>
        </div>
      </div>
    </section>
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
  overflow-x: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}
.avatar-notificacao-autor {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #cbd5e1;
}
.notificacao-texto-usuario {
  margin: 0;
  font-size: 0.95rem;
  color: #1e293b;
}
.handle-mini {
  color: #64748b;
  font-size: 0.85rem;
}
.notificacao-texto-conteudo-post {
  margin: 4px 0 0 0;
  font-size: 0.9rem;
  color: #475569;
  font-style: italic;
  background-color: #f8fafc;
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 2px solid #cbd5e1;
  overflow-wrap: break-word;
  max-width: 31.6vw;
}
.notifications-card {
  background-color: #fff;
  position: fixed;
  width: 40%;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translate(-50%);
  margin-top: 4vw;
  margin-bottom: 3vw;
  border-radius: 9px;
  border: 1px solid #000;
  scrollbar-color: #ccc transparent;
  overflow-y: auto;
  scrollbar-width: thin;
  padding: 2px;
}
.notifications-header {
  padding: 16px;
  border-bottom: 1px solid #000000;
}
.notifications-list-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
}
.card-notificacao-item {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}
.card-notificacao-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: #cbd5e1;
}
.notificacao-icone-container {
  background-color: rgba(85, 255, 51, 0.12);
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}
.emoji-alerta-sino {
  font-size: 1.3rem;
}
.notificacao-conteudo-bloco {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-grow: 1;
  overflow-wrap: break-word;
}
.notificacao-texto-titulo {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.4;
}
.notificacao-data-legenda {
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 400;
}
.marcador-novidade-linha {
  position: absolute;
  left: 0;
  top: 0%;
  bottom: 0%;
  width: 4px;
  background-color: #3CBC00;
  border-radius: 0 4px 4px 0;
}
.notifications-header h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: bold;
  color: #000000;
}
.notifications-body {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
  box-sizing: border-box;
  overflow-wrap: break-word;
}
.empty-text {
  color: #666666;
  font-size: 0.9rem;
}
.notifications-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>
