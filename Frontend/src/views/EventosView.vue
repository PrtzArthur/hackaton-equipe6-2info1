<script setup>
// Opa Bruno, não consegui identificar uma página de criação de novos eventos no Figma, então criei uma tela de detalhes ao invés de uma tela de criação, ainda posso aprimorar essa tela caso necessário, a barra de pesquisa está funcionando varrendo aquele array temporário também. Thanks Bruno.

import { ref, computed } from 'vue'

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

const abrirDetalhes = (evento) => {
  eventoSelecionado.value = evento
}

const voltarParaLista = () => {
  eventoSelecionado.value = null
}
</script>

<template>
  <main>
    
    <div v-if="!eventoSelecionado" class="events-card">
      
      <header class="events-header">
        <h1>Eventos</h1>
      </header>

      <div class="scroll-content">
        
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Procurar evento" 
          />
          <span class="search-icon">🔍︎</span>
        </div>

        <button class="add-event-btn">
          <span class="plus-icon">+</span>
          <span>Novo evento</span>
        </button>

        <section class="events-section">
          <h2>Principais eventos</h2>
          
          <div 
            v-for="evento in principaisFiltrados" 
            :key="evento.id" 
            class="event-item"
            @click="abrirDetalhes(evento)"
          >
            <div class="event-info">
              <strong>{{ evento.titulo }}</strong>
              <span class="event-date">{{ evento.data }}</span>
              <span class="event-attendees">{{ evento.membros }}</span>
            </div>
            <div :class="['status-badge', evento.confirmado ? 'confirmed' : 'pending']">
              {{ evento.confirmado ? '✔' : '✓' }}
            </div>
          </div>

          <p v-if="principaisFiltrados.length === 0" class="no-results">
            Nenhum evento principal encontrado.
          </p>

          <a href="#" class="see-more">Ver mais...</a>
        </section>

        <hr class="divider" />

        <section class="events-section">
          <h2>Eventos disponíveis</h2>

          <div 
            v-for="evento in disponiveisFiltrados" 
            :key="evento.id" 
            class="event-item"
            @click="abrirDetalhes(evento)"
          >
            <div class="event-info">
              <strong>{{ evento.titulo }}</strong>
              <span class="event-date">{{ evento.data }}</span>
              <span class="event-attendees">{{ evento.membros }}</span>
            </div>
            <div :class="['status-badge', evento.confirmado ? 'confirmed' : 'pending']">
              {{ evento.confirmado ? '✔' : '✓' }}
            </div>
          </div>

          <p v-if="disponiveisFiltrados.length === 0" class="no-results">
            Nenhum evento disponível encontrado.
          </p>

        </section>

      </div>
    </div>

    <div v-else class="events-card">
      
      <header class="events-header detail-header">
        <button class="back-btn" @click="voltarParaLista">←</button>
        <h1>{{ eventoSelecionado.titulo }}</h1>
      </header>

      <div class="scroll-content">
        
        <div class="event-detail-meta">
          <span class="event-date">{{ eventoSelecionado.data }}</span>
          <span class="event-attendees-text">{{ eventoSelecionado.membros }}</span>
        </div>

        <section class="events-section">
          <h2>Descrição</h2>
          <textarea 
            v-model="eventoSelecionado.descricao" 
            class="description-input"
          ></textarea>
        </section>

        <section class="events-section">
          <h2>Tags</h2>
          <div class="tags-wrapper">
            <span 
              v-for="(tag, index) in eventoSelecionado.tags" 
              :key="index" 
              class="tag-pill"
            >
              {{ tag }}
            </span>
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
}

.events-card {
  width: 100%;
  max-width: 480px;
  height: 80vh;
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  margin: 0 auto;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
}

.events-header {
  padding: 16px 20px;
  border-bottom: 1px solid #000000;
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

.event-item {
  border: 1px solid #000000;
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  background-color: #ffffff;
  cursor: pointer;
}

.event-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.event-info strong {
  font-size: 0.95rem;
  color: #000000;
}

.event-date {
  font-size: 0.75rem;
  color: #888888;
}

.event-attendees {
  font-size: 0.75rem;
  color: #888888;
  text-decoration: underline;
}

.status-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.status-badge.confirmed {
  background-color: #28a745;
  color: #ffffff;
}

.status-badge.pending {
  border: 1px solid #666666;
  color: #666666;
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
  color: #777;
  font-style: italic;
  margin: 8px 0;
}

.event-detail-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
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
}

.tag-pill {
  border: 1px solid #000000;
  border-radius: 20px;
  padding: 4px 16px;
  font-size: 0.8rem;
  font-weight: bold;
}
</style>