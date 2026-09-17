<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'

const toast = useToast()

const meuIdLogado = ref(localStorage.getItem('ifchat_user_id') || '')
// Puxa o username salvo no login (ex: @bruno) para preencher o criador_handle automaticamente
const meuHandleLogado = ref(localStorage.getItem('ifchat_username') || 'anonimo')

const searchQuery = ref('')
const eventoSelecionado = ref(null)
const principaisEventos = ref([])
const eventosDisponiveis = ref([])

// Controle de Estado do Modal
const mostrarModalNovoEvento = ref(false)
const nomeEvento = ref('')
const dataInicio = ref('')
const dataFim = ref('')

// Filtros Computados reativos para a busca por input
const principaisFiltrados = computed(() => {
  return principaisEventos.value.filter(e =>
    e.titulo_evento?.toLowerCase().includes(searchQuery.value.toLowerCase().trim())
  )
})

const disponiveisFiltrados = computed(() => {
  return eventosDisponiveis.value.filter(e =>
    e.titulo_evento?.toLowerCase().includes(searchQuery.value.toLowerCase().trim())
  )
})

async function buscarEventosDoBanco() {
  try {
    const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/eventos/listar?meuId=${meuIdLogado.value}`)
    if (resposta.ok) {
      const dados = await resposta.json()
      // Divide de acordo com a quantidade de presenças para simular relevância
      principaisEventos.value = dados.filter(e => e.total_presencas >= 3)
      eventosDisponiveis.value = dados.filter(e => e.total_presencas < 3)
    }
  } catch (erro) {
    console.error(erro)
  }
}

// Envio do formulário do Modal para o Back-end
async function criarNovoEventoInstitucional() {
  if (!nomeEvento.value.trim() || !dataInicio.value) {
    toast.warning("Por favor, preencha o nome e a data de início!")
    return
  }

  try {
    const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/eventos/novo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: nomeEvento.value.trim(),
        dataInicio: dataInicio.value,
        dataFim: dataFim.value || null,
        criadorHandle: meuHandleLogado.value,
        idComunidade: 'comunidade-geral' // Opcional, mantido para integridade de FK
      })
    })

    if (resposta.ok) {
      toast.success("Novo evento agendado com sucesso!")

      // Limpa as variáveis e fecha o modal reativamente
      nomeEvento.value = ''
      dataInicio.value = ''
      dataFim.value = ''
      mostrarModalNovoEvento.value = false

      // Atualiza a lista na tela instantaneamente
      buscarEventosDoBanco()
    } else {
      toast.error("Falha ao registrar novo evento.")
    }
  } catch (erro) {
    console.error(erro)
    toast.error("Erro de conexão com o servidor.")
  }
}

async function alternarPresencaNoEvento(eventoAlvo) {
  if (!meuIdLogado.value) {
    toast.warning("Você precisa estar logado para confirmar presença!")
    return
  }
  try {
    const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/eventos/presenca`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idUsuario: meuIdLogado.value, idEventos: eventoAlvo.id_evento })
    })
    const dados = await resposta.json()
    if (resposta.ok) {
      const status = !!dados.confirmado
      const update = (lista) => {
        lista.value = lista.value.map(e => e.id_evento === eventoAlvo.id_evento ? {
          ...e, confirmadoPorMim: status, total_presencas: status ? e.total_presencas + 1 : e.total_presencas - 1
        } : e)
      }
      update(principaisEventos)
      update(eventosDisponiveis)
    }
  } catch (erro) { console.error(erro) }
}

onMounted(() => { buscarEventosDoBanco() })
</script>

<template>
  <main>
    <div v-if="mostrarModalNovoEvento" class="modal-salvar-lista" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 999;">
      <div class="modal-novo-nome" style="background: #ffffff; padding: 24px; border-radius: 8px; width: 90%; max-width: 400px; display: flex; flex-direction: column; gap: 12px;">
        <h2 style="font-size: 18px; margin: 0 0 8px 0;">Agendar Novo Evento</h2>

        <label style="font-size: 12px; font-weight: bold;">Nome do Evento:</label>
        <input v-model="nomeEvento" type="text" class="input-modal" placeholder="Ex: Hackathon IFC">

        <label style="font-size: 12px; font-weight: bold;">Data/Hora de Início:</label>
        <input v-model="dataInicio" type="datetime-local" class="input-modal">

        <label style="font-size: 12px; font-weight: bold;">Data/Hora de Encerramento:</label>
        <input v-model="dataFim" type="datetime-local" class="input-modal">

        <label style="font-size: 12px; font-weight: bold;">Criado por (Handle):</label>
        <input :value="'@' + meuHandleLogado" type="text" class="input-modal" disabled style="background: #f0f0f0; color: #666;">

        <div class="botoes-modal" style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px;">
          <button @click="mostrarModalNovoEvento = false" class="cancelar-modal" style=" border-radius: 7px; color: var(--texto-principal); background-color: var(--fundo-card); padding: 0.5vw; border: var(--borda-padrao);">Cancelar</button>
          <button @click="criarNovoEventoInstitucional" class="criar-modal" style="border: none; border-radius: 7px; color: #fff; font-weight: bolder; padding: 0.5vw;;background: var(--fundo-card-va);">Agendar</button>
        </div>
      </div>
    </div>

    <div v-if="!eventoSelecionado" class="events-card">
      <header class="events-header">
        <h1 class="eventos-titulo">Eventos</h1>
      </header>

      <div class="scroll-content">
        <div class="search-box">
          <input type="text" v-model="searchQuery" placeholder="Procurar evento"/>
          <span class="search-icon">🔍︎</span>
        </div>
        <button @click="mostrarModalNovoEvento = true" class="add-event-btn">
          <span class="plus-icon">+</span>
          <span>Novo evento</span>
        </button>
        <section class="events-section">
          <h2>Principais eventos</h2>
          <div v-for="evento in principaisFiltrados" :key="evento.id_evento" class="event-item" style="cursor: pointer; border: 1px solid #ccc; padding: 12px; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div class="event-info" @click="abrirDetalhes(evento)">
              <strong style="display: block; font-size: 15px;">{{ evento.titulo_evento }}</strong>
              <span class="event-date" style="font-size: 11px; color: #999; display: block; margin-top: 4px;">
                {{ new Date(evento.data_hora_evento).toLocaleDateString('pt-BR') }}
                <span v-if="evento.data_fim_evento"> - {{ new Date(evento.data_fim_evento).toLocaleDateString('pt-BR') }}</span>
              </span>
              <span style="font-size: 11px; color: #666; display: block; margin-top: 2px;">Organizado por: @{{ evento.criador_handle || 'ifchat' }}</span>
              <span class="event-attendees" style="font-size: 12px; color: #28a745; font-weight: bold; display: block; margin-top: 4px;">{{ evento.total_presencas }} pessoas comparecerão</span>
            </div>
            <div
              :class="['status-badge', evento.confirmadoPorMim ? 'confirmed' : 'pending']"
              @click.stop="alternarPresencaNoEvento(evento)"
              style="cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;">
              <span class="circulo-status"></span>
            </div>
          </div>
          <p v-if="principaisFiltrados.length === 0" class="no-results">Nenhum evento principal encontrado.</p>
        </section>
        <section class="events-section">
          <h2>Eventos disponíveis</h2>
          <div v-for="evento in disponiveisFiltrados" :key="evento.id_evento" class="event-item" style="cursor: pointer; border: 1px solid #ccc; padding: 12px; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div class="event-info" @click="abrirDetalhes(evento)">
              <strong style="display: block; font-size: 15px;">{{ evento.titulo_evento }}</strong>
              <span class="event-date" style="font-size: 11px; color: #999; display: block; margin-top: 4px;">
                {{ new Date(evento.data_hora_evento).toLocaleDateString('pt-BR') }}
                <span v-if="evento.data_fim_evento"> - {{ new Date(evento.data_fim_evento).toLocaleDateString('pt-BR') }}</span>
              </span>
              <span style="font-size: 11px; color: #666; display: block; margin-top: 2px;">Organizado por: @{{ evento.criador_handle || 'ifchat' }}</span>
              <span class="event-attendees" style="font-size: 12px; color: #28a745; font-weight: bold; display: block; margin-top: 4px;">{{ evento.total_presencas }} pessoas comparecerão</span>
            </div>
            <div
              :class="['status-badge', evento.confirmadoPorMim ? 'confirmed' : 'pending']"
              @click.stop="alternarPresencaNoEvento(evento)"
              style="cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;"
            >
              <span class="circulo-status"></span>
            </div>
          </div>
          <p v-if="disponiveisFiltrados.length === 0" class="no-results">Nenhum evento disponível encontrado.</p>
        </section>
      </div>
    </div>
    <div v-else class="events-card">
      <header class="events-header detail-header" style="display: flex; align-items: center; gap: 12px;">
        <button class="back-btn" @click="voltarParaLista" style="background: none; border: none; font-size: 20px; cursor: pointer;">←</button>
        <h1>{{ eventoSelecionado.titulo_evento }}</h1>
      </header>
      <div class="scroll-content" style="padding: 16px;">
        <p style="font-size: 13px; color: #666;">Por: @{{ eventoSelecionado.criador_handle || 'ifchat' }}</p>
        <p style="font-size: 14px; margin-top: 12px;">{{ eventoSelecionado.desc_evento || 'Sem descrição para este evento.' }}</p>
      </div>
    </div>
  </main>
</template>

<style scoped>
main {
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
.eventos-titulo {
  color: var(--texto-principal) !important;
}
.circulo-status {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: block;
  transition: background-color 0.2s, border-color 0.2s;
}
.pending .circulo-status {
  background-color: #e0e0e0;
  border: 1px solid #b5b5b5;
}
.confirmed .circulo-status {
  background-color: #a3ff99;
  border: 1px solid #7cd66b;
}
.events-card {
  background-color: var(--fundo-card);
  position: fixed;
  width: 40%;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translate(-50%);
  margin-top: 4vw;
  margin-bottom: 3vw;
  border-radius: 9px;
  border: var(--borda-padrao);
  scrollbar-color: #ccc transparent;
  overflow-y: auto;
  scrollbar-width: thin;
  padding: 2px;
}
.events-header {
  padding: 16px 20px;
  border-bottom: var(--borda-padrao);
}
.events-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
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
  border: var(--borda-padrao);
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
  border: var(--borda-padrao);
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
  border: var(--borda-padrao);
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
  border: var(--borda-padrao);
  border-radius: 20px;
  padding: 4px 16px;
  font-size: 0.8rem;
  font-weight: bold;
}
</style>
