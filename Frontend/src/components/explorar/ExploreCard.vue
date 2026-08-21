<script setup>
import CommunityCard from './CommunityCard.vue'

defineProps({
  favoritas: {
    type: Array,
    default: () => []
  },
  comunidades: {
    type: Array,
    default: () => []
  },
  searchQuery: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:searchQuery'])

function onInput(event) {
  emit('update:searchQuery', event.target.value)
}
</script>

<template>
  <div class="explore-card">
    <!-- Busca -->
    <div class="search-section">
      <div class="search-box">
        <input 
          type="text" 
          :value="searchQuery" 
          @input="onInput"
          placeholder="Procurar comunidade..." 
        />
        <span class="search-icon">🔍︎</span>
      </div>
    </div>

    <div class="scroll-content">
      <section class="community-section" v-if="favoritas.length > 0">
        <h2>Comunidades favoritas</h2>
        <div class="horizontal-scroll">
          <div v-for="item in favoritas" :key="item.id" class="horizontal-item">
            <CommunityCard :nome="item.nome" :membros="item.membros" />
          </div>
        </div>
      </section>

      <section class="community-section">
        <h2>Comunidades</h2>
        <div class="communities-grid">
          <CommunityCard 
            v-for="item in comunidades" 
            :key="item.id" 
            :nome="item.nome"
            :membros="item.membros"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.explore-card {
  width: 100%;
  max-width: 580px;
  height: 82vh;
  max-height: 700px;
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden; 
}

.search-section {
  padding: 14px;
  border-bottom: 1px solid #000000;
  background-color: #ffffff;
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
  font-size: 0.9rem;
}

.search-icon {
  font-size: 0.85rem;
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  -webkit-overflow-scrolling: touch; 
}

.community-section {
  margin-bottom: 20px;
}

.community-section h2 {
  margin: 0 0 10px 0;
  font-size: 0.95rem;
  font-weight: bold;
}

.horizontal-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 8px;
  -webkit-overflow-scrolling: touch;
}

.horizontal-item {
  min-width: 130px;
  flex-shrink: 0;
}

.communities-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

@media (max-width: 768px) {
  .explore-card {
    height: 88vh;
    max-height: none;
  }
}

@media (max-width: 480px) {
  .communities-grid {
    grid-template-columns: repeat(2, 1fr); 
    gap: 8px;
  }
}
</style>