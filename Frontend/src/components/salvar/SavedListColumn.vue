<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  listas: Array,
  listaSelecionada: Object,
  buscaLista: String
})

const emit = defineEmits(['update:buscaLista', 'selecionar-lista', 'criar-lista'])

const criandoLista = ref(false)
const nomeNovaLista = ref('')
const inputNovaLista = ref(null)

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
    emit('criar-lista', nomeFormatado)
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
</script>

<template>
  <div class="column-card">
    <header class="card-header">
      <h1>Listas de postagens salvas</h1>
    </header>

    <div class="scroll-content">
      <div class="search-box">
        <input 
          type="text" 
          :value="buscaLista" 
          @input="emit('update:buscaLista', $event.target.value)" 
          placeholder="Procurar lista" 
        />
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
          v-for="item in listas" 
          :key="item.id" 
          :class="['list-item', { active: listaSelecionada?.id === item.id }]"
          @click="emit('selecionar-lista', item)"
        >
          <strong>{{ item.nome }}</strong>
          <span class="item-count">{{ item.postagens.length }} postagens</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
</style>