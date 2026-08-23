<script setup>
import { ref, computed, nextTick } from 'vue'


const buscaLista = ref('')
const buscaPostagem = ref('')


const criandoLista = ref(false)
const nomeNovaLista = ref('')
const inputNovaLista = ref(null)


const exibirModalExclusao = ref(false)


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
        usuario: 'Maria Eduarda',
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
}


async function ativarInputCriacao() {
  criandoLista.value = true
  await nextTick()
  if (inputNovaLista.value) {
    inputNovaLista.value.focus()
  }
}


function salvarNovaLista() {
  const nomeFormatado = nomeNovaLista.value.trim()
  if (nomeFormatado) {
    const novaLista = {
      id: Date.now(),
      nome: nomeFormatado,
      postagens: []
    }
    listas.value.unshift(novaLista)
    listaSelecionada.value = novaLista
  }
  nomeNovaLista.value = ''
  criandoLista.value = false
}


function cancelarOuSalvar() {
  if (nomeNovaLista.value.trim()) {
    salvarNovaLista()
  } else {
    criandoLista.value = false
    nomeNovaLista.value = ''
  }
}


function abrirModalExclusao() {
  if (listaSelecionada.value) {
    exibirModalExclusao.value = true
  }
}


function cancelarExclusao() {
  exibirModalExclusao.value = false
}


function confirmarExclusao() {
  if (!listaSelecionada.value) return

  const index = listas.value.findIndex(l => l.id === listaSelecionada.value.id)
  if (index !== -1) {
    listas.value.splice(index, 1)
    listaSelecionada.value = listas.value[index] || listas.value[index - 1] || null
  }
  exibirModalExclusao.value = false
}


function removerPostagem(postId) {
  if (!listaSelecionada.value) return
  listaSelecionada.value.postagens = listaSelecionada.value.postagens.filter(p => p.id !== postId)
}


</script>

<template>
  <main>
    <div class="saved-container">

      <div class="column-card">
        <header class="card-header">
          <h1>Listas de postagens salvas</h1>
        </header>

        <div class="scroll-content">
          <div class="search-box">
            <input type="text" v-model="buscaLista" placeholder="Procurar lista" />
            <span class="search-icon">🔍︎</span>
          </div>

          <div v-if="criandoLista" class="add-list-input-box">
            <input
              ref="inputNovaLista"
              type="text"
              v-model="nomeNovaLista"
              placeholder="Digite o nome da lista..."
              @keyup.enter="salvarNovaLista"
              @blur="cancelarOuSalvar"
            />
          </div>
          <button v-else class="add-list-btn" @click="ativarInputCriacao">
            <span class="plus-circle">⊕</span>
          </button>

          <div class="lists-wrapper">
            <div
              v-for="item in listasFiltradas"
              :key="item.id"
              :class="['list-item', { active: listaSelecionada?.id === item.id }]"
              @click="selecionarLista(item)"
            >
              <strong>{{ item.nome }}</strong>
              <span class="item-count">{{ item.postagens.length }} postagens</span>
            </div>
          </div>
        </div>
      </div>

      <div class="column-card">
        <header class="card-header header-with-action">
          <h1>
            <template v-if="listaSelecionada">
              <strong>{{ listaSelecionada.nome }}</strong>
              <span class="light-text"> selecionada</span>
            </template>
            <template v-else>
              <span class="light-text">Nenhuma lista selecionada</span>
            </template>
          </h1>
          <button
            v-if="listaSelecionada"
            class="trash-btn"
            title="Excluir lista"
            @click="abrirModalExclusao"
          >
            🗑️
          </button>
        </header>

        <div class="scroll-content">
          <div class="search-box">
            <input
              type="text"
              v-model="buscaPostagem"
              placeholder="Procurar postagem"
              :disabled="!listaSelecionada"
            />
            <span class="search-icon">🔍︎</span>
          </div>

          <div class="posts-wrapper" v-if="listaSelecionada">
            <div v-if="postagensFiltradas.length === 0" class="empty-state">
              Nenhuma postagem salva nesta lista.
            </div>

            <div v-for="post in postagensFiltradas" :key="post.id" class="post-card">

              <div class="post-header-meta">
                {{ post.data }} | {{ post.curtidas }} <template v-if="post.votos">| {{ post.votos }}</template>
              </div>

              <div class="user-row">
                <div class="avatar-icon">👤</div>
                <strong>{{ post.usuario }}</strong>
              </div>

              <p class="post-text">{{ post.texto }}</p>

              <div v-if="post.comEnquete" class="poll-container">
                <div v-for="op in post.enquete" :key="op.id" class="poll-option">
                  <div class="poll-bar" :style="{ width: op.porcentagem }"></div>
                  <span class="option-label">{{ op.opcao }}</span>
                  <span class="option-percent">{{ op.porcentagem }}</span>
                </div>
              </div>

              <div class="post-actions">
                <span class="action-icon">👍</span>
                <span class="action-icon">👎</span>
                <span class="action-icon">💬</span>
                <span class="action-icon">↪</span>
                <span class="action-icon active-bookmark">🔖</span>
              </div>

              <div class="post-footer">
                <button class="trash-btn" title="Remover da lista" @click="removerPostagem(post.id)">
                  🗑️
                </button>
              </div>

            </div>
          </div>

          <div v-else class="empty-state">
            Crie ou selecione uma lista para ver as postagens.
          </div>
        </div>
      </div>

    </div>

    <div v-if="exibirModalExclusao" class="modal-overlay" @click.self="cancelarExclusao">
      <div class="modal-card">
        <h2>Excluir Lista</h2>
        <p>Tem certeza que deseja excluir a lista <strong>"{{ listaSelecionada?.nome }}"</strong>?</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelarExclusao">Cancelar</button>
          <button class="btn-confirm" @click="confirmarExclusao">Excluir</button>
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


.column-card {
  flex: 1;
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}


.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #000000;
}


.card-header h1 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
  color: #000000;
}


.header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}


.light-text {
  font-weight: normal;
}


.scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}


.search-box {
  display: flex;
  align-items: center;
  border: 1px solid #000000;
  border-radius: 20px;
  padding: 6px 14px;
  background: #ffffff;
}


.search-box input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 0.85rem;
}


.search-icon {
  font-size: 0.8rem;
  color: #000000;
}


.add-list-btn {
  width: 100%;
  height: 60px;
  background: #ffffff;
  border: 1px dashed #000000;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}


.plus-circle {
  font-size: 1.8rem;
  line-height: 1;
  color: #000000;
}


.add-list-input-box {
  width: 100%;
  height: 60px;
  background: #ffffff;
  border: 1px dashed #000000;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  box-sizing: border-box;
}


.add-list-input-box input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  font-size: 0.9rem;
  font-weight: bold;
  color: #000000;
  background: transparent;
}


.lists-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}


.list-item {
  border: 1px solid #000000;
  border-radius: 4px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background-color: #ffffff;
}


.list-item.active {
  border: 2px solid #55ff33;
}


.item-count {
  font-size: 0.85rem;
  color: #888888;
}


.posts-wrapper {
  display: flex;
  flex-direction: column;
  gap: 14px;
}


.empty-state {
  text-align: center;
  font-size: 0.85rem;
  color: #777777;
  margin-top: 20px;
}


.post-card {
  border: 1px solid #000000;
  border-radius: 4px;
  padding: 12px;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 6px;
}


.post-header-meta {
  font-size: 0.68rem;
  color: #777777;
}


.user-row {
  display: flex;
  align-items: center;
  gap: 8px;
}


.avatar-icon {
  font-size: 1.1rem;
}


.post-text {
  margin: 2px 0;
  font-size: 0.85rem;
  color: #000000;
}


.poll-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 4px 0;
}


.poll-option {
  position: relative;
  border: 1px solid #000000;
  border-radius: 4px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  overflow: hidden;
  background-color: #ffffff;
}


.poll-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background-color: rgba(85, 255, 51, 0.3);
  z-index: 1;
}


.option-label, .option-percent {
  position: relative;
  z-index: 2;
  font-size: 0.75rem;
}


.option-percent {
  font-weight: bold;
}


.post-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 0.85rem;
  margin-top: 4px;
}


.action-icon {
  cursor: pointer;
}


.active-bookmark {
  color: #55ff33;
}


.post-footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #eeeeee;
  padding-top: 4px;
}


.trash-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  opacity: 0.8;
}


.trash-btn:hover {
  opacity: 1;
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
  color: #000000;
}


.modal-card p {
  font-size: 0.88rem;
  color: #333333;
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


.btn-cancel:hover {
  background-color: #f0f0f0;
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

.btn-confirm:hover {
  background-color: #cc0000;
}


</style>
