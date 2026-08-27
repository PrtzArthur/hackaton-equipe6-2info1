<template>
  <div class="refeitorio-page">
    <nav class="sidebar">
      <div class="brand">IF</div>
      <div class="navitem"><SvgHome />Home</div>
      <div class="navitem"><SvgSave />Salvar</div>
      <div class="navitem"><SvgChat />Chat</div>
      <div class="navitem"><SvgExplore />Explorar</div>
      <div class="navitem"><SvgEvents />Eventos</div>
      <div class="navitem active"><SvgTray />Refeitório</div>
      <div class="navitem"><SvgCreate />Criar</div>
      <div class="navitem"><SvgProfile />Perfil</div>
      <div class="navitem"><SvgBell />Avisos</div>
    </nav>

    <main>
      <h1 class="title">Mãos Peruanas</h1>
      <p class="subtitle">Refeitório · IFC Araquari · Almoço 11h – 13h30</p>

      <section>
        <div class="section-head">
          <h2>Fila agora</h2>
          <span class="hint">{{ clockNow }}</span>
        </div>
        <div class="queue-card">
          <div class="queue-bar-wrap">
            <div class="queue-label-row">
              <span class="label">{{ currentStatus.label }}</span>
              <span class="wait">{{ currentStatus.wait }}</span>
            </div>
            <div class="queue-track">
              <div class="queue-fill" :style="{ width: currentStatus.percent + '%' }"></div>
            </div>
          </div>
          <div class="queue-info">
            <div class="updated"><span class="dot"></span>Atualizado há {{ minutesSinceUpdate }} min por um usuário</div>
            <p>O fluxo costuma aumentar entre 11h15 e 12h00.</p>
            <div class="legend">
              <div class="item"><span class="sw vazio"></span>Vazio · até 5 min</div>
              <div class="item"><span class="sw medio"></span>Médio · 5–15 min</div>
              <div class="item"><span class="sw cheio"></span>Cheio · 15+ min</div>
            </div>
            <div class="hourbars">
              <div v-for="(h, i) in hourHistory" :key="h.label" class="hourbar-col">
                <div
                  class="bar"
                  :class="{ now: i === currentHourIndex }"
                  :style="{ height: h.level + '%', background: barColor(h.level) }"
                ></div>
                <div class="lbl">{{ h.label }}</div>
              </div>
            </div>

            <div class="quick-report">
              <span class="hint">Reportar fila:</span>
              <button v-for="key in ['vazio','medio','cheio']" :key="key"
                      class="chip" :class="{ active: statusKey === key }"
                      @click="statusKey = key">
                {{ statuses[key].label }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div class="section-head">
          <h2>Cardápio da semana</h2>
          <span class="hint">18 – 22 de agosto</span>
        </div>
        <div class="day-tabs">
          <div
            v-for="day in Object.keys(menu)"
            :key="day"
            class="day-tab"
            :class="{ active: activeDay === day }"
            @click="activeDay = day"
          >{{ day }}</div>
        </div>

        <div class="menu-card">
          <div class="admin-badge"><span class="av"></span>Cardápio por {{ activeMenu.editor }} · atualizado há {{ activeMenu.updated }}</div>
          <h3>{{ activeMenu.dish }}</h3>
          <div class="date">{{ activeMenu.date }} · Almoço</div>

          <div class="dish-row">
            <span class="dish-tag">Principal</span>
            <div class="dish-info"><b>{{ activeMenu.dish }}</b><span>{{ activeMenu.desc }}</span></div>
          </div>
          <div class="dish-row">
            <span class="dish-tag">Acompanha</span>
            <div class="dish-info"><b>{{ activeMenu.side }}</b><span>Calorias estimadas: {{ activeMenu.kcal }}</span></div>
          </div>
          <div class="dish-row">
            <span class="dish-tag">Opção veg</span>
            <div class="dish-info">
              <b>{{ activeMenu.veg }} <span class="veg-pill">🌱 vegetariano</span></b>
              <span>Disponível mediante solicitação no balcão.</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div class="section-head">
          <h2>Avaliações</h2>
          <button class="btn-primary" @click="showModal = true">★ Avaliar comida</button>
        </div>

        <div class="rating-summary">
          <div>
            <div class="rating-big">{{ averageRating.toFixed(1) }}</div>
            <div class="stars">{{ starString(Math.round(averageRating)) }}</div>
            <div class="count">{{ reviews.length }} avaliações</div>
          </div>
          <div class="bars-mini">
            <div v-for="n in [5,4,3,2,1]" :key="n" class="bar-row">
              {{ n }}
              <div class="track"><div class="fill" :style="{ width: ratingPercent(n) + '%' }"></div></div>
              {{ ratingPercent(n) }}%
            </div>
          </div>
        </div>

        <div class="empty-reviews" v-if="!reviews.length">
          Nenhuma avaliação ainda. Seja o primeiro a avaliar o almoço de hoje!
        </div>

        <div class="review" v-for="r in reviews" :key="r.id">
          <div class="review-head">
            <div class="avatar">{{ r.initials }}</div>
            <div class="who-when"><div class="who">{{ r.name }}</div><div class="when">{{ r.when }}</div></div>
            <button class="delete-btn" title="Apagar avaliação" @click="deleteReview(r.id)">🗑</button>
          </div>
          <div class="review-stars">{{ starString(r.stars) }}</div>
          <p>{{ r.text }}</p>
          <div class="review-photos" v-if="r.photos && r.photos.length">
            <img class="ph" v-for="(p, idx) in r.photos" :key="idx" :src="p" />
          </div>
        </div>
      </section>
    </main>

    <div class="overlay" :class="{ open: showModal }" @click.self="closeModal">
      <div class="modal">
        <h3>Avaliar o almoço de hoje</h3>
        <div class="sub">Mãos Peruanas · {{ activeDay === 'Seg' ? 'segunda-feira' : activeMenu.dish }}</div>

        <div class="star-picker">
          <span
            v-for="n in 5" :key="n"
            :class="{ on: n <= newReview.stars }"
            @click="newReview.stars = n"
          >★</span>
        </div>

        <textarea v-model="newReview.text" placeholder="Como estava a comida hoje?"></textarea>

        <div class="upload-row">
          <label class="upload-btn">
            📷 Adicionar foto
            <input type="file" accept="image/*" multiple hidden @change="onPhotoChange" />
          </label>
          <span class="hint" v-if="newReview.photos.length">{{ newReview.photos.length }} foto(s) selecionada(s)</span>
        </div>
        <div class="preview-photos" v-if="newReview.photos.length">
          <div class="preview-ph" v-for="(p, idx) in newReview.photos" :key="idx">
            <img :src="p" />
            <button class="preview-remove" title="Remover foto" @click="removeNewPhoto(idx)">×</button>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-ghost" @click="closeModal">Cancelar</button>
          <button class="btn-primary" :disabled="!newReview.stars" @click="submitReview">Publicar avaliação</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onUnmounted, h } from 'vue'

const icon = (path) => (props) =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2,
             width: props?.small ? 16 : 19, height: props?.small ? 16 : 19 },
    Array.isArray(path) ? path.map(d => h('path', { d })) : [h('path', { d: path })])

const SvgHome = icon('M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z')
const SvgSave = icon('M6 3h12v18l-6-4-6 4z')
const SvgChat = icon('M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z')
const SvgExplore = icon(['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M21 21l-4.3-4.3'])
const SvgEvents = icon(['M3 4h18v18H3z', 'M16 2v4M8 2v4M3 10h18'])
const SvgTray = icon('M3 2v7a4 4 0 0 0 4 4v9M7 2v6M11 2v6M15 2c-1.5 1.5-1.5 4-1.5 5.5 0 1.8 1.2 3 2.5 3v11.5')
const SvgCreate = icon(['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 8v4l3 3'])
const SvgProfile = icon(['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21c0-4 4-6.5 8-6.5s8 2.5 8 6.5'])
const SvgBell = icon(['M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 0 1-3.4 0'])

const clockNow = ref('')
let clockTimer = null
function tickClock() {
  clockNow.value = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
onMounted(() => {
  tickClock()
  clockTimer = setInterval(tickClock, 30000)
})
onUnmounted(() => clearInterval(clockTimer))

const statuses = {
  vazio: { label: 'Vazio', wait: '~3 min de espera', percent: 18 },
  medio: { label: 'Médio', wait: '~12 min de espera', percent: 55 },
  cheio: { label: 'Cheio', wait: '~22 min de espera', percent: 92 },
}
const statusKey = ref('medio')
const currentStatus = computed(() => statuses[statusKey.value])
const minutesSinceUpdate = ref(2)

const hourHistory = [
  { label: '11h', level: 20 },
  { label: '11h30', level: 55 },
  { label: '12h', level: 90 },
  { label: '12h30', level: 75 },
  { label: '13h', level: 40 },
  { label: '13h30', level: 15 },
]
const currentHourIndex = 2
function barColor(level) {
  const opacity = 0.3 + (level / 100) * 0.7
  return `rgba(47, 151, 96, ${opacity.toFixed(2)})`
}

const menu = reactive({
  Seg: { dish: 'Lomo saltado', desc: 'Tiras de carne bovina salteadas com tomate, cebola roxa e batata frita, servido com arroz.', side: 'Arroz branco · Batata frita', veg: 'Lomo saltado de cogumelos', kcal: '≈ 720 kcal', date: '18/08', editor: 'Coordenação', updated: '1 dia' },
  Ter: { dish: 'Ají de gallina', desc: 'Frango desfiado em creme de ají amarillo, nozes e queijo, servido com arroz e batata cozida.', side: 'Arroz branco · Batata cozida · Azeitona preta', veg: 'Ají de jaca', kcal: '≈ 680 kcal', date: '19/08', editor: 'Coordenação', updated: '2 dias' },
  Qua: { dish: 'Causa limeña', desc: 'Camadas de batata amarela temperada com limão e ají, recheada com frango desfiado e maionese.', side: 'Salada verde · Ovo cozido', veg: 'Causa de grão-de-bico', kcal: '≈ 590 kcal', date: '20/08', editor: 'Coordenação', updated: '2 dias' },
  Qui: { dish: 'Arroz con pollo', desc: 'Arroz temperado com coentro e pimentões, cozido com frango e ervilhas.', side: 'Farofa de milho · Salada', veg: 'Arroz con legumes', kcal: '≈ 640 kcal', date: '21/08', editor: 'Coordenação', updated: '2 dias' },
  Sex: { dish: 'Tallarín saltado', desc: 'Macarrão salteado ao molho de soja com carne, pimentão e cebolinha, estilo chifa peruano.', side: 'Legumes salteados', veg: 'Tallarín saltado de tofu', kcal: '≈ 700 kcal', date: '22/08', editor: 'Coordenação', updated: '2 dias' },
})
const activeDay = ref('Seg')
const activeMenu = computed(() => menu[activeDay.value])

/* ---------------- avaliações ---------------- */
const reviews = reactive([])

const averageRating = computed(() => {
  if (!reviews.length) return 0
  return reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length
})
function ratingPercent(star) {
  if (!reviews.length) return 0
  const count = reviews.filter(r => r.stars === star).length
  return Math.round((count / reviews.length) * 100)
}
function starString(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

/* ---------------- modal de nova avaliação ---------------- */
const showModal = ref(false)
const newReview = reactive({ stars: 0, text: '', photos: [] })

function onPhotoChange(e) {
  const files = Array.from(e.target.files || [])
  newReview.photos.push(...files.map(f => URL.createObjectURL(f)))
  e.target.value = ''
}
function removeNewPhoto(idx) {
  URL.revokeObjectURL(newReview.photos[idx])
  newReview.photos.splice(idx, 1)
}
function closeModal() {
  showModal.value = false
  newReview.photos.forEach(p => URL.revokeObjectURL(p))
  newReview.stars = 0
  newReview.text = ''
  newReview.photos = []
}
function submitReview() {
  if (!newReview.stars) return
  reviews.unshift({
    id: Date.now(),
    name: 'Você',
    initials: 'EU',
    stars: newReview.stars,
    when: 'agora',
    text: newReview.text || '(sem comentário)',
    photos: [...newReview.photos],
  })
  showModal.value = false
  newReview.stars = 0
  newReview.text = ''
  newReview.photos = []
}
function deleteReview(id) {
  const review = reviews.find(r => r.id === id)
  if (review?.photos) review.photos.forEach(p => URL.revokeObjectURL(p))
  const idx = reviews.findIndex(r => r.id === id)
  if (idx !== -1) reviews.splice(idx, 1)
}
</script>

<style scoped>

:root, .refeitorio-page {
  --verde-mata: #3CBC00;
  --verde-vivo: #3CBC00;
  --verde-claro: #E4F1E8;
  --tinta: #211B15;
  --tinta-suave: #766A5C;
  --linha: #E2E2E2;
  --branco: #FFFFFF;
  --fundo: #e1f9dc;
  --sombra: 0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px -12px rgba(0, 0, 0, 0.12);
  --sombra-lg: 0 2px 4px rgba(0, 0, 0, 0.05), 0 20px 40px -16px rgba(0, 0, 0, 0.16);
}

* { box-sizing: border-box; }

.refeitorio-page {
  font-family: 'Manrope', sans-serif;
  background: var(--fundo);
  color: var(--tinta);
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 78px;
  background: var(--branco);
  border-right: 1px solid var(--linha);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 22px 0;
  gap: 4px;
  flex-shrink: 0;
}
.sidebar .brand {
  width: 36px; height: 36px; border-radius: 4px;
  background: var(--verde-mata);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 14px; margin-bottom: 24px;
  font-family: 'Space Grotesk', sans-serif;
}
.navitem {
  width: 54px; padding: 10px 4px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  border-radius: 5px; cursor: pointer; color: var(--tinta-suave);
  font-size: 9.5px; font-weight: 700; text-align: center;
  transition: background 0.15s ease, color 0.15s ease;
}
.navitem.active { background: var(--verde-claro); color: var(--verde-mata); }
.navitem:hover:not(.active) { background: #F2F2F0; }

main { flex: 1; max-width: 900px; margin: 0 auto; padding: 30px 32px 84px; width: 100%; }

h1.title { font-family: 'Space Grotesk', sans-serif; font-size: 33px; font-weight: 600; letter-spacing: -0.6px; margin-top: 4px; }
.subtitle { color: var(--tinta-suave); font-size: 14px; margin-top: 5px; font-weight: 600; }

section { margin-top: 30px; }
.section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 15px; }
.section-head h2 { font-family: 'Space Grotesk', sans-serif; font-size: 19px; font-weight: 600; letter-spacing: -0.2px; }
.section-head .hint { font-size: 12px; color: var(--tinta-suave); font-weight: 700; }

.queue-card {
  background: var(--branco); border: 1px solid var(--linha); border-radius: 6px;
  padding: 26px; display: flex; gap: 30px; align-items: center;
  box-shadow: var(--sombra);
}
.queue-bar-wrap { width: 220px; flex-shrink: 0; }
.queue-label-row { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }
.queue-label-row .label { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 21px; color: var(--verde-mata); letter-spacing: -0.2px; }
.queue-label-row .wait { font-family: 'DM Mono', monospace; font-size: 11.5px; color: var(--tinta-suave); font-weight: 600; }
.queue-track { width: 100%; height: 10px; border-radius: 5px; background: var(--linha); overflow: hidden; }
.queue-fill { height: 100%; background: var(--verde-vivo); border-radius: 5px; transition: width 0.3s ease; }

.queue-info { flex: 1; z-index: 1; min-width: 0; }
.queue-info .updated { font-size: 12px; color: var(--tinta-suave); font-weight: 700; margin-bottom: 9px; }
.queue-info .updated .dot {
  display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--verde-vivo); margin-right: 6px;
}
.queue-info p { font-size: 14px; color: var(--tinta-suave); line-height: 1.55; max-width: 380px; margin-bottom: 15px; }
.legend { display: flex; gap: 15px; flex-wrap: wrap; }
.legend .item { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--tinta-suave); }
.legend .sw { width: 10px; height: 10px; border-radius: 3px; background: var(--verde-vivo); }
.sw.vazio { opacity: 0.4; }
.sw.medio { opacity: 0.7; }
.sw.cheio { opacity: 1; }

.hourbars { display: flex; align-items: flex-end; gap: 5px; height: 48px; margin-top: 18px; }
.hourbar-col { display: flex; flex-direction: column; align-items: center; }
.hourbars .bar { width: 9px; border-radius: 2px 2px 1px 1px; transition: height 0.2s ease; }
.hourbars .bar.now { outline: 2px solid var(--tinta); outline-offset: 2px; }
.hourbars .lbl { font-size: 9px; color: var(--tinta-suave); text-align: center; margin-top: 5px; font-weight: 600; }

.quick-report { display: flex; align-items: center; gap: 8px; margin-top: 18px; flex-wrap: wrap; }
.chip {
  border: 1px solid var(--linha); background: var(--branco); color: var(--tinta-suave);
  font-size: 13.5px; font-weight: 700; padding: 11px 20px; border-radius: 5px; cursor: pointer;
  transition: all 0.15s ease;
}
.chip:hover { border-color: var(--verde-vivo); color: var(--verde-mata); }
.chip.active { background: var(--verde-mata); border-color: var(--verde-mata); color: #fff; }

.day-tabs { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.day-tab {
  padding: 15px 25px; border-radius: 5px; border: 1px solid var(--linha); background: var(--branco);
  font-size: 15.5px; font-weight: 700; cursor: pointer; color: var(--tinta-suave);
  transition: all 0.15s ease;
}
.day-tab:hover { border-color: var(--verde-vivo); color: var(--verde-mata); }
.day-tab.active { background: var(--verde-mata); color: #fff; border-color: var(--verde-mata); }

.menu-card {
  background: var(--branco); border: 1px solid var(--linha); border-radius: 6px; padding: 24px;
  position: relative; box-shadow: var(--sombra);
}
.admin-badge {
  position: absolute; top: 22px; right: 22px; display: flex; align-items: center; gap: 6px;
  background: var(--verde-claro); color: var(--verde-mata); padding: 5px 11px; border-radius: 4px; font-size: 11px; font-weight: 700;
}
.admin-badge .av { width: 16px; height: 16px; border-radius: 50%; background: var(--verde-vivo); }
.menu-card h3 { font-family: 'Space Grotesk', sans-serif; font-size: 21px; margin-bottom: 2px; letter-spacing: -0.3px; }
.menu-card .date { font-size: 12px; color: var(--tinta-suave); font-weight: 700; margin-bottom: 4px; }
.dish-row { display: flex; gap: 14px; padding: 14px 0; border-top: 1px solid var(--linha); }
.dish-row:first-of-type { border-top: none; }
.dish-tag {
  font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: var(--verde-mata);
  background: var(--verde-claro); padding: 5px 9px; border-radius: 3px; height: fit-content; white-space: nowrap;
}
.dish-info b { font-size: 14px; display: block; }
.dish-info span { font-size: 12.5px; color: var(--tinta-suave); }
.veg-pill {
  display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 700; color: var(--verde-mata);
  margin-left: 8px; background: var(--verde-claro); padding: 2px 8px; border-radius: 4px;
}

/* ---------- AVALIAÇÕES ---------- */
.rating-summary {
  display: flex; gap: 24px; align-items: center; background: var(--branco); border: 1px solid var(--linha);
  border-radius: 6px; padding: 22px 26px; margin-bottom: 18px; box-shadow: var(--sombra);
}
.rating-big { font-family: 'Space Grotesk', sans-serif; font-size: 46px; font-weight: 700; line-height: 1; color: var(--tinta); }
.stars { color: var(--verde-vivo); font-size: 15px; letter-spacing: 2px; }
.rating-summary .count { font-size: 12.5px; color: var(--tinta-suave); font-weight: 600; margin-top: 5px; }
.bars-mini { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.bar-row { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--tinta-suave); font-weight: 700; }
.bar-row .track { flex: 1; height: 6px; background: var(--linha); border-radius: 4px; overflow: hidden; }
.bar-row .fill { height: 100%; background: var(--verde-vivo); border-radius: 4px; }

.btn-primary {
  background: var(--verde-mata);
  color: #fff; border: none; padding: 12px 19px; border-radius: 5px;
  font-weight: 700; font-size: 13px; cursor: pointer; white-space: nowrap;
  transition: background 0.15s ease;
}
.btn-primary:hover { background: var(--verde-vivo); }
.btn-primary:disabled { background: var(--linha); color: var(--tinta-suave); cursor: not-allowed; }

.empty-reviews {
  background: var(--branco); border: 1px dashed var(--linha); border-radius: 6px; padding: 24px;
  text-align: center; font-size: 13.5px; color: var(--tinta-suave); font-weight: 600;
}

.review {
  background: var(--branco); border: 1px solid var(--linha); border-radius: 6px; padding: 17px 19px; margin-bottom: 12px;
  box-shadow: var(--sombra); transition: box-shadow 0.15s ease;
}
.review:hover { box-shadow: var(--sombra-lg); }
.review-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.avatar {
  width: 35px; height: 35px; border-radius: 50%; background: var(--verde-claro); color: var(--verde-mata);
  display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;
  font-family: 'Space Grotesk', sans-serif; flex-shrink: 0;
}
.review-head .who-when { flex: 1; min-width: 0; }
.review-head .who { font-size: 13.5px; font-weight: 700; }
.review-head .when { font-size: 11.5px; color: var(--tinta-suave); font-weight: 600; }
.delete-btn {
  background: none; border: none; cursor: pointer; font-size: 14px; color: var(--tinta-suave);
  padding: 6px; border-radius: 4px; line-height: 1; flex-shrink: 0;
  transition: background 0.15s ease, color 0.15s ease;
}
.delete-btn:hover { background: var(--verde-claro); color: var(--verde-mata); }
.review-stars { color: var(--verde-vivo); font-size: 13px; margin-bottom: 6px; letter-spacing: 1px; }
.review p { font-size: 13.5px; color: var(--tinta); line-height: 1.55; }
.review-photos { display: flex; gap: 8px; margin-top: 10px; }
.review-photos .ph {
  width: 66px; height: 66px; border-radius: 4px; object-fit: cover; border: 1px solid var(--linha);
}

.overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45);
  display: none; align-items: center; justify-content: center; z-index: 50;
}
.overlay.open { display: flex; }
.modal {
  background: var(--branco); border-radius: 6px; padding: 28px; width: 388px; max-width: 90vw;
  box-shadow: var(--sombra-lg); border: 1px solid var(--linha);
}
.modal h3 { font-family: 'Space Grotesk', sans-serif; font-size: 20px; margin-bottom: 4px; }
.modal .sub { font-size: 12.5px; color: var(--tinta-suave); margin-bottom: 20px; font-weight: 600; }
.star-picker { display: flex; gap: 6px; font-size: 31px; color: var(--linha); cursor: pointer; margin-bottom: 18px; }
.star-picker span { transition: color 0.1s ease; }
.star-picker span.on { color: var(--verde-vivo); }
.modal textarea {
  width: 100%; border: 1px solid var(--linha); border-radius: 5px; padding: 13px; font-family: inherit;
  font-size: 13px; resize: none; height: 82px; margin-bottom: 13px; background: var(--fundo);
}
.modal textarea:focus { outline: 2px solid var(--verde-vivo); outline-offset: 1px; }
.upload-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.preview-photos { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
.preview-ph { position: relative; width: 56px; height: 56px; flex-shrink: 0; }
.preview-ph img { width: 100%; height: 100%; border-radius: 4px; object-fit: cover; border: 1px solid var(--linha); }
.preview-remove {
  position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%;
  background: var(--verde-mata); color: #fff; border: none; font-size: 12px; line-height: 1;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.preview-remove:hover { background: var(--verde-vivo); }
.upload-btn {
  border: 1.5px dashed var(--linha); border-radius: 5px; padding: 10px 15px; font-size: 12px; font-weight: 700;
  color: var(--tinta-suave); cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.upload-btn:hover { border-color: var(--verde-vivo); color: var(--verde-mata); }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
.btn-ghost {
  background: none; border: 1px solid var(--linha); padding: 12px 17px; border-radius: 5px; font-weight: 700;
  font-size: 13px; cursor: pointer; color: var(--tinta-suave); transition: border-color 0.15s ease, color 0.15s ease;
}
.btn-ghost:hover { border-color: var(--tinta-suave); color: var(--tinta); }

@media (max-width: 640px) {
  .sidebar { display: none; }
  main { padding: 20px 16px 60px; }
  .queue-card { flex-direction: column; text-align: center; }
  .queue-bar-wrap { width: 100%; }
  .queue-info p { max-width: none; }
  .rating-summary { flex-direction: column; align-items: flex-start; }
}
</style>