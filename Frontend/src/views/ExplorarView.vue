<script setup>
import { ref, computed } from 'vue'
import ExploreCard from '@/components/explorar/ExploreCard.vue'

const searchQuery = ref('')

const favoritas = ref([
  { id: 1, nome: 'Nome comunidade', membros: '12.213' },
  { id: 2, nome: 'Nome comunidade', membros: '12.213' },
  { id: 3, nome: 'Nome comunidade', membros: '12.213' },
  { id: 4, nome: 'Nome comunidade', membros: '12.213' }
])

const comunidades = ref([
  { id: 5, nome: 'Nome comunidade', membros: '12.213' },
  { id: 6, nome: 'Nome comunidade', membros: '12.213' },
  { id: 7, nome: 'Nome comunidade', membros: '12.213' },
  { id: 8, nome: 'Nome comunidade', membros: '12.213' },
  { id: 9, nome: 'Nome comunidade', membros: '12.213' },
  { id: 10, nome: 'Nome comunidade', membros: '12.213' }
])

const comunidadesFiltradas = computed(() => {
  if (!searchQuery.value.trim()) return comunidades.value
  return comunidades.value.filter(c => 
    c.nome.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const favoritasFiltradas = computed(() => {
  if (!searchQuery.value.trim()) return favoritas.value
  return favoritas.value.filter(c => 
    c.nome.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})
</script>

<template>
  <main class="explorar-container">
    <ExploreCard 
      :searchQuery="searchQuery"
      @update:searchQuery="val => searchQuery = val"
      :favoritas="favoritasFiltradas"
      :comunidades="comunidadesFiltradas"
    />
  </main>
</template>

<style scoped>
.explorar-container {
  background-color: rgba(85, 255, 51, 0.14);
  min-height: 100vh;
  width: calc(100% - 12vw);
  margin-left: 12vw;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
}


@media (max-width: 768px) {
  .explorar-container {
    margin-left: 0;
    width: 100%;
    padding: 10px;
    min-height: 100dvh;
  }
}
</style>