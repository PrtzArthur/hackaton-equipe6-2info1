<script setup>
import { ref } from 'vue'

const searchQuery = ref('')

// Dados fictícios para só pra renderizar os cards, thanks Bruno!
const favoritas = ref([
  { id: 1, nome: 'Nome comunidade', membros: '12.213' },
  { id: 2, nome: 'Nome comunidade', membros: '12.213' },
  { id: 3, nome: 'Nome comunidade', membros: '12.213' },
  { id: 4, nome: 'Nome comunidade', membros: '12.213' },
  { id: 5, nome: 'Nome comunidade', membros: '12.213' },
  { id: 6, nome: 'Nome comunidade', membros: '12.213' }
])

const comunidades = ref([
  { id: 4, nome: 'Nome comunidade', membros: '12.213' },
  { id: 5, nome: 'Nome comunidade', membros: '12.213' },
  { id: 6, nome: 'Nome comunidade', membros: '12.213' },
  { id: 7, nome: 'Nome comunidade', membros: '12.213' },
  { id: 8, nome: 'Nome comunidade', membros: '12.213' },
  { id: 9, nome: 'Nome comunidade', membros: '12.213' },
  { id: 10, nome: 'Nome comunidade', membros: '12.213' },
  { id: 11, nome: 'Nome comunidade', membros: '12.213' },
  { id: 12, nome: 'Nome comunidade', membros: '12.213' },
  { id: 13, nome: 'Nome comunidade', membros: '12.213' },
  { id: 14, nome: 'Nome comunidade', membros: '12.213' },
  { id: 15, nome: 'Nome comunidade', membros: '12.213' }
])
</script>

<template>
  <main>
    <div class="explore-card">
      
      <div class="search-section">
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Procurar comunidade" 
          />
          <span class="search-icon">🔍︎</span>
        </div>
      </div>

      <div class="scroll-content">
        
        <section class="community-section">
          <h2>Comunidades favoritas</h2>
          <div class="horizontal-scroll">
            <div 
              v-for="item in favoritas" 
              :key="item.id" 
              class="community-card"
            >
              <div class="card-banner"></div>
              <div class="card-info">
                <strong>{{ item.nome }}</strong>
                <span>{{ item.membros }} membros</span>
              </div>
            </div>
          </div>
        </section>

        <section class="community-section">
          <h2>Comunidades</h2>
          <div class="communities-grid">
            <div 
              v-for="item in comunidades" 
              :key="item.id" 
              class="community-card"
            >
              <div class="card-banner"></div>
              <div class="card-info">
                <strong>{{ item.nome }}</strong>
                <span>{{ item.membros }} membros</span>
              </div>
            </div>
          </div>
        </section>

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
  overflow-x: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.explore-card {
  width: 100%;
  max-width: 580px;
  height: 80vh;
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.search-section {
  padding: 16px;
  border-bottom: 1px solid #000000;
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
  color: #333;
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.community-section {
  margin-bottom: 20px;
}

.community-section h2 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: bold;
  color: #000000;
}

.horizontal-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.communities-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.community-card {
  border: 1px solid #000000;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  min-width: 150px;
}

.card-banner {
  background-color: #a3ff99;
  height: 110px;
  width: 100%;
  border-bottom: 1px solid #000000;
}

.card-info {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-info strong {
  font-size: 0.85rem;
  color: #000000;
}

.card-info span {
  font-size: 0.75rem;
  color: #666666;
}
</style>