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
      <form @submit.prevent="enviarPost">
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
              <input v-model="opcao.texto" type="text" :placeholder="`Opção ${index + 1}`" maxlength="25">
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
              <img :src="plus" alt="adicionar-tag">
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
}
.deFatoOBotaoPostar {
  width: 100%;
  height: 100%;
  padding: 1vw 0;
  color: #fff;
  background-color: #3CBC00;
  border: none;
  border-radius: 12px;
}
.deFatoOBotaoPostar:hover {
  background-color: #37ad00;
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
  border-top: 0.8px solid #000;
  padding-top: 0.5vw;
}
.titulo-enquete-btn {
  display: flex;
  align-items: center;
  gap: 0.2vw;
}
.titulo-enquete-btn button.btn-add-opcao {
  padding: 0.1vw;
  border-radius: 10px;
  border: 1px solid #000;
  background-color: #fff;
  display: flex;
  font-size: 0.9vw;
}
.titulo-enquete-btn button.btn-add-opcao:hover {
  background-color: #e7e7e7;
  cursor: pointer;
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
  background-color: #cf0000;
  cursor: pointer;
}
.botaoVoltar {
  width: 3vw;
  height: 3vw;
  background-color: #fff;
  border: 1px solid #000;
  border-radius: 5px;
  position: absolute;
  top: 0;
  margin-top: 4vw;
  margin-left: 13vw;
}
.secao-enquete {
  margin: 0.5vw;
}
.titulos-Da-tela-Postagem, .tituloTags {
  font-size: 1.2vw;
  font-weight: bolder;
}
.botaoVoltar:hover {
  background-color: #e7e7e7;
  cursor: pointer;
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
  background-color: #3CBC00;
  border-radius: 10px;
  padding: 1.5vw;
  color: #fff;
  font-weight: bolder;
  font-size: 1vw;
  border: none;
}
.btnTDC:hover {
  background-color: #37ad00;
  transition: 0.3s;
  cursor: pointer;
}
.areaDescricaoPost {
  display: flex;
  flex-direction: column;
  margin: 0.5vw;
  gap: 0.5vw;
}
.tituloPrincipal {
  border-bottom: 1px solid #000;
  margin: -2px;
  padding: 1vw;
  font-size: 1.7vw;
}
.tags {
  margin: 0.5vw;
}
.tag {
  border: 0.8px solid #000;
  background-color: #fff;
  border-radius: 100px;
  padding: 0.3vw 0.3vw;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tag:hover {
  background-color: #e7e7e7;
  transition: 0.2s;
  cursor: pointer;
}
section.telaDeCriacao {
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
.criarPost {
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
</style>
