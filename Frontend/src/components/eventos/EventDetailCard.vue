<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  evento: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['voltar', 'update:descricao'])

const descricaoLocal = ref(props.evento.descricao || '')

watch(() => props.evento.descricao, (novaDesc) => {
  descricaoLocal.value = novaDesc || ''
})

function aoDigitar() {
  emit('update:descricao', descricaoLocal.value)
}
</script>

<template>
  <div class="events-card">
    <header class="events-header detail-header">
      <button class="back-btn" @click="emit('voltar')">←</button>
      <h1>{{ evento.titulo }}</h1>
    </header>

    <div class="scroll-content">
      <div class="event-detail-meta">
        <span class="event-date">{{ evento.data }}</span>
        <span class="event-attendees-text">{{ evento.membros }}</span>
      </div>

      <section class="events-section">
        <h2>Descrição</h2>
        <textarea 
          v-model="descricaoLocal" 
          @input="aoDigitar"
          class="description-input"
          placeholder="Adicione uma descrição..."
        ></textarea>
      </section>

      <section class="events-section">
        <h2>Tags</h2>
        <div class="tags-wrapper">
          <span 
            v-for="(tag, index) in evento.tags" 
            :key="index" 
            class="tag-pill"
          >
            {{ tag }}
          </span>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.events-card {
  width: 100%;
  max-width: 480px;
  height: 85vh;
  max-height: 750px;
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.events-header {
  padding: 16px 20px;
  border-bottom: 1px solid #000000;
  background-color: #ffffff;
  flex-shrink: 0;
}

.events-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: #000000;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  color: #000000;
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  -webkit-overflow-scrolling: touch;
}

.events-section h2 {
  font-size: 1rem;
  font-weight: bold;
  margin: 0 0 10px 0;
  color: #000000;
}

.event-detail-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.event-date {
  font-size: 0.8rem;
  color: #666666;
}

.event-attendees-text {
  font-size: 0.75rem;
  color: #888888;
}

.description-input {
  width: 100%;
  height: 120px;
  border: 1px solid #000000;
  border-radius: 6px;
  padding: 10px;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 0.9rem;
  resize: none;
  outline: none;
}

.tags-wrapper {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-pill {
  border: 1px solid #000000;
  border-radius: 20px;
  padding: 4px 16px;
  font-size: 0.8rem;
  font-weight: bold;
}

@media (max-width: 480px) {
  .events-card {
    height: 92dvh;
    border-radius: 6px;
  }

  .events-header {
    padding: 12px 16px;
  }

  .scroll-content {
    padding: 12px 16px;
    gap: 12px;
  }
}
</style>