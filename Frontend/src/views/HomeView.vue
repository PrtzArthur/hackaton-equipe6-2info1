<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import userBlackFull from '@/icons/userBlackFull.svg';
import { useToast } from 'vue-toastification';
import marcadorInline from '@/icons/marcadorInline.svg';
import marcadorPreenchido from '@/icons/marcadorPreenchido.svg';
import likePreenchido from '@/icons/likePreenchido.svg';
import likeInline from '@/icons/likeInline.svg';
import compartilhar from '@/icons/compartilhar.svg';
import comentarios from '@/icons/comentarios.svg';
import dislikeInline from '@/icons/dislikeInline.svg';
import dislikePreenchido from '@/icons/dislikePreenchido.svg';
import ModalComentarios from '@/components/ModalComentarios.vue';

const router = useRouter();
const toast = useToast();

const modalAberto = ref(false);
const postSelecionado = ref(null);

function abrirMural(post) {
  postSelecionado.value = post;
  modalAberto.value = true;
}

const postagensFeedGlobal = ref([]);
const carregandoFeed = ref(true);
const carregandoMais = ref(false);

const paginaAtual = ref(1);
const fimDoFeed = ref(false);
const meuIdLogado = ref('');

async function carregarTimelineGlobal(novaPagina = 1) {
  if (novaPagina === 1) carregandoFeed.value = true;
  else carregandoMais.value = true;

  try {
    const resposta = await fetch(`http://localhost:3000/api/criar/feed/global?page=${novaPagina}&meuId=${meuIdLogado.value}`);

    if (resposta.ok) {
      const novosPosts = await resposta.json();

      if (novosPosts.length < 6) {
        fimDoFeed.value = true;
      }
      if (novaPagina === 1) {
        postagensFeedGlobal.value = novosPosts;
      } else {
        postagensFeedGlobal.value = [...postagensFeedGlobal.value, ...novosPosts];
      }

      paginaAtual.value = novaPagina;
    }
  } catch (erro) {
    console.error("Erro ao carregar a timeline do IFchat:", erro);
  } finally {
    carregandoFeed.value = false;
    carregandoMais.value = false;
  }
}
async function curtirPost(postagemAlvo, idUsuarioLogado, tipoEscolhido) {
  if (!idUsuarioLogado) {
    toast.warning("Você precisa estar logado para interagir!");
    return;
  }

  try {
    const resposta = await fetch('http://localhost:3000/api/criar/curtir/postagem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idDoUsuario: idUsuarioLogado,
        idDaPostagem: postagemAlvo.id_postagem,
        tipoVoto: tipoEscolhido
      })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      const votoAntigo = postagemAlvo.meu_voto_post;

      postagemAlvo.meu_voto_post = dados.votoAtual;

      if (dados.votoAtual === null) {
        if (votoAntigo === 'like') postagemAlvo.total_likes--;
        if (votoAntigo === 'dislike') postagemAlvo.total_dislikes--;
      }
      else if (!votoAntigo) {
        if (dados.votoAtual === 'like') postagemAlvo.total_likes++;
        if (dados.votoAtual === 'dislike') postagemAlvo.total_dislikes++;
      }
      else if (votoAntigo !== dados.votoAtual) {
        if (dados.votoAtual === 'like') {
          postagemAlvo.total_likes++;
          postagemAlvo.total_dislikes--;
        } else {
          postagemAlvo.total_likes--;
          postagemAlvo.total_dislikes++;
        }
      }
    } else {
      toast.error(dados.erro || "Falha ao registrar interação.");
    }
  } catch(erro) {
    console.error('Erro ao curtir post:', erro);
  }
}
async function votarNaEnquete(idOpcao, idPostagem) {
  try {
    const resposta = await fetch('http://localhost:3000/api/criar/enquetes/votar/opcao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idUsuario: meuIdLogado.value,
        idOpcao: idOpcao,
        idPostagem: idPostagem
      })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      toast.success(dados.mensagem || "Voto processado!");

      const postAlvo = postagensFeedGlobal.value.find(p => p.id_postagem === idPostagem);

      if (postAlvo) {
        postAlvo.opcoes = dados.novasOpcoes;
        postAlvo.totalVotosGeral = dados.totalVotosGeral;
        postAlvo.jaVotado = dados.jaVotado;
      }

    } else {
      toast.error(dados.erro || 'Erro com o voto');
    }
  } catch (erro) {
    console.error('Erro ao votar', erro);
  }
};
function irParaPerfilDoAutor(idAutor) {
  router.push(`/usuario/${idAutor}`);
}

function carregarProximoLote() {
  if (!fimDoFeed.value) {
    carregarTimelineGlobal(paginaAtual.value + 1);
  }
}

onMounted(() => {
  meuIdLogado.value = localStorage.getItem('ifchat_user_id') || '';
  carregarTimelineGlobal();
});
</script>

<template>
  <main>
    <input  type="text" placeholder="Procurar por..." class="barra-de-pesquisa">
    <section class="coluna-central-feed">
      <div v-if="carregandoFeed" class="aviso-carregando-home">
        <span class="texto-aviso">Buscando publicações do IFC...</span>
      </div>
      <div v-else-if="postagensFeedGlobal.length === 0" class="aviso-carregando-home">
        <span class="texto-aviso">Nenhuma publicação ativa encontrada no momento.</span>
      </div>
      <div v-else class="containerPai">
        <div v-for="post in postagensFeedGlobal" :key="post.id_postagem" class="lista-postagens-globais">
          <div class="autor-post-cabecalho" @click="irParaPerfilDoAutor(post.autor.id)">
            <div class="avatar-autor-post">
              <img v-if="post.autor.foto" :src="post.autor.foto" alt="Avatar" class="img-autor-home">
              <img v-else :src="userBlackFull" alt="Padrão" class="img-autor-home-default">
            </div>
            <div class="nomes-autor-post">
              <strong class="nome-real-autor">{{ post.autor.nome }}</strong>
              <span class="handle-autor">@{{ post.autor.username }}</span>
            </div>
          </div>

          <p v-if="post.conteudo" class="texto-do-post">{{ post.conteudo }}</p>

          <div v-if="post.imagem" class="container-imagem-post">
            <img :src="post.imagem" alt="Post Imagem" class="imagem-revelada-post">
          </div>

          <div v-if="post.tipo === 'postagemComEnquete' && post.opcoes.length > 0" class="render-enquete-post">
            <div class="lista-opcoes-voto">
              <div v-for="opcao in post.opcoes" :key="opcao.id_opcao" class="card-opcao-container">

                <button
                  type="button"
                  @click.stop.prevent="votarNaEnquete(opcao.id_opcao, post.id_postagem)"
                  class="btn-enquete-dinamico"
                  :class="{ 'opcao-selecionada-local': opcao.votadoPorMim }"
                  :disabled="post.autor.id === meuIdLogado"
                >
                  <div v-if="post.jaVotado" class="fundo-progresso-verde" :style="{ width: opcao.porcentagem + '%' }"></div>

                  <div class="conteudo-resultado-linha">
                    <span class="texto-opcao-voto">
                      {{ opcao.texto_opcao }}
                      <strong v-if="opcao.votadoPorMim">!</strong>
                    </span>
                    <span v-if="post.jaVotado || post.autor.id === meuIdLogado" class="porcentagem-texto-voto">{{ opcao.porcentagem }}%</span>
                  </div>
                </button>
              </div>
            </div>
            <span class="total-votos-legenda">{{ post.totalVotosGeral || 0 }} votos no total</span>
          </div>
          <div v-if="post.tags && post.tags.length > 0" class="container-tags-postagem">
            <span v-for="(tag, index) in post.tags" :key="index" class="pilula-tag-post">
              {{ tag }}
            </span>
          </div>
          <div class="div-botoes-postagens">
            <button :disabled="post.autor.id === meuIdLogado" class="btn-post" @click.prevent="curtirPost(post, meuIdLogado, 'like')">
              <img v-if="post?.meu_voto_post === 'like'" :src="likePreenchido" alt="Curtido">
              <img v-else :src="likeInline" alt="curtir">
            </button>
            <span>{{ post.total_likes }}</span>
            <button :disabled="post.autor.id === meuIdLogado" class="btn-post" @click.prevent="curtirPost(post, meuIdLogado, 'dislike')">
              <img v-if="post?.meu_voto_post === 'dislike'" :src="dislikePreenchido" alt="Descurtido">
              <img v-else :src="dislikeInline" alt="não curtir">
            </button>
            <span>{{ post.total_dislikes }}</span>
            <button class="btn-post" @click="abrirMural(post)"><img :src="comentarios" alt="comentar"></button>
            <button class="btn-post"><img :src="compartilhar" alt="compartilhar"></button>
            <button class="btn-post"><img v-if="!naoSalvo" :src="marcadorInline" alt=""><img v-else :src="marcadorPreenchido" alt="não curtir"></button>
          </div>
          <span class="data-do-post">
            Publicado em: {{ new Date(post.data_envio).toLocaleDateString('pt-BR') }}
          </span>
        </div>
        <div class="container-paginacao-home">
          <button
            v-if="!fimDoFeed"
            type="button"
            @click="carregarProximoLote"
            :disabled="carregandoMais"
            class="btn-carregar-mais"
          >
            {{ carregandoMais ? 'Buscando mais posts...' : 'Carregar mais publicações' }}
          </button>
          <span v-else class="texto-fim-feed">✨ Você chegou ao fim da timeline do IFchat! ✨</span>
        </div>
      </div>
    </section>
    <ModalComentarios
  :isOpen="modalAberto"
  :post="postSelecionado"
  @fechar="modalAberto = false"
/>
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
section {
  background-color: #fff;
  position: fixed;
  width: 40%;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translate(-50%);
  margin-top: 4vw;
  border-radius: 9px 9px 0 0;
  border: 1px solid #000;
  border-bottom: none;
  scrollbar-color: #ccc transparent;
  overflow-y: auto;
  scrollbar-width: thin;
  padding: 2px;
}
.btn-post {
  width: 2.5vw;
  height: 2.5vw;
  border-radius: 50%;
  background-color: #fff;
  border: none;
}
.btn-post:hover {
  background-color: #f9f9f9;
  cursor: pointer;
  transition: 0.2s;
}
.btn-post img {
  width: auto;
  height: 1.5vw;
}
.aviso-carregando-home {
  margin-top: 2vw;
  width: 100%;
  text-align: center;
}
.div-botoes-postagens {
  display: flex;
  align-items: center;
}
.porcentagem-texto-voto {
  color: #3CBC00;
  font-weight: bolder;
}
.texto-aviso {
  font-weight: bolder;
  color: #3CBC00;
}
.imagem-revelada-post {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
}
.container-imagem-post {
  overflow: hidden;
  width: 100%;
  display: flex;
  align-items: center;
  height: auto;
  position: relative;
  border-radius: 10px;
  border: 1px solid #eee;
  margin: 0.3vw 0;
}
.containerPai {
  display: flex;
  flex-direction: column;
  gap: 1vw;
  padding: 2vw 2vw;
}
.container-tags-postagem {
  display: flex;
  gap: 0.3vw;
  font-size: 0.81vw;
  color: blue;
  flex-wrap: wrap;
}
.autor-post-cabecalho {
  display: flex;
  align-items: center;
  gap: 0.8vw;
  cursor: pointer;
  transition: opacity 0.2s;
}
.autor-post-cabecalho:hover {
  opacity: 0.8;
}
.avatar-autor-post {
  width: 3vw;
  height: 3vw;
  border-radius: 50%;
  overflow: hidden;
  background-color: #eee;
}
.img-autor-home, .img-autor-home-default {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.barra-de-pesquisa {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translate(-50%);
  border: 0.5px solid #000;
  background-color: #fff;
  padding: 0.5vw;
  margin: 1vw 0;
  border-radius: 20px;
  width: 40vw;
}
.nomes-autor-post {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 25vw;
  max-width: 25vw;
}
.nome-real-autor {
  font-size: 1vw;
  color: #000;
  overflow: hidden;
  text-overflow: ellipsis;
}
.handle-autor {
  font-size: 0.8vw;
  color: #7a7a7a;
  overflow: hidden;
  text-overflow: ellipsis;
}
.container-paginacao-home {
  display: flex;
  justify-content: center;
  padding: 1.5vw 0;
  width: 100%;
}
.btn-carregar-mais {
  background-color: #fff;
  border: 1px solid #3CBC00;
  color: #3CBC00;
  padding: 0.6vw 2vw;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9vw;
  cursor: pointer;
  transition: 0.2s;
}
.btn-carregar-mais:hover:not(:disabled) {
  background-color: #3CBC00;
  color: #fff;
}
.btn-carregar-mais:disabled {
  border-color: #ccc;
  color: #999;
  cursor: not-allowed;
}
.texto-fim-feed {
  font-size: 0.9vw;
  color: #7a7a7a;
  font-style: italic;
}
.lista-postagens-globais {
  border: 1px solid #000;
  display: flex;
  flex-direction: column;
  padding: 1vw;
  min-width: 100%;
  border-radius: 6px;
  gap: 1vw;
}
.texto-do-post {
  font-size: 1vw;
  color: #111;
  margin: 0;
}
.data-do-post {
  font-size: 0.8vw;
  color: #7a7a7a;
}
.render-enquete-post {
  display: flex;
  flex-direction: column;
  gap: 0.5vw;
  margin: 0.5vw 0;
  width: 100%;
}
.titulo-mini-enquete {
  font-size: 0.95vw;
  font-weight: bold;
  color: #000;
  margin: 0;
}
.lista-opcoes-voto {
  display: flex;
  flex-direction: column;
  gap: 0.4vw;
  width: 100%;
}
.card-opcao-container {
  width: 100%;
  position: relative;
}
.btn-enquete-dinamico {
  position: relative;
  width: 100%;
  height: 2.3vw;
  background-color: #ffffff;
  border: 1px solid #ccc;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: 0;
  transition: border-color 0.2s, background-color 0.2s;
}
.btn-enquete-dinamico:hover {
  border-color: #3CBC00;
  background-color: rgba(60, 188, 0, 0.02);
}
.opcao-selecionada-local {
  border: 1.5px solid #3CBC00 !important;
}
.fundo-progresso-verde {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background-color: rgba(60, 188, 0, 0.22);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}
.conteudo-resultado-linha {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1vw;
  z-index: 2;
  font-family: inherit;
  font-size: 0.95vw;
  color: #000;
  font-weight: 500;
  pointer-events: none;
}
.total-votos-legenda {
  font-size: 0.8vw;
  color: #7a7a7a;
  margin-top: 0.1vw;
  font-style: italic;
}
</style>


