<script setup>
import EventItem from './EventItem.vue'

defineProps({
  searchQuery: {
    type: String,
    default: ''
  },
  principais: {
    type: Array,
    default: () => []
  },
  disponiveis: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:searchQuery', 'selecionar-evento'])
</script>

<template>
  <div class="events-card">
    <header class="events-header">
      <h1>Eventos</h1>
    </header>

    <div class="scroll-content">
      <div class="search-box">
        <input 
          type="text" 
          :value="searchQuery" 
          @input="emit('update:searchQuery', $event.target.value)" 
          placeholder="Procurar evento" 
        />
        <span class="search-icon">🔍︎</span>
      </div>

      <button class="add-event-btn">
        <span class="plus-icon">+</span>
        <span>Novo evento</span>
      </button>

      <!-- Seção Principais -->
      <section class="events-section">
        <h2>Principais eventos</h2>
        
        <EventItem 
          v-for="evento in principais" 
          :key="evento.id" 
          :evento="evento" 
          @click="emit('selecionar-evento', evento)"
        />

        <p v-if="principais.length === 0" class="no-results">
          Nenhum evento principal encontrado.
        </p>

        <a href="#" class="see-more">Ver mais...</a>
      </section>

      <hr class="divider" />

      <section class="events-section">
        <h2>Eventos disponíveis</h2>

        <EventItem 
          v-for="evento in disponiveis" 
          :key="evento.id" 
          :evento="evento" 
          @click="emit('selecionar-evento', evento)"
        />

        <p v-if="disponiveis.length === 0" class="no-results">
          Nenhum evento disponível encontrado.
        </p>
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

.scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  -webkit-overflow-scrolling: touch;
}

.search-box {
  display: flex;
  align-items: center;
  border: 1px solid #000000;
  border-radius: 20px;
  padding: 8px 16px;
  background: #ffffff;
}

.search-box input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 0.95rem;
}

.search-icon {
  font-size: 0.9rem;
  color: #333333;
}

.add-event-btn {
  width: 100%;
  background-color: #ffffff;
  border: 1px dashed #000000;
  border-radius: 4px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666666;
  font-size: 0.85rem;
}

.plus-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.events-section h2 {
  font-size: 1rem;
  font-weight: bold;
  margin: 0 0 10px 0;
  color: #000000;
}

.see-more {
  display: inline-block;
  font-size: 0.8rem;
  color: #666666;
  text-decoration: none;
  margin-top: 4px;
}

.divider {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 4px 0;
}

.no-results {
  font-size: 0.85rem;
  color: #777777;
  font-style: italic;
  margin: 8px 0;
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