<script setup>
import { ref } from 'vue'
import ChatMain from '../components/chat/ChatMain.vue'
import ChatEncontrar from '../components/chat/ChatEncontrar.vue'
import ChatPerfil from '../components/chat/ChatPerfil.vue'

const telaAtual = ref('chat')

const conversas = ref([
  {
    id: 1,
    nome: 'Nome usuário',
    ultimaMsg: 'Escrevendo...',
    tempo: 'Há 2 minutos',
    online: true,
    escrevendo: true,
    seguidores: '45.659',
    seguindoQtd: '12.234',
    dataCriacao: '00/00/0000',
    localizacao: 'nenhuma localização foi adicionada.',
    biografia: '',
    tags: ['#souIFC'],
    mensagens: [
      { id: 1, tipo: 'texto', enviadaPorMim: false, conteudo: 'Ok..' },
      { id: 2, tipo: 'imagem', enviadaPorMim: false, url: '' },
      { id: 3, tipo: 'divisor', conteudo: 'Hoje' },
      { id: 4, tipo: 'texto', enviadaPorMim: false, conteudo: 'Mensagem sistem.' },
      { id: 5, tipo: 'texto', enviadaPorMim: false, conteudo: 'Mensagem...' },
      { id: 6, tipo: 'texto', enviadaPorMim: true, conteudo: 'Mensagem do usuário que está sendo bem colocada tal que serve para apenas preencher aqui' },
      { id: 7, tipo: 'texto', enviadaPorMim: true, conteudo: 'Avisos...' },
      { id: 8, tipo: 'digitando', enviadaPorMim: false }
    ]
  },
  {
    id: 2,
    nome: 'Nome usuário',
    ultimaMsg: 'Mensagem',
    tempo: '00/00/0000',
    online: false,
    seguidores: '1.200',
    seguindoQtd: '340',
    dataCriacao: '12/05/2024',
    localizacao: 'Joinville, SC',
    biografia: 'Estudante de Informática',
    tags: ['#IFChat', '#Dev'],
    mensagens: []
  }
])

const novosUsuarios = ref([
  { id: 101, nome: 'Nome usuário', status: 'Offline', seguidores: '345.342.234', postagensQtd: 15, dataRegistro: 3, seguindo: false },
  { id: 102, nome: 'Nome usuário', status: 'Offline', seguidores: '120.000', postagensQtd: 42, dataRegistro: 1, seguindo: false },
  { id: 103, nome: 'Nome usuário', status: 'Offline', seguidores: '500.000', postagensQtd: 5, dataRegistro: 2, seguindo: false }
])

const conversaAtiva = ref(conversas.value[0])

function navegarPara(tela) {
  telaAtual.value = tela
}

function selecionarConversa(conversa) {
  conversaAtiva.value = conversa
}

function alternarSeguir(usuario) {
  usuario.seguindo = !usuario.seguindo
}

function enviarMensagem(texto) {
  if (!conversaAtiva.value) return

  conversaAtiva.value.mensagens.push({
    id: Date.now(),
    tipo: 'texto',
    enviadaPorMim: true,
    conteudo: texto
  })

  conversaAtiva.value.ultimaMsg = texto
}
</script>

<template>
  <main class="fundo">
    <ChatMain
      v-if="telaAtual === 'chat'"
      :conversas="conversas"
      :conversaAtiva="conversaAtiva"
      @selecionar-conversa="selecionarConversa"
      @navegar="navegarPara"
      @enviar-mensagem="enviarMensagem"
    />

    <ChatEncontrar
      v-else-if="telaAtual === 'encontrar'"
      :novosUsuarios="novosUsuarios"
      @navegar="navegarPara"
      @alternar-seguir="alternarSeguir"
    />

    <ChatPerfil
      v-else-if="telaAtual === 'perfil'"
      :conversaAtiva="conversaAtiva"
      @navegar="navegarPara"
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

@media (max-width: 768px) {
  main {
    margin-left: 0;
    width: 100%;
    padding: 10px;
  }
}
</style>