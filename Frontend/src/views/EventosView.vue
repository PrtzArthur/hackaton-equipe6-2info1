<script setup>
import { ref, reactive, computed } from 'vue'
const usuarioAtual = ref({
  id: 'u0',
  nome: 'Você'
})


const searchQuery = ref('')
const categoriaFiltro = ref('Todas')
const abaAtiva = ref('todos') 

const eventoSelecionado = ref(null)
const mostrarFormulario = ref(false)
const modoEdicao = ref(false)
const erroFormulario = ref('')

const categorias = ['Acadêmico', 'Esportivo', 'Cultural', 'Palestra', 'Workshop', 'Social', 'Outro']

const favoritos = ref([]) 

const eventos = ref([])


const formVazio = () => ({
  id: null,
  titulo: '',
  descricao: '',
  categoria: categorias[0],
  dataInicio: '',
  horaInicio: '',
  dataFim: '',
  horaFim: '',
  sala: '',
  bloco: '',
  limiteParticipantes: '',
  tagsInput: ''
})

const formEvento = reactive(formVazio())

const participandoDoEvento = (evento) =>
  evento.participantes.some((p) => p.id === usuarioAtual.value.id)

const naListaDeEspera = (evento) =>
  evento.listaEspera.some((p) => p.id === usuarioAtual.value.id)

const isCriador = (evento) => evento.criador.id === usuarioAtual.value.id

const vagasRestantes = (evento) =>
  evento.limiteParticipantes ? evento.limiteParticipantes - evento.participantes.length : null

const estaLotado = (evento) => {
  const vagas = vagasRestantes(evento)
  return vagas !== null && vagas <= 0
}

const estaSalvo = (evento) => favoritos.value.includes(evento.id)

const formatarData = (iso) => {
  if (!iso) return ''
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

const formatarPeriodo = (evento) => {
  const inicio = `${formatarData(evento.dataInicio)} ${evento.horaInicio}`
  if (evento.dataFim && evento.dataFim !== evento.dataInicio) {
    return `${inicio} até ${formatarData(evento.dataFim)} ${evento.horaFim || ''}`.trim()
  }
  if (evento.horaFim) {
    return `${inicio} - ${evento.horaFim}`
  }
  return inicio
}

const diasParaEvento = (evento) => {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dataEvento = new Date(`${evento.dataInicio}T00:00:00`)
  const diffMs = dataEvento - hoje
  const dias = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (dias < 0) return 'Evento encerrado'
  if (dias === 0) return 'É hoje!'
  if (dias === 1) return 'Amanhã'
  return `Faltam ${dias} dias`
}


const eventosFiltrados = computed(() => {
  const termo = searchQuery.value.trim().toLowerCase()

  return eventos.value.filter((evento) => {
    const bateBusca =
      !termo ||
      evento.titulo.toLowerCase().includes(termo) ||
      evento.descricao.toLowerCase().includes(termo) ||
      evento.tags.some((t) => t.toLowerCase().includes(termo)) ||
      evento.local.sala.toLowerCase().includes(termo)

    const bateCategoria = categoriaFiltro.value === 'Todas' || evento.categoria === categoriaFiltro.value

    let bateAba = true
    if (abaAtiva.value === 'meus') bateAba = isCriador(evento)
    else if (abaAtiva.value === 'participando') bateAba = participandoDoEvento(evento)
    else if (abaAtiva.value === 'salvos') bateAba = estaSalvo(evento)

    return bateBusca && bateCategoria && bateAba
  })
})

const meusEventosFiltrados = computed(() =>
  eventosFiltrados.value.filter((e) => isCriador(e) || participandoDoEvento(e))
)

const eventosDisponiveisFiltrados = computed(() =>
  eventosFiltrados.value.filter((e) => !isCriador(e) && !participandoDoEvento(e))
)



const participar = (evento) => {
  if (participandoDoEvento(evento)) return

  if (estaLotado(evento)) {
    entrarListaEspera(evento)
    return
  }

  evento.participantes.push({ ...usuarioAtual.value })
}

const sairDoEvento = (evento) => {
  evento.participantes = evento.participantes.filter((p) => p.id !== usuarioAtual.value.id)

  if (evento.listaEspera.length > 0) {
    const proximo = evento.listaEspera.shift()
    evento.participantes.push(proximo)
  }
}

const entrarListaEspera = (evento) => {
  if (naListaDeEspera(evento)) return
  evento.listaEspera.push({ ...usuarioAtual.value })
}

const sairDaListaEspera = (evento) => {
  evento.listaEspera = evento.listaEspera.filter((p) => p.id !== usuarioAtual.value.id)
}

const toggleFavorito = (evento) => {
  if (estaSalvo(evento)) {
    favoritos.value = favoritos.value.filter((id) => id !== evento.id)
  } else {
    favoritos.value.push(evento.id)
  }
}


const abrirDetalhes = (evento) => {
  eventoSelecionado.value = evento
  mostrarFormulario.value = false
}

const voltarParaLista = () => {
  eventoSelecionado.value = null
  mostrarFormulario.value = false
  erroFormulario.value = ''
}

const abrirFormularioCriacao = () => {
  Object.assign(formEvento, formVazio())
  modoEdicao.value = false
  erroFormulario.value = ''
  mostrarFormulario.value = true
  eventoSelecionado.value = null
}

const abrirFormularioEdicao = (evento) => {
  Object.assign(formEvento, {
    id: evento.id,
    titulo: evento.titulo,
    descricao: evento.descricao,
    categoria: evento.categoria,
    dataInicio: evento.dataInicio,
    horaInicio: evento.horaInicio,
    dataFim: evento.dataFim,
    horaFim: evento.horaFim,
    sala: evento.local.sala,
    bloco: evento.local.bloco,
    limiteParticipantes: evento.limiteParticipantes ?? '',
    tagsInput: evento.tags.join(', ')
  })
  modoEdicao.value = true
  erroFormulario.value = ''
  mostrarFormulario.value = true
  eventoSelecionado.value = null
}


const parseTags = (texto) =>
  texto
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith('#') ? t : `#${t}`))

const salvarEvento = () => {
  if (!formEvento.titulo || !formEvento.dataInicio || !formEvento.horaInicio || !formEvento.sala) {
    erroFormulario.value = 'Preencha ao menos título, data, horário e local.'
    return
  }

  const tags = parseTags(formEvento.tagsInput)
  const limite = formEvento.limiteParticipantes ? Number(formEvento.limiteParticipantes) : null

  if (modoEdicao.value) {
    const evento = eventos.value.find((e) => e.id === formEvento.id)
    Object.assign(evento, {
      titulo: formEvento.titulo,
      descricao: formEvento.descricao,
      categoria: formEvento.categoria,
      dataInicio: formEvento.dataInicio,
      horaInicio: formEvento.horaInicio,
      dataFim: formEvento.dataFim,
      horaFim: formEvento.horaFim,
      local: { sala: formEvento.sala, bloco: formEvento.bloco },
      limiteParticipantes: limite,
      tags
    })
    eventoSelecionado.value = evento
  } else {
    const novoEvento = {
      id: Date.now(),
      titulo: formEvento.titulo,
      descricao: formEvento.descricao,
      categoria: formEvento.categoria,
      dataInicio: formEvento.dataInicio,
      horaInicio: formEvento.horaInicio,
      dataFim: formEvento.dataFim,
      horaFim: formEvento.horaFim,
      local: { sala: formEvento.sala, bloco: formEvento.bloco },
      limiteParticipantes: limite,
      criador: { ...usuarioAtual.value },
      participantes: [{ ...usuarioAtual.value }], 
      listaEspera: [],
      tags
    }
    eventos.value.unshift(novoEvento)
    eventoSelecionado.value = novoEvento
  }

  mostrarFormulario.value = false
}

const excluirEvento = (evento) => {
  if (!confirm(`Excluir o evento "${evento.titulo}"? Essa ação não pode ser desfeita.`)) return
  eventos.value = eventos.value.filter((e) => e.id !== evento.id)
  eventoSelecionado.value = null
}

const cancelarFormulario = () => {
  mostrarFormulario.value = false
  erroFormulario.value = ''
}
</script>

<template>
  <main>

    <div v-if="!eventoSelecionado && !mostrarFormulario" class="events-card">

      <header class="events-header">
        <h1 class="eventos-titulo">Eventos</h1>
      </header>

      <div class="scroll-content">

        <div class="search-box">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Procurar evento, tag ou local"
          />
          <span class="search-icon">🔍︎</span>
        </div>

        <div class="filtros-row">
          <select v-model="categoriaFiltro" class="categoria-select">
            <option value="Todas">Todas as categorias</option>
            <option v-for="cat in categorias" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div class="abas-row">
          <button :class="['aba-btn', abaAtiva === 'todos' && 'ativa']" @click="abaAtiva = 'todos'">Todos</button>
          <button :class="['aba-btn', abaAtiva === 'meus' && 'ativa']" @click="abaAtiva = 'meus'">Criados por mim</button>
          <button :class="['aba-btn', abaAtiva === 'participando' && 'ativa']" @click="abaAtiva = 'participando'">Participando</button>
          <button :class="['aba-btn', abaAtiva === 'salvos' && 'ativa']" @click="abaAtiva = 'salvos'">⭐ Salvos</button>
        </div>

        <button class="add-event-btn" @click="abrirFormularioCriacao">
          <span class="plus-icon">+</span>
          <span>Novo evento</span>
        </button>

        <section class="events-section">
          <h2>Meus eventos</h2>

          <div
            v-for="evento in meusEventosFiltrados"
            :key="evento.id"
            class="event-item"
            @click="abrirDetalhes(evento)"
          >
            <div class="event-info">
              <strong>{{ evento.titulo }}</strong>
              <span class="event-date">{{ formatarPeriodo(evento) }} · {{ evento.local.sala }}</span>
              <span class="event-attendees">
                {{ evento.participantes.length }}<template v-if="evento.limiteParticipantes">/{{ evento.limiteParticipantes }}</template> participante(s)
              </span>
            </div>
            <div class="event-item-right">
              <span v-if="isCriador(evento)" class="organizador-badge" title="Você organiza este evento"></span>
              <div
                :class="['status-badge', estaLotado(evento) ? 'lotado' : (participandoDoEvento(evento) ? 'confirmed' : 'pending')]"
              >
                {{ estaLotado(evento) ? '🔒' : (participandoDoEvento(evento) ? '✔' : vagasRestantes(evento) ?? '∞') }}
              </div>
            </div>
          </div>

          <p v-if="meusEventosFiltrados.length === 0" class="no-results">
            Nenhum evento por aqui ainda.
          </p>
        </section>

        <hr class="divider" />

        <section class="events-section">
          <h2>Eventos disponíveis</h2>

          <div
            v-for="evento in eventosDisponiveisFiltrados"
            :key="evento.id"
            class="event-item"
            @click="abrirDetalhes(evento)"
          >
            <div class="event-info">
              <strong>{{ evento.titulo }}</strong>
              <span class="event-date">{{ formatarPeriodo(evento) }} · {{ evento.local.sala }}</span>
              <span class="event-attendees">
                {{ evento.participantes.length }}<template v-if="evento.limiteParticipantes">/{{ evento.limiteParticipantes }}</template> participante(s)
              </span>
            </div>
            <div
              :class="['status-badge', estaLotado(evento) ? 'lotado' : 'pending']"
            >
              {{ estaLotado(evento) ? '🔒' : (vagasRestantes(evento) ?? '∞') }}
            </div>
          </div>

          <p v-if="eventosDisponiveisFiltrados.length === 0" class="no-results">
            Nenhum evento disponível encontrado.
          </p>
        </section>

      </div>
    </div>

    <div v-else-if="eventoSelecionado" class="events-card">

      <header class="events-header detail-header">
        <button class="back-btn" @click="voltarParaLista">←</button>
        <h1>{{ eventoSelecionado.titulo }}</h1>
        <button class="favorito-btn" @click="toggleFavorito(eventoSelecionado)">
          {{ estaSalvo(eventoSelecionado) ? '⭐' : '☆' }}
        </button>
      </header>

      <div class="scroll-content">

        <div class="event-detail-meta">
          <span class="categoria-pill">{{ eventoSelecionado.categoria }}</span>
          <span class="event-date"> {{ formatarPeriodo(eventoSelecionado) }}</span>
          <span class="event-date"> {{ eventoSelecionado.local.sala }} · {{ eventoSelecionado.local.bloco }}</span>
          <span class="event-countdown">{{ diasParaEvento(eventoSelecionado) }}</span>
        </div>

        <section class="events-section">
          <h2>Organizador</h2>
          <div class="pessoa-linha">
            <span class="avatar-circle">{{ eventoSelecionado.criador.avatar }}</span>
            <span>{{ eventoSelecionado.criador.nome }}</span>
            <span v-if="isCriador(eventoSelecionado)" class="voce-tag">(você)</span>
          </div>
        </section>

        <section class="events-section">
          <h2>Descrição</h2>
          <p class="descricao-texto" v-if="!isCriador(eventoSelecionado)">
            {{ eventoSelecionado.descricao || 'Sem descrição.' }}
          </p>
          <textarea
            v-else
            v-model="eventoSelecionado.descricao"
            class="description-input"
            placeholder="Adicione uma descrição..."
          ></textarea>
        </section>

        <section class="events-section">
          <h2>
            Participantes
            <span class="contador-vagas">
              ({{ eventoSelecionado.participantes.length }}<template v-if="eventoSelecionado.limiteParticipantes">/{{ eventoSelecionado.limiteParticipantes }}</template>)
            </span>
          </h2>
          <div class="participantes-lista">
            <div v-for="p in eventoSelecionado.participantes" :key="p.id" class="pessoa-linha">
              <span class="avatar-circle">{{ p.avatar }}</span>
              <span>{{ p.nome }}</span>
              <span v-if="p.id === eventoSelecionado.criador.id" class="organizador-badge" title="Organizador"></span>
            </div>
            <p v-if="eventoSelecionado.participantes.length === 0" class="no-results">
              Ninguém confirmou presença ainda. Seja o primeiro!
            </p>
          </div>

          <div v-if="eventoSelecionado.listaEspera.length > 0" class="lista-espera-box">
            <h3>Lista de espera ({{ eventoSelecionado.listaEspera.length }})</h3>
            <div v-for="p in eventoSelecionado.listaEspera" :key="p.id" class="pessoa-linha">
              <span class="avatar-circle">{{ p.avatar }}</span>
              <span>{{ p.nome }}</span>
            </div>
          </div>
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
            <span v-if="eventoSelecionado.tags.length === 0" class="no-results">Sem tags.</span>
          </div>
        </section>

        <!-- Ações -->
        <section class="events-section acoes-section">
          <template v-if="isCriador(eventoSelecionado)">
            <button class="primary-btn" @click="abrirFormularioEdicao(eventoSelecionado)">Editar evento</button>
            <button class="danger-btn" @click="excluirEvento(eventoSelecionado)">Excluir evento</button>
          </template>
          <template v-else>
            <button
              v-if="participandoDoEvento(eventoSelecionado)"
              class="danger-btn"
              @click="sairDoEvento(eventoSelecionado)"
            >
              Cancelar participação
            </button>
            <button
              v-else-if="naListaDeEspera(eventoSelecionado)"
              class="danger-btn"
              @click="sairDaListaEspera(eventoSelecionado)"
            >
              Sair da lista de espera
            </button>
            <button
              v-else-if="estaLotado(eventoSelecionado)"
              class="primary-btn espera-btn"
              @click="entrarListaEspera(eventoSelecionado)"
            >
              Evento lotado · Entrar na lista de espera
            </button>
            <button v-else class="primary-btn" @click="participar(eventoSelecionado)">
              Participar do evento
            </button>
          </template>
        </section>

      </div>
    </div>

    <div v-else class="events-card">

      <header class="events-header detail-header">
        <button class="back-btn" @click="cancelarFormulario">←</button>
        <h1>{{ modoEdicao ? 'Editar evento' : 'Novo evento' }}</h1>
      </header>

      <div class="scroll-content">

        <p v-if="erroFormulario" class="erro-form">{{ erroFormulario }}</p>

        <section class="events-section">
          <h2>Título</h2>
          <input type="text" v-model="formEvento.titulo" class="form-input" placeholder="Ex: Campeonato de Futsal" />
        </section>

        <section class="events-section">
          <h2>Descrição</h2>
          <textarea v-model="formEvento.descricao" class="description-input" placeholder="Conte do que se trata o evento..."></textarea>
        </section>

        <section class="events-section">
          <h2>Categoria</h2>
          <select v-model="formEvento.categoria" class="categoria-select full">
            <option v-for="cat in categorias" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </section>

        <section class="events-section">
          <h2>Data e horário</h2>
          <div class="campos-duplos">
            <label class="campo-label">
              Início
              <input type="date" v-model="formEvento.dataInicio" class="form-input" />
              <input type="time" v-model="formEvento.horaInicio" class="form-input" />
            </label>
            <label class="campo-label">
              Fim (opcional)
              <input type="date" v-model="formEvento.dataFim" class="form-input" />
              <input type="time" v-model="formEvento.horaFim" class="form-input" />
            </label>
          </div>
        </section>

        <section class="events-section">
          <h2>Local</h2>
          <div class="campos-duplos">
            <label class="campo-label">
              Sala / Espaço
              <input type="text" v-model="formEvento.sala" class="form-input" placeholder="Ex: Laboratório 3" />
            </label>
            <label class="campo-label">
              Bloco
              <input type="text" v-model="formEvento.bloco" class="form-input" placeholder="Ex: Bloco B" />
            </label>
          </div>
        </section>

        <section class="events-section">
          <h2>Limite de participantes</h2>
          <input
            type="number"
            min="1"
            v-model="formEvento.limiteParticipantes"
            class="form-input"
            placeholder="Deixe em branco para ilimitado"
          />
        </section>

        <section class="events-section">
          <h2>Tags</h2>
          <input
            type="text"
            v-model="formEvento.tagsInput"
            class="form-input"
            placeholder="Separe por vírgula, ex: esporte, soulFC"
          />
        </section>

        <section class="events-section acoes-section">
          <button class="primary-btn" @click="salvarEvento">
            {{ modoEdicao ? 'Salvar alterações' : 'Criar evento' }}
          </button>
          <button class="danger-btn" @click="cancelarFormulario">Cancelar</button>
        </section>

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
.events-card {
  width: 100%;
  max-width: 480px;
  height: 80vh;
  background-color: var(--fundo-card);
  border: var(--borda-padrao);
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
  border-bottom: var(--borda-padrao);
}

.events-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
  flex: 1;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn,
.favorito-btn {
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

.filtros-row {
  display: flex;
  gap: 8px;
}

.categoria-select {
  flex: 1;
  border: var(--borda-padrao);
  border-radius: 20px;
  padding: 8px 12px;
  font-size: 0.85rem;
  background: #ffffff;
  color: #000000;
}

.categoria-select.full {
  width: 100%;
}

.abas-row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.aba-btn {
  border: 1px solid #cccccc;
  background: #ffffff;
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 0.75rem;
  color: #555555;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.aba-btn.ativa {
  background-color: #28a745;
  border-color: #28a745;
  color: #ffffff;
  font-weight: bold;
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
  display: flex;
  align-items: center;
  gap: 6px;
}

.contador-vagas {
  font-size: 0.8rem;
  font-weight: normal;
  color: #888888;
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

.event-item-right {
  display: flex;
  align-items: center;
  gap: 8px;
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
}

.status-badge {
  min-width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  padding: 0 4px;
}

.status-badge.confirmed {
  background-color: #28a745;
  color: #ffffff;
}

.status-badge.pending {
  border: 1px solid #666666;
  color: #666666;
}

.status-badge.lotado {
  background-color: #cc3d3d;
  color: #ffffff;
}

.organizador-badge {
  font-size: 0.9rem;
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
  gap: 4px;
}

.event-countdown {
  font-size: 0.75rem;
  color: #28a745;
  font-weight: bold;
}

.categoria-pill {
  align-self: flex-start;
  background-color: #eef7ee;
  color: #28a745;
  border: 1px solid #28a745;
  border-radius: 20px;
  padding: 3px 12px;
  font-size: 0.75rem;
  font-weight: bold;
}

.pessoa-linha {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 0.9rem;
  color: #000000;
}

.avatar-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #eef1f4;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
}

.voce-tag {
  font-size: 0.75rem;
  color: #888888;
}

.descricao-texto {
  font-size: 0.9rem;
  color: #333333;
  margin: 0;
  line-height: 1.4;
}

.description-input {
  width: 100%;
  height: 100px;
  border: var(--borda-padrao);
  border-radius: 6px;
  padding: 10px;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 0.9rem;
  resize: none;
  outline: none;
}

.participantes-lista {
  display: flex;
  flex-direction: column;
}

.lista-espera-box {
  margin-top: 10px;
  border-top: 1px dashed #cccccc;
  padding-top: 8px;
}

.lista-espera-box h3 {
  font-size: 0.85rem;
  color: #cc7a00;
  margin: 0 0 4px 0;
}

.tags-wrapper {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-pill {
  border: var(--borda-padrao);
  border-radius: 20px;
  padding: 4px 16px;
  font-size: 0.8rem;
  font-weight: bold;
}

.acoes-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.primary-btn {
  background-color: #28a745;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
}

.espera-btn {
  background-color: #cc7a00;
}

.danger-btn {
  background-color: #ffffff;
  color: #cc3d3d;
  border: 1px solid #cc3d3d;
  border-radius: 6px;
  padding: 12px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
}

.form-input {
  width: 100%;
  border: var(--borda-padrao);
  border-radius: 6px;
  padding: 10px;
  font-size: 0.9rem;
  box-sizing: border-box;
  font-family: inherit;
  outline: none;
  margin-bottom: 6px;
}

.campos-duplos {
  display: flex;
  gap: 12px;
}

.campo-label {
  flex: 1;
  display: flex;
  flex-direction: column;
  font-size: 0.75rem;
  color: #666666;
  gap: 4px;
}

.erro-form {
  background-color: #fdecec;
  color: #cc3d3d;
  border: 1px solid #cc3d3d;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.85rem;
  margin: 0;
}
</style>