<script setup>
import { ref, onMounted, computed } from 'vue';
import userBlackFull from '@/icons/userBlackFull.svg';
import ModalComentarios from '@/components/ModalComentarios.vue';
import marcadorInline from '@/icons/marcadorInline.svg';
import marcadorPreenchido from '@/icons/marcadorPreenchido.svg';
import likePreenchido from '@/icons/likePreenchido.svg';
import likeInline from '@/icons/likeInline.svg';
import compartilhar from '@/icons/compartilhar.svg';
import comentarios from '@/icons/comentarios.svg';
import dislikeInline from '@/icons/dislikeInline.svg';
import dislikePreenchido from '@/icons/dislikePreenchido.svg';
import iconeLupa from '@/icons/iconeLupa.svg';
import setinha from '@/icons/setinha.svg';
import { useToast } from 'vue-toastification';

const toast = useToast();

const meuIdLogado = ref(localStorage.getItem('ifchat_user_id') || '');
const buscaLista = ref('');
const buscaPostagem = ref('');
const listaSelecionada = ref(null);
const minhasListasSalvas = ref([]);
const postagensDaListaAtiva = ref([]);

const modalAberto = ref(false);
const postSelecionado = ref(null);

function abrirMural(post) {
  postSelecionado.value = post;
  modalAberto.value = true;
}
async function carregarMinhasListas() {
  if (!meuIdLogado.value) return;
  try {
    const r = await fetch(`http://localhost:3000/api/chat/listas-completo/${meuIdLogado.value}`);
    if (r.ok) {
      minhasListasSalvas.value = await r.json();
    }
  } catch (e) {
    console.error("Erro ao carregar listas salvas:", e);
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
async function abrirPastaSalva(lista) {
  listaSelecionada.value = lista;
  postagensDaListaAtiva.value = [];
  buscaPostagem.value = '';

  try {
    const r = await fetch(`http://localhost:3000/api/chat/posts-da-lista/${lista.id_lista}?meuId=${meuIdLogado.value}`);
    if (r.ok) {
      postagensDaListaAtiva.value = await r.json();
    }
  } catch (e) {
    console.error("Erro ao buscar postagens da lista:", e);
  }
}
async function removerPostagemDaLista(idPostagemAlvo) {
  if (!confirm("Deseja remover esta postagem dos seus salvos?")) return;

  try {
    const r = await fetch('http://localhost:3000/api/chat/remover-post-salvo', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_lista: listaSelecionada.value.id_lista,
        id_postagem: idPostagemAlvo
      })
    });

    if (r.ok) {
      postagensDaListaAtiva.value = postagensDaListaAtiva.value.filter(p => p.id_postagem !== idPostagemAlvo);

      if (listaSelecionada.value.qtd_posts > 0) {
        listaSelecionada.value.qtd_posts--;
      }
    }
  } catch (e) {
    console.error("Erro técnico na remoção de salvos:", e);
  }
}
async function criarNovaListaPasta() {
  const nome = prompt("Digite o nome da nova lista de postagens salvas:");
  if (!nome || !nome.trim()) return;

  try {
    const r = await fetch('http://localhost:3000/api/chat/criar-lista-rapida', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome_lista: nome.trim(),
        id_usuario: meuIdLogado.value
      })
    });
    if (r.ok) {
      carregarMinhasListas();
    }
  } catch (e) {
    console.error(e);
  }
}
const listasFiltradas = computed(() => {
  if (!buscaLista.value.trim()) return minhasListasSalvas.value;
  const termo = buscaLista.value.toLowerCase().trim();
  return minhasListasSalvas.value.filter(l => l.nome_lista?.toLowerCase().includes(termo));
});
const postagensFiltradas = computed(() => {
  if (!buscaPostagem.value.trim()) return postagensDaListaAtiva.value;
  const termo = buscaPostagem.value.toLowerCase().trim();
  return postagensDaListaAtiva.value.filter(p => p.conteudo?.toLowerCase().includes(termo));
});

onMounted(() => {
  carregarMinhasListas();
});
</script>

<template>
  <main>
    <section class="coluna-lista-salvos" :class="{ 'mobile-oculto': listaSelecionada }">
      <div class="cabecalho-secao-salvar">
        <h2>Listas de postagens salvas</h2>
      </div>
      <div class="caixa-busca-salvar-wrapper">
        <input v-model="buscaLista" type="text" placeholder="Procurar lista" class="input-busca-salvar">
        <span class="lupa-busca-pos">
          <img v-if="!buscaLista" :src="iconeLupa" alt="Pesquisar por lista" class="lupa">
        </span>
      </div>
      <div class="trilho-scroll-pastas">
        <button type="button" @click="criarNovaListaPasta" class="btn-adicionar-pasta-tracejado">
          <span class="icone-mais-circulo">+</span>
        </button>
        <div
          v-for="lista in listasFiltradas"
          :key="lista.id_lista"
          @click="abrirPastaSalva(lista)"
          class="card-pasta-linha"
          :class="{ 'card-pasta-selecionada': listaSelecionada?.id_lista === lista.id_lista }"
        >
          <strong>{{ lista.nome_lista }}</strong>
          <span class="meta-qtd-posts">{{ lista.qtd_posts }} postagens</span>
        </div>
      </div>
    </section>
    <section class="coluna-mural-salvos" :class="{ 'mobile-visivel': listaSelecionada }">
      <div v-if="listaSelecionada" class="grade-mural-salvos-ativo">
        <div class="cabecalho-mural-salvos-ativo">
          <div class="identidade-pasta-titulo">
            <button @click="listaSelecionada = null" class="btn-voltar-mobile-salvar"><img :src="setinha" alt=""></button>
            <h3>{{ listaSelecionada.nome_lista }} selecionada</h3>
          </div>
        </div>
        <div class="caixa-busca-salvar-wrapper" style="padding: 0 5px;">
          <input v-model="buscaPostagem" type="text" placeholder="Procurar postagem" class="input-busca-salvar">
          <span class="lupa-busca-pos">
            <img v-if="!buscaPostagem" :src="iconeLupa" alt="Pesquisar por lista" class="lupa">
          </span>
        </div>
        <div class="mural-scroll-posts-salvamentos">
          <div v-for="post in postagensFiltradas" :key="post.id_postagem" class="card-postagem-salva-item">
            <div class="linha-tempo-topo-meta">
              <span class="data-text-meta">
                {{ new Date(post.data_envio).toLocaleDateString('pt-BR') }} | {{ post.total_likes }} curtidas
              </span>
            </div>
            <div class="corpo-perfil-postagem-header">
              <img :src="post.foto_profile || userBlackFull" alt="Avatar" class="avatar-posts-salvos-mini">
              <strong>{{ post.nome_usuario }}</strong>
            </div>
            <p class="texto-postagem-conteudo-reaproveitado">{{ post.conteudo }}</p>
            <div v-if="post.imagem" class="container-imagem-anexada-salvos">
              <img
                :src="`http://localhost:3000${post.imagem}`"
                alt="Imagem do post"
                class="img-post-salvamento-midia"
              >
            </div>
            <div v-if="post.tipo === 'postagemComEnquete' || post.tipo === 'enquete'" class="bloco-enquete-salva-container">
              <div v-for="opcao in post.opcoes" :key="opcao.id_opcao || opcao.id" class="barra-opcao-enquete-linha">
                <span class="texto-opcao-label">{{ opcao.texto_opcao }}</span>
                <div class="preenchimento-porcentagem-barra" :style="{ width: opcao.porcentagem + '%' }"></div>
                <span class="porcentagem-label-enquete">{{ opcao.porcentagem }}%</span>
              </div>
            </div>
            <div v-if="post.tags && post.tags.length > 0" class="container-tags-postagem">
              <span v-for="(tag, index) in post.tags" :key="index" class="pilula-tag-post">
                {{ tag }}
              </span>
            </div>
            <div class="barra-acoes-post-salvo">
              <button class="btn-acao-post" type="button" @click="curtirPost(post, meuIdLogado, 'like')">
                <img v-if="post?.meu_voto_post === 'like'" :src="likePreenchido" alt="Curtido" class="img-preenchido" >
                <img v-else :src="likeInline" alt="curtir" class="btn-post-img">
              </button>
              <span class="qnt-likes-dislikes">{{ post.total_likes }}</span>
              <button class="btn-acao-post" type="button" @click="curtirPost(post, meuIdLogado, 'dislike')">
                <img v-if="post?.meu_voto_post === 'dislike'" :src="dislikePreenchido" alt="Descurtido" class="img-preenchido">
                <img v-else :src="dislikeInline" alt="não curtir" class="btn-post-img">
              </button>
              <span class="qnt-likes-dislikes">{{ post.total_dislikes }}</span>
              <button class="btn-acao-post" type="button" @click="abrirMural(post)">
                <img :src="comentarios" alt="comentar" class="btn-post-img">
              </button>
              <button class="btn-acao-post" type="button">
                <img :src="compartilhar" alt="compartilhar" class="btn-post-img">
              </button>
              <button type="button" class="btn-acao-post" @click="removerPostagemDaLista(post.id_postagem)">
                <img v-if="!post.naoSalvo" :src="marcadorPreenchido" alt="Salvo" class="img-preenchido">
                <img v-else :src="marcadorInline" alt="Salvar" class="btn-post-img">
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="janela-salvar-vazia-estado">
        <span>Selecione ou crie uma lista de postagens para visualizar seus salvamentos</span>
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
[data-theme="dark"] .lupa {
  filter: invert(1);
  transition: filter 0.3s ease;
}
.lupa {
  width: 1.5vw;
  height: 1.5vw;
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
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 2vw;
}
.coluna-lista-salvos,
.coluna-mural-salvos {
  background-color: var(--fundo-card, #ffffff);
  position: relative !important;
  width: 38% !important;
  height: calc(100vh - 8vw) !important;
  border-radius: 9px;
  border: var(--borda-padrao, 1px solid #e2e8f0);
  scrollbar-width: thin;
  padding: 15px;
  box-sizing: border-box;
  display: flex !important;
  flex-direction: column !important;
}
.cabecalho-secao-salvar h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--texto-principal, #1e293b);
  margin-bottom: 1vw;
  margin-top: 0;
}
.caixa-busca-salvar-wrapper {
  position: relative;
  width: 100%;
  margin-bottom: 1.2vw;
}
.input-busca-salvar {
  width: 100%;
  padding: 10px 40px 10px 14px;
  border: var(--borda-padrao, 1px solid #cbd5e1);
  border-radius: 20px;
  outline: none;
  background-color: var(--fundo-card);
  color: var(--texto-principal);
  font-size: 0.9rem;
  box-sizing: border-box;
}
.lupa-busca-pos {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.9rem;
  color: var(--texto-suave);
  align-items: center;
  justify-content: center;
}
.trilho-scroll-pastas {
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.btn-adicionar-pasta-tracejado {
  width: 100%;
  padding: 0.7vw;
  background: transparent;
  border: var(--borda-dashed);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease;
}
.btn-adicionar-pasta-tracejado:hover {
  background-color: var(--hover-botoes);
  border-color: var(--fundo-card-va);
}
.container-imagem-anexada-salvos {
  width: 100%;
  max-height: 250px;
  border-radius: 8px;
  overflow: hidden;
  margin: 6px 0;
  border: 1px solid var(--borda-padrao);
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--fundo-site);
}
.img-post-salvamento-midia {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.icone-mais-circulo {
  font-size: 1.4rem;
  padding: 0.1vw;
  width: 2vw;
  height: 2vw;
  border-radius: 50%;
  color: var(--texto-principal) !important;
  color: var(--texto-suave);
}
.icone-mais-circulo:hover {
  color: var(--fundo-card-va) !important;
}
.card-pasta-linha {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--borda-padrao, #e2e8f0);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}
.card-pasta-linha:hover {
  background-color: var(--hover-botoes, #f8fafc);
}
.card-pasta-selecionada {
  background-color: var(--hover-botoes, #f1f5f9) !important;
  border-color: #3cbc00 !important;
}
.meta-qtd-posts {
  font-size: 0.8rem;
  color: var(--texto-suave, #94a3b8);
}
.grade-mural-salvos-ativo {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
.cabecalho-mural-salvos-ativo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--borda-padrao);
  margin-bottom: 12px;
}
.identidade-pasta-titulo {
  display: flex;
  align-items: center;
  gap: 8px;
}
.identidade-pasta-titulo h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--texto-principal);
  margin: 0;
}
.btn-voltar-mobile-salvar { display: none; background: none; border: none; font-size: 1.1rem; cursor: pointer; }
.btn-deletar-pasta-geral, .btn-remover-post-individual-salvo { background: none; border: none; cursor: pointer; font-size: 1.1rem; color: var(--texto-suave); }
.mural-scroll-posts-salvamentos {
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 10px 5px;
  max-height: 52vh;
}
.card-postagem-salva-item {
  background-color: var(--fundo-card-modal, #ffffff);
  border: 1px solid var(--borda-padrao);
  border-radius: 8px;
  padding: 14px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.linha-tempo-topo-meta {
  font-size: 0.75rem;
  color: var(--texto-suave);
}
.corpo-perfil-postagem-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.avatar-posts-salvos-mini {
  width: 28px;
  height: 28px;
  border-radius: 50%;
}
.texto-postagem-conteudo-reaproveitado {
  font-size: 0.9rem;
  color: var(--texto-principal);
  margin: 4px 0;
}
.bloco-enquete-salva-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 4px 0;
}
.barra-opcao-enquete-linha {
  position: relative;
  border: 1px solid var(--borda-padrao);
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
  background-color: var(--fundo-card);
}
.preenchimento-porcentagem-barra {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background-color: rgba(60, 188, 0, 0.12);
  z-index: 1;
}
.texto-opcao-label, .porcentagem-label-enquete {
  position: relative;
  z-index: 2;
  font-size: 0.85rem;
  font-weight: 500;
}
.barra-acoes-post-salvo {
  display: flex;
  justify-content: flex-start;
  gap: 1vw;
  align-items: center;
  border-top: 1px solid var(--borda-padrao);
  padding-top: 8px;
  margin-top: 4px;
}
.container-tags-postagem {
  display: flex;
  gap: 0.3vw;
  font-size: 0.81vw;
  color: blue;
  flex-wrap: wrap;
  margin: 1vw 0.5vw;
}
.grupo-interacoes-esquerda {
  display: flex;
  gap: 12px;
}
.btn-acao-post {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}
.btn-remover-post-individual-salvo {
  position: absolute;
  bottom: 12px;
  right: 14px;
}
.janela-chat-vazia-estado, .janela-salvar-vazia-estado {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--texto-suave);
  font-weight: 600;
  font-size: 0.95rem;
  text-align: center;
  border: 2px dashed var(--borda-padrao);
  border-radius: 8px;
  padding: 20px;
  box-sizing: border-box;
}
@media (max-width: 768px) {
  main {
    margin-left: 0;
    width: 100vw;
    padding: 10px;
    display: block;
    position: relative;
  }
  .coluna-lista-conversas, .coluna-janela-mensagens,
  .coluna-lista-salvos, .coluna-mural-salvos {
    width: 100% !important;
    max-width: 100vw !important;
    height: calc(100vh - 120px) !important;
    position: relative !important;
  }
  .coluna-mural-salvos { display: none; }
  .coluna-lista-salvos.mobile-oculto { display: none !important; }
  .coluna-mural-salvos.mobile-visivel { display: flex !important; position: fixed !important; top: 0; left: 0; height: calc(100vh - 65px) !important; z-index: 2000; }
  .btn-voltar-mobile-salvar { display: block !important; margin-right: 6px; }
}
</style>
