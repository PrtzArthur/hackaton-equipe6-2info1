<script setup>
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
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
import setaParaBaixo from '@/icons/setaParaBaixo.svg';
import setaParaCima from '@/icons/setaParaCima.svg';
import reload from '@/icons/reload.svg';
import Folder from '@/icons/Folder.svg';
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
const gatilhoScrollInfinito = ref(null);
const paginaAtual = ref(1);
const fimDoFeed = ref(false);
const meuIdLogado = ref('');
let observadorSensor = null;


const textoBusca = ref('');
async function carregarTimelineGlobal(novaPagina = 1) {
  if (novaPagina === 1) carregandoFeed.value = true;
  else carregandoMais.value = true;

  try {
    const termo = encodeURIComponent(textoBusca.value.trim());
    const url = `http://localhost:3000/api/criar/feed/global?page=${novaPagina}&meuId=${meuIdLogado.value}&busca=${termo}`;
    const resposta = await fetch(url);

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
    console.error("Erro ao filtrar a timeline:", erro);
  } finally {
    carregandoFeed.value = false;
    carregandoMais.value = false;
  }
}
let temporizadorBusca = null;
watch(textoBusca, () => {
  clearTimeout(temporizadorBusca);

  temporizadorBusca = setTimeout(() => {
    fimDoFeed.value = false;
    carregandoFeed.value = true;
    carregarTimelineGlobal(1);
  }, 300);
});

const sugestoesAbertas = ref(true);
const topicosAbertos = ref(true);
const listaSugestaoPerfis = ref([]);
const listaTopicosEmAlta = ref([]);
const mostrarModalSalvar = ref(false);
const idPostagemAlvoParaSalvar = ref(null);
const listasDePastasDisponiveis = ref([]);
const nomeNovaListaRapida = ref('');

async function abrirModalDeSelecaoDePasta(idPostagem) {
  idPostagemAlvoParaSalvar.value = idPostagem;
  mostrarModalSalvar.value = true;
  listasDePastasDisponiveis.value = [];

  try {
    const r = await fetch(`http://localhost:3000/api/chat/listas-usuario/${meuIdLogado.value}`);
    if (r.ok) {
      listasDePastasDisponiveis.value = await r.json();
    }
  } catch (e) {
    console.error("Erro ao carregar listas do usuário", e);
  }
}
async function confirmarSalvamentoNaPasta(idLista) {
  try {
    const r = await fetch('http://localhost:3000/api/chat/salvar-post-na-lista', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_lista: idLista,
        id_postagem: idPostagemAlvoParaSalvar.value
      })
    });
    const dados = await r.json();
    if (r.ok) {
      alert(dados.mensagem || "Salvo com sucesso!");
      const postAlvo = postagensFeedGlobal.value.find(p => p.id_postagem === idPostagemAlvoParaSalvar.value);
      if (postAlvo) {
        postAlvo.naoSalvo = true;
      }
      mostrarModalSalvar.value = false;
    } else {
      alert(dados.erro || "Falha ao salvar");
    }
  } catch (e) {
    console.error("Erro ao salvar post na pasta", e);
  }
}
async function handleCriarListaRapida() {
  if (!nomeNovaListaRapida.value.trim()) return;
  try {
    const r = await fetch('http://localhost:3000/api/chat/criar-lista-rapida', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome_lista: nomeNovaListaRapida.value,
        id_usuario: meuIdLogado.value
      })
    });
    if (r.ok) {
      const novaLista = await r.json();
      listasDePastasDisponiveis.value.push(novaLista);
      nomeNovaListaRapida.value = '';
    }
  } catch (e) { console.error(e); }
}
async function carregarSugestoesPerfis() {
  const idSeguroLocalStorage = localStorage.getItem('ifchat_user_id') || '';

  if (!idSeguroLocalStorage) {
    console.warn("Aviso: Usuário não identificado para gerar a barra lateral.");
    return;
  }

  try {
    const resposta = await fetch(`http://localhost:3000/api/criar/sidebar/sugestoes?meuId=${idSeguroLocalStorage}`);

    if (resposta.ok) {
      listaSugestaoPerfis.value = await resposta.json();
    }
  } catch (e) {
    console.error("Erro de comunicação ao carregar sugestões laterais:", e);
  }
}
async function carregarTopicosSidebar() {
  try {
    const resposta = await fetch('http://localhost:3000/api/criar/sidebar/topicos');
    if (resposta.ok) {
      listaTopicosEmAlta.value = await resposta.json();
    }
  } catch (e) { console.error("Erro ao carregar tópicos laterais", e); }
}
async function seguirUsuarioPelaSidebar(idCriadorAlvo) {
  try {
    const resposta = await fetch('http://localhost:3000/api/usuario/seguir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idSeguidor: meuIdLogado.value, idSeguido: idCriadorAlvo })
    });

    if (resposta.ok) {
      toast.success("Perfil seguido!");
      listaSugestaoPerfis.value = listaSugestaoPerfis.value.filter(p => p.id_usuario !== idCriadorAlvo);
      if (listaSugestaoPerfis.value.length === 0) carregarSugestoesPerfis();
    }
  } catch (erro) { console.error("Erro ao seguir pela sidebar", erro); }
}
const girando = ref(false);
function dispararGiro() {
  if (girando.value) return;
  girando.value = true;

  carregarSugestoesPerfis();

  setTimeout(() => {
    girando.value = false;
  }, 500);
}
function gerenciarCliqueDoBotao() {
  carregarSugestoesPerfis();
  dispararGiro();
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
async function carregarProximoLote() {
  if (!fimDoFeed.value && !carregandoMais.value) {
    carregandoMais.value = true;

    await carregarTimelineGlobal(paginaAtual.value + 1);

    carregandoMais.value = false;
  }
}
onMounted(async () => {
  meuIdLogado.value = localStorage.getItem('ifchat_user_id') || '';
  carregarSugestoesPerfis();
  carregarTopicosSidebar();
  await carregarTimelineGlobal(1);
  await nextTick();

  observadorSensor = new IntersectionObserver((entradas) => {
    const alvoFicouVisivel = entradas[0].isIntersecting;
    if (alvoFicouVisivel) {
      carregarProximoLote();
    }
  }, {
    rootMargin: '200px'
  });
  if (gatilhoScrollInfinito.value) {
    observadorSensor.observe(gatilhoScrollInfinito.value);
  }
});
onUnmounted(() => {
  if (observadorSensor) observadorSensor.disconnect();
});
</script>

<template>
  <main>
    <input v-model.trim="textoBusca" type="text" placeholder="Procurar por..." class="barra-de-pesquisa">
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
                  :disabled="post.autor.id === meuIdLogado">
                  <div v-if="post.jaVotado" class="fundo-progresso-verde" :style="{ width: opcao.porcentagem + '%' }"></div>
                  <div class="conteudo-resultado-linha">
                    <span class="texto-opcao-voto">
                      {{ opcao.texto_opcao }}
                      <strong v-if="opcao.votadoPorMim" class="opcao-escolhida">★</strong>
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
              <img v-if="post?.meu_voto_post === 'like'" :src="likePreenchido" alt="Curtido" class="img-preenchido">
              <img v-else :src="likeInline" alt="curtir" class="btn-post-img">
            </button>
            <span class="qnt-likes-dislikes">{{ post.total_likes }}</span>
            <button :disabled="post.autor.id === meuIdLogado" class="btn-post" @click.prevent="curtirPost(post, meuIdLogado, 'dislike')">
              <img v-if="post?.meu_voto_post === 'dislike'" :src="dislikePreenchido" alt="Descurtido" class="img-preenchido">
              <img v-else :src="dislikeInline" alt="não curtir" class="btn-post-img">
            </button>
            <span class="qnt-likes-dislikes">{{ post.total_dislikes }}</span>
            <button class="btn-post" @click="abrirMural(post)"><img :src="comentarios" alt="comentar" class="btn-post-img"></button>
            <button class="btn-post"><img :src="compartilhar" alt="compartilhar" class="btn-post-img"></button>
            <button type="button" class="btn-post" @click="abrirModalDeSelecaoDePasta(post.id_postagem)" title="Salvar em uma lista">
              <img v-if="post.naoSalvo" :src="marcadorInline" alt="Salvar" class="btn-post-img">
              <img v-else :src="marcadorPreenchido" alt="Salvo" class="img-preenchido">
            </button>
          </div>
          <span class="data-do-post">
            Publicado em: {{ new Date(post.data_envio).toLocaleDateString('pt-BR') }}
          </span>
        </div>
        <div ref="gatilhoScrollInfinito" class="container-paginacao-home">
          <div v-if="!fimDoFeed" class="bloco-loading-scroll">
            <span class="loading-scroll-texto">Buscando mais publicações do IFC...</span>
          </div>
          <span v-else class="texto-fim-feed">Você chegou ao fim da timeline do IFchat!</span>
        </div>
      </div>
    </section>
    <ModalComentarios
  :isOpen="modalAberto"
  :post="postSelecionado"
  @fechar="modalAberto = false"
/>
    <div v-if="mostrarModalSalvar" class="overlay">
      <div class="caixa-corpo-modal-salvamento">
        <div class="topo-modal-salvar-header">
          <h3>Salvar postagem em qual lista?</h3>
          <button @click="mostrarModalSalvar = false" class="btn-fechar-modal-x">×</button>
        </div>
        <div v-if="listasDePastasDisponiveis.length === 0" class="container-sem-listas-aviso">
          <p class="frase-aviso-sem-listas">Sem listas para salvar</p>
        </div>
        <div v-else class="lista-de-pastas-opcoes-scroll">
          <button
            v-for="lista in listasDePastasDisponiveis"
            :key="lista.id_lista"
            @click="confirmarSalvamentoNaPasta(lista.id_lista)"
            class="btn-opcao-pasta-item">
            <img :src="Folder" alt=""> {{ lista.nome_lista }}
          </button>
        </div>
        <div class="bloco-criar-nova-lista-rapida">
          <input
            v-model="nomeNovaListaRapida"
            type="text"
            placeholder="Criar nova lista..."
            @keyup.enter="handleCriarListaRapida"
            maxlength="50"
            class="input-criar-lista-rapida"
          >
          <button @click="handleCriarListaRapida" class="btn-enviar-nova-lista-add">+</button>
        </div>
      </div>
    </div>
    <aside class="coluna-lateral-direita">
      <section class="box-sidebar-container">
        <h3 @click="sugestoesAbertas = !sugestoesAbertas" class="titulo-retratil">
          Sugestões para você
          <Transition name="troca-icone" mode="out-in">
            <img v-if="sugestoesAbertas" :src="setaParaCima" alt="tópicos abertos" key="ativo" class="seta">
            <img v-else :src="setaParaBaixo" alt="" class="seta" key="inativo">
          </Transition>
        </h3>
        <div class="corpo-retratil-container" :class="{ 'aba-recolhida': !sugestoesAbertas }">
          <div class="lista-sugestoes-wrapper">
            <div v-for="perfil in listaSugestaoPerfis" :key="perfil.id_usuario" class="card-sugestao-linha">
              <div class="div-imagem-perfil">
                <img :src="perfil.foto_profile || '/src/icons/userBlackFull.svg'" alt="Avatar" class="avatar-sugestao-mini" @click="irParaPerfilDoAutor(perfil.id_usuario)">
              </div>
              <div class="info-sugestao-texto">
                <div class="bloco-nomes-user">
                  <strong>{{ perfil.nome }}</strong>
                  <span>@{{ perfil.username }}</span>
                </div>
                <button type="button" @click="seguirUsuarioPelaSidebar(perfil.id_usuario)" class="btn-seguir-sidebar">
                  Seguir
                </button>
              </div>
            </div>
          </div>
          <button type="button" @click="gerenciarCliqueDoBotao" class="btn-refresh-sidebar" title="Ver novas sugestões">
            <img :src="reload" alt="" class="icone-loop" :class="{ 'rodando-360': girando }">
          </button>
        </div>
      </section>
      <section class="box-sidebar-container">
        <h3 @click="topicosAbertos = !topicosAbertos" class="titulo-retratil">
          Tópicos em alta
          <Transition name="troca-icone" mode="out-in">
            <img v-if="topicosAbertos" :src="setaParaCima" alt="tópicos abertos" key="ativo" class="seta">
            <img v-else :src="setaParaBaixo" alt="" class="seta" key="inativo">
          </Transition>
        </h3>
        <div class="corpo-retratil-container" :class="{ 'aba-recolhida': !topicosAbertos }">
          <div class="lista-topicos-wrapper">
            <div v-for="(topico, index) in listaTopicosEmAlta" :key="index" class="card-topico-linha">
              <span class="nome-topico-hashtag">#{{ topico.nome }}</span>
              <span class="ranking-posicao">#{{ index + 1 }}</span>
            </div>
          </div>
        </div>
      </section>
    </aside>
  </main>
</template>

<style scoped>
[data-theme="dark"] .img-preenchido {
  filter: hue-rotate(135deg) saturate(1.8) brightness(1.1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .btn-post-img {
  filter: invert(1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .icone-loop {
  filter: invert(1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .seta {
  filter: invert(1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .img-autor-home-default {
  filter: invert(1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .avatar-sugestao-mini[src$="userBlackFull.svg"] {
  filter: invert(1);
}
.avatar-sugestao-mini[src$="userBlackFull.svg"] {
  width: 4vw;
  height: auto;
}
.fundo-mascara-modal-salvamento {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background-color: rgba(0, 0, 0, 0.4) !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  z-index: 9999 !important;
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
.caixa-corpo-modal-salvamento {
  background-color: var(--fundo-card);
  border: var(--borda-padrao);
  border-radius: 12px;
  width: 30vw;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1.2vw;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}
.topo-modal-salvar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.topo-modal-salvar-header h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--texto-principal);
  margin: 0;
}
.btn-fechar-modal-x {
  background: none;
  border: var(--borda-padrao);
  width: 1.5vw;
  height: 1.5vw;
  display: flex;
  border-radius: 5px;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--texto-principal);
  transition: transform 0.1s ease;
}
.btn-fechar-modal-x:hover {
  transform: scale(1.2);
  transition: 0.3s;
  background-color: #dc3545;
  color: var(--texto-principal-reverso);
}
.container-sem-listas-aviso {
  padding: 20px 10px;
  text-align: center;
}
.frase-aviso-sem-listas {
  font-style: italic;
  color: var(--texto-suave, #94a3b8);
  font-size: 0.9rem;
  margin: 0;
}
.lista-de-pastas-opcoes-scroll {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 160px;
  overflow-y: auto;
  padding-right: 4px;
}
.lista-de-pastas-opcoes-scroll::-webkit-scrollbar {
  width: 4px;
}
.lista-de-pastas-opcoes-scroll::-webkit-scrollbar-thumb {
  background-color: var(--borda-padrao);
  border-radius: 10px;
}
.btn-opcao-pasta-item {
  display: flex;
  gap: 0.5vw;
  width: 100%;
  padding: 10px 12px;
  background-color: var(--fundo-site, #f8fafc);
  border: 1px solid var(--borda-padrao);
  border-radius: 6px;
  text-align: left;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--texto-principal);
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  align-items: center;
}
.btn-opcao-pasta-item:hover {
  background-color: var(--hover-botoes, #e2e8f0);
  border-color: var(--cor-detalhe-escuro, #3cbc00);
}
.bloco-criar-nova-lista-rapida {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
.input-criar-lista-rapida {
  flex-grow: 1;
  padding: 8px 12px;
  border: var(--borda-padrao);
  border-radius: 6px;
  background-color: var(--fundo-card);
  color: var(--texto-principal);
  font-size: 0.85rem;
  outline: none;
}
.btn-enviar-nova-lista-add {
  background-color: #3cbc00;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.btn-enviar-nova-lista-add:hover {
  transform: scale(1.1);
  background-color: #2c8200;
}
.div-imagem-perfil {
  width: 3vw;
  height: 3vw;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  background-color: var(--hover-botoes);
}
.rodando-360 {
  animation: girarGatilho 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes girarGatilho {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.troca-icone-enter-active,
.troca-icone-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.troca-icone-enter-from,
.troca-icone-leave-to {
  opacity: 0;
  transform: scale(0.8) rotate(-10deg);
}
main {
  height: 100vh;
  flex-grow: 1;
  padding: 1.5vw;
  margin-left: 12vw;
  width: calc(100% - 14vw);
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  box-sizing: border-box;
  overflow: hidden;
  overflow-x: hidden;
}
.coluna-central-feed {
  background-color: var(--fundo-card);
  position: fixed;
  width: 40%;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translate(-50%);
  margin-top: 4vw;
  border-radius: 9px 9px 0 0;
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
  background-color: var(--fundo-card);
  border: none;
}
.btn-post:hover {
  transform: scale(1.12);
}

.btn-post:active {
  transform: scale(0.92);
}
.opcao-escolhida {
  color: var(--opcao-escolhida);
  font-size: 0.8vw;
  margin-bottom: 0.7vw;
}
.texto-opcao-voto {
  font-size: 1vw;
}
.btn-post:hover {
  background-color: var(--hover-botoes);
  cursor: pointer;
  transition: 0.3s;
}
.coluna-lateral-direita {
  position: fixed;
  top: 4vw;
  right: 5vw;
  width: 20vw;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
}
.box-sidebar-container {
  background-color: var(--fundo-card);
  border: var(--borda-padrao);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  transition: border-color 0.3s ease, background-color 0.3s ease;
}
.titulo-retratil {
  margin: 0;
  padding: 0.5vw 1.5vw;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--texto-principal);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid var(--borda-padrao);
}
.titulo-retratil:hover {
  background-color: var(--hover-botoes);
  transition: 0.3s;
}
.corpo-retratil-container {
  max-height: 500px;
  opacity: 1;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
  display: flex;
  flex-direction: column;
}
.corpo-retratil-container.aba-recolhida {
  max-height: 0px !important;
  opacity: 0;
  pointer-events: none;
}
.lista-sugestoes-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.card-sugestao-linha {
  border: 1px solid var(--borda-padrao);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: var(--fundo-card);
}
.avatar-sugestao-mini {
  width: 3vw;
  height: 3vw;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--borda-padrao);
  cursor: pointer;
}
.info-sugestao-texto {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-grow: 1;
  box-sizing: border-box;
}
.bloco-nomes-user {
  display: flex;
  flex-direction: column;
  max-width: 65%;
}
.info-sugestao-texto strong {
  font-size: 0.88rem;
  color: var(--texto-principal);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.info-sugestao-texto span {
  font-size: 0.78rem;
  color: var(--texto-suave);
}
.btn-seguir-sidebar {
  background-color: var(--fundo-card-va);
  color: #ffffff;
  border: none;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  right: 0;
  transition: background-color 0.2s ease, transform 0.1s ease;
}
.btn-seguir-sidebar:hover {
  background-color: var(--fundo-card-va-hover);
  transform: scale(1.02);
}
.btn-refresh-sidebar {
  background-color: var(--fundo-card);
  border: 1px solid var(--borda-padrao);
  border-radius: 20px;
  width: 80%;
  margin: 4px auto 12px auto;
  padding: 6px 0;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease;
  border: var(--borda-padrao);
}
.btn-refresh-sidebar:hover {
  background-color: var(--hover-botoes);
  transform: scale(1.02);
}
.icone-loop {
  font-size: 1rem;
}
.lista-topicos-wrapper {
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 8px;
}
.card-topico-linha {
  border: 1px solid var(--borda-padrao);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--fundo-card);
}
.nome-topico-hashtag {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--texto-principal);
}
.ranking-posicao {
  font-size: 0.8rem;
  color: var(--texto-suave);
  font-weight: 500;
  margin: 0 0.7vw;
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
  gap: 0.2vw;
}
.porcentagem-texto-voto {
  color: var(--fundo-card-va);
  font-weight: bolder;
}
.texto-aviso {
  font-weight: bolder;
  color: var(--fundo-card-va);
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
  padding: 0.5vw 0.5vw;
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
  background-color: var(--hover-botoes);
  display: flex;
  justify-content: center;
  align-items: center;
}
.img-autor-home{
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.img-autor-home-default {
  object-fit: cover;
  width: 4vw;
  height: 4vw;
}
.barra-de-pesquisa {
  outline: none;
  font-size: 1vw;
  position: fixed;
  top: 0;
  left: 50%;
  color: var(--texto-suave);
  transform: translate(-50%);
  border: 0.5px solid var(--texto-principal);
  background-color: var(--fundo-card);
  padding: 0.5vw;
  margin: 1vw 0;
  border-radius: 20px;
  width: 40vw;
}
.barra-de-pesquisa::placeholder {
  color: var(--texto-mais-suave);
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
  color: var(--texto-principal);
  overflow: hidden;
  text-overflow: ellipsis;
}
.handle-autor {
  font-size: 0.8vw;
  color: var(--texto-suave);
  overflow: hidden;
  text-overflow: ellipsis;
}
.container-paginacao-home {
  display: flex;
  justify-content: center;
  padding: 1.5vw 0;
  width: 100%;
}
.qnt-likes-dislikes {
  font-size: 1vw;
  color: var(--texto-suave);
}
.btn-carregar-mais {
  background-color: var(--fundo-card);
  border: 1px solid var(--fundo-card-va);
  color: var(--fundo-card-va);
  padding: 0.6vw 2vw;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9vw;
  cursor: pointer;
  transition: 0.2s;
}
.btn-carregar-mais:hover:not(:disabled) {
  background-color: var(--fundo-card-va);
  color: #fff;
}
.btn-carregar-mais:disabled {
  border-color: #ccc;
  color: var(--texto-suave);
  cursor: not-allowed;
}
.texto-fim-feed {
  font-size: 0.9vw;
  color: var(--texto-suave);
  font-style: italic;
}
.lista-postagens-globais {
  border-bottom: var(--borda-padrao);
  display: flex;
  flex-direction: column;
  padding: 1vw;
  min-width: 100%;
  gap: 1vw;
}
.texto-do-post {
  font-size: 1vw;
  color: var(--texto-principal);
  margin: 0;
  overflow-wrap: break-word;
  max-width: 32vw;
}
.data-do-post {
  font-size: 0.8vw;
  color: var(--texto-suave);
}
.render-enquete-post {
  display: flex;
  flex-direction: column;
  gap: 0.5vw;
  margin: 0.5vw 0;
  width: 100%;
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
  background-color: var(--fundo-card);
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
  border-color: var(--fundo-card-va);
  background-color: var(--fundo-opcao-enquete);
}
.opcao-selecionada-local {
  border: 1.5px solid var(--fundo-card-va) !important;
}
.fundo-progresso-verde {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background-color: var(--fundo-opcao-enquete);
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
  color: var(--texto-principal);
  font-weight: 500;
  pointer-events: none;
}
.total-votos-legenda {
  font-size: 0.8vw;
  color: var(--texto-suave);
  margin-top: 0.1vw;
  font-style: italic;
}
@media (max-width: 728px) {
  main {
    position: relative !important;
    top: auto !important;
    left: auto !important;
    right: auto !important;
    margin-left: 0 !important;
    width: 100vw !important;
    min-height: calc(100vh - 120px) !important;
    padding-bottom: 75px !important;
    box-sizing: border-box !important;
    overflow-y: visible !important;
  }
  section {
    position: relative !important;
    top: auto !important;
    bottom: auto !important;
    left: auto !important;
    transform: none !important;
    width: 100% !important;
    max-width: 100vw !important;
    margin-top: 0 !important;
    padding-top: 15px !important;
    padding-bottom: 80px !important;
    border: none !important;
    border-radius: 0 !important;
    overflow-y: visible !important;
    box-sizing: border-box !important;
  }
  .barra-de-pesquisa {
    top: auto !important;
    position: relative;
  }
}
</style>


