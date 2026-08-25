<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import sino from '@/icons/sino.svg';
import home from '@/icons/home.svg';
import banner from '@/icons/banner.svg';
import chat from '@/icons/chat.svg';
import criar from '@/icons/criar.svg';
import explorar from '@/icons/explorar.svg';
import eventos from '@/icons/eventos.svg';
import user from '@/icons/user.svg';

import homePreenchido from '@/icons/homePreenchido.svg';
import bannerPreenchido from '@/icons/bannerPreenchido.svg';
import sinoPreenchido from '@/icons/sinoPreenchido.svg';
import chatPreenchido from '@/icons/chatPreenchido.svg';
import criarPreenchido from '@/icons/criarPreenchido.svg';
import explorarPreenchido from '@/icons/explorarPreenchido.svg';
import eventosPreenchido from '@/icons/eventosPreenchido.svg';
import userPreenchido from '@/icons/userPreenchido.svg';

const route = useRoute();
const meuId = ref('');

onMounted(() => {
  meuId.value = localStorage.getItem('ifchat_user_id') || '';
});
</script>

<template>
  <header>
    <h1>IFChat</h1>
    <nav class="nav-superior">
      <div class="divLink" :class="{ 'ativo': route.path === '/home' }">
        <RouterLink to="/home">
          <img :src="home" alt="" class="imgIcon linha">
          <img :src="homePreenchido" alt="" class="imgIcon preenchido">
          <span class="display-none">Home</span>
        </RouterLink>
      </div>
      <div class="divLink" :class="{ 'ativo': route.path === '/salvar' }">
        <RouterLink to="/salvar">
          <img :src="banner" alt="" class="imgIcon linha">
          <img :src="bannerPreenchido" alt="" class="imgIcon preenchido">
          <span class="display-none">Salvar</span>
        </RouterLink>
      </div>
      <div class="divLink" :class="{ 'ativo': route.path === '/chat' }">
        <RouterLink to="/chat">
          <img :src="chat" alt="" class="imgIcon linha">
          <img :src="chatPreenchido" alt="" class="imgIcon preenchido">
          <span class="display-none">Chat</span>
        </RouterLink>
      </div>
      <div class="divLink" :class="{ 'ativo': route.path === '/explorar' }">
        <RouterLink to="/explorar">
          <img :src="explorar" alt="" class="imgIcon linha">
          <img :src="explorarPreenchido" alt="" class="imgIcon preenchido">
          <span class="display-none">Explorar</span>
        </RouterLink>
      </div>
      <div class="divLink" :class="{ 'ativo': route.path === '/eventos' }">
        <RouterLink to="/eventos">
          <img :src="eventos" alt="" class="imgIcon linha">
          <img :src="eventosPreenchido" alt="" class="imgIcon preenchido">
          <span class="display-none">Eventos</span>
        </RouterLink>
      </div>
    </nav>
    <nav class="navInferior">
      <div  v-if="meuId" class="divLink" :class="{ 'ativo': route.path.startsWith('/criar') }">
        <RouterLink :to="`/criar/${meuId}`">
          <img :src="criar" alt="" class="imgIcon linha">
          <img :src="criarPreenchido" alt="" class="imgIcon preenchido">
          <span class="display-none">Criar</span>
        </RouterLink>
      </div>
      <div  v-if="meuId" class="divLink" :class="{ 'ativo': route.path.startsWith('/usuario') }">
        <RouterLink :to="`/usuario/${meuId}`">
          <img :src="user" alt="" class="imgIcon linha">
          <img :src="userPreenchido" alt="" class="imgIcon preenchido">
          <span class="display-none">Perfil</span>
        </RouterLink>
      </div>
      <div class="divLink" :class="{ 'ativo': route.path === '/avisos' }">
        <RouterLink to="/avisos">
          <img :src="sino" alt="" class="imgIcon linha">
          <img :src="sinoPreenchido" alt="" class="imgIcon preenchido">
          <span class="display-none">Avisos</span>
        </RouterLink>
      </div>
    </nav>
  </header>
</template>

<style scoped>
header {
  top: 0;
  left: 0;
  margin-top: 0;
  width: 14vw;
  height: 100vh;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  position: fixed;
  background-color: var(--fundo-card);
  border-right: 2px solid #b8b8b87e;
}
a {
  text-decoration: none;
  height: 100%;
  padding: 1vw 0;
}
header h1 {
  text-align: center;
  align-items: center;
  justify-content: center;
  display: flex;
  color: white;
  background-color: var(--fundo-card-va);
  width: 100%;
  height: 3vw;
  top: 0;
  margin-top: 0;
  padding: 2vw 0 2vw 0;
  margin-bottom: 3vw;
  font-size: 2vw;
}
.divLink {
  padding: 0;
  border-left: 0.45vw solid transparent;
}
.divLink:hover {
  background-color: var(--fundo-site);
  transition: 0.3s;
  transform: scale(1.02);
}
.divLink:active {
  transform: scale(0.94);
}
.divLink a {
  display: flex;
  align-items: center;
  gap: 0.8vw;
  width: 100%;
  height: 100%;
  padding-left: 1.2vw;
  font-weight: bold;
  font-size: 1.4vw;
  color: var(--texto-principal);
}
.imgIcon {
  width: 2.1vw;
  height: 2.1vw;
  object-fit: contain;
}
.imgIcon.linha {
  display: block;
}
[data-theme="dark"] .imgIcon.linha {
  filter: invert(1);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .imgIcon.preenchido {
  filter: hue-rotate(135deg) saturate(1.8) brightness(1.1);
  transition: filter 0.3s ease;
}
.imgIcon.preenchido {
  display: none;
}
.divLink img {
  width: 2.5vw;
  height: auto;
}
.divLink.ativo {
  background-color: var(--fundo-site);
  border-left: 0.45vw solid var(--fundo-card-va);
  box-shadow: 0px 4px 2px rgba(0, 0, 0, 0.25);
}
.divLink.ativo span {
  color: var(--texto-principal);
}
.divLink.ativo .imgIcon.linha {
  display: none;
}
.divLink.ativo .imgIcon.preenchido {
  display: block;
}
.navInferior {
  margin-top: auto;
  margin-bottom: 2vw;
}
@media (max-width:728px) {
  header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    position: fixed;
    align-items: center;
    width: 100%;
    height: 11vw !important;
    top: 0;
    left: 0;
    z-index: 9999 !important;
    border: none !important;
    box-sizing: border-box;
  }
  .divLink.ativo {
    background-color: var(--fundo-card) !important;
  }
  .imgIcon {
    width: 8vw !important;
    height: auto !important;
  }
  .divLink {
  padding: 0;
  border-left: none !important;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none !important;
  background-color: none !important;
  }
  a {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 !important;
    background-color: none !important;
  }
  .display-none {
    display: none;
  }
  .nav-superior {
    width: 85%;
    height: 12vw;
    display: flex;
    border-radius: 7px;
    margin-bottom: 2vw;
    flex-direction: row;
    position: fixed !important;
    transform: translateX(-50%) !important;
    bottom: 0 !important;
    left: 50% !important;
    z-index: 9999 !important;
    background-color: var(--fundo-card);
    align-items: center;
    justify-content: center;
    gap: 5.5vw;
    border-radius: 50px;
    box-shadow: 0px 4px 2px rgba(0, 0, 0, 0.25);
  }
  .navInferior {
    display: flex;
    flex-direction: row;
    gap: 1.5vw;
    margin: 0 !important;
  }
  h1 {
    width: 50% !important;
    height: 100% !important;
    left: 0;
    font-size: 5vw !important;
    margin: 0 !important;
  }
}
</style>

