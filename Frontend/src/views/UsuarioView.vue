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
import logoutRED from '@/icons/logoutRED.svg';
import sinoOFF from '@/icons/sinoOFF.svg';
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

const naoSalvo = ref(false);

const telaExibicao = ref(true);
const telaConfig = ref(false);

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
    const resposta = await fetch(`http://localhost:3000/api/usuario/bloquear/${idUsuarioDaURL.value}`, {
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
    const resposta = await fetch(`http://localhost:3000/api/usuario/bloquear/${idUsuarioDaURL.value}`, {
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

const modoEscuroAtivo = ref(false);
watch(modoEscuroAtivo, (novoEstado) => {
  if (novoEstado) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('ifchat_theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('ifchat_theme', 'light');
  }
});
onMounted(() => {
  const temaSalvo = localStorage.getItem('ifchat_theme');
  if (temaSalvo === 'dark') {
    modoEscuroAtivo.value = true;
  }
});
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
      postagemAlvo.meu_voto_post = dados.votoAtual;
      carregarDadosDoPerfil();
    } else {
      toast.error(dados.erro || "Falha ao registrar interação.");
    }
  } catch(erro) {
    console.error('Erro ao curtir post:', erro);
  }
}
function cancelarEdicao() {
  editarPerfil.value = false;
  removerBannerMarcado.value = false;
  removerFotoMarcada.value = false;
}
const jaEFavorito = ref(false);

function obterChaveFavoritos() {
  return `ifchat_favoritos_${meuIdLogado.value}`;
}
function abrirPainelDeTags() {
  adicionarTag.value = true;
}
async function fecharESalvarTagsNoBanco() {
  adicionarTag.value = false;
  const idSeguro = idUsuarioDaURL.value || route.params.id || localStorage.getItem('ifchat_user_id');

  if (!idSeguro || idSeguro === 'undefined') {
    console.warn("abortado: ID do usuário inválido.");
    return;
  }

  try {
    console.log("[GATILHO DIRETO] Enviando tags ao MySQL:", tagsDoUsuario.value);

    const resposta = await fetch(`http://localhost:3000/api/usuario/perfil/atualizar/${idSeguro}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tags: tagsDoUsuario.value
      })
    });

    const dadosNode = await resposta.json();

    if (resposta.ok) {
      toast.success(dadosNode.mensagem || "Tags salvas com sucesso!");
    } else {
      console.error("Resposta de erro do servidor:", dadosNode.erro);
    }
  } catch (erro) {
    console.error("Falha crítica ao tentar rodar a requisição de tags:", erro);
  }
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
const sinoAtivado = ref(false);
async function alternarSinoNotificacao() {
  try {
    const resposta = await fetch('http://localhost:3000/api/usuario/perfil/sino', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idSeguidor: meuIdLogado.value,
        idCriador: idUsuarioDaURL.value
      })
    });

    const dados = await resposta.json();
    if (resposta.ok) {
      sinoAtivado.value = dados.status === 'ativado';
      toast.success(dados.mensagem);
    }
  } catch (erro) {
    console.error("Erro ao alternar sino:", erro);
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
  localizacaoEdit.value = localizacao.value;
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
      sinoAtivado.value = dadosPerfil.jaSino || false;
      usuarioBloqueado.value = dadosPerfil.usuarioBloqueado || false;

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
const textoNovoComentarioMural = ref('');
const mostrarModalMural = ref(false);

async function carregarRecadosDoMural() {
  const idDoPerfilAtual = route.params.id;

  if (!idDoPerfilAtual) return;

  try {
    const resposta = await fetch(`http://localhost:3000/api/usuario/perfil/mural/${idDoPerfilAtual}`);
    if (resposta.ok) {
      const dadosDoBanco = await resposta.json();

      comentariosMural.value = Array.isArray(dadosDoBanco) ? dadosDoBanco : [];
    }
  } catch (erro) {
    console.error("erro de comunicação ao ler mural do perfil:", erro);
    comentariosMural.value = [];
  }
}
async function publicarRecadoNoMural() {
  const idDoPerfilAtual = route.params.id;

  if (!textoNovoComentarioMural.value.trim()) {
    toast.warning("Escreva algo antes de enviar!");
    return;
  }
  try {
    const resposta = await fetch('http://localhost:3000/api/usuario/perfil/mural/novo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idAutor: meuIdLogado.value,
        idPerfil: idDoPerfilAtual,
        conteudo: textoNovoComentarioMural.value.trim()
      })
    });
    const dados = await resposta.json();

    if (resposta.ok) {
      toast.success(dados.mensagem || "Recado publicado!");
      textoNovoComentarioMural.value = '';
      mostrarModalMural.value = false;
      await carregarRecadosDoMural();
    } else {
      toast.error(dados.erro || "Falha ao enviar recado.");
    }
  } catch (erro) {
    console.error("erro ao conectar com o servidor do mural:", erro);
  }
}
async function deletarRecadoDoMural(idComentarioAlvo) {
  if (!confirm("Tem certeza que deseja remover este recado do seu mural?")) return;

  try {
    const resposta = await fetch(`http://localhost:3000/api/usuario/perfil/mural/deletar/${idComentarioAlvo}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idUsuarioLogado: meuIdLogado.value })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      toast.success(dados.mensagem || "Recado excluído!");
      comentariosMural.value = comentariosMural.value.filter(c => c.id_comentario !== idComentarioAlvo);
    } else {
      toast.error(dados.erro || "Não foi possível excluir o recado.");
    }
  } catch (erro) {
    console.error("erro ao conectar com o servidor para exclusão:", erro);
    toast.error("Erro de comunicação com o servidor.");
  }
}
function abrirModalMuralPerfil() {
  if (!meuIdLogado.value) {
    toast.warning("Você precisa estar logado para comentar no mural");
    return;
  }
  mostrarModalMural.value = true;
}
onMounted(() => {
  carregarRecadosDoMural();
});
watch(() => route.params.id, () => {
  carregarRecadosDoMural();
});
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
            <img :src="gear" alt="" class="gear">
            <span class="span-config">Configurações</span>
          </button>
          <button @click="mostrarJanelaEditor" class="btnPerfil">
            <img :src="canetaEdicao" alt="" class="btn-edit">
            <span class="span-edit">Editar Perfil</span>
          </button>
        </div>
        <div v-else class="botoesU">
          <div class="btnParaUsuariosEstrangeiros">
            <button type="button" @click="alternarSeguirUsuario" :class="jaEstouSeguindo ? 'btnSeguindo' : 'btnSeguir' ">
            <span>{{ jaEstouSeguindo ? 'Seguindo' : 'Seguir' }}</span>
          </button>
            <button type="button" @click="alternarSinoNotificacao()" class="btn-notificacoes">
              <img v-if="sinoAtivado" :src="notificacoesAtivo" alt="" class="sininhoNotificacao">
              <img v-else :src="sinoOFF" alt="" class="sininhoNotificacao">
            </button>
            <button class="btnChat">Chat</button>
          </div>
          <button v-if="jaEFavorito" type="button" @click="alternarFavorito" class="btnPerfilFavorito">
            <img :src="favoritarPreenchido" alt="" class="favoritarPerfilDeUsuario">
          </button>
          <button v-else type="button" @click="alternarFavorito" class="btnPerfilFavorito">
            <img :src="favoritarInline" alt="" class="favoritarPerfilDeUsuario">
          </button>
        </div>
        <div class="spanInfo">
          <img :src="dataCriacao" alt="Data-de-Criacao" class="Data-de-Criacao">
          <span class="titulo">Data de Criação:</span><span class="creationDate">{{ dataDeCriacao }}</span>
        </div>
        <div class="spanInfo">
          <img :src="local" alt="local" class="Data-de-Criacao">
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
              <img :src="interrogacao" alt="" class="interrogacao">
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
              <button type="button" @click="abrirPainelDeTags" class="tag">
                <img :src="plus" alt="adicionar-tag" class="plus">
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
            <button type="button" @click="fecharESalvarTagsNoBanco" class="btnTagsFechar">
              fechar
            </button>
          </div>
        </div>
        <div class="postagens">
          <h3>Postagens</h3>
          <div v-if="postagens.length === 0" class="caixa-postagens-vazia">
            <img :src="interrogacao" alt="Sem postagens" class="interrogacao">
            <span class="textoDeAviso">Ainda não há nenhuma postagem</span>
          </div>
          <div v-else class="lista-de-posts-real">
            <div v-for="postagem in postagens" :key="postagem.id_postagem" class="cartao-postagem-usuario">
              <p v-if="postagem.conteudo" class="texto-do-post">{{ postagem.conteudo }}</p>
              <div v-if="postagem.imagem" class="container-imagem-post">
                <img :src="postagem.imagem" alt="Imagem da postagem" class="imagem-revelada-post">
              </div>
              <div v-if="postagem.tipo === 'postagemComEnquete' && postagem.opcoes && postagem.opcoes.length > 0" class="render-enquete-post">
                <div class="lista-opcoes-voto">
                  <div v-for="opcao in postagem.opcoes" :key="opcao.id_opcao" class="card-opcao-container">
                    <button type="button" :disabled="meuIdLogado === idUsuarioDaURL" @click="votarNaEnquete(opcao.id_opcao, postagem.id_postagem)" class="btn-enquete-dinamico" :class="{ 'opcao-selecionada-local': opcao.votadoPorMim }">
                      <div v-if="postagem.jaVotado" class="fundo-progresso-verde" :style="{ width: opcao.porcentagem + '%' }"></div>
                      <div class="conteudo-resultado-linha">
                        <span class="texto-opcao-voto">
                          {{ opcao.texto_opcao }}
                          <strong v-if="opcao.votadoPorMim" class="opcao-escolhida">★</strong>
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
               <button :disabled="idUsuarioDaURL === meuIdLogado" class="btn-post" @click="curtirPost(postagem, meuIdLogado, 'like')">
                 <img v-if="postagem.meu_voto_post === 'like'" :src="likePreenchido" alt="Curtido" class="btn-preenchido">
                 <img v-else :src="likeInline" alt="curtir" class="btn-post-img">
               </button>
                <span class="qnt-likes-dislikes">{{ postagem.total_likes }}</span>
                <button :disabled="idUsuarioDaURL === meuIdLogado" class="btn-post" @click="curtirPost(postagem, meuIdLogado, 'dislike')">
                  <img v-if="postagem.meu_voto_post === 'dislike'" :src="dislikePreenchido" alt="Descurtido" class="btn-preenchido">
                  <img v-else :src="dislikeInline" alt="não curtir" class="btn-post-img">
                </button>
                <span class="qnt-likes-dislikes">{{ postagem.total_dislikes }}</span>
                <button class="btn-post" @click="abrirMural(postagem)"><img :src="comentarios" alt="comentar" class="btn-post-img"></button>
                <button class="btn-post"><img :src="compartilhar" alt="compartilhar" class="btn-post-img"></button>
                <button class="btn-post"><img v-if="!naoSalvo" :src="marcadorInline" alt="" class="btn-post-img"><img v-else :src="marcadorPreenchido" alt="marcar" class="btn-preenchido"></button>
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
          <h3>Mural de Recados</h3>
          <div v-if="comentariosMural.length === 0" class="caixa-mural-vazia">
            <img :src="interrogacao" alt="Mural Vazio" class="interrogacao">
            <span class="textoDeAviso">Ninguém deixou um recado ainda. Seja o primeiro!</span>
          </div>
          <div v-else class="listaDasPostagens">
            <div v-for="recado in comentariosMural" :key="recado.id_comentario" class="card-resposta-linha">
              <div class="div-perfil-mural">
                <div class="div-imagem">
                <img :src="recado.foto_profile || '/src/icons/userBlackFull.svg'" alt="Avatar" class="avatar-mural-mini">
              </div>
              <div class="corpo-resposta-conteudo">
                <div class="identidade-resposta-autor">
                  <strong>{{ recado.nome }}</strong> <small>@{{ recado.username }}</small>
                </div>
                <p class="texto-mensagem-comentario">{{ recado.conteudo_comentario }}</p>
                <span class="data-legenda-mural-mini" style="font-size: 0.75vw; color: var(--texto-suave);">
                  {{ new Date(recado.data_comentario).toLocaleDateString('pt-BR') }} às
                  {{ new Date(recado.data_comentario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </div>
              </div>
              <button
                v-if="recado.autor === meuIdLogado || idUsuarioDaURL === meuIdLogado"
                type="button"
                @click="deletarRecadoDoMural(recado.id_comentario)"
                class="btn-mini-lixeira"
                title="Excluir este recado"
              >
                <img :src="lixeira" alt="Deletar" class="img-lixeira-mini">
              </button>
            </div>
          </div>
          <button type="button" @click="abrirModalMuralPerfil" class="btn-mural-expansivel">
            <span class="sinal-mais">+</span>
            <span class="legenda-lateral-btn">Adicionar comentário</span>
          </button>
        </div>
        <div class="favoritos">
          <h3>Perfis favoritos</h3>
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
    <ModalComentarios :isOpen="modalAberto" :post="postSelecionado" @fechar="modalAberto = false"/>
    <div v-if="editarPerfil" class="overlay" @click.self="cancelarEdicao()">
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
            <button type="button" @click="cancelarEdicao()" class="cancelarAlteracoes">Cancelar</button>
          </div>
        </form>
        </div>
      </div>
      <div v-if="mostrarModalMural" class="overlay" @click.self="mostrarModalMural = false">
      <div class="modal-comentarios-largura">
        <div class="cabecalho-modal-mural">
          <h2 class="overlayFormTitulo">Deixar um Recado Público</h2>
        </div>
        <div class="caixa-inserir-comentario-modal borda-topo-modal-mural">
          <input
            v-model="textoNovoComentarioMural"
            maxlength="50"
            type="text"
            placeholder="Escreva um elogio ou mensagem de apoio..."
            @keyup.enter="publicarRecadoNoMural"
            class="input-Form-Edit"
            autofocus
          >
          <button type="button" @click="publicarRecadoNoMural" class="btn-mural-enviar">Publicar</button>
        </div>
        <div class="botoesDoFormEditPerfil borda-topo-modal-mural">
          <button type="button" @click="mostrarModalMural = false" class="cancelarAlteracoes">Cancelar</button>
        </div>
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
                <span class="texto-checkbox">Novos posts</span>
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
                <input v-model="modoEscuroAtivo" type="checkbox" class="chekbox-Oculto" id="checkBoxToggle">
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
  background-color: var(--fundo-card);
  border: var(--borda-padrao);
  width: 100%;
  font-size: 1vw;
  padding: 0.5vw;
  color: var(--texto-principal);
  border-radius: 6px;
}
.div-botoes-postagens {
  display: flex;
  align-items: center;
  gap: 0.3vw;
}
.div-botoes-postagens button:hover {
  transform: scale(1.05);
}
.div-botoes-postagens button:active {
  transform: scale(0.95);
}
.marcado-para-manter-form:hover {
  background-color: var(--hover-botoes);
  cursor: pointer;
  transition: 0.2s;
}
.data-do-post {
  font-size: 0.8vw;
  color: var(--texto-suave);
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
  transition: 0.3s;
}
.btn-post {
  width: 2.5vw;
  height: 2.5vw;
  border-radius: 50%;
  background-color: var(--fundo-card);
  border: none;
}
.btn-post:hover {
  background-color: var(--hover-botoes);
  cursor: pointer;
  transition: 0.3s;
}
.listaParaAdicionarTags {
  display: flex;
  margin: 0.5vw auto;
  flex-wrap: wrap;
  gap: 0.4vw;
  border-top: var(--borda-padrao);
  padding-top: 0.5vw;
}
.btnLixeira {
  background-color: var(--fundo-card);
  border: none;
  cursor: pointer;
  border-radius: 50%;
}
.btnLixeira:hover {
  background-color: var(--hover-botoes);
  transition: 0.3s;
  transform: scale(1.05);
}
.btnLixeira:active {
  transform: scale(0.95);
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
  background-color: var(--fundo-card);
  border-radius: 50%;
  border: none;
}
.labelME {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between;
  width: 100%;
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
  border-bottom: var(--borda-padrao);
  margin: -2px;
  padding: 1vw;
  font-size: 1.7vw;
}
.ContaSeguranca button{
  background-color: var(--fundo-card);
  cursor: pointer;
  padding-left: 0.4vw !important;
}
.ContaSeguranca button:hover {
  background-color: var(--hover-botoes);
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
  border: var(--fundo-card);
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
  border: var(--borda-padrao);
  margin-top: 0.5vw;
  border-radius: 6px;
  padding: 0 0.2vw;
  box-sizing: border-box;
  min-height: 10vw;
  align-items: center;
  justify-content: flex-start;
  scrollbar-width: thin;
  max-height: 50vw;
  overflow-y: auto;
  word-wrap: break-word;
  overflow-wrap: break-word;
  box-sizing: border-box;
  word-break: normal;
}
.lista-notificacoes-push {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 450px;
  padding: 1vw 0;
}
.linha-checkbox-custom {
  background-color: var(--fundo-card);
  border: 1px solid var(--borda-padrao);
  border-radius: 12px;
  padding: 7px 9px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  position: relative;
  user-select: none;
}
.modal-comentarios-largura {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  border: var(--borda-padrao);
  background-color: var(--fundo-card-modal);
  height: 20vh;
  width: 35vw;
  border-radius: 7px;
}
.inputCirculo {
  opacity: 0;
  position: absolute;
  width: 0;
  height: 0;
}
.inputCirculo + .texto-checkbox::before {
  content: "";
  display: inline-block;
  width: 15px;
  height: 15px;
  border: 2px solid var(--checkbox-config);
  border-radius: 50%;
  background-color: var(--fundo-card);
  flex-shrink: 0;
  transition: all 0.2s ease-in-out;
  position: relative;
  top: 2px;
}
.inputCirculo:checked + .texto-checkbox::before {
  background-color: var(--checkbox-config);
  border-color: var(--checkbox-config);
  box-shadow: none;
}
.texto-checkbox {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  color: var(--texto-principal);
  width: 100%;
}
.inputCirculo:checked + .texto-checkbox {
  color: var(--texto-principal);
}
.inputCirculo:focus-visible + .texto-checkbox::before {
  box-shadow: 0 0 0 3px rgba(85, 255, 51, 0.4);
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
  border: var(--borda-padrao);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  width: 6vw;
  max-width: 6vw;
  align-items: center;
  justify-content: center;
  gap: 0.5vw;
  border-radius: 6px;
  flex-shrink: 0 !important;
}
.card-favorito:hover {
  background-color: var(--hover-botoes);
  transition: 0.2s;
  cursor: pointer;
}
.gradeFavoritos {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.4vw;
  margin-top: 0.5vw;
  border: var(--borda-padrao);
  padding: 0.5vw;
  height: 9vw;
  border-radius: 6px;
  overflow-x: auto;
}
.nome-favorito {
  overflow: hidden;
  max-width: 5vw;
  text-overflow: ellipsis;
  font-weight: bolder;
}
.cartao-postagem-usuario {
  border-bottom: var(--borda-padrao);
  display: flex;
  flex-direction: column;
  padding: 1vw;
  min-width: 100%;
  gap: 1.5vw;
  box-sizing: border-box;
  overflow-wrap: break-word;
}
.inputFormEdit {
  padding: 0.9vw;
  outline: none;
  border-radius: 2px;
  border-radius: 10px;
  border: var(--borda-padrao);
  background-color: var(--fundo-card);
  color: var(--texto-principal);
}
.input-Form-Edit {
  padding: 0.5vw;
  outline: none;
  border-radius: 2px;
  border-radius: 10px 0 0 10px;
  border: var(--borda-padrao);
  background-color: var(--fundo-card);
  color: var(--texto-principal);
  width: 100%;
}
.caixa-inserir-comentario-modal {
  display: flex;
  justify-content: center;
  padding: 1vw;
  width: 100%;
  gap: 0.2vw;
}
.divLogoutEDeleteAccount {
  display: flex !important;
  flex-direction: row !important;
  border-bottom: var(--borda-padrao);
  padding: 0.5vw 0;
  align-items: center;
  gap: 0.2vw;
}
.divLogoutEDeleteAccount button {
  border: none !important;
  padding: 0 !important;
  color: #cf0000 !important;
  align-items: center !important;
  text-align: left;
  height: 100%;
  gap: 0.2vw;
}
.divLogoutEDeleteAccount button:hover {
  cursor: pointer;
  color: #ff0000 !important;
}
.btnSeguir {
  background-color: var(--fundo-card-va);
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
  background-color: var(--fundo-card-va-hover);
  transition: 0.2s;
}
.containerConfig div {
  display: flex;
  flex-direction: column;
}
.subtitulo-config {
  padding: 0.5vw 0 0 0;
  font-weight: bold;
}
.containerConfig h3 {
  padding: 0.6vw 0;
  border-bottom: var(--borda-padrao);
  font-weight: bolder;
}
.imgLogout {
  width: 0.65vw;
  margin-left: 0.2vw;
  height: 100%;
}
.listaDasPostagens {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
  border: var(--borda-padrao);
  margin-top: 0.5vw;
  border-radius: 6px;
  padding: 0.5vw;
  min-height: 10vw;
  max-height: 20vw;
  overflow-y: auto;
  overflow-x: hidden;
}
.card-resposta-linha {
  display: flex;
  gap: 16px;
  background-color: var(--fundo-card-modal, var(--fundo-card));
  border: 1px solid var(--borda-padrao, #eee);
  padding: 14px 18px;
  border-radius: 10px;
  width: 100%;
  box-sizing: border-box;
  word-wrap: break-word;
  position: relative;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.01);
  justify-content: space-between;
}
.card-resposta-linha:hover {
  background-color: var(--hover-botoes);
}
.div-imagem {
  background-color: var(--hover-botoes, #f1f5f9);
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  overflow: hidden;
}
.texto-mensagem-comentario {
  margin: 0.35vw 0;
  font-size: 0.8vw;
  max-width: 25vw;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  white-space: normal !important;
}
.avatar-mural-mini {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #cbd5e1;
  transition: filter 0.3s ease;
}
.avatar-mural-mini[src$="userBlackFull.svg"] {
  object-fit: contain !important;
  padding: 5px;
  box-sizing: border-box;
  border: none !important;
}
[data-theme="dark"] .avatar-mural-mini[src$="userBlackFull.svg"] {
  filter: invert(1);
}
.data-legenda-mural-mini {
  font-size: 0.78rem;
  color: var(--texto-suave, #64748b);
  font-weight: 400;
  margin-top: 6px;
  display: block;
}
.pricavidadeSelectVP {
  display: flex !important;
  flex-direction: row !important;
  justify-content: space-between;
  border-bottom: var(--borda-padrao);
  padding: 0.5vw 0;
  font-weight: bold;
  font-size: 0.9vw;
}
.containerConfig div button {
  background-color: var(--fundo-card);
  border: none;
  border-bottom: var(--borda-padrao);
  padding: 0.5vw 0.3vw;
  text-align: left;
  font-weight: bold;
  font-size: 0.9vw;
  color: var(--texto-principal);
}
.notificacoes {
  border-bottom: var(--borda-padrao);
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
.container-imagem-post {
  overflow: hidden;
  width: 100%;
  display: flex;
  align-items: center;
  height: auto;
  position: relative;
  border-radius: 10px;
  border: var(--borda-padrao);
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
  color: var(--opcao-escolhida);
  font-weight: normal;
  font-size: 1.3vw;
  margin-bottom: 0.2vw;
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
.qnt-likes-dislikes {
  font-size: 1vw;
  color: var(--texto-suave);
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
  background-color: rgba(60, 188, 0, 0.02);
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
.texto-opcao-voto {
  display: flex;
  align-items: center;
  gap: 0.3vw;
  color: var(--texto-principal);
}
.porcentagem-texto-voto {
  font-weight: bold;
  color: var(--fundo-card-va);
}
.total-votos-legenda {
  font-size: 0.8vw;
  color: var(--texto-suave);
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
.span-edit {
  color: var(--texto-principal);
}
.textarea {
  max-width: 37.89vw;
  min-width: 10vw;
  min-height: 3vw;
  max-height: 20vw;
  padding: 0.5vw;
  border-radius: 7px;
  border: var(--borda-padrao);
  background-color: var(--fundo-card);
  color: var(--texto-principal);
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
  background-color: var(--fundo-card-va-hover);
  border-color: #b5b5b5;
}
.imageInput {
  font-size: 0.9vw;
  color: var(--texto-suave);
  font-family: inherit;
  cursor: pointer;
}
input {
   outline: none;
}
input::placeholder {
  color: var(--texto-mais-suave);
}
.labelMidiPerfil {
  font-weight: bold;
  font-size: 1vw;
  color: var(--texto-principal);
  text-align: left;
}
.linha-controle-midia-edit {
  display: flex;
  flex-direction: column;
  gap: 0.7vw;
}
.imageInput::-webkit-file-upload-button {
  background-color: var(--fundo-card-va);
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
  background-color: var(--fundo-card-va);
  color: #fff;
  height: 100%;
  padding: 1vw;
}
select {
  background-color: var(--fundo-card);
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
  transform: scale(1.05);
  transition: 0.3s;
}
.salvarAlteracoes:active {
  transform: scale(0.95);
}
.btn-mural-enviar {
  padding: 0.5vw;
  width: 7.2vw;
  border-radius: 0 10px 10px 0;
  font-size: 1vw;
  border: none;
  background-color: var(--fundo-card-va);
  font-weight: bold;
  color: #fff;
}
.btn-mural-enviar:hover {
  background-color: var(--fundo-card-va-hover);
  cursor: pointer;
  transform: scale(1.05);
  transition: 0.2s;
}
.btn-mural-enviar:active {
  transform: scale(0.95);
}
.cancelarAlteracoes {
  padding: 0.5vw;
  width: 7.2vw;
  border-radius: 10px;
  font-size: 1vw;
  border: var(--borda-padrao);
  background-color: var(--fundo-card);
  color: var(--texto-principal);
}
.cancelarAlteracoes:hover {
  background-color: var(--hover-botoes);
  cursor: pointer;
  transition: 0.3s;
  transform: scale(1.05);
}
.cancelarAlteracoes:active {
  transform: scale(0.95);
}
.formularioDeEdicao {
  padding: 0 1vw 0 1vw;
}
.paragrafoVermelho {
  color: #cf0000;
}
.form {
  background-color: var(--fundo-card);
  width: 40vw;
  border: var(--borda-padrao);
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
.span-config {
  color: var(--texto-principal);
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
  transition: 0.3s;
}
.tag {
  border: var(--borda-padrao);
  background-color: var(--fundo-card);
  border-radius: 100px;
  padding: 0.3vw 0.3vw;
  display: flex;
  align-items: center;
  color: var(--texto-principal);
  justify-content: center;
}
.texto-do-post {
  overflow-wrap: break-word;
  box-sizing: border-box;
  max-width: 32vw;
}
.tag:hover {
  background-color: var(--hover-botoes);
  transition: 0.2s;
  cursor: pointer;
}
.indicadorDeLimite {
  color: var(--texto-suave);
  position: absolute;
  bottom: 0;
  right: 0.2vw;
  font-size: 1vw;
}
.biografiaFieldset {
  display: flex;
  border: var(--borda-dashed);
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
  color: var(--texto-suave);
  margin: 0;
  line-height: 1.4;
  text-align: left;
  padding-bottom: 0.8vw;
  top: 0;
}
.textoDeAviso {
  color: var(--texto-suave);
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
  background-color: var(--fundo-card-va);
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
  background-color: var(--fundo-card-va-hover);
}
.btn-notificacoes {
  width: 4vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--fundo-card);
  border: var(--borda-padrao);
  border-radius: 20px;
  cursor: pointer;
}
.btn-notificacoes:hover {
  background-color: var(--hover-botoes);
  transition: 0.3s;
}
.mural {
  position: relative;
  padding: 1vw 0;
  display: flex;
  flex-direction: column;
  gap: 1vw;
}
.btn-mural-expansivel {
  border: var(--borda-padrao);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.2vw;
  height: 1.2vw;
  min-width: 45px;
  min-height: 45px;
  background-color: var(--fundo-card);
  color: var(--texto-principal);
  border-radius: 50px;
  cursor: pointer;
  padding: 0 1vw;
  box-sizing: border-box;
  align-self: flex-start;
  transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease, transform 0.1s ease;
  overflow: hidden;
  white-space: nowrap;
}
.sinal-mais {
  font-size: 1.8vw;
  font-weight: bold;
  display: inline-block;
}
.legenda-lateral-btn {
  max-width: 0;
  opacity: 0;
  font-size: 0.95vw;
  font-weight: 700;
  margin-left: 0;
  transition: max-width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) ease, opacity 0.2s ease, margin-left 0.3s ease;
}
.btn-mural-expansivel:hover {
  width: 14vw;
  min-width: 180px;
}
.btn-mural-expansivel:hover .legenda-lateral-btn {
  max-width: 200px;
  opacity: 1;
  margin-left: 0.8vw;
}
.btn-mural-expansivel:active {
  transform: scale(0.95);
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
  background-color: var(--fundo-card);
  border-radius: 100px;
  display: flex;
  align-items: center;
  align-items: center;
  gap: 5px;
  padding: 1px 7px;
  border: var(--borda-padrao);
}
.localization , .creationDate {
  color: var(--texto-suave);
}
.spanInfo {
  display: flex;
  align-items: center;
  margin-left: 1vw;
  gap: 0.4vw;
}
.btnPerfil:hover {
  background-color: var(--hover-botoes);
  cursor: pointer;
  transition: 0.2s;
  transform: scale(1.05);
}
section.telaDeExibicao {
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
[data-theme="dark"] .imgDelete {
  filter: invert(1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .gear {
  filter: invert(1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .Data-de-Criacao {
  filter: invert(1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .setaVoltar {
  filter: invert(1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .btn-post-img {
  filter: invert(1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .btn-edit {
  filter: invert(1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .plus {
  filter: invert(1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .btn-preenchido {
  filter: hue-rotate(135deg) saturate(1.8) brightness(1.1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .favoritarPerfilDeUsuario {
  filter: hue-rotate(135deg) saturate(1.8) brightness(1.1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .img-lixeira-mini {
  filter: invert(1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .fotoPerfilDefault {
  filter: invert(1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .sininhoNotificacao {
  filter: invert(1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .fotoPerfilDefault-favorito {
  filter: invert(1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .interrogacao {
  filter: invert(1) brightness(100);
  transition: filter 0.3s ease;
}
.setaVoltar {
  width: 2vw;
  height: 2vw;
}
.btn-mini-lixeira {
  right: 0;
  border: none;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 1.1vw;
  height: 1.1vw;
  background-color: var(--hover-botoes);
}
.div-perfil-mural {
  display: flex;
  gap: 0.5vw;
}
.btn-mini-lixeira:hover {
  background-color: var(--fundo-card);
  transform: scale(1.02);
}
.btn-mini-lixeira:active {
  transform: scale(0.92);
}
.img-lixeira-mini {
  width: 1vw;
  height: auto;
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
.botaoVoltar:hover {
  background-color: var(--hover-botoes);
  transform: scale(1.02);
  transition: 0.3s;
}
.botaoVoltar:active {
  transform: scale(0.92);
}
.bannerPerfil {
  height: 11vw;
  background-color: var(--banner-default);
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
  background-color: var(--fundo-card);
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
  color: var(--texto-suave);
}
.OnlineTexto , .OfflineTexto {
  color: var(--texto-suave);
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
  border: var(--borda-padrao);
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
  border-top: var(--borda-padrao);
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
.acoesModeracao {
  margin-top: 0.8vw;
}
.btnBloquear {
  background-color: var(--fundo-card);
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
  background-color: var(--fundo-card);
  border: none;
  color: var(--fundo-card-va);
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
  color: var(--texto-suave);
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
@media (max-width: 728px) {
  main {
    position: relative !important;
    top: auto !important;
    left: auto !important;
    right: auto !important;
    margin-left: 0 !important;
    width: 100vw !important;
    height: auto !important;
    overflow: visible !important;
    padding: 0 !important;
    display: block !important;
    box-sizing: border-box !important;
  }
  section.telaDeExibicao,
  section.configuracoes {
    position: relative !important;
    top: auto !important;
    bottom: auto !important;
    left: auto !important;
    transform: none !important;
    width: 100% !important;
    max-width: 100vw !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    padding-top: 15px !important;
    padding-bottom: 85px !important;
    border: none !important;
    border-radius: 0 !important;
    overflow-y: visible !important;
    box-sizing: border-box !important;
  }
}
</style>
