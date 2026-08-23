<script setup>
import { ref } from 'vue';
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

function moverTagParaListaUsuario(tagUniversal) {
  if (!tagsDaPostagem.value.includes(tagUniversal)) {
    tagsDaPostagem.value.push(tagUniversal);
  } else {
    console.log('Esta tag já existe.')
  }
}
function capturarImagemPost(event) {
  arquivoImagemPost.value = event.target.files;
}

const descricaoDaPostagem = ref('');

const enviarPost = async () => {
  const idUsuarioDaURL = route.params.id;

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

    const resposta = await fetch(`http://localhost:3000/api/criar/postagens/${idUsuarioDaURL}`, {
      method: 'POST',
      body: formDataCompleto
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      toast.success('Postagem completa criada com sucesso!');
      router.push('/home');
    } else {
      toast.error(dados.erro || "Erro ao fazer postagem.");
    }

  } catch(erro) {
    console.error('Não foi possível fazer a postagem.', erro);
  }
};
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
          <input type="file" accept="image/*" @change="capturarImagemPost">
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
    <section v-if="mostrarComunidadeTela" class="criarComunidade">
      <h2 class="tituloPrincipal">Painel de criação</h2>
      <form @submit.prevent="">
        <label for="nomeComunidade">Nome da Comunidade</label>
        <input type="text" maxlength="50" id="nomeComunidade">

        <label for=""></label>
        <input type="text">
      </form>
    </section>
    <button v-if="!mostrarTelaDeCriacao"  @click="voltarAoPainel" class="botaoVoltar">
          <img :src="voltar" alt="" class="setaVoltar">
      </button>
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
  position: absolute;
  top: 0;
  margin-top: 4vw;
  margin-left: 13vw;
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
  gap: 0.5vw;
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
}
.btnTDC:hover {
  background-color: var(--fundo-card-va-hover);
  transition: 0.3s;
  transform: scale(1.02);
  cursor: pointer;
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
</style>
