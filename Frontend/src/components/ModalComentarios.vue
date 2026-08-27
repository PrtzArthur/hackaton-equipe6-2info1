<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useToast } from 'vue-toastification';
import { io } from 'socket.io-client';
import likePreenchido from '@/icons/likePreenchido.svg';
import likeInline from '@/icons/likeInline.svg';
import dislikeInline from '@/icons/dislikeInline.svg';
import dislikePreenchido from '@/icons/dislikePreenchido.svg';
import lixeira from '@/icons/lixeira.svg';

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  post: { type: [Object, null], required: true },
});
const emit = defineEmits(['fechar']);

const toast = useToast();
const socket = io(import.meta.env.VITE_API_URL);

const listaComentariosDoPost = ref([]);
const textoNovoComentario = ref('');
const filtroAtual = ref('recente');
const meuIdLogado = ref(localStorage.getItem('ifchat_user_id') || '');

async function carregarComentariosDoBanco() {
  if (!props.post?.id_postagem) return;
  try {
    const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/criar/postagens/${props.post.id_postagem}/comentarios?meuId=${meuIdLogado.value}&filtro=${filtroAtual.value}`);
    if (resposta.ok) {
      listaComentariosDoPost.value = await resposta.json();
    }
  } catch (erro) {
    console.error("Erro ao buscar histórico do mural:", erro);
  }
}
function mudarFiltroMural(novoFiltro) {
  filtroAtual.value = novoFiltro;
  carregarComentariosDoBanco();
}
async function enviarComentarioNoOverlay() {
  if (!textoNovoComentario.value.trim() || !props.post?.id_postagem) {
    console.warn("Aviso: Texto vazio ou post não identificado.");
    toast.warning('Post não identificado ou texto vazio.')
    return;
  }
  const meuId = meuIdLogado.value || localStorage.getItem('ifchat_user_id') || '';

  if (!meuId) {
    toast.warning("Você precisa estar logado para comentar!");
    return;
  }

  try {
    const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/criar/comentarios/novo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idUsuario: meuId,
        idPostagem: props.post.id_postagem,
        conteudo: textoNovoComentario.value.trim()
      })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      textoNovoComentario.value = '';
      toast.success("Resposta publicada com sucesso!");
      carregarComentariosDoBanco();
    } else {
      toast.error(dados.erro || "Falha ao enviar comentário no servidor.");
    }
  } catch (erro) {
    console.error("Erro de conexão com a API de comentários:", erro);
    toast.error("Erro de comunicação com o servidor.");
  }
}
async function votarNoComentarioDoMural(idComentario, tipo) {
  if (!meuIdLogado.value) {
    toast.warning("Faça login para interagir!");
    return;
  }
  try {
    const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/criar/postagens/comentarios/votar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idUsuario: meuIdLogado.value,
        idComentario: idComentario.id_comentario,
        tipoVoto: tipo
      })
    });
    const dados = await resposta.json();

    if (resposta.ok) {
      idComentario.meu_voto = dados.votoAtual;
      carregarComentariosDoBanco()
    };
  } catch (erro) {
    console.error("Erro ao processar voto:", erro);
  }
}
async function deletarComentarioDoBanco(idComentario) {
  if (!confirm("Tem certeza que deseja apagar este comentário?")) return;

  try {
    const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/criar/comentarios/deletar/${idComentario}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idUsuarioLogado: meuIdLogado.value
      })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      toast.success("Comentário removido com sucesso!");
      carregarComentariosDoBanco();
    } else {
      toast.error(dados.erro || "Falha ao deletar comentário.");
    }
  } catch (erro) {
    console.error("Erro ao deletar comentário:", erro);
    toast.error("Erro de comunicação com o servidor.");
  }
}

watch(
  () => [props.isOpen, props.post],
  ([novoIsOpen, novoPost]) => {
    if (novoIsOpen && novoPost?.id_postagem) {
      meuIdLogado.value = localStorage.getItem('ifchat_user_id') || '';
      carregarComentariosDoBanco();
    }
  },
  { immediate: true }
);
onMounted(() => {
  if (props.isOpen) carregarComentariosDoBanco();
  socket.on('novo_comentario_recebido', (comentarioVindoDoServidor) => {
    if (props.isOpen && props.post?.id_postagem === comentarioVindoDoServidor.id_postagem) {
      const jaExiste = listaComentariosDoPost.value.some(c => c.id_comentario === comentarioVindoDoServidor.id_comentario);
      if (!jaExiste) {
        if (filtroAtual.value === 'recente') {
          listaComentariosDoPost.value.unshift(comentarioVindoDoServidor);
        } else {
          listaComentariosDoPost.value.push(comentarioVindoDoServidor);
        }
      }
    }
  });
});
onUnmounted(() => {
  socket.off('novo_comentario_recebido');
});
</script>

<template>
  <div v-if="isOpen" class="overlay" @click.self="emit('fechar')">
    <div class="modal-comentarios-largura">
      <div class="cabecalho-modal-mural">
        <h2 class="overlayFormTitulo">Comentários</h2>
        <div class="filtros-mural-abas">
          <button type="button" @click="mudarFiltroMural('recente')" :class="{ ativo: filtroAtual === 'recente' }">Recentes</button>
          <button type="button" @click="mudarFiltroMural('relevante')" :class="{ ativo: filtroAtual === 'relevante' }">Relevantes</button>
        </div>
      </div>

      <div class="container-scroll-comentarios-mural">
        <p v-if="listaComentariosDoPost.length === 0" class="texto-vazio-comentarios">
          Ninguém respondeu ainda. Seja o primeiro a comentar!
        </p>
        <div v-else v-for="c in listaComentariosDoPost" :key="c.id_comentario" class="card-resposta-linha">
          <div class="div-imagem">
            <img
              :src="c.foto_profile && c.foto_profile.startsWith('data:') ? c.foto_profile : '/icons/userBlackFull.svg'"
              alt="Avatar"
              class="avatar-mural-mini"
            >
          </div>
          <div class="corpo-resposta-conteudo">
            <div class="identidade-resposta-autor">
              <strong>{{ c.nome }}</strong> <small>@{{ c.username }}</small>
            </div>
            <p class="texto-mensagem-comentario">{{ c.conteudo_comentario }}</p>
            <div class="linha-votos-comentario-botoes">
              <div class="div-btn-like-dislike">
                <button type="button" :disabled="c.autor === meuIdLogado" @click="votarNoComentarioDoMural(c, 'like')" :class="{ 'comentario-votado-like': c.meu_voto === 'like' }" class="btn-mini-voto">
                <img v-if="c.meu_voto === 'like'" :src="likePreenchido" alt="">
                <img v-else :src="likeInline" alt="não curtir" class="btn-modo-escuro">
                {{ c.total_likes }}
              </button>
              <button type="button" :disabled="c.autor === meuIdLogado" @click="votarNoComentarioDoMural(c, 'dislike')" :class="{ 'comentario-votado-dislike': c.meu_voto === 'dislike' }" class="btn-mini-voto">
                <img v-if="c.meu_voto === 'dislike'" :src="dislikePreenchido" alt="">
                <img v-else :src="dislikeInline" alt="não curtir" class="btn-modo-escuro">
                {{ c.total_dislikes }}
              </button>
              </div>
              <button
                v-if="c.autor === meuIdLogado" type="button" @click="deletarComentarioDoBanco(c.id_comentario)" class="btn-mini-lixeira" title="Excluir meu comentário">
                <img :src="lixeira" alt="Deletar" class="img-lixeira-mini">
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="caixa-inserir-comentario-modal">
        <input
          v-model="textoNovoComentario"
          maxlength="500"
          type="text"
          placeholder="Escreva seu comentário..."
          @keyup.enter="enviarComentarioNoOverlay"
          class="inputFormEdit"
          autofocus
        >
        <button type="button" @click="enviarComentarioNoOverlay" class="salvarAlteracoes btn-mural-enviar">Enviar</button>
      </div>
      <div class="botoesDoFormEditPerfil borda-topo-modal-mural">
        <button type="button" @click="emit('fechar')" class="cancelarAlteracoes">Fechar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
[data-theme="dark"] .btn-modo-escuro {
  filter: invert(1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .img-lixeira-mini {
  filter: invert(1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .avatar-mural-mini[src$="userBlackFull.svg"] {
  filter: invert(1);
  transition: filter 0.3s ease;
}
.avatar-mural-mini[src$="userBlackFull.svg"] {
  width: 3.9vw !important;
  height: auto !important;
  border: none;
}
.modal-comentarios-largura {
  width: 35vw !important;
  background-color: var(--fundo-card);
  max-height: 85vh;
  height: auto;
  display: flex;
  flex-direction: column;
  gap: 0.8vw;
  padding: 2vw;
  border-radius: 7px;
  border: var(--borda-padrao);
  box-sizing: border-box;
}
.div-imagem {
  background-color: var(--hover-botoes);
  width: 3vw;
  height: 3vw;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}
.btn-mini-lixeira {
  display: flex;
  background-color: var(--fundo-card);
  width: 1.5vw;
  height: 1.5vw;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  cursor: pointer;
}
.cancelarAlteracoes {
  width: 100%;
  padding: 0.5vw;
  background-color: var(--fundo-card);
  border-radius: 10px;
  border: var(--borda-padrao);
  font-weight: bolder;
  cursor: pointer;
  color: var(--texto-principal);
}
.cancelarAlteracoes:hover {
  border: 1px transparent #000;
  background-color: #dc3545;
  color: #fff;
  transform: scale(1.025);
  transition: 0.3s;
}
.div-btn-like-dislike {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5vw;
}
.div-btn-like-dislike button {
  border-radius: 50%;
}
.div-btn-like-dislike button:hover {
  background-color: var(--hover-botoes);
}
.btn-mini-lixeira:hover {
  background-color: var(--hover-botoes);
}
.btn-mini-lixeira img {
  width: 1vw;
  height: 1vw;
}
.cabecalho-modal-mural {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5vw;
}
.inputFormEdit {
  padding: 0.7vw;
  width: 100%;
  border: var(--borda-padrao);
  border-radius: 10px 0 0 10px;
  outline: none;
  background-color: var(--fundo-card);
  color: var(--texto-principal);
}
.inputFormEdit::placeholder {
  color: var(--texto-mais-suave);
}
.filtros-mural-abas {
  display: flex;
  gap: 0.4vw;
}
.filtros-mural-abas button {
  background: none;
  border: var(--borda-padrao);
  border-radius: 15px;
  padding: 0.8vw 0.6vw;
  font-size: 0.8vw;
  font-weight: bold;
  cursor: pointer;
  color: var(--texto-principal);
}
.salvarAlteracoes {
  padding: 0.5vw;
  width: 7.2vw;
  border-radius: 10px;
  font-size: 1vw;
  border: none;
  background-color: var(--fundo-card-va);
  font-weight: bold;
  color: #fff;
}
.salvarAlteracoes:hover {
  background-color: var(--fundo-card-va-hover);
  cursor: pointer;
  transform: scale(1.02);
  transition: 0.3s;
}
.salvarAlteracoes:active {
  transform: scale(0.92);
}
.overlay {
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.filtros-mural-abas button.ativo {
  background-color: var(--texto-principal);
  color: var(--texto-principal-reverso);
}
.caixa-inserir-comentario-modal {
  display: flex;
  gap: 0.1vw;
  width: 100%;
  justify-content: space-between;
}
.btn-mural-enviar {
  padding: 0 1.2vw !important;
  font-size: 0.8vw !important;
  white-space: nowrap;
  border-radius: 0 7px 7px 0;
}
.container-scroll-comentarios-mural {
  flex-grow: 1;
  max-height: 45vh;
  display: flex;
  flex-direction: column;
  gap: 0.6vw;
  padding-right: 0.5vw;
  overflow-y: auto !important;
  overflow-x: hidden !important;
}
.card-resposta-linha {
  display: flex;
  gap: 0.8vw;
  position: relative;
  background-color: var(--fundo-card-modal);
  border: 1px solid #eee;
  padding: 0.6vw;
  border-radius: 6px;
  padding: 0.6vw 2.5vw 0.6vw 0.6vw;
  width: 100%;
  box-sizing: border-box;
  word-wrap: break-word;
}
.avatar-mural-mini {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #cbd5e1;
}
.corpo-resposta-conteudo {
  display: flex;
  flex-direction: column;
  gap: 0.1vw;
  width: 100%;
}
.identidade-resposta-autor {
  font-size: 0.8vw;
}
.texto-mensagem-comentario {
  font-size: 0.85vw;
  color: var(--texto-principal);
  width: 26vw;
  padding: 0 1vw 0 0;
}
.linha-votos-comentario-botoes {
  display: flex;
  align-items: center;
  gap: 0.6vw;
  margin-top: 0.2vw;
  justify-content: flex-start;
  width: 100%;
  box-sizing: border-box;
}
.btn-mini-voto {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.75vw;
  color: var(--texto-suave);
  display: flex;
  gap: 0.5vw;
}
.btn-mini-voto img {
  width: 1vw;
  height: auto;
}
.btn-mini-voto:hover {
  transform: scale(1.05);
  transition: 0.2s;
}
.btn-mini-voto:active {
  transform: scale(0.92);
}
.comentario-votado-like {
  color: #28a745 !important;
  font-weight: bold;
}
.comentario-votado-dislike {
  color: #dc3545 !important;
  font-weight: bold;
}
.borda-topo-modal-mural {
  border-top: 1px solid #eee;
  padding-top: 0.5vw;
}
.texto-vazio-comentarios {
  font-size: 0.8vw;
  color: var(--texto-suave);
  text-align: center;
  margin: 1vw 0;
  }
</style>
<style>
.container-scroll-comentarios-mural::-webkit-scrollbar {
  width: 6px !important;
  display: block !important;
}
.container-scroll-comentarios-mural::-webkit-scrollbar-track {
  background: var(--fundo-card) !important;
  border-radius: 10px !important;
}
.container-scroll-comentarios-mural::-webkit-scrollbar-thumb {
  background: var(--cor-detalhe-escuro, #005cb9) !important;
  border-radius: 10px !important;
  border: 1px solid var(--fundo-card) !important;
}
.container-scroll-comentarios-mural::-webkit-scrollbar-thumb:hover {
  background: var(--fundo-card-va-hover, #004b96) !important;
}
</style>
