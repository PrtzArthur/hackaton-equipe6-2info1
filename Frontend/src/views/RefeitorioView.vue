<template>
  <div class="refeitorio-page">
    <!-- SIDEBAR -->
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

    <!-- MAIN -->
    <main>
      <div class="topbar">
        <div class="crumb"><span class="tag">IFchat</span> Refeitório</div>
        <div class="icons">
          <div class="icon-btn"><SvgSearch /></div>
          <div class="icon-btn"><SvgBell small /></div>
        </div>
      </div>

      <h1 class="title">Mãos Peruanas</h1>
      <p class="subtitle">Refeitório · IFC Araquari · Almoço 11h – 13h30</p>

      <!-- FILA -->
      <section>
        <div class="section-head">
          <h2>Fila agora</h2>
          <span class="hint">{{ clockNow }}</span>
        </div>
        <div class="queue-card">
          <div class="dial-wrap">
            <svg viewBox="0 0 160 155">
              <path :d="gaugeTrackPath" class="gauge-track" stroke-width="14" fill="none" stroke-linecap="round"/>
              <path
                :d="gaugeFillPath"
                :stroke="currentStatus.color"
                class="gauge-fill"
                stroke-width="14"
                fill="none"
                stroke-linecap="round"
              />
              <circle
                :cx="gaugeDot.x"
                :cy="gaugeDot.y"
                r="8.5"
                class="gauge-dot"
                :style="{ stroke: currentStatus.color }"
              />
            </svg>
            <div class="dial-status">
              <div class="label" :style="{ color: currentStatus.color }">{{ currentStatus.label }}</div>
              <div class="wait">{{ currentStatus.wait }}</div>
            </div>
          </div>
          <div class="queue-info">
            <div class="updated"><span class="dot"></span>Atualizado há {{ minutesSinceUpdate }} min por um usuário</div>
            <p>O fluxo costuma aumentar entre 11h30 e 12h15. Se puder, evite esse horário ou marque para almoçar mais cedo.</p>
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

            <!-- Botões de teste (simulam atualização feita por outro usuário) -->
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

      <!-- CARDÁPIO -->
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

      <!-- AVALIAÇÕES -->
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

        <div class="review" v-for="r in reviews" :key="r.id">
          <div class="review-head">
            <div class="avatar">{{ r.initials }}</div>
            <div><div class="who">{{ r.name }}</div><div class="when">{{ r.when }}</div></div>
          </div>
          <div class="review-stars">{{ starString(r.stars) }}</div>
          <p>{{ r.text }}</p>
          <div class="review-photos" v-if="r.photos && r.photos.length">
            <div class="ph" v-for="(p, idx) in r.photos" :key="idx">📷</div>
          </div>
        </div>
      </section>
    </main>

    <!-- MODAL: NOVA AVALIAÇÃO -->
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

/* ---------------- ícones (SVG simples, sem dependências) ---------------- */
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
const SvgSearch = icon(['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M21 21l-4.3-4.3'])

/* ---------------- relógio ---------------- */
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

/* ---------------- status da fila ---------------- */
// Em produção: substituir por leitura/gravação em tempo real (ex: API do refeitório)
const statuses = {
  vazio: { label: 'Vazio', wait: '~3 min de espera', angle: -80, percent: 18, color: 'var(--verde-vivo)' },
  medio: { label: 'Médio', wait: '~12 min de espera', angle: -40, percent: 55, color: 'var(--dourado-vivo)' },
  cheio: { label: 'Cheio', wait: '~22 min de espera', angle: 0, percent: 92, color: 'var(--terracota-vivo)' },
}
const statusKey = ref('medio')
const currentStatus = computed(() => statuses[statusKey.value])
const minutesSinceUpdate = ref(2)

/* ---------------- geometria do gauge da fila (só desenho, mesmos dados de status) ---------------- */
const GAUGE_CX = 80
const GAUGE_CY = 84
const GAUGE_R = 58
const GAUGE_START = -130
const GAUGE_END = 130

function gaugePoint(angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: +(GAUGE_CX + GAUGE_R * Math.cos(rad)).toFixed(2),
    y: +(GAUGE_CY + GAUGE_R * Math.sin(rad)).toFixed(2),
  }
}
function gaugeArc(startAngle, endAngle) {
  const start = gaugePoint(startAngle)
  const end = gaugePoint(endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${GAUGE_R} ${GAUGE_R} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

const gaugeTrackPath = gaugeArc(GAUGE_START, GAUGE_END)
const gaugeFillAngle = computed(
  () => GAUGE_START + ((GAUGE_END - GAUGE_START) * currentStatus.value.percent) / 100
)
const gaugeFillPath = computed(() => gaugeArc(GAUGE_START, gaugeFillAngle.value))
const gaugeDot = computed(() => gaugePoint(gaugeFillAngle.value))

/* histórico de fila por horário (mock) */
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
  if (level > 70) return 'var(--terracota)'
  if (level > 35) return 'var(--dourado)'
  return 'var(--verde-vivo)'
}

/* ---------------- cardápio da semana ---------------- */
// Em produção: viria de uma API, editável apenas por contas com papel "admin"
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
const reviews = reactive([
  { id: 1, name: 'Larissa M.', initials: 'LM', stars: 5, when: 'hoje, 12h20', text: 'O lomo saltado de hoje estava excelente, temperinho na medida e chegou quente. Fila rápida também!', photos: ['a'] },
  { id: 2, name: 'Diego F.', initials: 'DF', stars: 4, when: 'ontem, 12h05', text: 'Ají de gallina bem cremoso, só achei que faltou um pouco mais de arroz na porção.', photos: [] },
  { id: 3, name: 'Camila R.', initials: 'CR', stars: 5, when: 'ontem, 11h40', text: 'Melhor causa limeña que já comi no IF! Pena que acaba rápido, cheguei perto das 13h e ainda tinha.', photos: ['a'] },
])

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
  newReview.photos = Array.from(e.target.files || [])
}
function closeModal() {
  showModal.value = false
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
    photos: newReview.photos.map(() => 'a'),
  })
  closeModal()
}
</script>

<style scoped>
/*
  Paleta e identidade: cerâmica andina + mercado de Lima.
  Verde-jade (Amazônia peruana), ouro-inca (milho, cerâmica) e
  terracota-adobe (arquitetura de Cusco) sobre um fundo areia quente.
  Assinatura visual: friso geométrico "chakana" (padrão andino em degraus)
  usado como divisor sutil, e o disco de fila como um "prato" cerâmico.
*/
:root, .refeitorio-page {
  --verde-mata: #17563B;
  --verde-vivo: #2F9760;
  --verde-claro: #E4F1E8;
  --dourado: #C6862A;
  --dourado-vivo: #E0A83E;
  --dourado-claro: #FBF0DA;
  --terracota: #A63824;
  --terracota-vivo: #C24A32;
  --terracota-claro: #F9E7E1;
  --tinta: #211B15;
  --tinta-suave: #766A5C;
  --linha: #E7DFD1;
  --branco: #FFFDF8;
  --fundo: #F3EEE3;
  --sombra: 0 1px 2px rgba(33, 27, 21, 0.04), 0 8px 24px -12px rgba(33, 27, 21, 0.18);
  --sombra-lg: 0 2px 4px rgba(33, 27, 21, 0.05), 0 20px 40px -16px rgba(33, 27, 21, 0.22);
}

* { box-sizing: border-box; }

.refeitorio-page {
  font-family: 'Manrope', sans-serif;
  background:
    radial-gradient(1100px 480px at 8% -8%, rgba(224, 168, 62, 0.10), transparent 60%),
    radial-gradient(900px 500px at 100% 0%, rgba(47, 151, 96, 0.08), transparent 55%),
    var(--fundo);
  color: var(--tinta);
  display: flex;
  min-height: 100vh;
}

/* padrão em degraus (chakana simplificada), usado como friso decorativo */
.chakana-rule {
  height: 8px;
  width: 100%;
  background-image: repeating-linear-gradient(
    -45deg,
    var(--dourado-vivo) 0 4px,
    var(--terracota) 4px 8px,
    var(--verde-vivo) 8px 12px,
    transparent 12px 16px
  );
  opacity: 0.55;
  border-radius: 6px;
  margin: 22px 0 4px;
}

/* ---------- SIDEBAR ---------- */
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
  background: linear-gradient(155deg, var(--verde-vivo), var(--verde-mata));
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 14px; margin-bottom: 24px;
  font-family: 'Space Grotesk', sans-serif;
  box-shadow: 0 6px 14px -6px rgba(23, 86, 59, 0.55);
}
.navitem {
  width: 54px; padding: 10px 4px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  border-radius: 5px; cursor: pointer; color: var(--tinta-suave);
  font-size: 9.5px; font-weight: 700; text-align: center;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}
.navitem.active { background: var(--verde-claro); color: var(--verde-mata); }
.navitem:hover:not(.active) { background: #F3EFE6; transform: translateY(-1px); }

/* ---------- MAIN ---------- */
main { flex: 1; max-width: 900px; margin: 0 auto; padding: 30px 32px 84px; width: 100%; }

.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
.topbar .crumb { display: flex; align-items: center; gap: 9px; color: var(--tinta-suave); font-size: 13px; font-weight: 700; }
.topbar .crumb .tag {
  background: linear-gradient(155deg, var(--verde-vivo), var(--verde-mata));
  color: #fff; padding: 4px 11px; border-radius: 4px; font-size: 11px; font-weight: 700;
  font-family: 'Space Grotesk', sans-serif; letter-spacing: 0.2px;
}
.topbar .icons { display: flex; gap: 12px; }
.icon-btn {
  width: 36px; height: 36px; border-radius: 50%; background: var(--branco); border: 1px solid var(--linha);
  display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--tinta-suave);
  box-shadow: var(--sombra); transition: transform 0.15s ease, color 0.15s ease;
}
.icon-btn:hover { color: var(--verde-mata); transform: translateY(-1px); }

h1.title { font-family: 'Space Grotesk', sans-serif; font-size: 33px; font-weight: 600; letter-spacing: -0.6px; }
.subtitle { color: var(--tinta-suave); font-size: 14px; margin-top: 5px; font-weight: 600; }
.subtitle::before { content: '◆ '; color: var(--dourado-vivo); font-size: 9px; vertical-align: middle; }

section { margin-top: 30px; }
.section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 15px; }
.section-head h2 { font-family: 'Space Grotesk', sans-serif; font-size: 19px; font-weight: 600; letter-spacing: -0.2px; }
.section-head .hint { font-size: 12px; color: var(--tinta-suave); font-weight: 700; }

/* ---------- FILA ---------- */
.queue-card {
  background: var(--branco); border: 1px solid var(--linha); border-radius: 6px;
  padding: 26px; display: flex; gap: 30px; align-items: center; position: relative; overflow: hidden;
  box-shadow: var(--sombra);
}
.queue-card::after {
  content: ''; position: absolute; inset: 0 0 auto 0; height: 6px;
  background: linear-gradient(90deg, var(--verde-vivo), var(--dourado-vivo), var(--terracota-vivo));
}
.dial-wrap { position: relative; width: 168px; height: 158px; flex-shrink: 0; }
.dial-wrap svg { width: 100%; height: 100%; overflow: visible; }
.gauge-track { stroke: var(--linha); }
.gauge-fill { transition: d 0.35s ease, stroke 0.35s ease; }
.gauge-dot {
  fill: var(--branco); stroke-width: 4.5px;
  filter: drop-shadow(0 3px 6px rgba(33, 27, 21, 0.18));
  transition: cx 0.35s ease, cy 0.35s ease, stroke 0.35s ease;
}
.dial-status {
  position: absolute; inset: 0 0 14px 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; gap: 2px;
}
.dial-status .label { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 21px; letter-spacing: -0.2px; transition: color 0.2s ease; }
.dial-status .wait { font-family: 'DM Mono', monospace; font-size: 11.5px; color: var(--tinta-suave); font-weight: 600; }
.queue-info { flex: 1; z-index: 1; min-width: 0; }
.queue-info .updated { font-size: 12px; color: var(--tinta-suave); font-weight: 700; margin-bottom: 9px; }
.queue-info .updated .dot {
  display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--verde-vivo); margin-right: 6px;
  box-shadow: 0 0 0 3px var(--verde-claro);
}
.queue-info p { font-size: 14px; color: var(--tinta-suave); line-height: 1.55; max-width: 380px; margin-bottom: 15px; }
.legend { display: flex; gap: 15px; flex-wrap: wrap; }
.legend .item { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--tinta-suave); }
.legend .sw { width: 10px; height: 10px; border-radius: 3px; }
.sw.vazio { background: var(--verde-vivo); }
.sw.medio { background: var(--dourado-vivo); }
.sw.cheio { background: var(--terracota-vivo); }

.hourbars { display: flex; align-items: flex-end; gap: 5px; height: 48px; margin-top: 18px; }
.hourbar-col { display: flex; flex-direction: column; align-items: center; }
.hourbars .bar { width: 9px; border-radius: 2px 2px 1px 1px; transition: height 0.2s ease; }
.hourbars .bar.now { outline: 2px solid var(--tinta); outline-offset: 2px; }
.hourbars .lbl { font-size: 9px; color: var(--tinta-suave); text-align: center; margin-top: 5px; font-weight: 600; }

.quick-report { display: flex; align-items: center; gap: 8px; margin-top: 18px; flex-wrap: wrap; }
.chip {
  border: 1px solid var(--linha); background: var(--branco); color: var(--tinta-suave);
  font-size: 11.5px; font-weight: 700; padding: 7px 13px; border-radius: 4px; cursor: pointer;
  transition: all 0.15s ease;
}
.chip:hover { border-color: var(--verde-vivo); color: var(--verde-mata); }
.chip.active { background: var(--verde-mata); border-color: var(--verde-mata); color: #fff; box-shadow: 0 4px 10px -4px rgba(23, 86, 59, 0.5); }

/* ---------- CARDÁPIO ---------- */
.day-tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.day-tab {
  padding: 10px 17px; border-radius: 4px; border: 1px solid var(--linha); background: var(--branco);
  font-size: 13px; font-weight: 700; cursor: pointer; color: var(--tinta-suave);
  transition: all 0.15s ease;
}
.day-tab:hover { border-color: var(--dourado-vivo); color: var(--dourado); }
.day-tab.active { background: var(--verde-mata); color: #fff; border-color: var(--verde-mata); box-shadow: 0 4px 10px -4px rgba(23, 86, 59, 0.5); }

.menu-card {
  background: var(--branco); border: 1px solid var(--linha); border-radius: 6px; padding: 24px;
  position: relative; box-shadow: var(--sombra);
}
.admin-badge {
  position: absolute; top: 22px; right: 22px; display: flex; align-items: center; gap: 6px;
  background: var(--dourado-claro); color: #8A5F16; padding: 5px 11px; border-radius: 4px; font-size: 11px; font-weight: 700;
}
.admin-badge .av { width: 16px; height: 16px; border-radius: 50%; background: var(--dourado-vivo); }
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
.stars { color: var(--dourado-vivo); font-size: 15px; letter-spacing: 2px; }
.rating-summary .count { font-size: 12.5px; color: var(--tinta-suave); font-weight: 600; margin-top: 5px; }
.bars-mini { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.bar-row { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--tinta-suave); font-weight: 700; }
.bar-row .track { flex: 1; height: 6px; background: var(--linha); border-radius: 4px; overflow: hidden; }
.bar-row .fill { height: 100%; background: linear-gradient(90deg, var(--dourado), var(--dourado-vivo)); border-radius: 4px; }

.btn-primary {
  background: linear-gradient(155deg, var(--verde-vivo), var(--verde-mata));
  color: #fff; border: none; padding: 12px 19px; border-radius: 5px;
  font-weight: 700; font-size: 13px; cursor: pointer; white-space: nowrap;
  box-shadow: 0 6px 14px -6px rgba(23, 86, 59, 0.5);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 18px -6px rgba(23, 86, 59, 0.55); }
.btn-primary:disabled { background: var(--linha); color: var(--tinta-suave); cursor: not-allowed; box-shadow: none; transform: none; }

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
.review-head .who { font-size: 13.5px; font-weight: 700; }
.review-head .when { font-size: 11.5px; color: var(--tinta-suave); font-weight: 600; }
.review-stars { color: var(--dourado-vivo); font-size: 13px; margin-bottom: 6px; letter-spacing: 1px; }
.review p { font-size: 13.5px; color: var(--tinta); line-height: 1.55; }
.review-photos { display: flex; gap: 8px; margin-top: 10px; }
.review-photos .ph {
  width: 66px; height: 66px; border-radius: 4px; background: var(--verde-claro);
  display: flex; align-items: center; justify-content: center; color: var(--verde-mata);
}

/* ---------- MODAL ---------- */
.overlay {
  position: fixed; inset: 0; background: rgba(20, 16, 12, 0.5); backdrop-filter: blur(2px);
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
.star-picker span { transition: color 0.1s ease, transform 0.1s ease; }
.star-picker span:hover { transform: scale(1.08); }
.star-picker span.on { color: var(--dourado-vivo); }
.modal textarea {
  width: 100%; border: 1px solid var(--linha); border-radius: 5px; padding: 13px; font-family: inherit;
  font-size: 13px; resize: none; height: 82px; margin-bottom: 13px; background: var(--fundo);
}
.modal textarea:focus { outline: 2px solid var(--verde-vivo); outline-offset: 1px; }
.upload-row { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
.upload-btn {
  border: 1.5px dashed var(--linha); border-radius: 5px; padding: 10px 15px; font-size: 12px; font-weight: 700;
  color: var(--tinta-suave); cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.upload-btn:hover { border-color: var(--dourado-vivo); color: var(--dourado); }
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
  .queue-info p { max-width: none; }
  .rating-summary { flex-direction: column; align-items: flex-start; }
}
</style>