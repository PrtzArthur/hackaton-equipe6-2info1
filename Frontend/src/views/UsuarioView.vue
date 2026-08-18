<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import ModalComentarios from '@/components/ModalComentarios.vue';
import { io } from 'socket.io-client';
import { useRoute } from 'vue-router';
import userBlackFull from '@/icons/userBlackFull.svg';
import canetaEdicao from '@/icons/canetaEdicao.svg';
import gear from '@/icons/gear.svg';
import dataCriacao from '@/icons/dataCriacao.svg';
import local from '@/icons/local.svg';
import interrogacao from '@/icons/interrogacao.svg';
import tagsTotais from '@/data/tags';
import plus from '@/icons/plus.svg';
import setinha from '@/icons/setinha.svg';
import voltar from '@/icons/voltar.svg';
import marcadorInline from '@/icons/marcadorInline.svg';
import marcadorPreenchido from '@/icons/marcadorPreenchido.svg';
import likePreenchido from '@/icons/likePreenchido.svg';
import likeInline from '@/icons/likeInline.svg';
import compartilhar from '@/icons/compartilhar.svg';
import comentarios from '@/icons/comentarios.svg';
import dislikeInline from '@/icons/dislikeInline.svg';
import dislikePreenchido from '@/icons/dislikePreenchido.svg';
import notificacoesAtivo from '@/icons/notificacoesAtivo.svg';
import favoritarInline from '@/icons/favoritarInline.svg';
import favoritarPreenchido from '@/icons/favoritarPreenchido.svg';
import logoutRED from '@/icons/logoutRED.svg'
import { useRouter } from 'vue-router';
import lixeira from '@/icons/lixeira.svg'
import { useToast } from 'vue-toastification';

const router = useRouter();
const toast = useToast();

async function logout() {
  const idLogado = localStorage.getItem('ifchat_user_id');

  const faxinaSessaoLocal = () => {
    localStorage.removeItem('ifchat_user_id');
    localStorage.removeItem('ifchat_user_name');
    localStorage.removeItem('ifchat_user_username');
    localStorage.removeItem('ifchat_user_foto');
    localStorage.removeItem('ifchat_user_token');
    localStorage.removeItem('ifchat_token');
  };

  if (!idLogado) {
    faxinaSessaoLocal();
    router.push('/');
    return;
  }

  try {
    const resposta = await fetch('http://localhost:3000/api/usuario/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idUsuario: idLogado })
    });

    if (resposta.ok) {
      faxinaSessaoLocal();
      toast.info('Você saiu da conta com sucesso!');
      router.push('/');
    } else {
      console.error("O servidor rejeitou o pedido de desconexão.");
      faxinaSessaoLocal();
      router.push('/');
    }
  } catch (erro) {
    console.error("Erro de conexão ao tentar fazer logout:", erro);
    faxinaSessaoLocal();
    router.push('/');
  }
}
const route = useRoute();

const socket = io('http://localhost:3000');

const editarPerfil = ref(false);
const modalAberto = ref(false);
const postSelecionado = ref(null);

function abrirMural(post) {
  postSelecionado.value = post;
  modalAberto.value = true;
}

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
const removerFotoMarcada = ref(false);
const removerBannerMarcado = ref(false);

const curtido = ref(false);
const naoCurtido = ref(false);
const naoSalvo = ref(false);

const telaExibicao = ref(true);
const telaConfig = ref(false);

// --- Bloquear usuário ---
const usuarioBloqueado = ref(false);
const mostrarConfirmacaoBloqueio = ref(false);

function abrirConfirmacaoBloqueio() {
  mostrarConfirmacaoBloqueio.value = true;
}

function cancelarBloqueio() {
  mostrarConfirmacaoBloqueio.value = false;
}

async function confirmarBloqueio() {
  try {
    const resposta = await fetch(`http://localhost:3000/api/usuario/bloquear/${idUsuarioDaURL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idUsuarioLogado: meuIdLogado.value })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      usuarioBloqueado.value = true;
      mostrarConfirmacaoBloqueio.value = false;
      alert('Usuário bloqueado com sucesso!');
    } else {
      alert(dados.erro || 'Não foi possível bloquear o usuário.');
    }
  } catch (erro) {
    console.error('Erro ao bloquear usuário:', erro);
    alert('Erro de comunicação com o servidor.');
  }
}

async function desbloquearUsuario() {
  try {
    const resposta = await fetch(`http://localhost:3000/api/usuario/bloquear/${idUsuarioDaURL}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idUsuarioLogado: meuIdLogado.value })
    });

    if (resposta.ok) {
      usuarioBloqueado.value = false;
      alert('Usuário desbloqueado.');
    } else {
      const dados = await resposta.json();
      alert(dados.erro || 'Não foi possível desbloquear o usuário.');
    }
  } catch (erro) {
    console.error('Erro ao desbloquear usuário:', erro);
    alert('Erro de comunicação com o servidor.');
  }
}
// --- Fim bloquear usuário ---

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

const jaEFavorito = ref(false);

function obterChaveFavoritos() {
  return `ifchat_favoritos_${meuIdLogado.value}`;
}
function verificarStatusFavorito() {
  const idAtualDaBarra = route.params.id;

  const favoritosSalvos = JSON.parse(localStorage.getItem(obterChaveFavoritos()) || '[]');
  jaEFavorito.value = favoritosSalvos.includes(idAtualDaBarra);
}
function alternarFavorito() {
  const idAtualDaBarra = route.params.id;
  const chaveConta = obterChaveFavoritos();
  let favoritosSalvos = JSON.parse(localStorage.getItem(chaveConta) || '[]');

  if (jaEFavorito.value) {
    favoritosSalvos = favoritosSalvos.filter(id => id !== idAtualDaBarra);
    jaEFavorito.value = false;
  } else {
    favoritosSalvos.push(idAtualDaBarra);
    jaEFavorito.value = true;
  }

  localStorage.setItem(chaveConta, JSON.stringify(favoritosSalvos));
  carregarGradeDeFavoritosVisuais();
}
async function carregarGradeDeFavoritosVisuais() {
  const idAtualDaBarra = route.params.id;
  const donoDoPerfilExibido = idAtualDaBarra;

  const chaveFavoritosDonoDaTela = `ifchat_favoritos_${donoDoPerfilExibido}`;
  const favoritosIds = JSON.parse(localStorage.getItem(chaveFavoritosDonoDaTela) || '[]');

  if (favoritosIds.length === 0) {
    perfisFavoritos.value = [];
    return;
  }

  try {
    const resposta = await fetch('http://localhost:3000/api/usuario/favoritos/detalhes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: favoritosIds })
    });

    if (resposta.ok) {
      perfisFavoritos.value = await resposta.json();
    }
  } catch (erro) {
    console.error("Erro ao traduzir favoritos:", erro);
  }
}
const deletarPostagemDoBanco = async (idPostagem) => {
  const confirmou = confirm("Você tem certeza absoluta que deseja excluir de forma permanente esta postagem?");

  if (!confirmou) return;

  try {
    const resposta = await fetch(`http://localhost:3000/api/usuario/postagens/${idPostagem}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idUsuario: meuIdLogado.value
      })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      toast.success("Postagem excluída com sucesso!");
      postagens.value = postagens.value.filter(post => post.id_postagem !== idPostagem);
    } else {
      toast.warning(dados.erro || "Não foi possível deletar a postagem.");
    }

  } catch (erro) {
    console.error("Erro de conexão ao deletar post:", erro);
    toast.error("Erro de comunicação com o servidor.");
  }
};
const edicaoDosDados = async () => {
  const idAtualDaBarra = route.params.id;

  if (nomeEdit.value === '') {
    showWarningNome.value = !showWarningNome.value;
  } else {
    showWarningNome.value = false;
    try {
      const listaDeTagsPuras = [...tagsDoUsuario.value];

      const resposta = await fetch(`http://localhost:3000/api/usuario/perfil/${idAtualDaBarra}`, {
        method: 'PUT',
        headers: {
          'content-Type' : 'application/json'
        },
        body: JSON.stringify({
          nome: nomeEdit.value,
          biografia: biografiaEdit.value,
          localizacao: localizacaoEdit.value,
          tags: listaDeTagsPuras
        })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        toast.error(dados.erro || "Erro ao atualizar dados.");
        return;
      }
      if (arquivoFoto.value || arquivoBanner.value || removerFotoMarcada.value || removerBannerMarcado.value) {
        const dadosMidia = new FormData();

        if (arquivoFoto.value && !removerFotoMarcada.value) dadosMidia.append('foto', arquivoFoto.value);
        if (arquivoBanner.value && !removerBannerMarcado.value) dadosMidia.append('banner', arquivoBanner.value);

        dadosMidia.append('removerFoto', removerFotoMarcada.value);
        dadosMidia.append('removerBanner', removerBannerMarcado.value);

        const respostaMidia = await fetch(`http://localhost:3000/api/usuario/perfil/${idAtualDaBarra}/midias`, {
          method: 'PUT',
          body: dadosMidia
        });
        const resultadoMidia = await respostaMidia.json();

        if (respostaMidia.ok) {
          fotoPerfil.value = resultadoMidia.foto_profile || '';
          bannerUrl.value = resultadoMidia.banner_fundo || '';
        } else {
          toast.error(resultadoMidia.erro || "Erro ao processar imagens.");
        }
      }
      nomeUsuario.value = nomeEdit.value;
      biografia.value = biografiaEdit.value;
      localizacao.value = localizacaoEdit.value;
      removerFotoMarcada.value = false;
      removerBannerMarcado.value = false;
      arquivoFoto.value = null;
      arquivoBanner.value = null;
      editarPerfil.value = false;
      toast.success("Perfil atualizado com sucesso!");
    } catch(erro) {
      console.error('Não foi possível adicionar os dados', erro);
    }
  }
};
function moverTagParaListaUsuario(tagUniversal) {
  if (!tagsDoUsuario.value.includes(tagUniversal)) {
    tagsDoUsuario.value.push(tagUniversal);
  } else {
    toast.warning('Você já adicionou esta tag ao seu perfil!');
  }
}
function mostrarJanelaEditor() {
  editarPerfil.value = !editarPerfil.value;
  biografiaEdit.value = biografia.value;
  nomeEdit.value = nomeUsuario.value;
}
function deletarTag(index) {
  tagsDoUsuario.value.splice(index, 1);
}
const idUsuarioDaURL = ref('');
const meuIdLogado = ref('');
const jaEstouSeguindo = ref(false);
const carregarDadosDoPerfil = async () => {
  try {
    const idAtualDaBarra = route.params.id;

    const respostaPerfil = await fetch(`http://localhost:3000/api/usuario/perfil/${idAtualDaBarra}?meuId=${meuIdLogado.value}`);
    const dadosPerfil = await respostaPerfil.json();

    if (respostaPerfil.ok) {
      nomeUsuario.value = dadosPerfil.nome;
      statusOnline.value = dadosPerfil.status_online;
      biografia.value = dadosPerfil.biografia;
      localizacao.value = dadosPerfil.localizacao;
      fotoPerfil.value = dadosPerfil.foto_profile || '';
      bannerUrl.value = dadosPerfil.banner_fundo || '';
      tagsDoUsuario.value = dadosPerfil.tags || [];
      seguidoresUsuario.value = dadosPerfil.seguidores || 0;
      usiarioSeguindo.value = dadosPerfil.seguindo || 0;
      jaEstouSeguindo.value = dadosPerfil.jaSeguindo || false;

      if (dadosPerfil.data_criacao) {
        dataDeCriacao.value = new Date(dadosPerfil.data_criacao).toLocaleDateString('pt-BR');
      }
    }
    const respostaPosts = await fetch(`http://localhost:3000/api/usuario/postagens/${idAtualDaBarra}?meuId=${meuIdLogado.value}`);

    postagens.value = await respostaPosts.json();

  } catch (erro) {
    console.error("Erro ao buscar dados do perfil:", erro);
  }
};
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
      if (typeof carregarDadosDoPerfil === 'function') carregarDadosDoPerfil();
    } else {
      toast.error(dados.erro || 'Erro com o voto');
    }
  } catch (erro) {
    console.error('Erro ao votar', erro);
  }
};
function irParaPerfilDoAmigo(idAmigo) {
  router.push(`/usuario/${idAmigo}`);
}
async function alternarSeguirUsuario() {
  const idAtualDaBarra = route.params.id;

  try {
    const resposta = await fetch('http://localhost:3000/api/usuario/seguir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idSeguidor: meuIdLogado.value,
        idSeguido: idAtualDaBarra
      })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      jaEstouSeguindo.value = (dados.status === 'seguiu');
      seguidoresUsuario.value = dados.contadorSeguidoresDoPerfil;
    } else {
      toast.error(dados.erro || "Erro ao processar ação.");
    }
  } catch (erro) {
    console.error("Erro de conexão ao seguir:", erro);
  }
};
const eMeuPerfil = ref(false);
function gerenciarPermissoesDeVisualizacao() {
  const idAtualDaBarra = route.params.id;
  meuIdLogado.value = localStorage.getItem('ifchat_user_id') || '';
  if (idAtualDaBarra === meuIdLogado.value) {
    eMeuPerfil.value = true;
  } else {
    eMeuPerfil.value = false;
  }
}
watch(
  () => route.params.id,
  (novoId) => {
    if (novoId) {
      idUsuarioDaURL.value = novoId;
      gerenciarPermissoesDeVisualizacao();
      carregarDadosDoPerfil();
      verificarStatusFavorito();
      carregarGradeDeFavoritosVisuais();
    }
  }
);
onMounted(() => {
  meuIdLogado.value = localStorage.getItem('ifchat_user_id') || '';
  idUsuarioDaURL.value = route.params.id;
  gerenciarPermissoesDeVisualizacao();
  carregarDadosDoPerfil();
  verificarStatusFavorito();
  carregarGradeDeFavoritosVisuais();

   socket.on('usuario_status_mudou', (dadosRecebidos) => {
    if (route.params.id === dadosRecebidos.id_usuario) {
      statusOnline.value = dadosRecebidos.status_online;
    }
     const amigoNaLista = perfisFavoritos.value.find(p => p.id_usuario === dadosRecebidos.id_usuario);
    if (amigoNaLista) {
      amigoNaLista.status_online = dadosRecebidos.status_online;
    }
  });
});
onUnmounted(() => {
  socket.off('usuario_status_mudou');
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
          <div class="dados-Cabecalho">
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
        <div v-if="idUsuarioDaURL === meuIdLogado" class="botoes">
          <button @click="mostrarTelaConfiguracao" class="btnPerfil">
            <img :src="gear" alt="">
            <span>Configurações</span>
          </button>
          <button @click="mostrarJanelaEditor" class="btnPerfil">
            <img :src="canetaEdicao" alt="">
            <span>Editar Perfil</span>
          </button>
        </div>
        <div v-else class="botoesU">
          <div class="btnParaUsuariosEstrangeiros">
            <button
            type="button"
            @click="alternarSeguirUsuario"
            :class="jaEstouSeguindo ? 'btnSeguindo' : 'btnSeguir' "
          >
            <span>{{ jaEstouSeguindo ? 'Seguindo' : 'Seguir' }}</span>
          </button>
            <button class="btn-notificacoes"><img :src="notificacoesAtivo" alt="" class="sininhoNotificacao"></button>
            <button class="btnChat">Chat</button>
          </div>
          <button
            v-if="jaEFavorito"
            type="button"
            @click="alternarFavorito"
            class="btnPerfilFavorito"
          >
            <img :src="favoritarPreenchido" alt="" class="favoritarPerfilDeUsuario">
          </button>
          <button
            v-else
            type="button"
            @click="alternarFavorito"
            class="btnPerfilFavorito"
          >
            <img :src="favoritarInline" alt="" class="favoritarPerfilDeUsuario">
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
            <button class="tag" :disabled="meuIdLogado !== idUsuarioDaURL" @click="deletarTag(index)">
              {{ tag }}
            </button>
          </div>
          <div v-if="idUsuarioDaURL === meuIdLogado">
            <button @click="adicionarNovasTags" class="tag">
              <img :src="plus" alt="adicionar-tag">
            </button>
          </div>
          </div>
          <div v-show="adicionarTag === true" class="listaParaAdicionarTags">
            <div v-for="(tagUniversal, index) in listaTagsTotais" :key="index">
              <button v-if="idUsuarioDaURL === meuIdLogado" @click="moverTagParaListaUsuario(tagUniversal)" class="tag">
                {{ tagUniversal }}
              </button>
              <button v-else class="tag">
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
      class="cartao-postagem-usuario"
      >
      <p v-if="postagem.conteudo" class="texto-do-post">{{ postagem.conteudo }}</p>
      <div v-if="postagem.imagem" class="container-imagem-post">
        <img :src="postagem.imagem" alt="Imagem da postagem" class="imagem-revelada-post">
      </div>
      <div v-if="postagem.tipo === 'postagemComEnquete' && postagem.opcoes && postagem.opcoes.length > 0" class="render-enquete-post">
        <p class="titulo-mini-enquete">Enquete:</p>
        <div class="lista-opcoes-voto">
          <div v-for="opcao in postagem.opcoes" :key="opcao.id_opcao" class="card-opcao-container">
            <button
              type="button"
              :disabled="meuIdLogado === idUsuarioDaURL"
              @click="votarNaEnquete(opcao.id_opcao, postagem.id_postagem)"
              class="btn-enquete-dinamico"
              :class="{ 'opcao-selecionada-local': opcao.votadoPorMim }"
            >
              <div v-if="postagem.jaVotado" class="fundo-progresso-verde" :style="{ width: opcao.porcentagem + '%' }"></div>
              <div class="conteudo-resultado-linha">
                <span class="texto-opcao-voto">
                  {{ opcao.texto_opcao }}
                  <strong v-if="opcao.votadoPorMim" class="opcao-escolhida">!</strong>
                </span>
                <span v-if="postagem.jaVotado || idUsuarioDaURL === meuIdLogado" class="porcentagem-texto-voto">{{ opcao.porcentagem }}%</span>
              </div>
            </button>
          </div>
        </div>
        <span class="total-votos-legenda">{{ postagem.totalVotosGeral || 0 }} votos no total</span>
      </div>
        <div v-if="postagem.tags && postagem.tags.length > 0" class="container-tags-postagem">
        <span v-for="(tag, index) in postagem.tags" :key="index" class="pilula-tag-post">
          {{ tag }}
        </span>
      </div>
      <div class="div-botoes-postagens">
        <button :disabled="idUsuarioDaURL === meuIdLogado" class="btn-post"><img v-if="curtido" :src="likePreenchido" alt=""><img v-else :src="likeInline" alt="curtir"></button>
        <button :disabled="idUsuarioDaURL === meuIdLogado" class="btn-post"><img v-if="naoCurtido" :src="dislikePreenchido" alt=""><img v-else :src="dislikeInline" alt="não curtir"></button>
        <button class="btn-post" @click="abrirMural(postagem)"><img :src="comentarios" alt="comentar"></button>
        <button class="btn-post"><img :src="compartilhar" alt="compartilhar"></button>
        <button class="btn-post"><img v-if="!naoSalvo" :src="marcadorInline" alt=""><img v-else :src="marcadorPreenchido" alt="não curtir"></button>
      </div>
      <div class="divDeleteEPublicacao">
        <span class="data-do-post">
          Publicado em: {{ new Date(postagem.data_envio).toLocaleDateString('pt-BR') }}
        </span>
        <button v-if="route.params.id === meuIdLogado" @click="deletarPostagemDoBanco(postagem.id_postagem)" class="btnLixeira">
          <img :src="lixeira" alt="deletar post" class="imgDelete">
        </button>
      </div>
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
          <h3>Perfim favoritos</h3>
          <div v-if="perfisFavoritos.length === 0" class="textoDeAviso info-vazio">
            Nenhum perfil favoritado encontrado nesta conta.
          </div>
          <div v-else class="gradeFavoritos">
            <div v-for="perfil in perfisFavoritos" :key="perfil.id_usuario" @click="irParaPerfilDoAmigo(perfil.id_usuario)" class="card-favorito">
              <div class="avatar-favorito-container">
                <img v-if="perfil.foto_profile" :src="perfil.foto_profile" alt="Avatar" class="fotoPerfil-favorito">
                <img v-else :src="userBlackFull" alt="Avatar Padrão" class="fotoPerfilDefault-favorito">
                <div v-if="perfil.status_online === 1" class="bolinha-status-favorito online"></div>
                <div v-else class="bolinha-status-favorito offline"></div>
              </div>
              <span class="nome-favorito">{{ perfil.nome }}</span>
            </div>
          </div>
        </div>
        <div class="suporte">
          <a href="#" class="link-suporte">
            <img :src="setinha" alt="Suporte"> Suporte
          </a>
          <div v-if="idUsuarioDaURL !== meuIdLogado" class="acoesModeracao">
            <button v-if="!usuarioBloqueado" @click="abrirConfirmacaoBloqueio" class="btnBloquear">
              Bloquear usuário
            </button>
            <button v-else @click="desbloquearUsuario" class="btnDesbloquear">
              Desbloquear usuário
            </button>
          </div>
        </div>
      </div>
    </section>
    <ModalComentarios
  :isOpen="modalAberto"
  :post="postSelecionado"
  @fechar="modalAberto = false"
/>
    <div v-if="editarPerfil" class="overlay" @click.self="editarPerfil = false">
        <div class="form">
          <h2 class="overlayFormTitulo">Editar Perfil</h2>
          <form @submit.prevent="edicaoDosDados" class="formularioDeEdicao">
          <div class="divFormEditPerfil">
            <label for="novo-nome">Novo nome</label>
            <input type="text" v-model="nomeEdit" minlength="1" maxlength="50" id="novo-nome" placeholder="Insira o seu nome" class="inputFormEdit" autofocus>
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
        <label class="labelMidiPerfil">Alterar Foto de Perfil:</label>
        <div class="linha-controle-midia-edit">
          <input type="file" accept="image/*" @change="capturarFoto" class="imageInput" :disabled="removerFotoMarcada">
          <button type="button" @click="removerFotoMarcada = !removerFotoMarcada" :class=" removerFotoMarcada ? 'marcado-para-excluir-form' : 'marcado-para-manter-form'">
            {{ removerFotoMarcada ? 'Manter-Foto' : 'Remover' }}
          </button>
        </div>
      </div>
    <div class="divEditImage">
        <label class="labelMidiPerfil">Alterar Imagem de Banner:</label>
        <div class="linha-controle-midia-edit">
          <input type="file" accept="image/*" @change="capturarBanner" class="imageInput" :disabled="removerBannerMarcado">
          <button type="button" @click="removerBannerMarcado = !removerBannerMarcado" :class=" removerBannerMarcado ? 'marcado-para-excluir-form' : 'marcado-para-manter-form' ">
            {{ removerBannerMarcado ? 'Manter-Banner' : 'Remover' }}
          </button>
        </div>
      </div>
          <div class="botoesDoFormEditPerfil">
            <button type="submit" class="salvarAlteracoes">Salvar</button>
            <button type="button" @click="editarPerfil = false" class="cancelarAlteracoes">Cancelar</button>
          </div>
        </form>
        </div>
      </div>
      <div v-if="mostrarConfirmacaoBloqueio" class="overlay">
        <div class="form formBloqueio">
          <h2 class="overlayFormTitulo overlayFormTituloVermelho">Bloquear {{ nomeUsuario }}?</h2>
          <div class="formularioDeEdicao">
            <p class="textoConfirmacaoBloqueio">
              Vocês deixarão de se seguir. {{ nomeUsuario }} não poderá ver seu perfil, mandar mensagens ou comentar nas suas postagens.
            </p>
            <div class="botoesDoFormEditPerfil">
              <button type="button" @click="confirmarBloqueio" class="btnConfirmarBloqueio">Bloquear</button>
              <button type="button" @click="cancelarBloqueio" class="cancelarAlteracoes">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
      <button v-if="telaConfig"  @click="mostrarTelaConfiguracao" class="botaoVoltar">
          <img :src="voltar" alt="" class="setaVoltar">
      </button>
      <section v-if="telaConfig" class="configuracoes">
        <div>
          <h2 class="tituloPrincipal">Configurações</h2>
          <div class="containerConfig">
            <div class="ContaSeguranca">
            <h3>Conta e Segurança</h3>
            <button>
              Alterar Senha
            </button>
            <button>
              Alterar E-mail
            </button>
          </div>
          <div class="Privacidade">
            <h3>Privacidade</h3>
            <div class="pricavidadeSelectVP">
              <span>Visibilidade do perfil</span>
              <select class="selectVP">
                <option value="1">Público</option>
                <option value="2">Privado</option>
              </select>
            </div>
            <div class="pricavidadeSelectVP">
              <span>Quem pode falar comigo</span>
              <select class="selectVP">
                <option value="1">Todos</option>
                <option value="2">Apenas amigos</option>
                <option value="3">Ninguém</option>
              </select>
            </div>
          </div>
          <div class="notificacoes">
            <h3>Notificações</h3>
            <span class="subtitulo-config">Notificações Push</span>
            <div class="lista-notificacoes-push">
              <label class="linha-checkbox-custom">
                <input type="checkbox" v-model="notifChat" class="inputCirculo">
                <span class="texto-checkbox">Novas mensagens no Chat</span>
              </label>
              <label class="linha-checkbox-custom">
                <input type="checkbox" v-model="notifComentarios" class="inputCirculo">
                <span class="texto-checkbox">Novos comentários</span>
              </label>
              <label class="linha-checkbox-custom">
                <input type="checkbox" v-model="notifEventos" class="inputCirculo">
                <span class="texto-checkbox">Novos eventos</span>
              </label>
            </div>
          </div>
          <div class="Aparencia">
            <h3>Aparência e Acessibilidade</h3>
            <div class="pricavidadeSelectVP">
              <label for="checkBoxToggle" class="labelME">
                <span>Modo Escuro</span>
              <div class="switch-container">
                <input type="checkbox" class="chekbox-Oculto" id="checkBoxToggle">
                <span class="trilha">
                  <span class="circulo"></span>
                </span>
              </div>
              </label>
            </div>
            <div class="pricavidadeSelectVP">
              <span>Tamanho da fonte</span>
              <select class="selectVP">
                <option value="1">Normal</option>
                <option value="2">Grande</option>
                <option value="3">Pequena</option>
              </select>
            </div>
          </div>
          <div class="PrivacidadeSeguranca">
            <h3>Sobre e Suporte</h3>
            <button>
              Termos de Uso
            </button>
            <button>
              Relatar um problema
            </button>
            <div class="divLogoutEDeleteAccount">
              <button @click="logout" class="buttonLogout"><span>Sair da conta</span><img :src="logoutRED" alt="Logout" class="imgLogout"></button>
              <span class="spanLogout">|</span>
              <button>Excluir conta</button>
            </div>
          </div>
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
  display: flex;
  align-items: center;
}
.divDasTagsDoUsuario {
  display: flex;
  margin-top: 0.5vw;
  flex-wrap: wrap;
  gap: 0.4vw;
}
.container-tags-postagem {
  color: blue;
  display: flex;
  gap: 0.3vw;
  font-size: 0.85vw;
  flex-wrap: wrap;
}
.marcado-para-manter-form {
  background-color: #fff;
  border: 1px solid #000;
  width: 100%;
  font-size: 1vw;
  padding: 0.5vw;
  border-radius: 6px;
}
.div-botoes-postagens {
  display: flex;
  align-items: center;
}
.marcado-para-manter-form:hover {
  background-color: #f9f9f9;
  cursor: pointer;
  transition: 0.2s;
}
.data-do-post {
  font-size: 0.8vw;
  color: #7a7a7a;
}
.marcado-para-excluir-form {
  background-color: #ff0000;
  border: 1px transparent #000;
  color: #fff;
  width: 100%;
  border: none;
  font-weight: bolder;
  font-size: 1vw;
  padding: 0.5vw;
  border-radius: 6px;
}
.marcado-para-excluir-form:hover {
  background-color: #cf0000;
  cursor: pointer;
  transition: 0.2s;
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
.listaParaAdicionarTags {
  display: flex;
  margin: 0.5vw auto;
  flex-wrap: wrap;
  gap: 0.4vw;
  border-top: 0.8px solid #000;
  padding-top: 0.5vw;
}
.btnLixeira {
  background-color: #fff;
  border: none;
  cursor: pointer;
}
.spanLogout {
  color: #cf0000;
}
.buttonLogout {
  align-items: center !important;
}
.divDeleteEPublicacao {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.checkBoxToggle {
  display: flex !important;
  flex-direction: row !important;
  justify-content: space-between;
  align-items: center;
  padding: 0.6vw 0;
  border-bottom: 1px solid #ccc;
  cursor: pointer;
  width: 100%;
}
.btnPerfilFavorito {
  background-color: #fff;
  border-radius: 50%;
  border: none;
}
.labelME {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between;
}
.chekbox-Oculto {
  opacity: 0;
  width: 0;
  height: 0;
}
.trilha {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #ccc;
  border: 1px solid #999;
  border-radius: 30px;
  transition: 0.3s;
}
.imgDelete {
  height: 1vw;
}
.switch-container {
  position: relative;
  width: 3.2vw;
  height: 1.6vw;
}
.chekbox-Oculto:checked + .trilha {
  background-color: #3CBC00;
  border-color: #319e00;
}
.chekbox-Oculto:checked + .trilha .circulo {
  transform: translateX(1.4vw);
}
.circulo {
  position: absolute;
  content: "";
  height: 1.2vw;
  width: 1.2vw;
  left: 0.2vw;
  bottom: 0.12vw;
  background-color: white;
  border: 1px solid #888;
  border-radius: 50%;
  transition: 0.3s;
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
.tituloPrincipal {
  border-bottom: 1px solid #000;
  margin: -2px;
  padding: 1vw;
  font-size: 1.7vw;
}
.avatar-favorito-container {
  position: relative;
  width: 3.5vw;
  height: 3.5vw;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fotoPerfil-favorito {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
.fotoPerfilDefault-favorito {
  width: 4.55vw;
  height: auto;
  border-radius: 50%;
  object-fit: cover;
}
.bolinha-status-favorito {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 0.8vw;
  height: 0.8vw;
  border-radius: 50%;
  border: 2px solid #fff;
  box-sizing: border-box;
}
.bolinha-status-favorito.online {
  background-color: #3CBC00;
}
.bolinha-status-favorito.offline {
  background-color: #9e9e9e;
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
  justify-content: flex-start;
  scrollbar-width: thin;
  gap: 0.5vw;
  max-height: 40vw;
  overflow-y: auto;
}
.dados-Cabecalho {
  display: flex;
  flex-direction: column;
  gap: 0.2vw;
  max-width: 25vw;
  min-width: 0;
  overflow: hidden;
}
.card-favorito {
  display: flex;
  flex-direction: column;
  border: 1px solid #000;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 6vw;
  max-width: 6vw;
  align-items: center;
  justify-content: center;
  gap: 0.5vw;
  border-radius: 6px;
}
.card-favorito:hover {
  background-color: #f9f9f9;
  transition: 0.2s;
  cursor: pointer;
}
.gradeFavoritos {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4vw;
  margin-top: 0.5vw;
  border: 1px solid #000;
  padding: 0.5vw;
  height: 9vw;
  border-radius: 6px;
}
.nome-favorito {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: bolder;
}
.cartao-postagem-usuario {
  border: 1px solid #000;
  display: flex;
  flex-direction: column;
  padding: 1vw;
  min-width: 100%;
  border-radius: 6px;
  gap: 1.5vw;
}
.inputFormEdit {
  padding: 0.4vw;
}
.divLogoutEDeleteAccount {
  display: flex !important;
  flex-direction: row !important;
  border-bottom: 1px solid #000;
  padding: 0.5vw 0;
  align-items: center;
  gap: 0.2vw;
}
.divLogoutEDeleteAccount button {
  border: none !important;
  padding: 0 !important;
  color: #cf0000;
  align-items: center !important;
  text-align: left;
  height: 100%;
  gap: 0.2vw;
}
.divLogoutEDeleteAccount button:hover {
  cursor: pointer;
  color: #ff0000;
}
.btnSeguir {
  background-color: #3CBC00;
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.9vw;
  font-weight: bolder;
  width: 6vw;
  border-radius: 20px;
}
.btnSeguir:hover {
  cursor: pointer;
  background-color: #37ad00;
}
.containerConfig div {
  display: flex;
  flex-direction: column;
}
.containerConfig div h3 {
  padding: 0.6vw 0;
  border-bottom: 1px solid #000;
  font-weight: bolder;
}
.imgLogout {
  width: 0.65vw;
  margin-left: 0.2vw;
  height: 100%;
}
.pricavidadeSelectVP {
  display: flex !important;
  flex-direction: row !important;
  justify-content: space-between;
  border-bottom: 1px solid #000;
  padding: 0.5vw 0;
  font-weight: bold;
  font-size: 0.9vw;
}
.containerConfig div button {
  background-color: #fff;
  border: none;
  border-bottom: 1px solid #000;
  padding: 0.5vw 0;
  text-align: left;
  font-weight: bold;
  font-size: 0.9vw;
}
.containerConfig {
  padding: 0.25vw;
  font-size: 1vw;
}
.btnSeguindo {
  background-color: #b5b5b5;
  color: #fff;
  border: none;
  display: flex;
  font-weight: bolder;
  border-radius: 20px;
  align-items: center;
  justify-content: center;
  padding: 0.9vw;
  width: 6vw;
}
.btnSeguindo:hover {
  cursor: pointer;
  background-color: #7a7a7a;
}
.selectVP {
  width: 9vw;
}
.btnParaUsuariosEstrangeiros {
  display: flex;
  gap: 0.4vw;
}
.btnParaUsuariosEstrangeiros button {
  font-size: 1vw;
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
.container-imagem-post {
  overflow: hidden;
  width: 100%;
  display: flex;
  align-items: center;
  height: auto;
  position: relative;
  border-radius: 10px;
  border: 1px solid #000;
  margin: 0.3vw 0;
}
.imagem-revelada-post {
  object-fit: cover;
  width: 100%;
  height: 100%;
}
.render-enquete-post {
  display: flex;
  flex-direction: column;
  gap: 0.5vw;
  margin: 0.6vw 0;
  width: 100%;
  box-sizing: border-box;
}
.opcao-escolhida {
  color: #319e00;
  font-weight: normal;
}
.titulo-mini-enquete {
  font-size: 0.95vw;
  font-weight: bold;
  color: #000;
  margin: 0 0 0.2vw 0;
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
.texto-opcao-voto {
  display: flex;
  align-items: center;
  gap: 0.3vw;
}
.porcentagem-texto-voto {
  font-weight: bold;
  color: #3CBC00;
}
.total-votos-legenda {
  font-size: 0.8vw;
  color: #7a7a7a;
  margin-top: 0.2vw;
  font-style: italic;
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
  display: flex;
  flex-direction: column;
  gap: 0.4vw;
  margin-bottom: 0.8vw;
  width: 100%;
}
.imageInput::-webkit-file-upload-button:hover {
  background-color: #37ad00;
  border-color: #b5b5b5;
}
.imageInput {
  font-size: 0.9vw;
  color: #333;
  font-family: inherit;
  cursor: pointer;
}
.labelMidiPerfil {
  font-weight: bold;
  font-size: 1vw;
  color: #000;
  text-align: left;
}
.linha-controle-midia-edit {
  display: flex;
  flex-direction: column;
  gap: 0.7vw;
}
.imageInput::-webkit-file-upload-button {
  background-color: #3CBC00;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 0.4vw 0.8vw;
  font-size: 1vw;
  font-weight: bolder;
  cursor: pointer;
  transition: 0.2s;
  color: #fff;
  margin-right: 0.5vw;
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
  text-transform: capitalize;
}
.favoritarPerfilDeUsuario {
  height: 3vw;
}
.favoritarPerfilDeUsuario:hover {
  cursor: pointer;
}
.tag {
  border: 0.8px solid #000;
  background-color: #fff;
  border-radius: 100px;
  padding: 0.3vw 0.3vw;
  display: flex;
  align-items: center;
  color: #000;
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
.sininhoNotificacao {
  display: block;
  width: 1.45vw;
}
.btnChat {
  background-color: #3CBC00;
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.9vw;
  font-weight: bolder;
  width: 6vw;
  border-radius: 20px;
}
.btnChat:hover {
  cursor: pointer;
  background-color: #37ad00;
}
.btn-notificacoes {
  width: 4vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border: 1px solid #000;
  border-radius: 20px;
}
.botoesU {
  display: flex;
  margin-left: 1vw;
  margin-top: 1vw;
  margin-bottom: 1vw;
  width: 37vw;
  align-items: center;
  justify-content: space-between;
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
.postagens, .mural, .favoritos {
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
  margin: 0 1vw 0.7vw 1vw;
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

/* --- Bloquear usuário --- */
.acoesModeracao {
  margin-top: 0.8vw;
}
.btnBloquear {
  background-color: #fff;
  border: none;
  color: #cf0000;
  font-weight: bold;
  font-size: 1vw;
  padding: 0;
}
.btnBloquear:hover {
  text-decoration: underline;
  cursor: pointer;
}
.btnDesbloquear {
  background-color: #fff;
  border: none;
  color: #3CBC00;
  font-weight: bold;
  font-size: 1vw;
  padding: 0;
}
.btnDesbloquear:hover {
  text-decoration: underline;
  cursor: pointer;
}
.overlayFormTituloVermelho {
  background-color: #cf0000 !important;
}
.formBloqueio {
  width: 26vw;
}
.textoConfirmacaoBloqueio {
  padding: 0 1vw;
  color: #333;
  font-size: 1vw;
  line-height: 1.4;
}
.btnConfirmarBloqueio {
  padding: 0.5vw;
  width: 7.2vw;
  border-radius: 10px;
  font-size: 1vw;
  border: none;
  background-color: #cf0000;
  font-weight: bold;
  color: #fff;
}
.btnConfirmarBloqueio:hover {
  background-color: #ff0000;
  cursor: pointer;
}
</style>