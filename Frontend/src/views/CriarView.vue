<script setup>
import { ref, nextTick, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import voltar from '@/icons/voltar.svg'
import tagsTotais from '@/data/tags';
import plus from '@/icons/plus.svg'

const route = useRoute();
const router = useRouter();
const toast = useToast();

const listaTagsTotais = ref(tagsTotais);
const adicionarTag = ref(false);
const tagsDaPostagem = ref([]);

const mostrarTelaDeCriacao = ref(true);
const mostrarPostTela = ref(false);
const mostrarComunidadeTela = ref(false);

function mostrarTelaPost() {
  mostrarTelaDeCriacao.value = false;
  mostrarPostTela.value = true;
  mostrarComunidadeTela.value = false;
}
function mostrarTelaComunidade() {
  mostrarTelaDeCriacao.value = false;
  mostrarComunidadeTela.value = true;
  mostrarPostTela.value = false;
}
function voltarAoPainel() {
  mostrarTelaDeCriacao.value = true;
  mostrarComunidadeTela.value = false;
  mostrarPostTela.value = false;
}
function adicionarNovasTags() {
 adicionarTag.value = !adicionarTag.value;
}
const opcoesEnquete = ref([
  { id: 1, texto: '' },
  { id: 2, texto: '' }
]);
function adicionarOpcaoEnquete() {
  if (opcoesEnquete.value.length < 5) {
    opcoesEnquete.value.push({ id: Date.now(), texto: '' });
  } else {
    toast.warning("Você só pode adicionar até 5 opções na enquete.");
  }
};
function removerOpcaoEnquete(index) {
  if (opcoesEnquete.value.length > 2) {
    opcoesEnquete.value.splice(index, 1);
  }
};
function deletarTag(index) {
  tagsDaPostagem.value.splice(index, 1)
};

const arquivoImagemPost = ref(null);
const arquivoOriginalPost = ref(null);
const previewImagemPost = ref(null);
const inputImagemPostRef = ref(null);

function moverTagParaListaUsuario(tagUniversal) {
  const textoObjetoTag = typeof tagUniversal === 'object' ? tagUniversal.nome_tag : tagUniversal;
  const tagTratadaLimpa = textoObjetoTag.replace('#', '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  if (!tagsDaPostagem.value.includes(tagTratadaLimpa)) {
    tagsDaPostagem.value.push(tagTratadaLimpa);
    console.log(`Tag adicionada ao rascunho: ${tagTratadaLimpa}`);
  } else {
    toast.warning('Esta tag já foi adicionada ao post.');
  }
}

function capturarImagemPost(event) {
  const arquivo = event.target.files && event.target.files[0];
  if (!arquivo) return;
  arquivoOriginalPost.value = arquivo;
  abrirModalCorte(arquivo, 'post');
}

function removerImagemPost() {
  arquivoImagemPost.value = null;
  arquivoOriginalPost.value = null;
  if (previewImagemPost.value) URL.revokeObjectURL(previewImagemPost.value);
  previewImagemPost.value = null;
  if (inputImagemPostRef.value) inputImagemPostRef.value.value = '';
}

function recortarNovamentePost() {
  if (arquivoOriginalPost.value) {
    abrirModalCorte(arquivoOriginalPost.value, 'post');
  }
}

const descricaoDaPostagem = ref('');

const nomeDaComunidade = ref('');
const descricaoDaComunidade = ref('');
const tagsDaComunidade = ref([]);
const mostrarPainelTagsComunidade = ref(false);

const bannerUrlComunidade = ref(null);
const arquivoOriginalBanner = ref(null);
const previewBannerComunidade = ref(null);
const inputBannerRef = ref(null);

function capturarBannerComunidade(event) {
  const arquivo = event.target.files && event.target.files[0];
  if (!arquivo) return;
  arquivoOriginalBanner.value = arquivo;
  abrirModalCorte(arquivo, 'banner');
}

function removerBannerComunidade() {
  bannerUrlComunidade.value = null;
  arquivoOriginalBanner.value = null;
  if (previewBannerComunidade.value) URL.revokeObjectURL(previewBannerComunidade.value);
  previewBannerComunidade.value = null;
  if (inputBannerRef.value) inputBannerRef.value.value = '';
}

function recortarNovamenteBanner() {
  if (arquivoOriginalBanner.value) {
    abrirModalCorte(arquivoOriginalBanner.value, 'banner');
  }
}

function adicionarNovasTagsComunidade() {
  mostrarPainelTagsComunidade.value = !mostrarPainelTagsComunidade.value;
}

function moverTagParaComunidade(tagUniversal) {
  const textoObjetoTag = typeof tagUniversal === 'object' ? tagUniversal.nome_tag : tagUniversal;
  const tagTratadaLimpa = textoObjetoTag.replace('#', '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  if (!tagsDaComunidade.value.includes(tagTratadaLimpa)) {
    tagsDaComunidade.value.push(tagTratadaLimpa);
  } else {
    toast.warning('Esta categoria já foi adicionada.');
  }
}

function deletarTagComunidade(index) {
  tagsDaComunidade.value.splice(index, 1);
}

const mostrarModalCorte = ref(false);
const tipoCorteAtual = ref(null);
const canvasCorteRef = ref(null);

const imagemCarregadaCorte = ref(null);
const escalaImagemCorte = ref(1);
const offsetXCorte = ref(0);
const offsetYCorte = ref(0);
let urlTemporariaCorte = null;

const arrastandoCorte = ref(false);
let inicioArrastoX = 0;
let inicioArrastoY = 0;
let offsetInicialX = 0;
let offsetInicialY = 0;

function obterDimensoesCorte(tipo) {
  if (tipo === 'banner') {
    return { largura: 800, altura: 260 };
  }
  return { largura: 500, altura: 500 };
}

function abrirModalCorte(arquivo, tipo) {
  tipoCorteAtual.value = tipo;

  const img = new Image();
  urlTemporariaCorte = URL.createObjectURL(arquivo);

  img.onload = () => {
    imagemCarregadaCorte.value = img;

    const { largura, altura } = obterDimensoesCorte(tipo);

    const escala = Math.max(largura / img.width, altura / img.height);
    escalaImagemCorte.value = escala;

    offsetXCorte.value = (largura - img.width * escala) / 2;
    offsetYCorte.value = (altura - img.height * escala) / 2;

    mostrarModalCorte.value = true;

    nextTick(() => desenharCanvasCorte());
  };

  img.src = urlTemporariaCorte;
}

function desenharCanvasCorte() {
  const canvas = canvasCorteRef.value;
  const img = imagemCarregadaCorte.value;
  if (!canvas || !img) return;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    img,
    offsetXCorte.value,
    offsetYCorte.value,
    img.width * escalaImagemCorte.value,
    img.height * escalaImagemCorte.value
  );
}

function obterPosicaoEvento(event) {
  const canvas = canvasCorteRef.value;
  const rect = canvas.getBoundingClientRect();
  const fatorEscala = canvas.width / rect.width;

  const ponto = event.touches ? event.touches[0] : event;
  return {
    x: (ponto.clientX - rect.left) * fatorEscala,
    y: (ponto.clientY - rect.top) * fatorEscala
  };
}

function iniciarArrastoCorte(event) {
  arrastandoCorte.value = true;
  const pos = obterPosicaoEvento(event);
  inicioArrastoX = pos.x;
  inicioArrastoY = pos.y;
  offsetInicialX = offsetXCorte.value;
  offsetInicialY = offsetYCorte.value;
}

function moverArrastoCorte(event) {
  if (!arrastandoCorte.value) return;
  event.preventDefault();

  const pos = obterPosicaoEvento(event);
  const img = imagemCarregadaCorte.value;
  const { largura, altura } = obterDimensoesCorte(tipoCorteAtual.value);
  const larguraImg = img.width * escalaImagemCorte.value;
  const alturaImg = img.height * escalaImagemCorte.value;

  let novoX = offsetInicialX + (pos.x - inicioArrastoX);
  let novoY = offsetInicialY + (pos.y - inicioArrastoY);

  novoX = Math.min(0, Math.max(largura - larguraImg, novoX));
  novoY = Math.min(0, Math.max(altura - alturaImg, novoY));

  offsetXCorte.value = novoX;
  offsetYCorte.value = novoY;

  desenharCanvasCorte();
}

function pararArrastoCorte() {
  arrastandoCorte.value = false;
}

function cancelarCorte() {
  mostrarModalCorte.value = false;
  if (urlTemporariaCorte) {
    URL.revokeObjectURL(urlTemporariaCorte);
    urlTemporariaCorte = null;
  }
  imagemCarregadaCorte.value = null;

  if (tipoCorteAtual.value === 'post' && !arquivoImagemPost.value && inputImagemPostRef.value) {
    inputImagemPostRef.value.value = '';
  }
  if (tipoCorteAtual.value === 'banner' && !bannerUrlComunidade.value && inputBannerRef.value) {
    inputBannerRef.value.value = '';
  }
}

function confirmarCorte() {
  const canvas = canvasCorteRef.value;
  if (!canvas) return;

  canvas.toBlob((blob) => {
    if (!blob) {
      toast.error('Não foi possível recortar a imagem.');
      return;
    }

    const nomeArquivo = tipoCorteAtual.value === 'banner' ? 'banner-comunidade.jpg' : 'imagem-post.jpg';
    const arquivoCortado = new File([blob], nomeArquivo, { type: 'image/jpeg' });
    const novaUrlPreview = URL.createObjectURL(blob);

    if (tipoCorteAtual.value === 'post') {
      if (previewImagemPost.value) URL.revokeObjectURL(previewImagemPost.value);
      arquivoImagemPost.value = [arquivoCortado];
      previewImagemPost.value = novaUrlPreview;
    } else {
      if (previewBannerComunidade.value) URL.revokeObjectURL(previewBannerComunidade.value);
      bannerUrlComunidade.value = [arquivoCortado];
      previewBannerComunidade.value = novaUrlPreview;
    }

    mostrarModalCorte.value = false;
    if (urlTemporariaCorte) {
      URL.revokeObjectURL(urlTemporariaCorte);
      urlTemporariaCorte = null;
    }
    imagemCarregadaCorte.value = null;
  }, 'image/jpeg', 0.9);
}

const enviarComunidade = async () => {
  const idUsuarioCriador = localStorage.getItem('ifchat_user_id') || route.params.id;

  if (!idUsuarioCriador || idUsuarioCriador === 'undefined') {
    toast.error("Usuário não identificado. Faça login novamente.");
    return;
  }
  if (!nomeDaComunidade.value.trim() || !descricaoDaComunidade.value.trim()) {
    toast.warning("Nome e descrição da comunidade são obrigatórios.");
    return;
  }

  try {
    const formDataComunidade = new FormData();
    formDataComunidade.append('nome', nomeDaComunidade.value.trim());
    formDataComunidade.append('descricao', descricaoDaComunidade.value.trim());
    formDataComunidade.append('tags', JSON.stringify(tagsDaComunidade.value));

    if (bannerUrlComunidade.value && bannerUrlComunidade.value.length > 0) {
      formDataComunidade.append('banner_comunidade', bannerUrlComunidade.value[0]);
    }

    const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/criar/comunidades/nova/${idUsuarioCriador}`, {
      method: 'POST',
      body: formDataComunidade
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      toast.success('Comunidade criada com sucesso!');

      nomeDaComunidade.value = '';
      descricaoDaComunidade.value = '';
      tagsDaComunidade.value = [];
      removerBannerComunidade();

      router.push('/explorar');
    } else {
      toast.error(dados.erro || "Erro ao fazer o cadastro do grupo.");
    }
  } catch (erro) {
    console.error('Falha de rede ao criar comunidade:', erro);
    toast.error("Falha ao se conectar com o servidor.");
  }
};

const enviarPost = async () => {
  const idUsuarioReal = localStorage.getItem('ifchat_user_id') || route.params.id;

  if (!idUsuarioReal || idUsuarioReal === 'undefined') {
    toast.error("Usuário não identificado. Faça login novamente.");
    return;
  }
  const opcoesValidas = opcoesEnquete.value
    .map(o => o.texto.trim())
    .filter(texto => texto !== '');

  const tipoPostagem = opcoesValidas.length >= 2 ? 'postagemComEnquete' : 'postagemComum';

  try {
    const formDataCompleto = new FormData();

    formDataCompleto.append('descricao', descricaoDaPostagem.value.trim());
    formDataCompleto.append('tipo', tipoPostagem);

    formDataCompleto.append('opcoes', JSON.stringify(opcoesValidas));
    formDataCompleto.append('tags', JSON.stringify(tagsDaPostagem.value));

    if (arquivoImagemPost.value && arquivoImagemPost.value.length > 0) {
      formDataCompleto.append('imagem_post', arquivoImagemPost.value[0]);
    }
    const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/criar/postagens/${idUsuarioReal}`, {
      method: 'POST',
      body: formDataCompleto
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      toast.success('Postagem completa criada com sucesso!');
      descricaoDaPostagem.value = '';
      tagsDaPostagem.value = [];
      removerImagemPost();

      router.push('/home');
    } else {
      toast.error(dados.erro || "Erro ao fazer postagem.");
    }

  } catch(erro) {
    console.error('Não foi possível fazer a postagem.', erro);
    toast.error("Falha ao se conectar com o servidor.");
  }
};

onBeforeUnmount(() => {
  if (previewImagemPost.value) URL.revokeObjectURL(previewImagemPost.value);
  if (previewBannerComunidade.value) URL.revokeObjectURL(previewBannerComunidade.value);
  if (urlTemporariaCorte) URL.revokeObjectURL(urlTemporariaCorte);
});
</script>

<template>
  <main>
    <section v-if="mostrarTelaDeCriacao" class="telaDeCriacao">
      <h2 class="tituloPrincipal">Painel de criação</h2>
      <div class="opcoesDeCriar">
        <button @click="mostrarTelaPost" class="btnTDC">Criar Postagem</button>
        <button @click="mostrarTelaComunidade" class="btnTDC">Criar Comunidade</button>
      </div>
    </section>
    <section v-if="mostrarPostTela" class="criarPost">
      <h2 class="tituloPrincipal">Painel de criação</h2>
      <form @submit.prevent="enviarPost" class="form-posts">
        <div class="areaDescricaoPost">
          <label for="descPost" class="titulos-Da-tela-Postagem">Descrição da postagem*</label>
          <textarea v-model="descricaoDaPostagem" placeholder="O que você está pensando?" maxlength="3500" id="descPost" required rows="10" class="textarea"></textarea>
        </div>
        <div class="secao-enquete">
          <div class="titulo-enquete-btn">
            <label class="titulos-Da-tela-Postagem">Criar Enquete (Mínimo de 2 opções preenchidas):</label>
            <button type="button" @click="adicionarOpcaoEnquete" class="btn-add-opcao">+ Opção</button>
          </div>
          <div class="lista-inputs-enquete">
            <div v-for="(opcao, index) in opcoesEnquete" :key="opcao.id" class="linha-opcao-enquete">
              <input v-model="opcao.texto" type="text" :placeholder="`Opção ${index + 1}`" maxlength="25" class="input-enquete-borda-normal" :class="{ 'input-enquete': opcoesEnquete.length > 2 }">
              <button v-if="opcoesEnquete.length > 2" type="button" @click="removerOpcaoEnquete(index)" class="btn-deletar-opcao">&times;</button>
            </div>
          </div>
          <div class="campo-form">
            <label class="titulos-Da-tela-Postagem">Adicionar imagem ao post (Opcional):</label>
            <input ref="inputImagemPostRef" type="file" accept="image/*" @change="capturarImagemPost">

            <div v-if="previewImagemPost" class="preview-imagem-container">
              <img :src="previewImagemPost" alt="Pré-visualização da imagem" class="preview-imagem" />
              <div class="preview-botoes">
                <button type="button" @click="recortarNovamentePost" class="btn-recortar-preview">
                  Recortar novamente
                </button>
                <button type="button" @click="removerImagemPost" class="btn-remover-preview">
                  Remover imagem
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="tags">
          <h3 class="tituloTags">Tags</h3>
          <div class="divDasTagsDoUsuario">
            <div v-for="(tag, index) in tagsDaPostagem" :key="index">
            <button type="button" class="tag" @click="deletarTag(index)">
              {{ tag }}
            </button>
          </div>
          <div>
            <button type="button" @click="adicionarNovasTags" class="tag">
              <img :src="plus" alt="adicionar-tag" class="adicionar-tag">
            </button>
          </div>
          </div>
          <div v-show="adicionarTag === true" class="listaParaAdicionarTags">
            <div v-for="(tagUniversal, index) in listaTagsTotais" :key="index">
              <button type="button" @click="moverTagParaListaUsuario(tagUniversal)" class="tag">
                {{ tagUniversal }}
              </button>
            </div>
            <button type="button" @click="adicionarNovasTags" class="btnTagsFechar">
              fechar
            </button>
          </div>
        </div>
        <div class="botaoPostar">
          <button type="submit" class="deFatoOBotaoPostar">Postar</button>
        </div>
      </form>
    </section>
<section v-if="mostrarComunidadeTela" class="criarPost">
  <h2 class="tituloPrincipal">Painel de criação</h2>
  <form @submit.prevent="enviarComunidade" class="form-posts">
    <div class="areaDescricaoPost">
      <label for="nomeComunidade" class="titulos-Da-tela-Postagem">Nome comunidade*</label>
      <input
        v-model="nomeDaComunidade"
        type="text"
        id="nomeComunidade"
        placeholder="Nome"
        maxlength="50"
        required
        class="input-enquete-borda-normal"
        style="width: 100%; height: 40px; padding: 0 12px; border-radius: 4px;"
      >
    </div>
    <div class="areaDescricaoPost" style="margin-top: 16px;">
      <label for="descComunidade" class="titulos-Da-tela-Postagem">Descrição</label>
      <div style="position: relative; width: 100%;">
        <textarea
          v-model="descricaoDaComunidade"
          placeholder="Descrição"
          maxlength="1500"
          id="descComunidade"
          required
          rows="4"
          class="textarea"
          style="width: 100%; border-radius: 4px; padding-bottom: 24px;"
        ></textarea>
        <span style="position: absolute; bottom: 8px; right: 12px; font-size: 11px; color: #888;">
          {{ descricaoDaComunidade.length }}/1500
        </span>
      </div>
    </div>
    <div class="campo-form" style="margin-top: 16px;">
      <label class="titulos-Da-tela-Postagem">Banner da comunidade (Opcional):</label>
      <input ref="inputBannerRef" type="file" accept="image/*" @change="capturarBannerComunidade">

      <div v-if="previewBannerComunidade" class="preview-banner-container">
        <img :src="previewBannerComunidade" alt="Pré-visualização do banner" class="preview-banner" />
        <div class="preview-botoes">
          <button type="button" @click="recortarNovamenteBanner" class="btn-recortar-preview">
            Recortar novamente
          </button>
          <button type="button" @click="removerBannerComunidade" class="btn-remover-preview">
            Remover imagem
          </button>
        </div>
      </div>
    </div>
    <div class="tags" style="margin-top: 16px;">
      <h3 class="tituloTags" style="font-size: 14px; font-weight: bold; margin-bottom: 8px;">Tags</h3>
      <div class="divDasTagsDoUsuario" style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
        <div v-for="(tag, index) in tagsDaComunidade" :key="index">
          <button type="button" class="tag" @click="deletarTagComunidade(index)">
            #{{ tag }}
          </button>
        </div>
        <div>
          <button type="button" @click="adicionarNovasTagsComunidade" class="tag" style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 0;">
            <img :src="plus" alt="adicionar-tag" class="adicionar-tag" style="width: 14px; height: 14px;">
          </button>
        </div>
      </div>
      <div v-show="mostrarPainelTagsComunidade === true" class="listaParaAdicionarTags" style="margin-top: 12px;">
        <div v-for="(tagUniversal, index) in listaTagsTotais" :key="index">
          <button type="button" @click="moverTagParaComunidade(tagUniversal)" class="tag">
            {{ tagUniversal }}
          </button>
        </div>
        <button type="button" @click="mostrarPainelTagsComunidade = false" class="btnTagsFechar">
          fechar
        </button>
      </div>
    </div>
    <div class="botaoPostar" style="margin-top: 24px;">
      <button type="submit" class="deFatoOBotaoPostar">Criar Comunidade</button>
    </div>
  </form>
</section>
    <button v-if="!mostrarTelaDeCriacao"  @click="voltarAoPainel" class="botaoVoltar">
          <img :src="voltar" alt="" class="setaVoltar">
      </button>

    <div v-if="mostrarModalCorte" class="overlay-corte">
      <div class="caixa-modal-corte">
        <h3 class="titulo-modal-corte">Arraste a imagem para posicionar</h3>

        <canvas
          ref="canvasCorteRef"
          :width="tipoCorteAtual === 'banner' ? 800 : 500"
          :height="tipoCorteAtual === 'banner' ? 260 : 500"
          class="canvas-corte"
          @mousedown="iniciarArrastoCorte"
          @mousemove="moverArrastoCorte"
          @mouseup="pararArrastoCorte"
          @mouseleave="pararArrastoCorte"
          @touchstart="iniciarArrastoCorte"
          @touchmove="moverArrastoCorte"
          @touchend="pararArrastoCorte"
        ></canvas>

        <div class="botoes-modal-corte">
          <button type="button" @click="cancelarCorte" class="btn-cancelar-corte">Cancelar</button>
          <button type="button" @click="confirmarCorte" class="btn-confirmar-corte">Usar esta imagem</button>
        </div>
      </div>
    </div>
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
}
.input-enquete {
  color: var(--texto-suave);
  outline: none;
  background-color: var(--fundo-card);
  border: var(--borda-padrao);
  padding: 0.5vw;
  border-radius: 7px 0 0 7px !important;
}
.input-enquete-borda-normal {
  color: var(--texto-principal);
  outline: none;
  background-color: var(--fundo-card);
  border: var(--borda-padrao);
  padding: 0.5vw;
  border-radius: 7px;
}
.input-enquete-borda-normal::placeholder {
  color: var(--texto-mais-suave);
}
.input-enquete::placeholder {
  color: var(--texto-mais-suave);
}
.linha-opcao-enquete {
  display: flex;
  width: 100%;
  gap: 0.2vw;
}
.btn-deletar-opcao {
  background-color: var(--fundo-card-va);
  border: none;
  padding: 0.5vw 0.7vw;
  font-size: 1vw;
  color: #fff;
  border-radius: 0 7px 7px 0;
}
.btn-deletar-opcao:hover {
  background-color: var(--fundo-card-va-hover);
  transition: 0.3s;
  transform: scale(1.05);
}
.btn-deletar-opcao:active {
  transform: scale(0.95);
}
.form-posts {
  display: flex;
  flex-direction: column;
  gap: 0.5vw;
}
.divDasTagsDoUsuario {
  display: flex;
  margin-top: 0.5vw;
  flex-wrap: wrap;
  gap: 0.4vw;
}
.botaoPostar {
  margin: 0.5vw;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1vw 0;
}
.textarea {
  max-width: 100%;
  max-height: 15vw;
  min-width: 50%;
  background-color: var(--fundo-card);
  border: var(--borda-padrao);
  border-radius: 7px;
  padding: 0.5vw;
  color: var(--texto-principal);
  outline: none;
}
.textarea::placeholder {
  color: var(--texto-suave);
}
.deFatoOBotaoPostar {
  width: 100%;
  height: 100%;
  padding: 1vw 0;
  color: #fff;
  background-color: var(--fundo-card-va);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: bolder;
}
.deFatoOBotaoPostar:hover {
  background-color: var(--fundo-card-va-hover);
  transform: scale(1.02);
  transition: 0.2s;
}
.deFatoOBotaoPostar:active {
  transform: scaleY(1.2);
}
.campo-form {
  margin: 1vw 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.7vw;
  margin-left: 0.5vw;
}
.campo-form input::-webkit-file-upload-button {
  background-color: var(--fundo-card-va);
  border: none;
  padding: 1vw;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  font-weight: bolder;
}
.campo-form input::-webkit-file-upload-button:hover {
  background-color: var(--fundo-card-va-hover);
  transition: 0.4s;
  transform: scale(1.01);
}
.campo-form input::-webkit-file-upload-button:active {
  transform: scale(0.92);
}
.lista-inputs-enquete {
  display: flex;
  flex-direction: column;
  gap: 0.5vw;
}
.listaParaAdicionarTags {
  display: flex;
  margin: 0.5vw auto;
  flex-wrap: wrap;
  gap: 0.4vw;
  border-top: var(--borda-padrao);
  padding-top: 0.5vw;
}
.titulo-enquete-btn {
  display: flex;
  align-items: center;
  gap: 0.2vw;
}
.titulo-enquete-btn button.btn-add-opcao {
  padding: 0.1vw 0.3vw;
  border-radius: 10px;
  border: var(--borda-padrao);
  background-color: var(--fundo-card);
  color: var(--texto-principal);
  display: flex;
  font-size: 0.9vw;
}
.titulo-enquete-btn button.btn-add-opcao:hover {
  background-color: var(--hover-botoes);
  transition: 0.3s;
  transform: scale(1.05);
  cursor: pointer;
}
.titulo-enquete-btn button.btn-add-opcao:active {
  transform: scale(0.92);
}
.btnTagsFechar {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 100px;
  padding: 0.2vw 0.3vw;
  background-color: #ff0000;
  color: #fff;
  font-weight: bold;
}
.setaVoltar {
  width: 2vw;
  height: 2vw;
}
.btnTagsFechar:hover {
  transition: 0.2s;
  transform: scale(1.05);
  background-color: #cf0000;
  cursor: pointer;
}
.btnTagsFechar:active {
  transform: scale(0.92);
}
.botaoVoltar {
  width: 3vw;
  height: 3vw;
  background-color: var(--fundo-card);
  border: var(--borda-padrao);
  border-radius: 5px;
  top: 0 !important;
  left: 0 !important;
  margin-top: 2.5vw !important;
  margin-left: 12.5vw !important;
  z-index: 9999 !important;
  cursor: pointer;
}
.secao-enquete {
  margin: 0.5vw;
  gap: 0.5vw;
  display: flex;
  flex-direction: column;
}
.titulos-Da-tela-Postagem, .tituloTags {
  font-size: 1.2vw;
  font-weight: bolder;
}
.botaoVoltar:hover {
  background-color: var(--hover-botoes);
  transform: scale(1.02);
  transition: 0.3s;
}
.botaoVoltar:active {
  transform: scale(0.92);
}
.opcoesDeCriar {
  display: flex;
  flex-direction: column;
  margin-top: 1vw;
  gap: 0.8vw;
  margin-left: 0.5vw;
  margin-right: 0.5vw;
}
.btnTDC {
  background-color: var(--fundo-card-va);
  border-radius: 10px;
  padding: 1.5vw;
  color: #fff;
  font-weight: bolder;
  font-size: 1vw;
  border: none;
  transition: 0.3s ease;
}
.btnTDC:hover {
  background-color: var(--fundo-card-va-hover);
  transition: 0.3s;
  scale: 1.01;
  cursor: pointer;
  animation: flutuar 1.3s infinite cubic-bezier(0.445, 0.05, 0.55, 0.95);
}

@keyframes flutuar {
  0% {
    transform: translateY(0vw);
  }
  50% {
    transform: translateY(-0.3vw) ;
  }
  100% {
    transform: translateY(0vw);
  }
}
.btnTDC:active {
  transform: scale(0.98);
}
.areaDescricaoPost {
  display: flex;
  flex-direction: column;
  margin: 0.5vw;
  gap: 0.5vw;
}
.tituloPrincipal {
  border-bottom: var(--borda-padrao);
  margin: -2px;
  padding: 1vw;
  font-size: 1.7vw;
}
.tags {
  margin: 0.5vw;
}
.tag {
  border: var(--borda-padrao);
  background-color: var(--fundo-card);
  border-radius: 100px;
  padding: 0.3vw 0.3vw;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--texto-principal);
}
.tag:hover {
  background-color: var(--hover-botoes);
  transition: 0.3s;
  transform: scale(1.05);
  cursor: pointer;
}
.tag:active {
  transform: scale(0.92);
}
section.telaDeCriacao {
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
.criarPost {
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
.criarPost::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 9px;
}
.criarPost::-webkit-scrollbar {
  width: 12px;
}
.criarPost::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 20px;
}
.criarPost::-webkit-scrollbar-thumb:hover {
  background-color: #b5b5b5;
}
.criarComunidade {
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
[data-theme="dark"] .setaVoltar {
  filter: invert(1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .adicionar-tag {
  filter: invert(1);
  transition: filter 0.3s ease;
}

.preview-imagem-container,
.preview-banner-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5vw;
  margin-top: 0.5vw;
}
.preview-imagem {
  max-width: 100%;
  max-height: 12vw;
  border-radius: 8px;
  border: var(--borda-padrao);
  object-fit: cover;
}
.preview-banner {
  width: 100%;
  height: 8vw;
  border-radius: 8px;
  border: var(--borda-padrao);
  object-fit: cover;
}
.preview-botoes {
  display: flex;
  gap: 0.5vw;
}
.btn-remover-preview,
.btn-recortar-preview {
  border: none;
  font-size: 0.8vw;
  font-weight: bold;
  padding: 0.3vw 0.8vw;
  border-radius: 100px;
  cursor: pointer;
}
.btn-remover-preview {
  background-color: #ff0000;
  color: #fff;
}
.btn-remover-preview:hover {
  background-color: #cf0000;
  transition: 0.2s;
  transform: scale(1.03);
}
.btn-recortar-preview {
  background-color: var(--fundo-card-va);
  color: #fff;
}
.btn-recortar-preview:hover {
  background-color: var(--fundo-card-va-hover);
  transition: 0.2s;
  transform: scale(1.03);
}
.btn-remover-preview:active,
.btn-recortar-preview:active {
  transform: scale(0.95);
}

.overlay-corte {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.caixa-modal-corte {
  background-color: var(--fundo-card);
  border-radius: 12px;
  padding: 1.5vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1vw;
  max-width: 90vw;
}
.titulo-modal-corte {
  color: var(--texto-principal);
  font-size: 1.1vw;
  margin: 0;
}
.canvas-corte {
  max-width: 80vw;
  max-height: 60vh;
  width: auto;
  height: auto;
  border-radius: 8px;
  border: var(--borda-padrao);
  cursor: grab;
  touch-action: none;
}
.canvas-corte:active {
  cursor: grabbing;
}
.botoes-modal-corte {
  display: flex;
  gap: 0.8vw;
}
.btn-cancelar-corte,
.btn-confirmar-corte {
  border: none;
  padding: 0.6vw 1.2vw;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}
.btn-cancelar-corte {
  background-color: var(--hover-botoes);
  color: var(--texto-principal);
}
.btn-confirmar-corte {
  background-color: var(--fundo-card-va);
  color: #fff;
}
.btn-cancelar-corte:hover,
.btn-confirmar-corte:hover {
  transform: scale(1.03);
  transition: 0.2s;
}
</style>