<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import voltar from '@/icons/voltar.svg'
import userBlackFull from '@/icons/userBlackFull.svg'
import favoritarInline from '@/icons/favoritarInline.svg';
import favoritarPreenchido from '@/icons/favoritarPreenchido.svg';

const toast = useToast()

const searchQuery = ref('')
const comunidadeSelecionada = ref(null)
const listaDeTodasAsComunidades = ref([])

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
  return listaDeTodasAsComunidades.value.filter(c => c.favoritadoPorMim)
})

function abrirDetalhesComunidade(comunidade) {
  comunidadeSelecionada.value = comunidade
  console.log(`Abrindo dados da comunidade: ${comunidade.id_comunidade}`)
}

function fecharDetalhesComunidade() {
  comunidadeSelecionada.value = null
}

const gruposInternosDaComunidade = ref(['Grupo 1'])
async function buscarComunidadesDoBanco() {
  const meuId = localStorage.getItem('ifchat_user_id') || ''
  try {
    const r = await fetch(`${import.meta.env.VITE_API_URL}/api/criar/comunidades/listar?meuId=${meuId}`)
    if (r.ok) {
      const dados = await r.json()

      listaDeTodasAsComunidades.value = dados.map(c => ({
        id_comunidade: c.id_comunidade,
        nome_comunidade: c.nome_comunidade,
        descricao: c.descricao,
        banner_url: c.banner_url || null,
        total_membros: c.total_membros || 1,
        favoritadoPorMim: !!c.favoritadoPorMim,
        nome_admin: c.nome_admin || 'Administrador',
        foto_admin: c.foto_admin || null
      }))

      console.log("Comunidades carregadas com sucesso no Front-end:", listaDeTodasAsComunidades.value)
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
      listaDeTodasAsComunidades.value = listaDeTodasAsComunidades.value.map(c => {
        if (c.id_comunidade === grupo.id_comunidade) {
          const novoStatus = !!dados.favoritado

          if (comunidadeSelecionada.value && comunidadeSelecionada.value.id_comunidade === grupo.id_comunidade) {
            comunidadeSelecionada.value.favoritadoPorMim = novoStatus
          }
          return { ...c, favoritadoPorMim: novoStatus }
        }
        return c
      })

      toast.success(dados.favoritado ? "Comunidade favoritada!" : "Removida dos favoritos.")
    }
  } catch (e) {
    console.error("Erro ao alternar curtida da comunidade:", e)
    toast.error("Falha ao se conectar com o servidor.")
  }
}

function obterUrlBanner(urlOriginal) {
  if (!urlOriginal || urlOriginal === 'null' || urlOriginal.trim() === '') return '';

  if (urlOriginal.startsWith('http')) {
    return urlOriginal;
  }

  const urlBase = import.meta.env.VITE_API_URL;
  const urlLimpaSemBarrasDuplas = `${urlBase}/${urlOriginal}`.replace(/([^:]\/)\/+/g, "$1");

  return urlLimpaSemBarrasDuplas;
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
          <input type="text" v-model="searchQuery" placeholder="Procurar comunidade"/>
          <span class="search-icon">🔍︎</span>
        </div>
      </div>
      <div class="scroll-content">
        <section class="community-section">
          <h2>Comunidades favoritas</h2>
          <div v-if="comunidadesFavoritas.length > 0" class="horizontal-scroll">
            <div v-for="item in comunidadesFavoritas" :key="item.id_comunidade" class="community-card" @click="abrirDetalhesComunidade(item)">
              <div class="card-banner">
                <img
                  v-if="item.banner_url"
                  :src="obterUrlBanner(item.banner_url)"
                  :alt="item.nome_comunidade"
                  style="object-fit: cover; width: 100%; height: 100%; display: block;"
                />
              </div>
              <div class="card-info">
                <strong>{{ item.nome_comunidade }}</strong>
                <span>{{ item.total_membros }} membros</span>
              </div>
            </div>
          </div>
          <div v-else class="aviso-comunidade-favorita">
            <span>Nenhuma comunidade favoritada</span>
          </div>
        </section>
        <section class="community-section">
          <h2>Comunidades</h2>
          <div class="communities-grid">
            <div
              v-for="item in comunidadesFiltradas"
              :key="item.id_comunidade"
              class="community-card"
              @click="abrirDetalhesComunidade(item)">
              <div class="card-banner">
                <img
                  v-if="item.banner_url"
                  :src="obterUrlBanner(item.banner_url)"
                  :alt="item.nome_comunidade"
                  style="object-fit: cover; width: 100%; height: 100%; display: block;"
                />
              </div>
              <div class="card-info">
                <strong>{{ item.nome_comunidade }}</strong>
                <span>{{ item.total_membros }} membros</span>
              </div>
            </div>
          </div>
          <div v-if="comunidadesFiltradas.length === 0" class="aviso-vazio-grade" style="text-align: center; color: #999; padding: 4px;">
            Nenhuma comunidade encontrada com esse termo.
          </div>
        </section>
      </div>
    </div>
    <div v-else class="tela-interna-comunidade-container">
      <div class="barra-voltar-topo">
        <button class="btn-voltar-estilizado" @click="fecharDetalhesComunidade">
          <img :src="voltar" alt="" class="voltar-img">
        </button>
      </div>
      <div class="scroll-content-interno">
        <div class="moldura-central-comunidade">
          <div class="banner-interno-grupo">
            <img
              v-if="comunidadeSelecionada.banner_url"
              :src="obterUrlBanner(comunidadeSelecionada.banner_url)"
              alt="Banner da Comunidade"
              style="object-fit: cover; width: 100%; height: 100%; display: block;"
            />
          </div>
          <div class="linha-titulo-favorito">
            <h1 class="titulo-nome-comunidade">
              {{ comunidadeSelecionada.nome_comunidade }}
            </h1>
            <button class="btn-coracao-comunidade" @click="alternarCurtidaComunidade(comunidadeSelecionada)">
              <span v-if="comunidadeSelecionada.favoritadoPorMim" style="font-size: 24px; cursor: pointer;"><img :src="favoritarPreenchido" alt="" class="favoritarPerfilDeUsuario"></span>
              <span v-else style="font-size: 24px; cursor: pointer;"><img :src="favoritarInline" alt=""></span>
            </button>
          </div>
          <div class="secao-info-bloco secao-biografia">
            <h3>Sobre a comunidade</h3>
            <p class="caixa-texto-descricao-grupo">
              {{ comunidadeSelecionada.descricao || 'Sem descrição fornecida para esta comunidade.' }}
            </p>
          </div>
          <div class="secao-info-bloco">
            <span class="label-badge-verde">
              Administrador
            </span>
            <div class="card-administrador-mini">
              <div style="border-radius: 50%; object-fit: cover; display: flex; width: 3vw; height: 3vw; align-items: center;justify-content: center; flex-shrink: 0; overflow: hidden;">
                <img v-if="comunidadeSelecionada.foto_admin" :src="obterUrlBanner(comunidadeSelecionada.foto_admin)" alt="Avatar do Administrador" style="width: 3vw; height: 3vw;"/>
              <img
                v-else
                :src="userBlackFull"
                alt="Admin Padrão"
                style="width: 4vw; height: 4vw;"
              >
              </div>
              <span class="username-admin-texto" style="font-size: 13px; font-weight: bold; color: #000; margin-left: 8px;">
                {{ comunidadeSelecionada.nome_admin || 'Administrador' }}
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
  margin-left: 14vw;
  width: calc(100% - 14vw);
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
.aviso-comunidade-favorita {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: center;
  margin: 4vw auto;
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
[data-theme="dark"] .voltar-img {
  filter: invert(1);
  transition: filter 0.3s ease;
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
[data-theme="dark"] .favoritarPerfilDeUsuario {
  filter: hue-rotate(135deg) saturate(1.8) brightness(1.1);
  transition: filter 0.3s ease;
}
.card-info span {
  font-size: 0.78rem;
  color: var(--texto-suave);
  font-weight: 500;
}
.tela-interna-comunidade-container {
  width: 100%;
  height: 100%;
  background-color: var(--fundo-card);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow-y: auto;
}
.barra-voltar-topo {
  padding: 12px 16px;
  border-bottom: var(--borda-padrao);
}
.btn-voltar-estilizado {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.3vw;
  border-radius: 7px;
  border: var(--borda-padrao);
  transition: 0.3s;
}
.btn-voltar-estilizado:hover {
  transition: 0.3s;
  transform: scale(1.03);
}
.scroll-content-interno {
  flex: 1;
  overflow-y: auto;
}
.moldura-central-comunidade {
  max-width: 700px;
  margin: 0 auto;
  padding-bottom: 32px;
}
.banner-interno-grupo {
  width: 100%;
  height: 18vw;
  background-color: var(--fundo-opcao-enquete);
  overflow: hidden;
  border-bottom: var(--borda-padrao);
}
.linha-titulo-favorito {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 0 20px;
}
.linha-titulo-favorito span {
  display: flex;
  align-items: center;
}
.titulo-nome-comunidade {
  font-size: 1.4rem;
  word-break: break-all;
  text-overflow: ellipsis;
  overflow: hidden;
  margin: 0;
  color: var(--texto-principal);
}
.btn-coracao-comunidade:hover {
  transform: scale(1.08);
  transition: 0.3s;
}
.btn-coracao-comunidade {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: 0.3s;
}
.btn-coracao-comunidade:active {
  transform: scale(0.92);
  transition: 0.3s;
}
.btn-coracao-comunidade img {
  width: 2vw;
  height: 2vw;
}
.secao-info-bloco {
  padding: 16px 20px 0 20px;
}
.secao-info-bloco h3 {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  color: var(--texto-principal);
}
.secao-biografia {
  border-bottom: var(--borda-padrao);
  padding-bottom: 16px;
  margin-bottom: 4px;
}
.label-badge-verde {
  display: inline-block;
  background-color: var(--fundo-opcao-enquete);
  color: var(--fundo-card-va);
  font-size: 0.75rem;
  font-weight: bold;
  padding: 3px 10px;
  border-radius: 12px;
  margin-bottom: 8px;
}
.card-administrador-mini {
  display: flex;
  align-items: center;
  margin-top: 6px;
  gap: 0.3vw;
}
.caixa-texto-descricao-grupo {
  background-color: var(--fundo-opcao-enquete);
  border: var(--borda-padrao);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 0.9rem;
  color: var(--texto-suave);
  margin: 0;
  line-height: 1.4;
}
.lista-subgrupos-comunidade {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.item-subgrupo-caixa {
  border: var(--borda-padrao);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.9rem;
  color: var(--texto-principal);
  background-color: var(--fundo-card);
}
</style>
