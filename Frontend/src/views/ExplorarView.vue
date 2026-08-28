<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import userBlackFull from '@/icons/userBlackFull.svg'

const toast = useToast()

const searchQuery = ref('')
const comunidadeSelecionada = ref(null)
const listaDeTodasAsComunidades = ref([])

function abrirDetalhesComunidade(comunidade) {
  comunidadeSelecionada.value = comunidade
  console.log(`Abrindo dados da comunidade: ${comunidade.id_comunidade}`)
}

function fecharDetalhesComunidade() {
  comunidadeSelecionada.value = null
}
const comunidadesFiltradas = computed(() => {
  let resultado = [...listaDeTodasAsComunidades.value]
  if (searchQuery.value.trim()) {
    const termo = searchQuery.value.toLowerCase().trim()
    resultado = resultado.filter(c =>
      c.nome_comunidade?.toLowerCase().includes(termo) ||
      c.descricao?.toLowerCase().includes(termo)
    )
  }
  return resultado
})
const comunidadesFavoritas = computed(() => {
  return comunidadesFiltradas.value.slice(0, 4)
})

const gruposInternosDaComunidade = ref(['Grupo 1'])

async function buscarComunidadesDoBanco() {
  const meuId = localStorage.getItem('ifchat_user_id') || ''
  try {
    const r = await fetch(`${import.meta.env.VITE_API_URL}/api/criar/comunidades/listar?meuId=${meuId}`)
    if (r.ok) {
      listaDeTodasAsComunidades.value = await r.json()
    }
  } catch (e) {
    console.error("Erro ao listar canais de comunidades no MySQL:", e)
  }
}
async function alternarCurtidaComunidade(grupo) {
  const meuId = localStorage.getItem('ifchat_user_id') || ''

  if (!meuId) {
    toast.warning("Você precisa estar logado para favoritar!");
    return;
  }

  try {
    const r = await fetch(`${import.meta.env.VITE_API_URL}/api/criar/comunidades/curtir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idUsuario: meuId, idComunidade: grupo.id_comunidade })
    })

    if (r.ok) {
      const dados = await r.json()
      grupo.favoritadoPorMim = dados.favoritado
      toast.success(dados.favoritado ? "Comunidade favoritada!" : "Removida dos favoritos.")
    }
  } catch (e) {
    console.error("Erro ao favoritar comunidade:", e)
  }
}
onMounted(() => {
  buscarComunidadesDoBanco()
})
</script>

<template>
  <main>
    <div v-if="!comunidadeSelecionada" class="explore-card">
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
              v-for="item in comunidadesFavoritas"
              :key="item.id_comunidade"
              class="community-card"
              @click="abrirDetalhesComunidade(item)"
            >
              <div class="card-banner">
                <img
                  :src="item.banner_url || ''"
                  :alt="item.nome_comunidade"
                  style="background-color: #a3ff99;"
                />
              </div>
              <div class="card-info">
                <strong>{{ item.nome_comunidade }}</strong>
                <span>{{ item.total_membros || 1 }} membros</span>
              </div>
            </div>
          </div>
        </section>
        <section class="community-section">
          <h2>Comunidades</h2>
          <div class="communities-grid">
            <div
              v-for="item in comunidadesFiltradas"
              :key="item.id_comunidade"
              class="community-card"
              @click="abrirDetalhesComunidade(item)"
            >
              <div class="card-banner">
                <img
                  :src="item.banner_url || ''"
                  :alt="item.nome_comunidade"
                  style="background-color: #a3ff99;"
                />
              </div>
              <div class="card-info">
                <strong>{{ item.nome_comunidade }}</strong>
                <span>{{ item.total_membros || 1 }} membros</span>
              </div>
            </div>
          </div>
          <div v-if="comunidadesFiltradas.length === 0" class="aviso-vazio-grade" style="text-align: center; color: #999; padding: 20px;">
            Nenhuma comunidade encontrada com esse termo.
          </div>
        </section>
      </div>
    </div>
    <div v-else class="tela-interna-comunidade-container">
      <div class="barra-voltar-topo">
        <button class="btn-voltar-estilizado" @click="fecharDetalhesComunidade">
          ← Voltar para explorar
        </button>
      </div>
      <div class="scroll-content-interno">
        <div class="moldura-central-comunidade">
          <div class="banner-interno-grupo">
            <img
              :src="comunidadeSelecionada.banner_url || ''"
              alt="Banner da Comunidade"
              style="background-color: #a3ff99;"
            />
          </div>
          <div class="linha-titulo-favorito">
            <h1 class="titulo-nome-comunidade">
              {{ comunidadeSelecionada.nome_comunidade }}
            </h1>
            <button class="btn-coracao-comunidade" @click="alternarCurtidaComunidade(comunidadeSelecionada)">
              <span v-if="comunidadeSelecionada.favoritadoPorMim" style="color: #44cc11;"><img src="" alt=""></span>
              <span v-else style="color: #ccc;"><img src="" alt=""></span>
            </button>
          </div>
          <div class="secao-info-bloco">
            <span class="label-badge-verde">
              Administrador
            </span>
          <div class="card-administrador-mini">
            <img
              v-if="comunidadeSelecionada.foto_admin && comunidadeSelecionada.foto_admin !== ''"
              :src="comunidadeSelecionada.foto_admin"
              alt="Admin"
              style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid #000; object-fit: cover;"
            >
            <img
              v-else
              :src="userBlackFull"
              alt="Admin Padrão"
              style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid #000; object-fit: cover;"
            >
            <span class="username-admin-texto" style="font-size: 13px; font-weight: bold; color: #000; margin-left: 8px;">
              {{ comunidadeSelecionada.nome_admin || 'Nome usuário' }}
            </span>
          </div>
          </div>
          <div class="secao-info-bloco" style="margin-top: 16px;">
            <h3>Grupos</h3>
            <div class="lista-subgrupos-comunidade">
              <div v-for="(subgrupo, index) in gruposInternosDaComunidade" :key="index" class="item-subgrupo-caixa">
                {{ subgrupo }}
              </div>
              <div class="item-subgrupo-caixa" style="border: 1px dashed #aaa; color: #aaa; cursor: not-allowed;">
                + Criar grupo
              </div>
            </div>
          </div>
          <div class="secao-info-bloco" style="margin-top: 20px;">
            <h3>Descrição</h3>
            <div class="caixa-texto-descricao-grupo">
              {{ comunidadeSelecionada.descricao || 'Sem descrição fornecida para esta comunidade.' }}
            </div>
          </div>

        </div>
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
}
.explore-card {
  width: 100%;
  height: 100%;
  background-color: var(--fundo-card);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.search-section {
  padding: 16px;
  border-bottom: var(--borda-padrao);
}
.search-box {
  display: flex;
  align-items: center;
  border: var(--borda-padrao);
  border-radius: 20px;
  padding: 8px 16px;
  background: var(--fundo-card);
  max-width: 500px;
  margin: 0 auto;
}
.search-box input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 0.95rem;
  background-color: var(--fundo-card);
  color: var(--texto-principal);
}
.search-box input::placeholder {
  color: var(--texto-mais-suave);
}
.search-icon {
  font-size: 0.9rem;
  color: var(--texto-principal);
  margin-left: 8px;
  cursor: pointer;
}
.scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.community-section {
  margin-bottom: 32px;
}
.community-section h2 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--texto-principal);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.horizontal-scroll {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 12px;
  scroll-behavior: smooth;
}
.horizontal-scroll::-webkit-scrollbar {
  height: 6px;
}
.horizontal-scroll::-webkit-scrollbar-track {
  background: var(--hover-botoes);
  border-radius: 10px;
}
.horizontal-scroll::-webkit-scrollbar-thumb {
  border-radius: 10px;
}
.communities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}
.community-card {
  border: var(--borda-padrao);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--fundo-card);
  min-width: 160px;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.community-card:hover {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}
.card-banner {
  background-color: var(--fundo-opcao-enquete);
  width: 100%;
  height: 90px;
  border-bottom: var(--borda-padrao);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-banner img,
.card-banner video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.card-info {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.card-info strong {
  font-size: 0.9rem;
  color: var(--texto-principal);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-info span {
  font-size: 0.78rem;
  color: var(--texto-suave);
  font-weight: 500;
}
</style>

