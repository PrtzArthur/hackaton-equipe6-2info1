<script setup>
import { ref, computed } from 'vue'
import EventsListCard from '@/components/eventos/EventsListCard.vue'
import EventDetailCard from '@/components/eventos/EventDetailCard.vue'

const searchQuery = ref('')
const eventoSelecionado = ref(null)

const principaisEventos = ref([
  {
    id: 1,
    titulo: 'Evento 2',
    data: '00/00/0000 - 00/00/0000',
    membros: '1000 pessoas comparecerão',
    confirmado: true,
    descricao: '',
    tags: ['#soulFC']
  }
])

const eventosDisponiveis = ref([
  { id: 2, titulo: 'Evento 3', data: '00/00/0000 - 00/00/0000', membros: '1000 pessoas comparecerão', confirmado: false, descricao: '', tags: ['#soulFC'] },
  { id: 3, titulo: 'Evento 4', data: '00/00/0000 - 00/00/0000', membros: '1000 pessoas comparecerão', confirmado: true, descricao: '', tags: ['#soulFC'] },
  { id: 4, titulo: 'Evento 5', data: '00/00/0000 - 00/00/0000', membros: '1000 pessoas comparecerão', confirmado: false, descricao: '', tags: ['#soulFC'] },
  { id: 5, titulo: 'Evento 6', data: '00/00/0000 - 00/00/0000', membros: '1000 pessoas comparecerão', confirmado: true, descricao: '', tags: ['#soulFC'] },
  { id: 6, titulo: 'Evento 7', data: '00/00/0000 - 00/00/0000', membros: '1000 pessoas comparecerão', confirmado: true, descricao: '', tags: ['#soulFC'] }
])

const principaisFiltrados = computed(() => {
  return principaisEventos.value.filter(evento => 
    evento.titulo.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const disponiveisFiltrados = computed(() => {
  return eventosDisponiveis.value.filter(evento => 
    evento.titulo.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

function abrirDetalhes(evento) {
  eventoSelecionado.value = evento
}

function voltarParaLista() {
  eventoSelecionado.value = null
}

function atualizarDescricao(novaDescricao) {
  if (eventoSelecionado.value) {
    eventoSelecionado.value.descricao = novaDescricao
  }
}
</script>

<template>
  <main class="eventos-container">
    <EventsListCard 
      v-if="!eventoSelecionado"
      v-model:searchQuery="searchQuery"
      :principais="principaisFiltrados"
      :disponiveis="disponiveisFiltrados"
      @selecionar-evento="abrirDetalhes"
    />

    <EventDetailCard 
      v-else
      :evento="eventoSelecionado"
      @update:descricao="atualizarDescricao"
      @voltar="voltarParaLista"
    />
  </main>
</template>

<style scoped>
.eventos-container {
  background-color: rgba(85, 255, 51, 0.14);
  min-height: 100dvh;
  width: calc(100% - 200px);
  margin-left: 200px;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
}

@media (max-width: 768px) {
  .eventos-container {
    width: 100%;
    margin-left: 0;
    padding: 12px;
  }
}
</style>