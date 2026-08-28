<script setup>
import { ref } from 'vue'

const searchQuery = ref('')


const extensoesVideo = ['mp4', 'webm', 'ogg', 'mov']

// Recebe a URL do arquivo (ex: 'banner.mp4' ou 'banner.png')
// e devolve 'video' ou 'imagem' olhando só a extensão.
function detectarTipoMidia(url) {
  if (!url) return 'imagem'
  const extensao = url.split('.').pop().toLowerCase()
  return extensoesVideo.includes(extensao) ? 'video' : 'imagem'
}

// Dados fictícios para só pra renderizar os cards, thanks Bruno!

const favoritas = ref([
  { id: 1, nome: 'Nome comunidade', membros: '12.213', midia: '' },
  { id: 2, nome: 'Nome comunidade', membros: '12.213', midia: '' },
  { id: 3, nome: 'Nome comunidade', membros: '12.213', midia: '' },
  { id: 4, nome: 'Nome comunidade', membros: '12.213', midia: '' },
  { id: 5, nome: 'Nome comunidade', membros: '12.213', midia: '' },
  { id: 6, nome: 'Nome comunidade', membros: '12.213', midia: '' }
])

const comunidades = ref([
  { id: 4, nome: 'Nome comunidade', membros: '12.213', midia: '' },
  { id: 5, nome: 'Nome comunidade', membros: '12.213', midia: '' },
  { id: 6, nome: 'Nome comunidade', membros: '12.213', midia: '' },
  { id: 7, nome: 'Nome comunidade', membros: '12.213', midia: '' },
  { id: 8, nome: 'Nome comunidade', membros: '12.213', midia: '' },
  { id: 9, nome: 'Nome comunidade', membros: '12.213', midia: '' },
  { id: 10, nome: 'Nome comunidade', membros: '12.213', midia: '' },
  { id: 11, nome: 'Nome comunidade', membros: '12.213', midia: '' },
  { id: 12, nome: 'Nome comunidade', membros: '12.213', midia: '' },
  { id: 13, nome: 'Nome comunidade', membros: '12.213', midia: '' },
  { id: 14, nome: 'Nome comunidade', membros: '12.213', midia: '' },
  { id: 15, nome: 'Nome comunidade', membros: '12.213', midia: '' }
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
              <div class="card-banner">
                <video
                  v-if="detectarTipoMidia(item.midia) === 'video'"
                  :src="item.midia"
                  muted
                  loop
                  autoplay
                  playsinline
                />
                <img
                  v-else-if="item.midia"
                  :src="item.midia"
                  :alt="item.nome"
                />
              </div>
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
              <div class="card-banner">
                <video
                  v-if="detectarTipoMidia(item.midia) === 'video'"
                  :src="item.midia"
                  muted
                  loop
                  autoplay
                  playsinline
                />
                <img
                  v-else-if="item.midia"
                  :src="item.midia"
                  :alt="item.nome"
                />
              </div>
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
  height: 100vh;
  flex-grow: 1;
  padding: 0;
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

.explore-card {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
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
  width: 100%;
  min-height: 60px;
  border-bottom: 1px solid #000000;
  overflow: hidden;
}

.card-banner img,
.card-banner video {
  width: 100%;
  height: auto;
  display: block;
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
