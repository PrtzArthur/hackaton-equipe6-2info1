<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import userBlackFull from '@/icons/userBlackFull.svg';

const router = useRouter();

const postagensFeedGlobal = ref([]);
const carregandoFeed = ref(true);
const carregandoMais = ref(false);

const paginaAtual = ref(1);
const fimDoFeed = ref(false);

async function carregarTimelineGlobal(novaPagina = 1) {
  if (novaPagina === 1) carregandoFeed.value = true;
  else carregandoMais.value = true;

  try {
    const resposta = await fetch(`http://localhost:3000/api/criar/feed/global?page=${novaPagina}`);

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
function irParaPerfilDoAutor(idAutor) {
  router.push(`/usuario/${idAutor}`);
}

function carregarProximoLote() {
  if (!fimDoFeed.value) {
    carregarTimelineGlobal(paginaAtual.value + 1);
  }
}

onMounted(() => {
  carregarTimelineGlobal();
});
</script>


<template>
  <main>
    <section class="coluna-central-feed">
      <div class="cabecalho-feed">
        <h2>Página Inicial</h2>
      </div>
      <div v-if="carregandoFeed" class="aviso-carregando-home">
        <span>Buscando publicações do IFC...</span>
      </div>
      <div v-else-if="postagensFeedGlobal.length === 0" class="aviso-carregando-home">
        <span>Nenhuma publicação ativa encontrada no momento.</span>
      </div>
      <div v-else class="lista-postagens-globais">
        <div v-for="post in postagensFeedGlobal" :key="post.id_postagem" class="cartao-postagem-usuario">
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
              <div v-for="opcao in post.opcoes" :key="opcao.id_opcao" class="opcao-voto-card">
                <button type="button" class="btn-votar-enquete">
                  {{ opcao.texto_opcao }}
                </button>
              </div>
            </div>
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
            {{ caravansMais ? 'Buscando mais posts...' : 'Carregar mais publicações' }}
          </button>
          <span v-else class="texto-fim-feed">✨ Você chegou ao fim da timeline do IFchat!</span>
        </div>
      </div>
    </section>
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
.nomes-autor-post {
  display: flex;
  flex-direction: column;
}
.nome-real-autor {
  font-size: 1vw;
  color: #000;
}
.handle-autor {
  font-size: 0.8vw;
  color: #7a7a7a;
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
</style>

