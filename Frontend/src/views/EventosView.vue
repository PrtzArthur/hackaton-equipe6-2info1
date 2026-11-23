<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import canetaEdicao from '@/icons/canetaEdicao.svg';
import lixeira from '@/icons/lixeira.svg'

const toast = useToast()
const API_URL = import.meta.env.VITE_API_URL

const meuIdLogado = ref(localStorage.getItem('ifchat_user_id') || '')
const meuHandleLogado = ref(localStorage.getItem('ifchat_username') || 'anonimo')

const searchQuery = ref('')
const eventoSelecionado = ref(null)
const todosOsEventos = ref([])
const carregando = ref(false)

const mostrarModalEvento = ref(false)
const modoEdicao = ref(false)
const idEventoEmEdicao = ref(null)

const nomeEvento = ref('')
const descricaoEvento = ref('')
const dataInicio = ref('')
const dataFim = ref('')

const principaisFiltrados = computed(() => {
  const agora = new Date()
  const limiteSeteDias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000)

  return todosOsEventos.value.filter(e => {
    const tituloBate = e.titulo_evento?.toLowerCase().includes(searchQuery.value.toLowerCase().trim())
    const dataEvento = new Date(e.data_hora_evento)
    const urgente = dataEvento >= agora && dataEvento <= limiteSeteDias

    return tituloBate && urgente
  })
})

const disponiveisFiltrados = computed(() => {
  return todosOsEventos.value.filter(e =>
    e.titulo_evento?.toLowerCase().includes(searchQuery.value.toLowerCase().trim())
  )
})

// 1. LISTAR EVENTOS (GET /eventos)
async function buscarEventosDoBanco() {
  carregando.value = true
  try {
    const resposta = await fetch(`${API_URL}/eventos`)
    if (!resposta.ok) throw new Error('Erro ao listar eventos')

    const dados = await resposta.json()
    todosOsEventos.value = dados.map(ev => {
      const listaParticipantes = ev.participantesIds || []
      return {
        ...ev,
        id_evento: ev.id,
        participantesIds: listaParticipantes,
        total_presencas: ev.total_presencas ?? listaParticipantes.length,
        confirmadoPorMim: listaParticipantes.includes(String(meuIdLogado.value))
      }
    })
  } catch (erro) {
    console.error('Erro ao puxar cronograma de eventos:', erro)
    toast.error('Erro ao carregar eventos. Verifique se o JSON Server está rodando.')
  } finally {
    carregando.value = false
  }
}

// 2. CONSULTAR EVENTO POR ID (GET /eventos/:id)
async function abrirDetalhes(evento) {
  carregando.value = true
  try {
    const resposta = await fetch(`${API_URL}/eventos/${evento.id}`)
    if (resposta.ok) {
      const dadosAtualizados = await resposta.json()
      const listaParticipantes = dadosAtualizados.participantesIds || []
      eventoSelecionado.value = {
        ...dadosAtualizados,
        id_evento: dadosAtualizados.id,
        participantesIds: listaParticipantes,
        total_presencas: dadosAtualizados.total_presencas ?? listaParticipantes.length,
        confirmadoPorMim: listaParticipantes.includes(String(meuIdLogado.value))
      }
    } else {
      toast.error('Evento não encontrado na API (404).')
    }
  } catch (erro) {
    console.error('Erro ao buscar detalhes do evento:', erro)
    toast.error('Erro de comunicação ao buscar detalhes.')
  } finally {
    carregando.value = false
  }
}

function voltarParaLista() {
  eventoSelecionado.value = null
}

function abrirModalCriacao() {
  modoEdicao.value = false
  idEventoEmEdicao.value = null
  nomeEvento.value = ''
  descricaoEvento.value = ''
  dataInicio.value = ''
  dataFim.value = ''
  mostrarModalEvento.value = true
}

function abrirModalEdicao(evento) {
  modoEdicao.value = true
  idEventoEmEdicao.value = evento.id
  nomeEvento.value = evento.titulo_evento || ''
  descricaoEvento.value = evento.desc_evento || ''
  dataInicio.value = evento.data_hora_evento || ''
  dataFim.value = evento.data_fim_evento || ''
  mostrarModalEvento.value = true
}

// 3. CADASTRAR (POST /eventos) OU ATUALIZAR (PUT /eventos/:id)
async function salvarEvento() {
  if (!nomeEvento.value.trim() || !dataInicio.value) {
    toast.warning('Por favor, preencha o nome e a data de início!')
    return
  }

  carregando.value = true
  try {
    if (modoEdicao.value && idEventoEmEdicao.value) {
      // ATUALIZAR (PUT /eventos/:id)
      const payloadAtualizado = {
        ...eventoSelecionado.value,
        titulo_evento: nomeEvento.value.trim(),
        desc_evento: descricaoEvento.value.trim(),
        data_hora_evento: dataInicio.value,
        data_fim_evento: dataFim.value || ''
      }
      // Remove propriedades auxiliares de UI antes de salvar
      delete payloadAtualizado.id_evento
      delete payloadAtualizado.confirmadoPorMim

      const resposta = await fetch(`${API_URL}/eventos/${idEventoEmEdicao.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadAtualizado)
      })

      if (resposta.ok) {
        toast.success('Evento atualizado com sucesso!')
        mostrarModalEvento.value = false
        await buscarEventosDoBanco()
        await abrirDetalhes({ id: idEventoEmEdicao.value })
      } else {
        toast.error('Falha ao atualizar o evento.')
      }
    } else {
      // CADASTRAR (POST /eventos)
      const resposta = await fetch(`${API_URL}/eventos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo_evento: nomeEvento.value.trim(),
          desc_evento: descricaoEvento.value.trim(),
          data_hora_evento: dataInicio.value,
          data_fim_evento: dataFim.value || '',
          criador_handle: meuHandleLogado.value,
          participantesIds: [],
          total_presencas: 0
        })
      })

      if (resposta.ok) {
        toast.success('Novo evento agendado com sucesso!')
        mostrarModalEvento.value = false
        await buscarEventosDoBanco()
      } else {
        toast.error('Falha ao registrar novo evento.')
      }
    }
  } catch (erro) {
    console.error(erro)
    toast.error('Erro de conexão com o JSON Server.')
  } finally {
    carregando.value = false
  }
}

// 4. EXCLUIR EVENTO (DELETE /eventos/:id)
async function excluirEvento(idEvento) {
  if (!confirm('Tem certeza que deseja excluir este evento permanentemente?')) return

  carregando.value = true
  try {
    const resposta = await fetch(`${API_URL}/eventos/${idEvento}`, {
      method: 'DELETE'
    })

    if (resposta.ok) {
      toast.success('Evento excluído com sucesso!')
      eventoSelecionado.value = null
      await buscarEventosDoBanco()
    } else {
      toast.error('Não foi possível excluir o evento.')
    }
  } catch (erro) {
    console.error('Erro ao excluir evento:', erro)
    toast.error('Erro de comunicação com o servidor.')
  } finally {
    carregando.value = false
  }
}

// 5. CONFIRMAR / CANCELAR PRESENÇA (PATCH /eventos/:id)
async function alternarPresencaNoEvento(eventoAlvo) {
  if (!meuIdLogado.value) {
    toast.warning('Você precisa estar logado para confirmar presença!')
    return
  }

  const idUser = String(meuIdLogado.value)
  const listaAtual = eventoAlvo.participantesIds || []
  const jaEstava = listaAtual.includes(idUser)

  const novaLista = jaEstava
    ? listaAtual.filter(id => id !== idUser)
    : [...listaAtual, idUser]

  try {
    const resposta = await fetch(`${API_URL}/eventos/${eventoAlvo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantesIds: novaLista,
        total_presencas: novaLista.length
      })
    })

    if (resposta.ok) {
      toast.success(jaEstava ? 'Presença cancelada.' : 'Presença confirmada!')
      todosOsEventos.value = todosOsEventos.value.map(e => {
        if (e.id === eventoAlvo.id) {
          return {
            ...e,
            participantesIds: novaLista,
            confirmadoPorMim: !jaEstava,
            total_presencas: novaLista.length
          }
        }
        return e
      })
    }
  } catch (erro) {
    console.error('Erro ao alternar presença no evento:', erro)
    toast.error('Erro ao atualizar presença.')
  }
}

onMounted(() => {
  buscarEventosDoBanco()
})
</script>

<template>
  <main>
    <div
      v-if="mostrarModalEvento"
      class="modal-salvar-lista"
      style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 999;"
    >
      <div
        class="modal-novo-nome"
        style="background: var(--fundo-card, #ffffff); color: var(--texto-principal); border: var(--borda-padrao); padding: 24px; border-radius: 8px; width: 90%; max-width: 400px; display: flex; flex-direction: column; gap: 10px;"
      >
        <h2 style="font-size: 18px; margin: 0 0 8px 0;">
          {{ modoEdicao ? 'Editar Evento' : 'Agendar Novo Evento' }}
        </h2>
        <label style="font-size: 12px; font-weight: bold;">Nome do Evento: *</label>
        <input
          v-model="nomeEvento"
          type="text"
          class="input-modal"
          placeholder="Ex: Hackathon IFC"
          style="padding: 8px; border-radius: 6px; border: 1px solid #ccc;"
        />
        <label style="font-size: 12px; font-weight: bold;">Descrição:</label>
        <textarea
          v-model="descricaoEvento"
          rows="3"
          placeholder="Detalhes sobre o evento..."
          style="padding: 8px; border-radius: 6px; border: 1px solid #ccc; resize: none;"
        ></textarea>
        <label style="font-size: 12px; font-weight: bold;">Data/Hora de Início: *</label>
        <input
          v-model="dataInicio"
          type="datetime-local"
          class="input-modal"
          style="padding: 8px; border-radius: 6px; border: 1px solid #ccc;"
        />
        <label style="font-size: 12px; font-weight: bold;">Data/Hora de Encerramento:</label>
        <input
          v-model="dataFim"
          type="datetime-local"
          class="input-modal"
          style="padding: 8px; border-radius: 6px; border: 1px solid #ccc;"
        />
        <label style="font-size: 12px; font-weight: bold;">Organizador (Handle):</label>
        <input
          :value="'@' + meuHandleLogado"
          type="text"
          class="input-modal"
          disabled
          style="background: #f0f0f0; color: #666; padding: 8px; border-radius: 6px; border: 1px solid #ccc;"
        />
        <div class="botoes-modal" style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px;">
          <button
            @click="mostrarModalEvento = false"
            class="cancelar-modal"
            style="border-radius: 7px; color: var(--texto-principal); background-color: var(--fundo-card); padding: 8px 14px; border: var(--borda-padrao); cursor: pointer;"
          >
            Cancelar
          </button>
          <button
            @click="salvarEvento"
            :disabled="carregando"
            class="criar-modal"
            style="border: none; border-radius: 7px; color: #fff; font-weight: bolder; padding: 8px 16px; background: var(--fundo-card-va); cursor: pointer;"
          >
            {{ carregando ? 'Salvando...' : (modoEdicao ? 'Salvar Alterações' : 'Agendar') }}
          </button>
        </div>
      </div>
    </div>
    <div v-if="!eventoSelecionado" class="events-card">
      <header class="events-header">
        <h1 class="eventos-titulo">Eventos</h1>
      </header>
      <div class="scroll-content">
        <div class="search-box">
          <input type="text" v-model="searchQuery" placeholder="Procurar evento" />
          <span class="search-icon">🔍︎</span>
        </div>
        <button @click="abrirModalCriacao" class="add-event-btn">
          <span class="plus-icon">+</span>
          <span>Novo evento</span>
        </button>
        <p v-if="carregando" style="text-align: center; font-weight: bold; color: var(--fundo-card-va);">
          Carregando eventos...
        </p>
        <template v-else>
          <section class="events-section">
            <h2>Principais eventos</h2>
            <div
              v-for="evento in principaisFiltrados"
              :key="evento.id"
              class="event-item"
              style="cursor: pointer; border: 1px solid var(--texto-suave); padding: 12px; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;"
            >
              <div class="event-info" @click="abrirDetalhes(evento)">
                <strong style="display: block; font-size: 15px;">{{ evento.titulo_evento }}</strong>
                <span class="event-date" style="font-size: 11px; color: #999; display: block; margin-top: 4px;">
                  {{ new Date(evento.data_hora_evento).toLocaleDateString('pt-BR') }}
                  <span v-if="evento.data_fim_evento">
                    - {{ new Date(evento.data_fim_evento).toLocaleDateString('pt-BR') }}
                  </span>
                </span>
                <span style="font-size: 11px; color: #666; display: block; margin-top: 2px;">
                  Organizado por: @{{ evento.criador_handle || 'ifchat' }}
                </span>
                <span class="event-attendees" style="font-size: 12px; color: #28a745; font-weight: bold; display: block; margin-top: 4px;">
                  {{ evento.total_presencas }} pessoas comparecerão
                </span>
              </div>
              <div
                :class="['status-badge', evento.confirmadoPorMim ? 'confirmed' : 'pending']"
                @click.stop="alternarPresencaNoEvento(evento)"
                title="Confirmar presença"
                style="cursor: pointer; display: flex; align-items: center; justify-content: center;"
              >
                <span class="circulo-status">✔</span>
              </div>
            </div>
            <p v-if="principaisFiltrados.length === 0" class="no-results">
              Nenhum evento principal encontrado.
            </p>
          </section>
                    <section class="events-section">
            <h2>Eventos disponíveis</h2>
            <div
              v-for="evento in disponiveisFiltrados"
              :key="evento.id"
              class="event-item"
              style="cursor: pointer; border: 1px solid #ccc; padding: 12px; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;"
            >
              <div class="event-info" @click="abrirDetalhes(evento)">
                <strong style="display: block; font-size: 15px;">{{ evento.titulo_evento }}</strong>
                <span class="event-date" style="font-size: 11px; color: #999; display: block; margin-top: 4px;">
                  {{ new Date(evento.data_hora_evento).toLocaleDateString('pt-BR') }}
                  <span v-if="evento.data_fim_evento">
                    - {{ new Date(evento.data_fim_evento).toLocaleDateString('pt-BR') }}
                  </span>
                </span>
                <span style="font-size: 11px; color: #666; display: block; margin-top: 2px;">
                  Organizado por: @{{ evento.criador_handle || 'ifchat' }}
                </span>
                <span class="event-attendees" style="font-size: 12px; color: #28a745; font-weight: bold; display: block; margin-top: 4px;">
                  {{ evento.total_presencas }} pessoas comparecerão
                </span>
              </div>
              <div
                :class="['status-badge', evento.confirmadoPorMim ? 'confirmed' : 'pending']"
                @click.stop="alternarPresencaNoEvento(evento)"
                title="Confirmar presença"
                style="cursor: pointer; display: flex; align-items: center; justify-content: center;"
              >
                <span class="circulo-status">✔</span>
              </div>
            </div>
            <p v-if="disponiveisFiltrados.length === 0" class="no-results">
              Nenhum evento disponível encontrado.
            </p>
          </section>
        </template>
      </div>
    </div>
    <div v-else class="events-card">
      <header
        class="events-header detail-header"
        style="display: flex; justify-content: space-between; align-items: center;"
      >
        <div style="display: flex; align-items: center; gap: 12px;">
          <button
            class="back-btn"
            @click="voltarParaLista"
            style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--texto-principal);"
          >
            ←
          </button>
          <h1>{{ eventoSelecionado.titulo_evento }}</h1>
        </div>

        <div v-if="eventoSelecionado.criador_handle === meuHandleLogado" style="display: flex; gap: 8px;">
          <button
            @click="abrirModalEdicao(eventoSelecionado)"
            style="padding: 6px 12px; border-radius: 6px; border: var(--borda-padrao); background: var(--fundo-card); color: var(--texto-principal); cursor: pointer; font-weight: bold;"
          >
            <img :src="canetaEdicao" alt="" class="btn-post-img">
          </button>
          <button
            @click="excluirEvento(eventoSelecionado.id)"
            style="padding: 6px 12px; border-radius: 6px; border: none; background: #dc3545; color: #fff; cursor: pointer; font-weight: bold;"
          >
            <img :src="lixeira" alt="" class="btn-post-img lixeira">
          </button>
        </div>
      </header>

      <div class="scroll-content" style="padding: 16px; display: flex; flex-direction: column; gap: 10px;">
        <p style="font-size: 13px; color: var(--texto-suave);">
          <strong>Organizado por:</strong> @{{ eventoSelecionado.criador_handle || 'ifchat' }}
        </p>
        <p style="font-size: 13px; color: var(--texto-suave);">
          <strong>Início:</strong> {{ new Date(eventoSelecionado.data_hora_evento).toLocaleString('pt-BR') }}
          <span v-if="eventoSelecionado.data_fim_evento">
            | <strong>Fim:</strong> {{ new Date(eventoSelecionado.data_fim_evento).toLocaleString('pt-BR') }}
          </span>
        </p>
        <p style="font-size: 13px; color: #28a745; font-weight: bold;">
          {{ eventoSelecionado.total_presencas }} pessoas confirmadas
        </p>
        <p style="font-size: 14px; line-height: 1.5; margin-top: 8px;">
          {{ eventoSelecionado.desc_evento || 'Sem descrição para este evento.' }}
        </p>
      </div>
    </div>
  </main>
</template>

<style scoped>
[data-theme="dark"] .btn-post-img {
  filter: invert(0);
  transition: filter 0.3s ease;
}
.lixeira {
  width: 1.2vw;
  height: 1.2vw;
  filter: invert(1);
}
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
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: block;
  transition: background-color 0.2s, border-color 0.2s;
  align-items: center;
  display: flex;
  justify-content: center;
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
  background: var(--fundo-card);
}
.search-box input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 0.95rem;
  background-color: var(--fundo-card);
  color: var(--texto-principal)
}
.search-box input::placeholder {
  color: var(--texto-suave);
}
.search-icon {
  font-size: 0.9rem;
  color: var(--texto-suave);
}
.add-event-btn {
  width: 100%;
  background-color: var(--fundo-card);
  border: var(--borda-padrao);
  border-radius: 4px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--texto-suave);
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
  color: var(--texto-principal);
}
.event-item {
  border: var(--borda-padrao);
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  background-color: var(--fundo-card);
  cursor: pointer;
}
.event-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.event-info strong {
  font-size: 0.95rem;
  color: var(--texto-principal);
}
.event-date {
  font-size: 0.75rem;
  color: var(--texto-suave);
}
.event-attendees {
  font-size: 0.75rem;
  color: var(--texto-suave);
  text-decoration: underline;
}
.status-badge {
  width: 2vw;
  height: 2vw;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1vw;
}
.status-badge.confirmed {
  background-color: var(--fundo-card);
  color: #fff;
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
