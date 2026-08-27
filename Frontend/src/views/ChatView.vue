<script setup>
import { ref, onMounted, nextTick, onUnmounted, computed } from 'vue';
import { io } from 'socket.io-client';
import iconeLupa from '@/icons/iconeLupa.svg';
import imagem from '@/icons/imagem.svg';
import voltar from '@/icons/voltar.svg';
import emoji from '@/icons/emoji.svg';
import enviar from '@/icons/enviar.svg';
import gear from '@/icons/gear.svg';

const socket = io(import.meta.env.VITE_API_URL);

const meuIdLogado = ref(localStorage.getItem('ifchat_user_id') || '');
const buscaUsuario = ref('');
const textoMensagem = ref('');
const conversaAtiva = ref(null);
const containerMensagens = ref(null);

const listaConversas = ref([]);
const historicoMensagens = ref([]);
const mostrarPainelEmojis = ref(false);
const inputGaleriaReferencia = ref(null);
const listaDeEmojisTotais = [
  '😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘',
  '😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣',
  '😥','😮','🤐','😯','😪','😫','😴','😌','😛','😜','😝','🤤','😒','😓',
  '😔','😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟','😤','😢','😭','😦',
  '😧','😨','😩','🤯','😬','😰','😱','😳','🤪','😵','😡','😠','🤬','😷',
  '🤒','🤕','🤢','🤮','🤧','😇','🤠','🤡','🤥','🤫','🤭','🧐','🤓','😈',
  '👿','👹','👺','💀','👻','👽','🤖','💩','😺','😸','😹','😻','😼','😽',
  '👋','👌','👍','👎','✊','👊','🤛','🤜','🤞','✌️','🤟','🤘','🤙','👈',
  '👉','👆','🖕','👇','☝️','👍','❤️','💔','💖','💗','💘','⚡','🔥','✨'
];

let timeoutDigitando = null;

async function rolarChatParaBaixo() {
  await nextTick();
  if (containerMensagens.value) {
    containerMensagens.value.scrollTop = containerMensagens.value.scrollHeight;
  }
}

function comprimirImagemParaBase64(arquivo, larguraMaxima = 500, qualidade = 0.6) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.readAsDataURL(arquivo);
    leitor.onload = (evento) => {
      const img = new Image();
      img.src = evento.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let largura = img.width;
        let altura = img.height;

        if (largura > larguraMaxima) {
          altura = Math.round((altura * larguraMaxima) / largura);
          largura = larguraMaxima;
        }

        canvas.width = largura;
        canvas.height = altura;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, largura, altura);

        const base64Comprimido = canvas.toDataURL('image/jpeg', qualidade);
        resolve(base64Comprimido);
      };
      img.onerror = (err) => reject(err);
    };
    leitor.onerror = (err) => reject(err);
  });
}

async function carregarListaConversas() {
  try {
    const r = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/conversas?meuId=${meuIdLogado.value}`);
    if (r.ok) {
      const dados = await r.json();
      listaConversas.value = dados.map(c => ({ ...c, digitando: false }));
    }
  } catch (e) { console.error("Erro ao listar chats", e); }
}
const conversasFiltradas = computed(() => {
  if (!buscaUsuario.value.trim()) {
    return listaConversas.value;
  }
  const termo = buscaUsuario.value.toLowerCase().trim();

  return listaConversas.value.filter(chat => {
    const nomeBate = chat.nome?.toLowerCase().includes(termo);
    const userBate = chat.username?.toLowerCase().includes(termo);

    return nomeBate || userBate;
  });
});
async function selecionarConversa(usuario) {
  conversaAtiva.value = usuario;
  mostrarPainelEmojis.value = false;
  try {
    const r = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/historico?meuId=${meuIdLogado.value}&amigoId=${usuario.id_usuario}`);
    if (r.ok) {
      const dadosMensagens = await r.json();
      historicoMensagens.value = dadosMensagens.map(msg => ({
        id_mensagem: msg.id_mensagem,
        id_remetente: msg.id_remetente,
        id_destinatario: msg.id_destinatario,
        texto: msg.texto || msg.conteudo_mensagem,
        data: msg.data || msg.data_mensagem
      }));
      rolarChatParaBaixo();
    }
  } catch (e) { console.error("Erro ao carregar histórico", e); }
}

function enviarMensagem() {
  if (!textoMensagem.value.trim() || !conversaAtiva.value) return;

  socket.emit('enviar_mensagem_privada', {
    id_remetente: meuIdLogado.value,
    id_destinatario: conversaAtiva.value.id_usuario,
    texto: textoMensagem.value.trim()
  });

  textoMensagem.value = '';
  mostrarPainelEmojis.value = false;
}
function adicionarEmojiNoTexto(emoji) {
  textoMensagem.value += emoji;
}
function abrirSeletorDeArquivos() {
  if (inputGaleriaReferencia.value) {
    inputGaleriaReferencia.value.click();
  }
}
async function processarEnvioDeImagemDoChat(evento) {
  const arquivo = evento.target.files[0];
  if (!arquivo || !conversaAtiva.value) return;

  try {
    const base64Leve = await comprimirImagemParaBase64(arquivo);
    socket.emit('enviar_mensagem_privada', {
      id_remetente: meuIdLogado.value,
      id_destinatario: conversaAtiva.value.id_usuario,
      texto: base64Leve
    });

  } catch (erro) {
    console.error("Erro ao comprimir ou enviar imagem pelo WebSocket:", erro);
  }
}

async function tratarDuploCliqueNaMensagem(msg) {
  if (msg.id_remetente !== meuIdLogado.value) return;
  if (msg.texto === 'Mensagem apagada') return;

  if (!confirm("Deseja apagar esta mensagem para todos?")) return;

  try {
    const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/mensagem/apagar/${msg.id_mensagem}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meuId: meuIdLogado.value })
    });

    if (resposta.ok) {
      msg.texto = 'Mensagem apagada';
      socket.emit('apagar_mensagem_realtime', {
        id_mensagem: msg.id_mensagem,
        id_remetente: meuIdLogado.value,
        id_destinatario: conversaAtiva.value.id_usuario
      });
    }
  } catch (erro) { console.error("Erro ao tentar apagar mensagem:", erro); }
}

function avisarQueEstouDigitando() {
  if (!conversaAtiva.value || !meuIdLogado.value) return;

  socket.emit('aluno_digitando', {
    id_remetente: meuIdLogado.value,
    id_destinatario: conversaAtiva.value.id_usuario
  });

  clearTimeout(timeoutDigitando);

  timeoutDigitando = setTimeout(() => {
    socket.emit('aluno_parou_digitando', {
      id_remetente: meuIdLogado.value,
      id_destinatario: conversaAtiva.value.id_usuario
    });
  }, 1500);
}

onMounted(() => {
  carregarListaConversas();
  if (meuIdLogado.value) { socket.emit('entrar_no_chat', meuIdLogado.value); }

  socket.on('receber_mensagem_privada', (novaMsg) => {
    const textoFinal = novaMsg.texto || novaMsg.conteudo_mensagem;

    if (
      (novaMsg.id_remetente === meuIdLogado.value && novaMsg.id_destinatario === conversaAtiva.value?.id_usuario) ||
      (novaMsg.id_remetente === conversaAtiva.value?.id_usuario && novaMsg.id_destinatario === meuIdLogado.value)
    ) {
      historicoMensagens.value.push({
        id_mensagem: novaMsg.id_mensagem,
        id_remetente: novaMsg.id_remetente,
        id_destinatario: novaMsg.id_destinatario,
        texto: textoFinal,
        data: novaMsg.data
      });
      rolarChatParaBaixo();
    }
    carregarListaConversas();
  });

  socket.on('mensagem_foi_apagada', (dados) => {
    const msgAlvo = historicoMensagens.value.find(m => m.id_mensagem === dados.id_mensagem);
    if (msgAlvo) { msgAlvo.texto = 'Mensagem apagada'; }
  });

  socket.on('aluno_esta_digitando', (dados) => {
    const index = listaConversas.value.findIndex(c => c.id_usuario === dados.id_remetente);
    if (index !== -1) { listaConversas.value[index] = { ...listaConversas.value[index], digitando: true }; }
  });
  socket.on('aluno_parou_de_digitando', (dados) => {
    const index = listaConversas.value.findIndex(c => c.id_usuario === dados.id_remetente);
    if (index !== -1) { listaConversas.value[index] = { ...listaConversas.value[index], digitando: false }; }
  });
});

onUnmounted(() => {
  socket.off('receber_mensagem_privada');
  socket.off('mensagem_foi_apagada');
  socket.off('aluno_esta_digitando');
  socket.off('aluno_parou_de_digitando');
});
</script>

<template>
  <main>
    <section class="coluna-lista-conversas" :class="{ 'mobile-oculto': conversaAtiva }">
      <div class="cabecalho-secao-chat">
        <h2>Lista de conversas</h2>
      </div>
      <div class="caixa-busca-chat-wrapper">
        <input v-model="buscaUsuario" type="text" placeholder="Procurar por usuário" class="input-busca-chat">
        <span v-if="!buscaUsuario" class="lupa-busca-pos">
          <img :src="iconeLupa" alt="Pesquisar" class="lupa">
        </span>
      </div>
      <div class="trilho-scroll-conversas">
        <div v-for="chat in conversasFiltradas" :key="chat.id_usuario" @click="selecionarConversa(chat)" class="card-conversa-linha" :class="{ 'card-selecionado': conversaAtiva?.id_usuario === chat.id_usuario }">
          <div class="avatar-chat-container">
            <img :src="chat.foto_profile || '/src/icons/userBlackFull.svg'" alt="Avatar" class="avatar-chat-img">
            <span class="ponto-status-online" :class="{ 'online': chat.status_online }"></span>
          </div>
          <div class="info-corpo-chat-card">
            <div class="linha-topo-card-chat">
              <strong>{{ chat.nome }}</strong>
              <span class="horario-meta-chat">@{{ chat.username }}</span>
            </div>
            <div class="linha-base-card-chat">
              <span v-if="chat.digitando" class="texto-escrevendo" style="color: #22c55e; font-weight: bold; font-style: italic;">
                digitando...
              </span>
              <span v-else style="max-width: 15vw; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--texto-principal);">
                {{ chat.ultima_mensagem || 'Nenhuma mensagem' }}
              </span>
              <span class="status-texto-legenda">{{ chat.status_online ? 'Online' : 'Offline' }}</span>
            </div>
          </div>
        </div>
      </div>
      <button type="button" class="btn-encontrar-usuarios-verde">
        Encontre outros usuários
      </button>
    </section>
    <section class="coluna-janela-mensagens" :class="{ 'mobile-visivel': conversaAtiva }">
      <div v-if="conversaAtiva" class="grade-chat-mural-ativo" style="position: relative;">
        <div class="cabecalho-chat-janela-ativa">
          <div class="identidade-usuario-chat-ativo">
            <button @click="conversaAtiva = null" class="btn-voltar-mobile-chat">
              <img :src="voltar" alt="">
            </button>
            <span class="ponto-status-online header-ponto" :class="{ 'online': conversaAtiva.status_online }"></span>
            <h3>{{ conversaAtiva.nome }}</h3>
          </div>
          <button type="button" class="btn-config-chat-topo">
            <img :src="gear" alt="configuração" class="gear">
          </button>
        </div>
        <div ref="containerMensagens" class="mural-scroll-mensagens-historico">
          <div
            v-for="msg in historicoMensagens"
            :key="msg.id_mensagem || msg.id"
            class="balao-mensagem-linha"
            :class="[
              msg.id_remetente === meuIdLogado ? 'msg-minha' : 'msg-outro',
              { 'estado-apagado': msg.texto === 'Mensagem apagada' }
            ]"
            @dblclick="tratarDuploCliqueNaMensagem(msg)">
            <div v-if="msg.id_remetente !== meuIdLogado && msg.texto !== 'Mensagem apagada'" class="wrapper-avatar-mensagem-outro">
              <img :src="conversaAtiva.foto_profile || '/src/icons/userBlackFull.svg'" alt="Avatar" class="avatar-mural-mini-chat">
            </div>
            <div class="corpo-balao-conteudo">
              <p v-if="msg.texto === 'Mensagem apagada'" class="texto-mensagem-deletada">
                Mensagem apagada
              </p>
              <div v-else-if="msg.texto.startsWith('/imagens/')" class="container-imagem-chat-balao">
                <img :src="msg.texto" alt="Imagem enviada" class="img-enviada-chat-midia">
              </div>
              <p v-else>{{ msg.texto }}</p>

              <span class="tag-tempo-data-balao">
                {{ new Date(msg.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }}
              </span>
            </div>
          </div>
        </div>
        <div v-if="mostrarPainelEmojis" class="caixa-pop-over-teclado-emojis">
          <div class="grade-emojis-scroll">
            <span
              v-for="emoji in listaDeEmojisTotais"
              :key="emoji"
              @click="adicionarEmojiNoTexto(emoji)"
              class="emoji-item-clicavel"
            >
              {{ emoji }}
            </span>
          </div>
        </div>
        <div class="barra-digitacao-footer-container">
          <button type="button" @click="mostrarPainelEmojis = !mostrarPainelEmojis" class="btn-emoji-chat-trigger">
            <img :src="emoji" alt="Adicionar emoji" class="icone-modo-escuro">
          </button>
          <button type="button" @click="abrirSeletorDeArquivos" class="btn-clip-chat-midia" title="Enviar imagem">
            <img :src="imagem" alt="Adicionar imagem" class="icone-modo-escuro">
          </button>
          <input
            type="file"
            ref="inputGaleriaReferencia"
            accept="image/*"
            @change="processarEnvioDeImagemDoChat"
            style="display: none;"
          >
          <input
            v-model="textoMensagem"
            type="text"
            placeholder="Escreva seu texto..."
            @keyup.enter="enviarMensagem"
            @input="avisarQueEstouDigitando"
            class="input-mensagem-chat-campo"
          >
          <button type="button" @click="enviarMensagem" class="btn-enviar-mensagem-chat-gatilho">
            <img :src="enviar" alt="Enviar mensagem" class="enviar-img">
          </button>
        </div>
      </div>

      <div v-else class="janela-chat-vazia-estado">
        <span>Selecione uma conversa para iniciar o IFChat Realtime</span>
      </div>
    </section>
  </main>
</template>

<style scoped>
[data-theme="dark"] .icone-modo-escuro {
  filter: hue-rotate(135deg) saturate(1.8) brightness(1.1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .lupa {
  filter: invert(1);
  transition: filter 0.3s ease;
}
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
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 2vw;
}
.coluna-lista-conversas,
.coluna-janela-mensagens {
  background-color: var(--fundo-card);
  position: relative !important;
  left: auto !important;
  right: auto !important;
  transform: none !important;
  width: 38% !important;
  height: calc(100vh - 8vw) !important;
  margin: 0 !important;
  top: 0;
  bottom: 0;
  margin-top: 4vw;
  margin-bottom: 3vw;
  border-radius: 9px;
  border: var(--borda-padrao);
  scrollbar-color: #ccc transparent;
  overflow-y: auto;
  scrollbar-width: thin;
  padding: 1vw;
  box-sizing: border-box;
  display: flex !important;
  flex-direction: column !important;
}
.janela-chat-vazia-estado {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  height: 100% !important;
  width: 100% !important;
  color: var(--texto-suave, #64748b) !important;
  font-weight: 600 !important;
  font-size: 0.95rem !important;
  text-align: center !important;
  box-sizing: border-box !important;
  padding: 2vw !important;
  border: 2px dashed var(--borda-padrao) !important;
  border-radius: 8px !important;
  background-color: rgba(255, 255, 255, 0.02) !important;
}
.coluna-lista-conversas {
  left: 45%;
  transform: translateX(-100%);
  margin-right: 1.5vw;
}
.coluna-janela-mensagens {
  left: 45%;
  transform: translateX(0);
  margin-left: 1.5vw;
  padding: 1vw 1vw 0 1vw !important;
}
.cabecalho-secao-chat h2 {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--texto-principal);
  margin-bottom: 1vw;
}
.estado-apagado .corpo-balao-conteudo {
  background-color: var(--hover-botoes, #f1f5f9) !important;
  border: 1px dashed var(--borda-padrao) !important;
  box-shadow: none !important;
}
.texto-mensagem-deletada {
  font-style: italic !important;
  color: var(--texto-suave, #94a3b8) !important;
  font-size: 0.88rem !important;
}
.msg-outro.estado-apagado {
  padding-left: 42px;
}
.caixa-busca-chat-wrapper {
  position: relative;
  width: 100%;
  margin-bottom: 1.2vw;
}
.caixa-pop-over-teclado-emojis {
  position: absolute;
  bottom: 4.5vw;
  left: 1.5vw;
  background-color: var(--fundo-card-modal, #ffffff);
  border: 1px solid var(--borda-padrao);
  border-radius: 10px;
  width: 18vw;
  min-width: 250px;
  max-height: 180px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  padding: 10px;
  z-index: 50;
  box-sizing: border-box;
}
.grade-emojis-scroll {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  overflow-y: auto;
  max-height: 160px;
  padding-right: 4px;
}
.grade-emojis-scroll::-webkit-scrollbar { width: 3px; }
.grade-emojis-scroll::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
.emoji-item-clicavel {
  font-size: 1.25rem;
  cursor: pointer;
  text-align: center;
  transition: transform 0.1s ease;
  user-select: none;
}
.emoji-item-clicavel:hover {
  transform: scale(1.25);
}
.btn-clip-chat-midia {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.15rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  color: var(--texto-suave);
}
.btn-clip-chat-midia:hover {
  transform: scale(1.15) rotate(15deg);
}
.container-imagem-chat-balao {
  max-width: 100%;
  border-radius: 8px;
  overflow: hidden;
  margin: 4px 0;
  display: block;
}
.img-enviada-chat-midia {
  width: 100%;
  max-width: 200px;
  height: auto;
  border-radius: 6px;
  object-fit: cover;
  display: block;
  border: 1px solid rgba(0,0,0,0.05);
}
.input-busca-chat {
  width: 100%;
  padding: 10px 40px 10px 14px;
  border: var(--borda-padrao);
  border-radius: 20px;
  outline: none;
  background-color: var(--fundo-card);
  color: var(--texto-principal);
  font-size: 0.9rem;
}
.input-busca-chat::placeholder {
  color: var(--texto-mais-suave);
}
.lupa-busca-pos {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.9rem;
  color: var(--texto-suave);
  justify-content: center;
  align-items: center;
}
.lupa {
  height: 1.4vw;
  width: 1.4vw;
}
.trilho-scroll-conversas {
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 4px;
}
.card-conversa-linha {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--borda-padrao);
  border-radius: 12px;
  cursor: pointer;
  background-color: var(--fundo-card-modal, transparent);
  transition: all 0.2s ease-in-out;
}
.card-conversa-linha:hover {
  background-color: var(--hover-botoes, #f1f5f9);
  transform: translateY(-1px);
}
.card-selecionado {
  background-color: var(--fundo-opcao-enquete) !important;
  border-color: var(--fundo-card-va) !important;
}
.avatar-chat-container {
  position: relative;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  object-fit: cover;
}
.avatar-chat-img[src$='userBlackFull.svg'] {
  width: 3.73vw;
  height: 3.73vw;
}
[data-theme="dark"] .avatar-chat-img[src$='userBlackFull.svg'] {
  filter: invert(1);
  transition: filter 0.3s ease;
}
.avatar-chat-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--borda-padrao);
}
.ponto-status-online {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #94a3b8;
  border: 2px solid var(--fundo-card);
}
.ponto-status-online.online {
  background-color: #22c55e;
}
.info-corpo-chat-card {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 4px;
}
.linha-topo-card-chat,
.linha-base-card-chat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.linha-topo-card-chat strong {
  font-size: 0.9rem;
  color: var(--texto-principal);
}
.horario-meta-chat,
.status-texto-legenda {
  font-size: 0.75rem;
  color: var(--texto-suave);
}
.cabecalho-chat-janela-ativa {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1vw;
  border-bottom: var(--borda-padrao);
  margin-bottom: 1vw;
}
.identidade-usuario-chat-ativo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.identidade-usuario-chat-ativo h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--texto-principal);
  margin: 0;
}
.header-ponto {
  position: relative !important;
  border-radius: 50%;
}
.enviar-img {
  width: 1.5vw;
  height: 1.5vw;
}
.gear {
  width: auto;
  height: 100%;
}
.mural-scroll-mensagens-historico {
  flex-grow: 1 !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  padding: 1vw;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background-color: var(--fundo-opcao-enquete-claro);
  border-radius: 6px;
  box-sizing: border-box;
  max-height: calc(100vh - 20vw) !important;
  margin-bottom: 5px;
}
.balao-mensagem-linha {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
}
.msg-minha {
  justify-content: flex-end;
}
.msg-outro {
  justify-content: flex-start;
}
.wrapper-avatar-mensagem-outro {
  width: 2vw;
  height: 2vw;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--borda-padrao);
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--hover-botoes);
}
.avatar-mural-mini-chat {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-mural-mini-chat[src$="userBlackFull.svg"] {
  object-fit: contain !important;
  width: 3.3vw;
  height: 3.3vw;
  padding: 4px;
  box-sizing: border-box;
}
[data-theme="dark"] .avatar-mural-mini-chat[src$='userBlackFull.svg'] {
  filter: invert(1);
  transition: filter 0.3s ease;
}
.corpo-balao-conteudo {
  padding: 10px 14px;
  max-width: 65%;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.msg-outro .corpo-balao-conteudo {
  background-color: var(--fundo-card-modal, #ffffff);
  border: 1px solid var(--borda-padrao);
  border-radius: 14px 14px 14px 0px;
}
.msg-minha .corpo-balao-conteudo {
  background-color: rgba(85, 255, 51, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.25);
  border-radius: 14px 14px 0px 14px;
}
.corpo-balao-conteudo p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--texto-principal);
  line-height: 1.4;
}
.btn-encontrar-usuarios-verde {
  background-color: var(--fundo-card-va) !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 20px !important;
  width: calc(100% - 30px) !important;
  padding: 10px 16px !important;
  margin-top: 15px !important;
  align-self: center !important;
  font-size: 0.85rem !important;
  font-weight: bold !important;
  cursor: pointer !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}
.btn-encontrar-usuarios-verde:hover {
  background-color: var(--fundo-card-va-hover) !important;
  transform: translateY(-1px) scale(1.02) !important;
  box-shadow: 0 6px 16px rgba(49, 158, 0, 0.3) !important;
}
.btn-encontrar-usuarios-verde:active {
  transform: translateY(0) scale(0.98) !important;
}
.grade-chat-mural-ativo {
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
  width: 100% !important;
  box-sizing: border-box;
  margin-bottom: 0 !important;
}
.tag-tempo-data-balao {
  font-size: 0.68rem;
  color: var(--texto-suave);
  display: block;
  text-align: right;
  margin-top: 4px;
}
.barra-digitacao-footer-container {
  display: flex !important;
  align-items: center !important;
  gap: 0.5vw;
  padding-top: 15px !important;
  border-top: var(--borda-padrao) !important;
  background-color: var(--fundo-card) !important;
  margin-top: 0 !important;
  width: 100% !important;
  flex-shrink: 0 !important;
  box-sizing: border-box !important;
}
.input-mensagem-chat-campo {
  flex-grow: 1 !important;
  font-size: 0.5vw;
  padding: 0.48vw !important;
  border: var(--borda-padrao) !important;
  border-radius: 10px 0 0 10px !important;
  outline: none !important;
  background-color: var(--fundo-card) !important;
  color: var(--texto-principal) !important;
  font-size: 0.9rem !important;
  box-sizing: border-box !important;
  width: 100% !important;
}
.input-mensagem-chat-campo::placeholder {
  color: var(--texto-mais-suave);
}
.btn-emoji-chat-trigger,
.btn-enviar-mensagem-chat-gatilho,
.btn-config-chat-topo,
.btn-voltar-mobile-chat {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.15rem;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-config-chat-topo:hover {
  transition: 0.3s;
  transform: scale(1.15);
}
.btn-config-chat-topo:active {
  transform: scale(0.90);
}
.btn-enviar-mensagem-chat-gatilho {
  background-color: var(--fundo-card-va);
  width: 2.7vw;
  height: 100%;
  border-radius: 0 10px 10px 0;
  padding: 0.2vw !important;
}
.btn-voltar-mobile-chat {
  display: none;
}
.btn-enviar-mensagem-chat-gatilho:hover {
  background-color: var(--fundo-card-va-hover);
}
.btn-enviar-mensagem-chat-gatilho:active {
  transform: scale(0.95);
}
.btn-enviar-mensagem-chat-gatilho:hover,
.btn-emoji-chat-trigger:hover {
  transform: scale(1.12);
}
.trilho-scroll-conversas::-webkit-scrollbar,
.mural-scroll-mensagens-historico::-webkit-scrollbar {
  width: 5px !important;
}
.trilho-scroll-conversas::-webkit-scrollbar-track,
.mural-scroll-mensagens-historico::-webkit-scrollbar-track {
  background: transparent;
}
.trilho-scroll-conversas::-webkit-scrollbar-thumb,
.mural-scroll-mensagens-historico::-webkit-scrollbar-thumb {
  background: var(--cor-detalhe-escuro, #319e00) !important;
  border-radius: 10px;
}
@media (max-width: 728px) {
  .fundo-chat-layout {
    margin-left: 0;
    width: 100vw;
    height: calc(100vh - 65px);
    position: relative;
  }
  .coluna-lista-conversas {
    width: 100vw;
    display: flex;
  }
  .coluna-janela-mensagens {
    display: none;
    width: 100vw;
    position: fixed;
    top: 0;
    left: 0;
    height: calc(100vh - 65px);
    z-index: 2000;
  }
  .coluna-lista-conversas.mobile-oculto {
    display: none !important;
  }
  .coluna-janela-mensagens.mobile-visivel {
    display: block !important;
  }
  .btn-voltar-mobile-chat {
    display: block !important;
    margin-right: 8px;
  }
  .box-imagem-verde-placeholder {
    width: 25vw;
    height: 25vw;
  }
}
</style>
