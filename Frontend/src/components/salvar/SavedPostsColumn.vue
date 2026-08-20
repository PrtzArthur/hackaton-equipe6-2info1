<script setup>
defineProps({
  listaSelecionada: Object,
  postagensFiltradas: Array,
  buscaPostagem: String
})

const emit = defineEmits([
  'update:buscaPostagem', 
  'voltar-mobile', 
  'abrir-modal-exclusao', 
  'remover-postagem'
])
</script>

<template>
  <div class="column-card">
    <header class="card-header header-with-action">
      <div class="header-left">
        <button class="back-mobile-btn" @click="emit('voltar-mobile')" title="Voltar para as listas">←</button>
        <h1>
          <template v-if="listaSelecionada">
            <strong>{{ listaSelecionada.nome }}</strong> 
            <span class="light-text"> selecionada</span>
          </template>
          <template v-else>
            <span class="light-text">Nenhuma lista selecionada</span>
          </template>
        </h1>
      </div>

      <button 
        v-if="listaSelecionada" 
        class="trash-btn" 
        title="Excluir lista"
        @click="emit('abrir-modal-exclusao')"
      >
        🗑️
      </button>
    </header>

    <div class="scroll-content">
      <div class="search-box">
        <input 
          type="text" 
          :value="buscaPostagem" 
          @input="emit('update:buscaPostagem', $event.target.value)"
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
            <button class="trash-btn" title="Remover da lista" @click="emit('remover-postagem', post.id)">
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

.header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-mobile-btn {
  display: none;
  background: none;
  border: none;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
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

@media (max-width: 768px) {
  .back-mobile-btn {
    display: block;
  }
}
</style>