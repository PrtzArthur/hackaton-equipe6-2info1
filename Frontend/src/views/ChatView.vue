<script setup>
import { ref, onMounted, nextTick, onUnmounted, computed, watch } from 'vue';
import { io } from 'socket.io-client';
import iconeLupa from '@/icons/iconeLupa.svg';
import imagem from '@/icons/imagem.svg';
import voltar from '@/icons/voltar.svg';
import emoji from '@/icons/emoji.svg';
import userBlackFull from '@/icons/userBlackFull.svg';
import enviar from '@/icons/enviar.svg';
import gear from '@/icons/gear.svg';
import { useToast } from 'vue-toastification';
import { useRouter } from 'vue-router';

const router = useRouter();

const toast = useToast();

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

const mostrarTelaPesquisaUsuarios = ref(false);

let timeoutDigitando = null;

async function rolarChatParaBaixo() {
  await nextTick();
  if (containerMensagens.value) {
    containerMensagens.value.scrollTop = containerMensagens.value.scrollHeight;
  }
}

function mostrarTelaDeUsuarios()  {
  mostrarTelaPesquisaUsuarios.value = true;
}
function voltarTela()  {
  mostrarTelaPesquisaUsuarios.value = false;
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

  const mensagemLimpa = textoMensagem.value.trim();
  socket.emit('enviar_mensagem_privada', {
    id_remetente: meuIdLogado.value,
    id_destinatario: conversaAtiva.value.id_usuario,
    texto: mensagemLimpa,
    conteudo_mensagem: mensagemLimpa
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

  const formDataEnviada = new FormData();
  formDataEnviada.append('imagemChat', arquivo);

  try {
    const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/upload-imagem`, {
      method: 'POST',
      body: formDataEnviada
    });

    if (resposta.ok) {
      const dadosRetorno = await resposta.json();
      const urlMidiaFisica = dadosRetorno.urlImagem;
      socket.emit('enviar_mensagem_privada', {
        id_remetente: meuIdLogado.value,
        id_destinatario: conversaAtiva.value.id_usuario,
        texto: urlMidiaFisica,
        conteudo_mensagem: urlMidiaFisica
      });
      evento.target.value = '';
    }
  } catch (erro) {
    console.error("Erro ao fazer upload da imagem no chat:", erro);
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
const usuarioFiltrado = ref('');
const mostrarDropdownOrdenacao = ref(false);
const filtroOrdenacaoSelecionado = ref('Mais recente');
const listaDeTodosOsUsuariosDoBanco = ref([]);

function alternarDropdownOrdenacao() {
  mostrarDropdownOrdenacao.value = !mostrarDropdownOrdenacao.value;
}
const usuariosFiltradosEOrdenados = computed(() => {
  let resultado = [...listaDeTodosOsUsuariosDoBanco.value];
  if (usuarioFiltrado.value.trim()) {
    const termo = usuarioFiltrado.value.toLowerCase().trim();
    resultado = resultado.filter(u =>
      u.nome?.toLowerCase().includes(termo) ||
      u.username?.toLowerCase().includes(termo)
    );
  }
  if (filtroOrdenacaoSelecionado.value === 'Mais seguido') {
    return resultado.sort((a, b) => (b.total_seguidores || 0) - (a.total_seguidores || 0));
  } else if (filtroOrdenacaoSelecionado.value === 'Com mais postagens') {
    return resultado.sort((a, b) => (b.total_posts || 0) - (a.total_posts || 0));
  } else {
    return resultado.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));
  }
});
async function carregarTodosOsUsuariosParaExplorar() {
  const idLogado = localStorage.getItem('ifchat_user_id') || '';
  if (!idLogado) return;

  try {
    const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/usuario/explorar/usuarios?meuId=${idLogado}`);

    if (resposta.ok) {
      listaDeTodosOsUsuariosDoBanco.value = await resposta.json();
    }
  } catch (erro) {
    console.error("Falha na requisição de exploração de alunos:", erro);
  }
}
watch(mostrarTelaPesquisaUsuarios, (ficouVisivel) => {
  if (ficouVisivel) {
    carregarTodosOsUsuariosParaExplorar();
  }
});
function reordenarUsuarios() {
  mostrarDropdownOrdenacao.value = false;
}
function irParaPerfilDoAutor(idUsuario) {
  router.push(`/usuario/${idUsuario}`);
}
async function alternarSeguirUsuarioNaLista(userAlvo) {
  try {
    const r = await fetch(`${import.meta.env.VITE_API_URL}/api/usuario/seguir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idSeguidor: meuIdLogado.value,
        idSeguido: userAlvo.id_usuario,
        idCriador: userAlvo.id_usuario
      })
    });

    if (r.ok) {
      const dados = await r.json();
      userAlvo.jaSeguindo = (dados.status === 'seguiu');
      userAlvo.total_seguidores = dados.contadorSeguidoresDoPerfil;
      toast.success(dados.status === 'seguiu' ? `Seguindo ${userAlvo.nome}!` : `Parou de seguir.`);
    }
  } catch (e) {
    console.error("Erro ao seguir usuário na listagem:", e);
  }
}

onMounted(() => {
  carregarListaConversas();
  socket.on('connect', () => {
    if (meuIdLogado.value) {
      socket.emit('entrar_no_chat', meuIdLogado.value);
    }
  });

  if (meuIdLogado.value && socket.connected) {
    socket.emit('entrar_no_chat', meuIdLogado.value);
  }

  socket.on('receber_mensagem_privada', (novaMsg) => {
    const textoMensagemTratado = novaMsg.texto || novaMsg.conteudo_mensagem || '';

    if (
      (novaMsg.id_remetente === meuIdLogado.value && novaMsg.id_destinatario === conversaAtiva.value?.id_usuario) ||
      (novaMsg.id_remetente === conversaAtiva.value?.id_usuario && novaMsg.id_destinatario === meuIdLogado.value)
    ) {
      historicoMensagens.value.push({
        id_mensagem: novaMsg.id_mensagem,
        id_remetente: novaMsg.id_remetente,
        id_destinatario: novaMsg.id_destinatario,
        texto: textoMensagemTratado,
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

  socket.on('usuario_status_mudou', (dadosRecebidos) => {
    if (listaDeTodosOsUsuariosDoBanco.value) {
      const usuarioAlvoNaBusca = listaDeTodosOsUsuariosDoBanco.value.find(u => u.id_usuario === dadosRecebidos.id_usuario);
      if (usuarioAlvoNaBusca) {
        usuarioAlvoNaBusca.status_online = dadosRecebidos.status_online;
      }
    }

    const chatAtivoNaSidebar = listaConversas.value.find(c => c.id_usuario === dadosRecebidos.id_usuario);
    if (chatAtivoNaSidebar) {
      chatAtivoNaSidebar.status_online = dadosRecebidos.status_online;
    }
  });
});

onUnmounted(() => {
  socket.off('connect');
  socket.off('receber_mensagem_privada');
  socket.off('mensagem_foi_apagada');
  socket.off('aluno_esta_digitando');
  socket.off('aluno_parou_de_digitando');
  socket.off('usuario_status_mudou');
});
</script>

<template>
  <main>
    <section v-if="!mostrarTelaPesquisaUsuarios" class="coluna-lista-conversas" :class="{ 'mobile-oculto': conversaAtiva }">
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
            <div class="avatar-chat-img-fundo">
              <img v-if="chat.foto_profile && chat.foto_profile !== ''" :src="chat.foto_profile" alt="Avatar" class="avatar-chat-img">
              <img v-else :src="userBlackFull" alt="" class="avatar-chat-img-default">
            </div>
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
      <button @click="mostrarTelaDeUsuarios" type="button" class="btn-encontrar-usuarios-verde">
        Encontre outros usuários
      </button>
    </section>
    <section v-if="!mostrarTelaPesquisaUsuarios" class="coluna-janela-mensagens" :class="{ 'mobile-visivel': conversaAtiva }">
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
              <div class="avatar-mural-mini-chat">
                <img v-if="conversaAtiva.foto_profile && conversaAtiva.foto_profile !== ''" :src="conversaAtiva.foto_profile" alt="Avatar" class="foto-perfil-chat">
                <img v-else :src="userBlackFull" alt="" class="img-perfil-chat">
              </div>
            </div>
            <div class="corpo-balao-conteudo">
              <p v-if="msg.texto === 'Mensagem apagada'" class="texto-mensagem-deletada">
                Mensagem apagada
              </p>
              <div v-else-if="msg.texto && msg.texto.includes('/imagens/')" class="container-imagem-chat-balao">
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
    <section v-if="mostrarTelaPesquisaUsuarios" class="notifications-card">
  <div class="topo-pesquisa-filtro">
    <div class="container-input-busca">
      <input v-model="usuarioFiltrado" type="text" placeholder="Procurar por usuário..." class="input-pesquisa">
      <i v-if="usuarioFiltrado.length === ''" class="icone-lupa"><img :src="iconeLupa" alt=""></i>
    </div>
    <div class="dropdown-ordenacao-container">
      <button @click="alternarDropdownOrdenacao" class="botao-dropdown-ordenar">
        Ordenar por: <span>{{ filtroOrdenacaoSelecionado }}</span>
        <i class="seta-dropdown">▼</i>
      </button>
      <div v-if="mostrarDropdownOrdenacao" class="painel-opcoes-ordenar">
        <label class="opcao-checkbox">
          <input type="radio" v-model="filtroOrdenacaoSelecionado" value="Mais recente" @change="reordenarUsuarios">
          Mais recente
        </label>
        <label class="opcao-checkbox">
          <input type="radio" v-model="filtroOrdenacaoSelecionado" value="Mais seguido" @change="reordenarUsuarios">
          Mais seguido
        </label>
        <label class="opcao-checkbox">
          <input type="radio" v-model="filtroOrdenacaoSelecionado" value="Com mais postagens" @change="reordenarUsuarios">
          Com mais postagens
        </label>
      </div>
    </div>
  </div>
  <div class="lista-de-usuarios-container">
    <div v-for="user in usuariosFiltradosEOrdenados" :key="user.id_usuario" class="card-usuario-linha">
      <div class="bloco-info-esquerda">
        <div class="avatar-aluno-lista" @click="irParaPerfilDoAutor(user.id_usuario)">
          <img v-if="user.foto_profile && user.foto_profile !== ''" :src="user.foto_profile">
          <img v-else :src="userBlackFull" alt="" class="img-default">
        </div>
        <div class="detalhes-texto-aluno">
          <h4 class="nome-aluno-titulo">{{ user.nome }}</h4>
          <span :class="['status-badge', user.status_online ? 'online' : 'offline']">
            ● {{ user.status_online ? 'Online' : 'Offline' }}
          </span>
          <p class="contador-seguidores-sub">{{ user.total_seguidores || 0 }} seguidores</p>
        </div>
      </div>
      <button
        :class="['btn-seguir-lista', user.jaSeguindo ? 'seguindo' : '']"
        @click="alternarSeguirUsuarioNaLista(user)"
      >
        {{ user.jaSeguindo ? 'Seguindo' : 'Seguir' }}
      </button>
    </div>
    <div v-if="usuariosFiltradosEOrdenados.length === 0" class="aviso-vazio-lista">
      Nenhum estudante encontrado com esse termo.
    </div>
  </div>
</section>
      <button v-if="mostrarTelaPesquisaUsuarios"  @click="voltarTela" class="botaoVoltar">
          <img :src="voltar" alt="" class="setaVoltar">
      </button>
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
[data-theme="dark"] .img-perfil-chat {
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
.setaVoltar {
  width: 2vw;
  height: 2vw;
}
.input-pesquisa {
  background-color: var(--fundo-card) !important;
  color: var(--texto-principal);
}
.img-perfil-chat {
  width: 2.8vw;
  height: 2.8vw;
}
.botaoVoltar {
  width: 3vw;
  height: 3vw;
  background-color: var(--fundo-card);
  border: var(--borda-padrao);
  border-radius: 5px;
  top: 0 !important;
  left: 0 !important;
  margin-top: -45.2vw !important;
  margin-left: -56vw !important;
  z-index: 9999 !important;
  cursor: pointer;
}
.botaoVoltar:hover {
  background-color: var(--hover-botoes);
  transform: scale(1.02);
  transition: 0.3s;
}
.botaoVoltar:active {
  transform: scale(0.92);
}
[data-theme="dark"] .setaVoltar {
  filter: invert(1);
  transition: filter 0.3s ease;
}
.notifications-card {
  background-color: var(--fundo-card);
  position: fixed;
  width: 40%;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translate(-50%);
  margin-top: 4vw;
  margin-bottom: 3vw;
  border-radius: 9px;
  border: var(--borda-padrao);
  scrollbar-color: #ccc transparent;
  overflow-y: auto;
  scrollbar-width: thin;
  padding: 2px;
}
.topo-pesquisa-filtro {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2vw;
  padding: 0 0.5vw;
  width: 100%;
  height: 4vw;
}
.container-input-busca {
  position: relative;
  flex: 1;
  max-width: 450px;
}
.container-input-busca input {
  width: 100%;
  padding: 0.8vw 3vw 0.8vw 1vw;
  border: 1px solid #ccc;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  background-color: #fff;
}
.container-input-busca .icone-lupa {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #777;
  font-size: 14px;
  cursor: pointer;
}
.dropdown-ordenacao-container {
  position: relative;
}
.botao-dropdown-ordenar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--fundo-card);
  border: var(--borda-padrao);
  color: var(--texto-principal);
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}
.botao-dropdown-ordenar span {
  font-weight: normal;
  color: var(--texto-mais-suave);
}
.painel-opcoes-ordenar {
  position: absolute;
  top: 110%;
  right: 0;
  width: 220px;
  background: var(--fundo-card);
  border: var(--borda-padrao);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
}
.opcao-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--texto-mais-suave);
  cursor: pointer;
  background-color: var(--fundo-card);
}
.lista-de-usuarios-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: var(--fundo-card-modal);
  border: 1px solid #ccc;
  border-radius: 12px;
  padding: 20px;
  max-height: 600px;
  overflow-y: auto;
}
.card-usuario-linha {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--fundo-card);
  border: 1px solid #e0e0e0;
  border-radius: 25px;
  padding: 1vw 1.5vw;
  transition: transform 0.2s, box-shadow 0.2s;
}
.card-usuario-linha:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
}
.bloco-info-esquerda {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  flex: 1;
}
.avatar-aluno-lista {
  width: 3vw;
  height: 3vw;
  border-radius: 50%;
  display: flex;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  object-fit: cover;
  flex-shrink: 0;
  border: var(--borda-padrao);
}
[data-theme="dark"] .img-default {
  filter: invert(1) !important;
  transition: filter 0.3s ease !important;
}
[data-theme="dark"] .gear {
  filter: invert(1);
  transition: filter 0.3s ease;
}
.img-default {
  width: 4.5vw;
  height: 4.5vw;
}
.detalhes-texto-aluno {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nome-aluno-titulo {
  margin: 0;
  font-size: 15px;
  font-weight: bold;
  color: var(--texto-principal);
}
.status-badge {
  font-size: 11px;
  font-weight: 500;
}
.status-badge.online { color: #2e7d32; }
.status-badge.offline { color: #757775; }
.contador-seguidores-sub {
  margin: 0;
  font-size: 11px;
  color: #888;
}
.btn-seguir-lista {
  background-color: var(--fundo-card-va);
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 8px 24px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  min-width: 100px;
}
.btn-seguir-lista:hover {
  background-color: var(--fundo-card-va-hover);
}
.btn-seguir-lista.seguindo {
  background-color: #757775;
}
.aviso-vazio-lista {
  text-align: center;
  color: #777;
  font-size: 14px;
  padding: 20px 0;
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
.avatar-chat-img-fundo {
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  overflow: hidden;
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
.foto-perfil-chat {
  width: 100%;
  height: 100%;
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
.avatar-chat-img-default {
  width: 3.73vw;
  height: 3.73vw;
}
[data-theme="dark"] .avatar-chat-img-default {
  filter: invert(1);
  transition: filter 0.3s ease;
}
.avatar-chat-img {
  width: 3vw;
  height: 3vw;
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
[dark-theme="dark"] .gear {
  filter: invert(1);
  transition: filter 0.3s ease;
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
.avatar-mural-mini-chat {
  object-fit: contain !important;
  width: 3.3vw;
  height: 3.3vw;
  padding: 4px;
  box-sizing: border-box;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
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
