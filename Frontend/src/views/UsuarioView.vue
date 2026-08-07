<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import userBlackFull from '@/icons/userBlackFull.svg';
import canetaEdicao from '@/icons/canetaEdicao.svg';
import gear from '@/icons/gear.svg'
import dataCriacao from '@/icons/dataCriacao.svg'
import local from '@/icons/local.svg'
import interrogacao from '@/icons/interrogacao.svg'
import tagsTotais from '@/data/tags';
import plus from '@/icons/plus.svg'
import setinha from '@/icons/setinha.svg'
import voltar from '@/icons/voltar.png'

const route = useRoute();

const editarPerfil = ref(false);

const nomeUsuario = ref('Carregando...');
const statusOnline = ref(false);
const biografia = ref('');
const localizacao = ref('');
const postagens = ref([]);
const perfisFavoritos = ref([]);
const bannerUrl = ref('');
const seguidoresUsuario = ref(0);
const usiarioSeguindo = ref(0);
const fotoPerfil = ref('');
const dataDeCriacao = ref('');
const tagsDoUsuario = ref([]);
const comentariosMural = ref([]);
const adicionarTag = ref(false);
const listaTagsTotais = ref(tagsTotais);
const arquivoFoto = ref(null);
const arquivoBanner = ref(null);

const telaExibicao = ref(true);
const telaConfig = ref(false);

function mostrarTelaConfiguracao() {
  telaConfig.value = !telaConfig.value;
  telaExibicao.value = !telaExibicao.value;
}
function capturarFoto(event) {
  arquivoFoto.value = event.target.files[0];
}

function capturarBanner(event) {
  arquivoBanner.value = event.target.files[0];
}

const biografiaEdit = ref('');
const localizacaoEdit = ref('');
const nomeEdit = ref('');

const showWarningNome = ref(false);

function adicionarNovasTags() {
 adicionarTag.value = !adicionarTag.value;
}

const edicaoDosDados = async () => {
  if (nomeEdit.value === '') {
    showWarningNome.value = !showWarningNome.value;
  } else {
    showWarningNome.value = false;
  try {
    const resposta = await fetch(`http://localhost:3000/api/usuario/perfil/${idUsuarioDaURL}`, {
      method: 'PUT',
      headers: {
        'content-Type' : 'application/json'
      },
      body: JSON.stringify({
        nome: nomeEdit.value,
        biografia: biografiaEdit.value,
        localizacao: localizacaoEdit.value
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert(dados.erro || "Erro ao atualizar dados.");
      return;
    }
    if (arquivoFoto.value || arquivoBanner.value) {
      const dadosMidia = new FormData();

      if (arquivoFoto.value) dadosMidia.append('foto', arquivoFoto.value);
      if (arquivoBanner.value) dadosMidia.append('banner', arquivoBanner.value);

      const respostaMidia = await fetch(`http://localhost:3000/api/usuario/perfil/${idUsuarioDaURL}/midias`, {
        method: 'PUT',
        body: dadosMidia
      });
      const resultadoMidia = await respostaMidia.json();
      if (respostaMidia.ok) {
        fotoPerfil.value = resultadoMidia.foto_profile;
        bannerUrl.value = resultadoMidia.banner_fundo;
      } else {
        alert(resultadoMidia.erro || "Erro ao processar imagens.");
      }
    };
    nomeUsuario.value = nomeEdit.value;
    biografia.value = biografiaEdit.value;
    localizacao.value = localizacaoEdit.value;
    editarPerfil.value = false;
  } catch(erro) {
    console.error('Não foi possível adicionar os dados', erro);
  }
}};

function moverTagParaListaUsuario(tagUniversal) {
  if (!tagsDoUsuario.value.includes(tagUniversal)) {
    tagsDoUsuario.value.push(tagUniversal);
  } else {
    console.log('Esta tag já existe.')
  }
};
function mostrarJanelaEditor() {
  editarPerfil.value = !editarPerfil.value;
  biografiaEdit.value = biografia.value;
  nomeEdit.value = nomeUsuario.value;
};
function deletarTag(index) {
  tagsDoUsuario.value.splice(index, 1)
};
const idUsuarioDaURL = route.params.id;

const carregarDadosDoPerfil = async () => {
  try {
    const respostaPerfil = await fetch(`http://localhost:3000/api/usuario/perfil/${idUsuarioDaURL}`);
    const dadosPerfil = await respostaPerfil.json();

    if (respostaPerfil.ok) {
      nomeUsuario.value = dadosPerfil.nome;
      statusOnline.value = dadosPerfil.status_online;
      biografia.value = dadosPerfil.biografia;
      localizacao.value = dadosPerfil.localizacao;
      dataDeCriacao.value = dadosPerfil.data_criacao;
      fotoPerfil.value = dadosPerfil.foto_profile || '';
      bannerUrl.value = dadosPerfil.banner_fundo || '';

      if (dadosPerfil.data_criacao) {
    dataDeCriacao.value = new Date(dadosPerfil.data_criacao).toLocaleDateString('pt-BR');
  };
    }
    const respostaPosts = await fetch(`http://localhost:3000/api/usuario/postagens/${idUsuarioDaURL}`);
    postagens.value = await respostaPosts.json();
  } catch (erro) {
    console.error("Erro ao buscar dados do perfil:", erro);
  }
};
onMounted(() => {
  carregarDadosDoPerfil();
});
</script>

<template>
  <main>
    <section v-if="telaExibicao" class="telaDeExibicao">
      <div class="divDoUsuario">
        <div class="bannerPerfil">
          <img v-if="bannerUrl && bannerUrl !== ''" :src="bannerUrl" alt="Banner" class="banner">
        </div>
        <div class="cabecalho-perfil">
          <div class="fotoDePerfil">
            <div class="molduraPerfil">
              <img v-if="fotoPerfil && fotoPerfil !== ''" :src="fotoPerfil" alt="Foto-de-perfil" class="fotoPerfil">
              <img v-else :src="userBlackFull" alt="Default-foto-perfil" class="fotoPerfilDefault">
            </div>
          </div>
          <div class="dadosCabecalho">
            <h2 class="nomeDeUsuario">{{ nomeUsuario }}</h2>
            <div v-if="statusOnline" class="statusUsuarioOnline">
              <div class="IndicadorOnline"></div>
              <span class="OnlineTexto">Online</span>
            </div>
            <div v-else class="statusUsuarioOffline">
              <div class="IndicadorOffline"></div>
              <span class="OfflineTexto">Offline</span>
            </div>
            <div>
              <span class="spanSeguidores">{{ seguidoresUsuario }} seguidores | {{ usiarioSeguindo }} seguindo</span>
            </div>
          </div>
        </div>
        <div class="botoes">
          <button @click="mostrarTelaConfiguracao" class="btnPerfil">
            <img :src="gear" alt="">
            <span>Configurações</span>
          </button>
          <button @click="mostrarJanelaEditor" class="btnPerfil">
            <img :src="canetaEdicao" alt="">
            <span>Editar Perfil</span>
          </button>
        </div>
        <div class="spanInfo">
          <img :src="dataCriacao" alt="Data-de-Criacao">
          <span class="titulo">Data de Criação:</span><span class="creationDate">{{ dataDeCriacao }}</span>
        </div>
        <div class="spanInfo">
          <img :src="local" alt="local">
          <span class="titulo">Localização:</span><span v-if="localizacao" class="localization">{{ localizacao }}</span>
          <span v-else class="localization">
            Nenhuma localização mencionada
          </span>
        </div>
        <div class="biografia">
          <h3>Biografia</h3>
          <div class="biografiaFieldset">
            <p v-if="biografia">{{ biografia }}</p>
            <div v-else class="semBiografia">
              <img :src="interrogacao" alt="">
              <span class="textoDeAviso">Não há nada escrito ainda</span>
            </div>
            <span class="indicadorDeLimite">{{ biografia ? biografia.length : 0 }}/500</span>
          </div>
        </div>
        <div class="tags">
          <h3 class="tituloTags">Tags</h3>
          <div class="divDasTagsDoUsuario">
            <div v-for="(tag, index) in tagsDoUsuario" :key="index">
            <button  class="tag" @click="deletarTag">
              {{ tag }}
            </button>
          </div>
          <div>
            <button @click="adicionarNovasTags" class="tag">
              <img :src="plus" alt="adicionar-tag">
            </button>
          </div>
          </div>
          <div v-show="adicionarTag === true" class="listaParaAdicionarTags">
            <div v-for="(tagUniversal, index) in listaTagsTotais" :key="index">
              <button @click="moverTagParaListaUsuario(tagUniversal)" class="tag">
                {{ tagUniversal }}
              </button>
            </div>
            <button @click="adicionarNovasTags" class="btnTagsFechar">
              fechar
            </button>
          </div>
        </div>
        <div class="postagens">
          <h3>Postagens</h3>
            <div v-if="postagens.length === 0" class="caixa-postagens-vazia">
              <img :src="interrogacao" alt="Sem postagens">
              <span class="textoDeAviso">Ainda não há nenhuma postagem</span>
            </div>
        <div v-else class="lista-de-posts-real">
      <div
      v-for="postagem in postagens"
      :key="postagem.id_postagem"
      class="cartao-postagem-usuario">
        <p class="texto-do-post">{{ postagem.conteudo }}</p>
        <span class="data-do-post">
          Publicado em: {{ new Date(postagem.data_envio).toLocaleDateString('pt-BR') }}
        </span>
      </div>
      </div>
    </div>
        <div class="mural">
          <h3>Mural</h3>
          <div v-if="comentariosMural.length === 0" class="caixa-mural-vazia">
            <img :src="interrogacao" alt="Mural Vazio">
            <span class="textoDeAviso">Ninguém comentou nada ainda</span>
          </div>
          <div v-else class="listaDasPostagens">
            <div  v-for="comentario in comentariosMural" :key="comentario">
            </div>
          </div>
        </div>
        <div class="favoritos">
          <h3>Perfis favoritos</h3>
         <div v-if="perfisFavoritos.length === 0" class="textoDeAviso info-vazio">
            Você ainda não favoritou nenhum perfil.
          </div>
          <div v-else class="gradeFavoritos">
            <div v-for="(perfil, index) in perfisFavoritos" :key="index" class="card-favorito">
              <div class="avatar-favorito">
                <img :src="userBlackFull" alt="Avatar">
              </div>
              <span class="nome-favorito">{{ perfil }}</span>
            </div>
          </div>
        </div>
        <div class="suporte">
          <a href="#" class="link-suporte">
            <img :src="setinha" alt="Suporte"> Suporte
          </a>
        </div>
      </div>
    </section>
    <div v-if="editarPerfil" class="overlay">
        <div class="form">
          <h2 class="overlayFormTitulo">Editar Perfil</h2>
          <form @submit.prevent="edicaoDosDados" class="formularioDeEdicao">
          <div class="divFormEditPerfil">
            <label for="novo-nome">Novo nome</label>
            <input type="text" v-model="nomeEdit" minlength="1" maxlength="50" id="novo-nome" placeholder="Insira o seu nome" class="inputFormEdit">
            <p v-if="showWarningNome" class="paragrafoVermelho">Por favor, coloque pelo menos um caractere.</p>
          </div>
          <div class="divFormEditPerfil">
            <label for="nova-local">Nova localização</label>
            <input type="text" v-model="localizacaoEdit" id="nova-local" placeholder="Insira sua localização" class="inputFormEdit">
          </div>
          <div class="divFormEditPerfil">
            <label for="biografiaEdit">Nova biografia</label>
            <textarea v-model="biografiaEdit" id="biografiaEdit" rows="3" maxlength="500" placeholder="Insira sua biografia" class="textarea"></textarea>
          </div>
          <div class="divEditImage">
      <label>Alterar Foto de Perfil:</label>
      <input type="file" accept="image/*" @change="capturarFoto" class="imageInput">
    </div>
    <div class="divEditImage">
      <label>Alterar Imagem de Banner:</label>
      <input type="file" accept="image/*" @change="capturarBanner" class="imageInput">
    </div>
          <div class="botoesDoFormEditPerfil">
            <button type="submit" class="salvarAlteracoes">Salvar</button>
            <button type="button" @click="editarPerfil = false" class="cancelarAlteracoes">Cancelar</button>
          </div>
        </form>
        </div>
      </div>
      <button v-if="telaConfig"  @click="mostrarTelaConfiguracao" class="botaoVoltar">
          <img :src="voltar" alt="" class="setaVoltar">
      </button>
      <section v-if="telaConfig" class="configuracoes">
        <div>
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
  display: flex;
  align-items: center;
}
.divDasTagsDoUsuario {
  display: flex;
  margin-top: 0.5vw;
  flex-wrap: wrap;
  gap: 0.4vw;
}
.listaParaAdicionarTags {
  display: flex;
  margin: 0.5vw auto;
  flex-wrap: wrap;
  gap: 0.4vw;
  border-top: 0.8px solid #000;
  padding-top: 0.5vw;
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
.lista-de-posts-real {
  display: flex;
  flex-direction: column;
  border: 1px solid #000;
  margin-top: 0.5vw;
  border-radius: 6px;
  padding: 1vw;
  box-sizing: border-box;
  min-height: 10vw;
  align-items: center;
  justify-content: center;
  gap: 0.5vw;
}
.dadosCabecalho {
  display: flex;
  flex-direction: column;
  gap: 0.2vw;
  max-width: 25vw;
  min-width: 0;
  overflow: hidden;
}
.cartao-postagem-usuario {
  border: 1px solid #000;
  padding: 1vw;
  min-width: 100%;
  border-radius: 6px;
}
.inputFormEdit {
  padding: 0.4vw;
}
section.configuracoes {
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
.nomeDeUsuario{
  font-size: 1.8vw;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  width: 100%;
  text-overflow: ellipsis;
  display: block;
}
.textarea {
  max-width: 27.87vw;
  min-width: 10vw;
  min-height: 3vw;
  max-height: 12vw;
  padding: 0.5vw;
}
.divEditImage {
  margin-top: 0.5vw;
}
.overlayFormTitulo {
  width: 100%;
  background-color: #3CBC00;
  color: #fff;
  height: 100%;
  padding: 1vw;
}
.salvarAlteracoes {
  padding: 0.5vw;
  width: 7.2vw;
  border-radius: 10px;
  font-size: 1vw;
  border: none;
  background-color: #3CBC00;
  font-weight: bold;
  color: #fff;
}
.salvarAlteracoes:hover {
background-color: #37ad00;
cursor: pointer;
}
.cancelarAlteracoes {
  padding: 0.5vw;
  width: 7.2vw;
  border-radius: 10px;
  font-size: 1vw;
  border: 1px solid #000;
  background-color: #fff;
}
.cancelarAlteracoes:hover {
  background-color: #e7e7e7;
  cursor: pointer;
}
.formularioDeEdicao {
  padding: 0 1vw 0 1vw;
}
.paragrafoVermelho {
  color: #cf0000;
}
.form {
  background-color: #fff;
  width: 30vw;
  border: 0.8px solid #000;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  gap: 0.5vw;
  overflow: hidden;
}
.divFormEditPerfil {
  display: flex;
  flex-direction: column;
  gap: 0.5vw;
  margin-bottom: 0.4vw;
}
.botoesDoFormEditPerfil {
  display: flex;
  justify-content: center;
  width: 100%;
  gap: 0.5vw;
  margin: 0.5vw;
}
.overlay {
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
.btnTagsFechar:hover {
  transition: 0.2s;
  background-color: #cf0000;
  cursor: pointer;
}
.biografia {
  margin: 1vw 1vw;
}
.tags {
  margin: 1vw 1vw;
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
.indicadorDeLimite {
  color: #8b8b8b;
  position: absolute;
  bottom: 0;
  right: 0.2vw;
  font-size: 1vw;
}
.biografiaFieldset {
  display: flex;
  border: 1px dashed #000;
  margin-top: 0.5vw;
  border-radius: 6px;
  padding: 0.7vw;
  box-sizing: border-box;
  min-height: 10vw;
  position: relative;
  justify-content: center;
  overflow-wrap: break-word;
}
.biografiaFieldset p {
  width: 100%;
  max-width: 100%;
  font-size: 1vw;
  color: #333;
  margin: 0;
  line-height: 1.4;
  text-align: left;
  padding-bottom: 0.8vw;
  top: 0;
}
.textoDeAviso {
  color: #8b8b8b;
}
.semBiografia {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.botoes {
  display: flex;
  margin-left: 1vw;
  margin-top: 1vw;
  gap: 0.5vw;
  margin-bottom: 1vw;
}
.btnPerfil {
  background-color: #fff;
  border-radius: 100px;
  display: flex;
  align-items: center;
  align-items: center;
  gap: 5px;
  padding: 1px 7px;
  border: 0.8px solid #000;
}
.localization , .creationDate {
  color: #8b8b8b
}
.spanInfo {
  display: flex;
  align-items: center;
  margin-left: 1vw;
  gap: 0.4vw;
}
.btnPerfil:hover {
  background-color: #e7e7e7;
  cursor: pointer;
}
section.telaDeExibicao {
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
.botaoVoltar:hover {
  background-color: #e7e7e7;
  cursor: pointer;
}
.setaVoltar {
  width: 2vw;
  height: 2vw;
}
.bannerPerfil {
  height: 11vw;
  background-color: #55ff3389;
  margin: 0.5vw 0.5vw;
  border-radius: 5px;
  overflow: hidden;
}
.cabecalho-perfil {
  display: flex;
}
.molduraPerfil {
  overflow: hidden;
  height: 6vw;
  width: 6vw;
  border-radius: 100px;
  align-items: center;
  display: flex;
  justify-content: center;
}
.fotoDePerfil {
  background-color: #fff;
  margin-top: -3vw;
  margin-left: 1vw;
  margin-right: 0.5vw;
  position: relative;
  z-index: 1000;
  border-radius: 100px;
  width: 7vw;
  height: 7vw;
  display: flex;
  align-items: center;
  justify-content: center;

}
.fotoPerfilDefault {
  object-fit: cover;
  width: 8vw;
  height: 8vw;
}
.fotoPerfil {
  object-fit: cover;
  width: 100%;
  height: 100%;
}
.banner {
  object-fit: cover;
  width: 100%;
  height: 100%;
  opacity: 1 !important;
}
.spanSeguidores {
  color: #8b8b8b;
}
.OnlineTexto , .OfflineTexto {
  color: #8b8b8b;
  font-size: 0.95vw;
}
section::-webkit-scrollbar-track {
  width: 8px;
}
section::-webkit-scrollbar-thumb {
  background-color: #ccc;
}
section::-webkit-scrollbar-thumb:hover {
  background-color: #aaaaaa;
}
.IndicadorOnline {
  background-color: #3CBC00;
  width: 1vw;
  height: 1vw;
  border-radius: 200px;
}
.IndicadorOffline {
  background-color: #9b9b9b;
  width: 1vw;
  height: 1vw;
  border-radius: 200px;
}
.statusUsuarioOffline {
  display: flex;
  gap: 0.1vw;
  align-items: center;
}
.statusUsuarioOnline {
  display: flex;
  gap: 0.1vw;
  align-items: center;
}
.gradeFavoritos {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8vw;
  margin-top: 0.5vw;
}
.postagens, .mural, .favoritos, .suporte {
  margin: 1.5vw 1vw;
}
.postagens h3, .mural h3, .favoritos h3 {
  margin-bottom: 0.5vw;
}
.caixa-postagens-vazia, .caixa-mural-vazia {
  display: flex;
  flex-direction: column;
  border: 1px solid #000;
  margin-top: 0.5vw;
  border-radius: 6px;
  padding: 1.5vw;
  box-sizing: border-box;
  min-height: 10vw;
  align-items: center;
  justify-content: center;
}
.suporte {
  margin-top: 2vw;
  padding-top: 1vw;
  border-top: 1px solid #000;
}
.link-suporte {
  color: #00d2ff;
  text-decoration: none;
  font-weight: bold;
  font-size: 1vw;
  display: inline-flex;
  align-items: center;
  gap: 0.1vw;
}
.link-suporte:hover {
  text-decoration: underline;
}
.seta-suporte {
  display: inline-block;
  transform: rotate(0deg);
}
</style>
