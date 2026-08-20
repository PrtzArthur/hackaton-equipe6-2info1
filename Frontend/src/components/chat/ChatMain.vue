<script setup>
import { ref } from 'vue'

const props = defineProps({
  conversas: Array,
  conversaAtiva: Object
})

const emit = defineEmits(['selecionar-conversa', 'navegar', 'enviar-mensagem'])

const buscaUsuario = ref('')
const textoMensagem = ref('')

const mostrarChatMobile = ref(false)

function selecionarECarregar(item) {
  emit('selecionar-conversa', item)
  mostrarChatMobile.value = true
}

function voltarParaLista() {
  mostrarChatMobile.value = false
}

function handleEnviar() {
  if (!textoMensagem.value.trim()) return
  emit('enviar-mensagem', textoMensagem.value)
  textoMensagem.value = ''
}
</script>

<template>
  <div class="chat-container">
    <div :class="['column-card', 'left-column', { 'hide-mobile': mostrarChatMobile }]">
      <header class="card-header">
        <h1>Lista de conversas</h1>
      </header>

      <div class="scroll-content list-content">
        <div class="search-box">
          <input type="text" v-model="buscaUsuario" placeholder="Procurar por usuário" />
          <span class="search-icon">🔍︎</span>
        </div>

        <div class="conversations-wrapper">
          <div 
            v-for="item in conversas.filter(c => c.nome.toLowerCase().includes(buscaUsuario.toLowerCase()))" 
            :key="item.id"
            :class="['conversation-item', { active: conversaAtiva?.id === item.id }]"
            @click="selecionarECarregar(item)"
          >
            <div class="avatar-icon">👤</div>
            
            <div class="conversation-info">
              <div class="user-top-row">
                <strong>{{ item.nome }}</strong>
                <span class="time-text">{{ item.tempo }}</span>
              </div>

              <div class="user-bottom-row">
                <span :class="['last-msg', { italic: item.escrevendo }]">
                  {{ item.ultimaMsg }}
                </span>
                <span :class="['status-dot', item.online ? 'online' : 'offline']">
                  ● {{ item.online ? 'Online' : 'Offline' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <button class="find-users-btn" @click="emit('navegar', 'encontrar')">
          Encontre outros usuários
        </button>
      </div>
    </div>

    <div :class="['column-card', 'right-column', { 'show-mobile': mostrarChatMobile }]">
      <header class="card-header header-with-action">
        <div class="header-left">
          <button class="back-chat-mobile" @click="voltarParaLista" title="Voltar à lista">←</button>
          <h1>{{ conversaAtiva ? conversaAtiva.nome : 'Selecione uma conversa' }}</h1>
        </div>
        <button 
          v-if="conversaAtiva" 
          class="settings-btn" 
          title="Ver Perfil do Usuário"
          @click="emit('navegar', 'perfil')"
        >
          ⚙
        </button>
      </header>

      <div class="scroll-content chat-content" v-if="conversaAtiva">
        <div class="messages-wrapper">
          <template v-for="msg in conversaAtiva.mensagens" :key="msg.id">
            <div 
              v-if="msg.tipo === 'texto'" 
              :class="['message-bubble', msg.enviadaPorMim ? 'sent' : 'received']"
            >
              {{ msg.conteudo }}
            </div>

            <div 
              v-else-if="msg.tipo === 'imagem'" 
              :class="['message-image-box', msg.enviadaPorMim ? 'sent' : 'received']"
            >
              <div class="placeholder-image"></div>
            </div>

            <div v-else-if="msg.tipo === 'divisor'" class="date-divider">
              <span>{{ msg.conteudo }}</span>
            </div>

            <div v-else-if="msg.tipo === 'digitando'" class="message-bubble received typing-bubble">
              •••
            </div>
          </template>
        </div>

        <footer class="chat-input-area">
          <button class="icon-btn emoji-btn" type="button">😃</button>
          <input 
            type="text" 
            v-model="textoMensagem" 
            placeholder="Escreva seu texto" 
            @keyup.enter="handleEnviar"
          />
          <button class="send-btn" @click="handleEnviar" type="button">➤</button>
        </footer>
      </div>

      <div v-else class="empty-chat-state">
        Selecione uma conversa para começar.
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  gap: 20px;
  width: 100%;
  max-width: 950px;
  height: 85vh;
  margin: 0 auto;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
}

.column-card {
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}

.left-column {
  flex: 0 0 320px;
  position: relative;
}

.right-column {
  flex: 1;
}

.card-header {
  padding: 14px 18px;
  border-bottom: 1px solid #000000;
}

.card-header h1 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: bold;
  color: #000000;
}

.header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-chat-mobile {
  display: none;
  background: none;
  border: none;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
}

.settings-btn {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #000000;
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-content {
  position: relative;
  padding-bottom: 60px;
}

.search-box {
  display: flex;
  align-items: center;
  border: 1px solid #000000;
  border-radius: 20px;
  padding: 6px 14px;
  background: #ffffff;
}

.search-box input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 0.82rem;
  color: #555555;
}

.search-icon {
  font-size: 0.85rem;
  color: #000000;
}

.conversations-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.conversation-item {
  border: 1px solid #888888;
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  background-color: #ffffff;
}

.conversation-item.active {
  border: 2px solid #55ff33;
}

.avatar-icon {
  font-size: 1.8rem;
  line-height: 1;
}

.conversation-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-top-row, .user-bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-top-row strong {
  font-size: 0.88rem;
  color: #000000;
}

.time-text {
  font-size: 0.65rem;
  color: #888888;
}

.last-msg {
  font-size: 0.72rem;
  color: #666666;
}

.last-msg.italic {
  font-style: italic;
  color: #888888;
}

.status-dot {
  font-size: 0.65rem;
}

.status-dot.online {
  color: #33cc00;
}

.status-dot.offline {
  color: #aaaaaa;
}

.find-users-btn {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #33cc00;
  color: #ffffff;
  border: 1px solid #000000;
  border-radius: 20px;
  padding: 8px 18px;
  font-size: 0.82rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  white-space: nowrap;
  z-index: 10;
}

.chat-content {
  justify-content: space-between;
  padding: 16px;
}

.messages-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding-right: 4px;
}

.message-bubble {
  max-width: 75%;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 0.82rem;
  line-height: 1.35;
  word-wrap: break-word;
}

.message-bubble.received {
  align-self: flex-start;
  background-color: #808080;
  color: #ffffff;
}

.message-bubble.sent {
  align-self: flex-end;
  background-color: #33cc00;
  color: #ffffff;
}

.message-image-box {
  width: 180px;
  height: 140px;
  border: 3px solid #808080;
  border-radius: 16px;
  overflow: hidden;
  background-color: #a0ff80;
}

.message-image-box.received {
  align-self: flex-start;
}

.message-image-box.sent {
  align-self: flex-end;
}

.placeholder-image {
  width: 100%;
  height: 100%;
  background-color: #a0ff80;
}

.date-divider {
  display: flex;
  justify-content: center;
  margin: 6px 0;
}

.date-divider span {
  border: 1px solid #000000;
  border-radius: 14px;
  padding: 2px 16px;
  font-size: 0.75rem;
  font-weight: bold;
  background-color: #ffffff;
}

.typing-bubble {
  letter-spacing: 2px;
  font-size: 0.9rem;
  padding: 4px 12px;
}

.chat-input-area {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.chat-input-area input {
  flex: 1;
  border: 1px solid #000000;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 0.85rem;
  outline: none;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
}

.send-btn {
  background-color: #33cc00;
  color: #ffffff;
  border: 1px solid #000000;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.9rem;
}

.empty-chat-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #777777;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .chat-container {
    height: 90vh;
  }

  .left-column {
    flex: 1;
    width: 100%;
  }

  .right-column {
    display: none;
    width: 100%;
  }

  .left-column.hide-mobile {
    display: none;
  }

  .right-column.show-mobile {
    display: flex;
  }

  .back-chat-mobile {
    display: block;
  }
}
</style>