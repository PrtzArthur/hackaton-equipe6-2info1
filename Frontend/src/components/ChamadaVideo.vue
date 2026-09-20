<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Peer } from 'peerjs';
import { useToast } from 'vue-toastification';

const toast = useToast();

const props = defineProps({
  idAmigo: { type: String, required: true }
});

const emit = defineEmits(['fecharLigar']);

const videoLocalRef = ref(null);
const videoRemotoRef = ref(null);
const amigoConectado = ref(false);
const camAtiva = ref(true);
const micAtivo = ref(true);

const meuIdLogado = localStorage.getItem('ifchat_user_id') || '';

let fluxoDeMidiaLocal = null;
let instanciaPeer = null;
let chamadaAtivaObjeto = null;

async function iniciarMidiasDeHardware() {
  try {
    fluxoDeMidiaLocal = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: true
    });

    if (videoLocalRef.value) {
      videoLocalRef.value.srcObject = fluxoDeMidiaLocal;
    }

    inicializarMotorPeerJS();
  } catch (err) {
    console.error("Falha ao abrir câmera local:", err);
    toast.error("Perissões de câmera negadas.");
    emit('fecharLigar');
  }
}

function inicializarMotorPeerJS() {
  const urlLimpaDoBack = import.meta.env.VITE_API_URL.replace('https://', '').replace('http://', '');
  const ehSeguro = import.meta.env.VITE_API_URL.includes('https');

  instanciaPeer = new Peer(meuIdLogado, {
    host: urlLimpaDoBack,
    port: ehSeguro ? 443 : 3000,
    path: '/peerjs/ifchat-video-signaling',
    secure: ehSeguro
  });

  instanciaPeer.on('open', (idConstatado) => {
    console.log(`meu ID de vídeo registrado na nuvem P2P: ${idConstatado}`);

    console.log(`disparando chamada P2P direta para o ID do amigo: ${props.idAmigo}`);
    const chamada = instanciaPeer.call(props.idAmigo, fluxoDeMidiaLocal);
    vincularEventosDaChamada(chamada);
  });

  instanciaPeer.on('call', (chamadaEntrante) => {
    console.log("recebendo ligação de vídeo de volta do colega. Atendendo automaticamente...");
    chamadaEntrante.answer(fluxoDeMidiaLocal);
    vincularEventosDaChamada(chamadaEntrante);
  });
}

function vincularEventosDaChamada(chamada) {
  chamadaAtivaObjeto = chamada;

  chamada.on('stream', (fluxoRemotoDoAmigo) => {
    if (videoRemotoRef.value) {
      videoRemotoRef.value.srcObject = fluxoRemotoDoAmigo;
      amigoConectado.value = true;
    }
  });

  chamada.on('close', () => {
    desligarChamadaTotalmente();
  });
}

function alternarMic() {
  if (fluxoDeMidiaLocal) {
    micAtivo.value = !micAtivo.value;
    fluxoDeMidiaLocal.getAudioTracks().forEach(t => t.enabled = micAtivo.value);
  }
}

function alternarCam() {
  if (fluxoDeMidiaLocal) {
    camAtiva.value = !camAtiva.value;
    fluxoDeMidiaLocal.getVideoTracks().forEach(t => t.enabled = camAtiva.value);
  }
}

function desligarChamadaTotalmente() {
  if (chamadaAtivaObjeto) chamadaAtivaObjeto.close();
  if (fluxoDeMidiaLocal) fluxoDeMidiaLocal.getTracks().forEach(t => t.stop());
  if (instanciaPeer) instanciaPeer.destroy();

  toast.info("Vídeo-chamada encerrada.");
  emit('fecharLigar');
}

onMounted(() => {
  iniciarMidiasDeHardware();
});

onUnmounted(() => {
  if (fluxoDeMidiaLocal) fluxoDeMidiaLocal.getTracks().forEach(t => t.stop());
  if (instanciaPeer) instanciaPeer.destroy();
});
</script>

<template>
  <div class="tela-cheia-chamada-video">
    <div class="box-video-principal">
      <video ref="videoRemotoRef" autoplay playsinline class="video-player"></video>
      <div v-if="!amigoConectado" class="alerta-espera-chamada">
        <div class="spinner-ligacao"></div>
        <span>Conectando canal seguro P2P com o colega...</span>
      </div>
    </div>
    <div class="box-video-local-mini">
      <video ref="videoLocalRef" autoplay playsinline muted class="video-player local-espelhado"></video>
    </div>
    <div class="botoes-controle-ligacao">
      <button @click="alternarMic" :class="['btn-redondo', { 'btn-mutado': !micAtivo }]">
        {{ micAtivo ? 'ativado microfone' : 'desativado microfone' }}
      </button>
      <button @click="alternarCam" :class="['btn-redondo', { 'btn-mutado': !camAtiva }]">
        {{ camAtiva ? 'ativada câmera' : 'desativada câmera' }}
      </button>
      <button @click="desligarChamadaTotalmente" class="btn-redondo btn-hangup">
        Desligar
      </button>
    </div>
  </div>
</template>

<style scoped>
.tela-cheia-chamada-video {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #111111;
  z-index: 99999;
  display: flex;
}
.box-video-principal {
  width: 100%;
  height: 100%;
  position: relative;
}
.video-player {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.local-espelhado {
  transform: scaleX(-1);
}
.box-video-local-mini {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 160px;
  height: 220px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #ffffff;
  box-shadow: 0 8px 24px rgba(0,0,0,0.6);
  z-index: 100000;
  background: #000;
}
.botoes-controle-ligacao {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
  background: rgba(0, 0, 0, 0.7);
  padding: 14px 28px;
  border-radius: 40px;
  backdrop-filter: blur(12px);
  z-index: 100000;
}
.btn-redondo {
  background: #2a2a2a;
  color: white;
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.btn-redondo:hover {
  background: #3a3a3a;
  transform: scale(1.05);
}
.btn-mutado {
  background: #dc3545;
}
.btn-hangup {
  background: #dc3545;
  width: auto;
  padding: 0 20px;
  border-radius: 24px;
  font-weight: bold;
  font-size: 14px;
}
.btn-hangup:hover {
  background: #bd2130;
}
.alerta-espera-chamada {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #fff;
  text-align: center;
}
.spinner-ligacao {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255,255,255,0.1);
  border-top-color: #22c55e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
