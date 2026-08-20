<script setup>
import { ref, computed } from 'vue'
import SavedListColumn from '@/components/salvar/SavedListColumn.vue'
import SavedPostsColumn from '@/components/salvar/SavedPostsColumn.vue'

const buscaLista = ref('')
const buscaPostagem = ref('')
const exibirModalExclusao = ref(false)
const mostrarPostagensMobile = ref(false)

const listas = ref([
  {
    id: 1,
    nome: 'Lista 1',
    postagens: [
      {
        id: 101,
        data: '10/08/2026 - Há um dia',
        curtidas: '1.200 curtidas',
        usuario: 'Lucas Silva',
        texto: 'Dicas de estudo para a prova do IF!',
        comEnquete: false
      }
    ]
  },
  {
    id: 2,
    nome: 'Lista 2',
    postagens: [
      {
        id: 201,
        data: '08/08/2026 - Há três dias',
        curtidas: '37.056 curtidas',
        usuario: 'Nome Usuário',
        texto: 'Assunto comentado pelo usuário',
        comEnquete: false
      },
      {
        id: 202,
        data: '08/08/2026 - Há três dias',
        curtidas: '36.843 curtidas',
        votos: '7.290 votos',
        usuario: 'Seu usuário',
        texto: 'Assunto comentado pelo usuário com enquete',
        comEnquete: true,
        enquete: [
          { id: 1, opcao: 'Opção 1', porcentagem: '25%' },
          { id: 2, opcao: 'Opção 2', porcentagem: '50%' },
          { id: 3, opcao: 'Opção 3', porcentagem: '25%' }
        ]
      }
    ]
  },
  {
    id: 3,
    nome: 'Lista 3',
    postagens: [
      {
        id: 301,
        data: '05/08/2026 - Há seis dias',
        curtidas: '500 curtidas',
        usuario: 'Lucas Eliel',
        texto: 'Links úteis do Hackathon da Equipe 6.',
        comEnquete: false
      }
    ]
  }
])

const listaSelecionada = ref(listas.value[1] || null)

const listasFiltradas = computed(() => {
  return listas.value.filter(l => 
    l.nome.toLowerCase().includes(buscaLista.value.toLowerCase())
  )
})

const postagensFiltradas = computed(() => {
  if (!listaSelecionada.value) return []
  return listaSelecionada.value.postagens.filter(p => 
    p.texto.toLowerCase().includes(buscaPostagem.value.toLowerCase()) ||
    p.usuario.toLowerCase().includes(buscaPostagem.value.toLowerCase())
  )
})

function selecionarLista(lista) {
  listaSelecionada.value = lista
  buscaPostagem.value = ''
  mostrarPostagensMobile.value = true
}

function criarLista(nome) {
  const novaLista = {
    id: Date.now(),
    nome,
    postagens: []
  }
  listas.value.unshift(novaLista)
  selecionarLista(novaLista)
}

function confirmarExclusao() {
  if (!listaSelecionada.value) return

  const index = listas.value.findIndex(l => l.id === listaSelecionada.value.id)
  if (index !== -1) {
    listas.value.splice(index, 1)
    listaSelecionada.value = listas.value[index] || listas.value[index - 1] || null
  }
  exibirModalExclusao.value = false
  mostrarPostagensMobile.value = false
}

function removerPostagem(postId) {
  if (!listaSelecionada.value) return
  listaSelecionada.value.postagens = listaSelecionada.value.postagens.filter(p => p.id !== postId)
}
</script>

<template>
  <main>
    <div class="saved-container">
      
      <div :class="['column-wrapper', { 'hide-mobile': mostrarPostagensMobile }]">
        <SavedListColumn 
          :listas="listasFiltradas"
          :listaSelecionada="listaSelecionada"
          v-model:buscaLista="buscaLista"
          @selecionar-lista="selecionarLista"
          @criar-lista="criarLista"
        />
      </div>

      <div :class="['column-wrapper', { 'show-mobile': mostrarPostagensMobile }]">
        <SavedPostsColumn 
          :listaSelecionada="listaSelecionada"
          :postagensFiltradas="postagensFiltradas"
          v-model:buscaPostagem="buscaPostagem"
          @voltar-mobile="mostrarPostagensMobile = false"
          @abrir-modal-exclusao="exibirModalExclusao = true"
          @remover-postagem="removerPostagem"
        />
      </div>

    </div>

    <div v-if="exibirModalExclusao" class="modal-overlay" @click.self="exibirModalExclusao = false">
      <div class="modal-card">
        <h2>Excluir Lista</h2>
        <p>Tem certeza que deseja excluir a lista <strong>"{{ listaSelecionada?.nome }}"</strong>?</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="exibirModalExclusao = false">Cancelar</button>
          <button class="btn-confirm" @click="confirmarExclusao">Excluir</button>
        </div>
      </div>
    </div>
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
}

.saved-container {
  display: flex;
  gap: 20px;
  width: 100%;
  max-width: 900px;
  height: 80vh;
  margin: 0 auto;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
}

.column-wrapper {
  flex: 1;
  height: 100%;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-card {
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 6px;
  padding: 20px;
  width: 90%;
  max-width: 360px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  text-align: center;
}

.modal-card h2 {
  margin: 0 0 10px 0;
  font-size: 1.1rem;
  font-weight: bold;
}

.modal-card p {
  font-size: 0.88rem;
  margin: 0 0 20px 0;
  line-height: 1.4;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 4px;
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
}

.btn-confirm {
  background-color: #ff4d4d;
  color: #ffffff;
  border: 1px solid #000000;
  border-radius: 4px;
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
}

@media (max-width: 768px) {
  main {
    margin-left: 0;
    width: 100%;
    padding: 10px;
  }

  .saved-container {
    height: 90vh;
  }

  .column-wrapper {
    display: none;
    width: 100%;
  }

  .column-wrapper:first-child {
    display: block;
  }

  .column-wrapper.hide-mobile {
    display: none !important;
  }

  .column-wrapper.show-mobile {
    display: block !important;
  }
}
</style>