<script setup>
import { ref, computed } from 'vue'

const telaAtual = ref('chat')

const buscaUsuario = ref('')
const buscaNovosUsuarios = ref('')
const ordenacao = ref('mais-recente')
const textoMensagem = ref('')

const conversas = ref([
  {
    id: 1,
    nome: 'Nome usuário',
    ultimaMsg: 'Escrevendo...',
    tempo: 'Há 2 minutos',
    online: true,
    escrevendo: true,
    seguidores: '45.659',
    seguindoQtd: '12.234',
    dataCriacao: '00/00/0000',
    localizacao: 'nenhuma localização foi adicionada.',
    biografia: '',
    tags: ['#souIFC'],
    mensagens: [
      { id: 1, tipo: 'texto', enviadaPorMim: false, conteudo: 'Ok..' },
      { id: 2, tipo: 'imagem', enviadaPorMim: false, url: '' },
      { id: 3, tipo: 'divisor', conteudo: 'Hoje' },
      { id: 4, tipo: 'texto', enviadaPorMim: false, conteudo: 'Mensagem sistem.' },
      { id: 5, tipo: 'texto', enviadaPorMim: false, conteudo: 'Mensagem...' },
      { id: 6, tipo: 'texto', enviadaPorMim: true, conteudo: 'Mensagem do usuário que está sendo bem colocada tal que serve para apenas preencher aqui' },
      { id: 7, tipo: 'texto', enviadaPorMim: true, conteudo: 'Avisos...' },
      { id: 8, tipo: 'digitando', enviadaPorMim: false }
    ]
  },
  {
    id: 2,
    nome: 'Nome usuário',
    ultimaMsg: 'Mensagem',
    tempo: '00/00/0000',
    online: false,
    seguidores: '1.200',
    seguindoQtd: '340',
    dataCriacao: '12/05/2024',
    localizacao: 'Joinville, SC',
    biografia: 'Estudante de Informática',
    tags: ['#IFChat', '#Dev'],
    mensagens: []
  }
])

const novosUsuarios = ref([
  { id: 101, nome: 'Nome usuário', status: 'Offline', seguidores: '345.342.234', postagensQtd: 15, dataRegistro: 3, seguindo: false },
  { id: 102, nome: 'Nome usuário', status: 'Offline', seguidores: '120.000', postagensQtd: 42, dataRegistro: 1, seguindo: false },
  { id: 103, nome: 'Nome usuário', status: 'Offline', seguidores: '500.000', postagensQtd: 5, dataRegistro: 2, seguindo: false }
])

const conversaAtiva = ref(conversas.value[0])

const conversasFiltradas = computed(() => {
  return conversas.value.filter(c => 
    c.nome.toLowerCase().includes(buscaUsuario.value.toLowerCase())
  )
})

const novosUsuariosFiltrados = computed(() => {
  let lista = novosUsuarios.value.filter(u => 
    u.nome.toLowerCase().includes(buscaNovosUsuarios.value.toLowerCase())
  )

  if (ordenacao.value === 'mais-seguido') {
    return lista.sort((a, b) => b.seguidores.localeCompare(a.seguidores))
  } else if (ordenacao.value === 'mais-postagens') {
    return lista.sort((a, b) => b.postagensQtd - a.postagensQtd)
  } else {
    return lista.sort((a, b) => a.dataRegistro - b.dataRegistro)
  }
})

// Funções
function navegarPara(tela) {
  telaAtual.value = tela
}

function selecionarConversa(conversa) {
  conversaAtiva.value = conversa
}

function alternarSeguir(usuario) {
  usuario.seguindo = !usuario.seguindo
}

function enviarMensagem() {
  const texto = textoMensagem.value.trim()
  if (!texto || !conversaAtiva.value) return

  conversaAtiva.value.mensagens.push({
    id: Date.now(),
    tipo: 'texto',
    enviadaPorMim: true,
    conteudo: texto
  })

  conversaAtiva.value.ultimaMsg = texto
  textoMensagem.value = ''
}
</script>

<template>
  <main class="fundo">

    <div v-if="telaAtual === 'chat'" class="chat-container">

      <div class="column-card left-column">
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
              v-for="item in conversasFiltradas" 
              :key="item.id"
              :class="['conversation-item', { active: conversaAtiva?.id === item.id }]"
              @click="selecionarConversa(item)"
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

          <button class="find-users-btn" @click="navegarPara('encontrar')">
            Encontre outros usuários
          </button>
        </div>
      </div>

      <div class="column-card right-column">
        <header class="card-header header-with-action">
          <h1>{{ conversaAtiva ? conversaAtiva.nome : 'Selecione uma conversa' }}</h1>
          <button 
            v-if="conversaAtiva" 
            class="settings-btn" 
            title="Ver Perfil do Usuário"
            @click="navegarPara('perfil')"
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
              @keyup.enter="enviarMensagem"
            />
            <button class="send-btn" @click="enviarMensagem" type="button">➤</button>
          </footer>
        </div>

        <div v-else class="empty-chat-state">
          Selecione uma conversa para começar.
        </div>
      </div>

    </div>

    <div v-else-if="telaAtual === 'encontrar'" class="find-container">
      
      <div class="top-search-area">
        <button class="back-btn" @click="navegarPara('chat')" title="Voltar ao Chat">← Voltar</button>
        <div class="search-box large-search">
          <input type="text" v-model="buscaNovosUsuarios" placeholder="Procurar por usuário" />
          <span class="search-icon">🔍︎</span>
        </div>
      </div>

      <div class="find-main-content">
        <div class="users-card-container">
          <div class="users-scroll">
            <div 
              v-for="user in novosUsuariosFiltrados" 
              :key="user.id" 
              class="user-row-card"
            >
              <div class="user-row-left">
                <div class="avatar-icon">👤</div>
                <div class="user-details">
                  <strong>{{ user.nome }}</strong>
                  <span class="user-status-text">● {{ user.status }}</span>
                  <span class="followers-count">{{ user.seguidores }} seguidores</span>
                </div>
              </div>

              <button 
                :class="['follow-btn', { following: user.seguindo }]" 
                @click="alternarSeguir(user)"
              >
                {{ user.seguindo ? 'Seguindo' : 'Seguir' }}
              </button>
            </div>
          </div>
        </div>

        <div class="order-by-box">
          <select v-model="ordenacao">
            <option value="mais-recente">Mais recente</option>
            <option value="mais-seguido">Mais seguido</option>
            <option value="mais-postagens">Com mais postagens</option>
          </select>
        </div>
      </div>

    </div>

    <div v-else-if="telaAtual === 'perfil'" class="profile-container">
      <button class="back-icon-btn" @click="navegarPara('chat')" title="Voltar">
        ↶
      </button>

      <div class="profile-card">
        <div class="profile-scroll">
          
          <div class="profile-banner"></div>

          <div class="profile-header">
            <div class="profile-avatar-wrapper">
              <div class="profile-avatar">👤</div>
            </div>

            <div class="profile-title-area">
              <h2>{{ conversaAtiva?.nome || 'Nome usuário' }}</h2>
              <div class="profile-status">
                <span :class="['status-dot', conversaAtiva?.online ? 'online' : 'offline']">●</span>
                <span>{{ conversaAtiva?.online ? 'Online' : 'Offline' }}</span>
              </div>
              <p class="profile-stats">
                {{ conversaAtiva?.seguidores || '45.659' }} seguidores | {{ conversaAtiva?.seguindoQtd || '12.234' }} seguindo
              </p>
            </div>
          </div>

          <div class="profile-actions-row">
            <button class="btn-grey">Seguindo</button>
            <button class="btn-circle-icon">🔔</button>
            <button class="btn-green-chat" @click="navegarPara('chat')">Chat</button>
            <span class="heart-icon"></span>
          </div>

          <div class="profile-meta-info">
            <p><strong> Data de criação:</strong> {{ conversaAtiva?.dataCriacao || '00/00/0000' }}</p>
            <p><strong> Localização:</strong> {{ conversaAtiva?.localizacao || 'nenhuma localização foi adicionada.' }}</p>
          </div>

          <div class="profile-section">
            <h3>Biografia</h3>
            <div class="empty-box bio-box">
              <span class="empty-icon"></span>
              <p>{{ conversaAtiva?.biografia || 'Não há nada escrito ainda' }}</p>
            </div>
          </div>

          <div class="profile-section">
            <h3>Tags</h3>
            <div class="tags-row">
              <span v-for="(tag, index) in (conversaAtiva?.tags || ['#souIFC'])" :key="index" class="tag-badge">
                {{ tag }}
              </span>
            </div>
          </div>

          <div class="profile-section">
            <h3>Postagens</h3>
            <div class="empty-box posts-box">
              <span class="empty-icon"></span>
              <p>Ainda não há nenhuma postagem</p>
            </div>
          </div>

        </div>
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

.find-container {
  width: 100%;
  max-width: 950px;
  height: 88vh;
  margin: 0 auto;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.top-search-area {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
}

.back-btn {
  position: absolute;
  left: 0;
  background: #ffffff;
  border: 1px solid #000000;
  border-radius: 16px;
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
}

.large-search {
  width: 380px;
}

.find-main-content {
  display: flex;
  justify-content: center;
  gap: 30px;
  height: calc(100% - 60px);
  position: relative;
}

.users-card-container {
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 4px;
  width: 420px;
  height: 100%;
  box-sizing: border-box;
  padding: 16px;
}

.users-scroll {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
}

.user-row-card {
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-row-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.user-details strong {
  font-size: 0.9rem;
  color: #000000;
}

.user-status-text {
  font-size: 0.68rem;
  color: #aaaaaa;
}

.followers-count {
  font-size: 0.68rem;
  color: #999999;
}

.follow-btn {
  background-color: #33cc00;
  color: #ffffff;
  border: 1px solid #000000;
  border-radius: 20px;
  padding: 6px 22px;
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
}

.follow-btn.following {
  background-color: #e0e0e0;
  color: #333333;
}

.order-by-box {
  position: absolute;
  right: 20px;
  top: 0;
}

.order-by-box select {
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.88rem;
  font-weight: bold;
  cursor: pointer;
  outline: none;
}

.profile-container {
  width: 100%;
  max-width: 580px;
  height: 88vh;
  margin: 0 auto;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 16px;
}

.back-icon-btn {
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 6px;
  width: 38px;
  height: 38px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-card {
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 4px;
  flex: 1;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.profile-scroll {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-banner {
  background-color: #a0ff80;
  height: 120px;
  border-radius: 4px;
}

.profile-header {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  margin-top: -45px;
  padding-left: 10px;
}

.profile-avatar-wrapper {
  background: #ffffff;
  border-radius: 50%;
  padding: 4px;
}

.profile-avatar {
  width: 70px;
  height: 70px;
  border: 2px solid #000000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  background-color: #ffffff;
}

.profile-title-area h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: bold;
}

.profile-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #777777;
}

.profile-stats {
  margin: 4px 0 0 0;
  font-size: 0.72rem;
  color: #888888;
}

.profile-actions-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 10px;
}

.btn-grey {
  background-color: #d9d9d9;
  border: none;
  border-radius: 16px;
  padding: 6px 20px;
  font-size: 0.82rem;
  font-weight: bold;
  color: #ffffff;
}

.btn-circle-icon {
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

.btn-green-chat {
  background-color: #33cc00;
  color: #ffffff;
  border: none;
  border-radius: 16px;
  padding: 6px 24px;
  font-size: 0.82rem;
  font-weight: bold;
  cursor: pointer;
}

.heart-icon {
  font-size: 1.4rem;
  margin-left: auto;
}

.profile-meta-info {
  font-size: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 10px;
  color: #333333;
}

.profile-meta-info p {
  margin: 0;
}

.profile-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 10px;
}

.profile-section h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: bold;
  color: #000000;
}

.empty-box {
  border: 1px solid #777777;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #888888;
  font-size: 0.82rem;
}

.bio-box {
  height: 100px;
}

.posts-box {
  height: 120px;
}

.empty-icon {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.tags-row {
  display: flex;
  gap: 8px;
}

.tag-badge {
  background-color: #eeeeee;
  border: 1px solid #cccccc;
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 0.72rem;
  font-weight: bold;
  color: #333333;
}
</style>