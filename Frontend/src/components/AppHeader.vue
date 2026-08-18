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
    <h1>IFchat</h1>
    <nav>
      <div class="divLink" :class="{ 'ativo': route.path === '/home' }">
        <RouterLink to="/home">
          <img :src="home" alt="" class="imgIcon linha">
          <img :src="homePreenchido" alt="" class="imgIcon preenchido">
          <span>Home</span>
        </RouterLink>
      </div>
      <div class="divLink" :class="{ 'ativo': route.path === '/salvar' }">
        <RouterLink to="/salvar">
          <img :src="banner" alt="" class="imgIcon linha">
          <img :src="bannerPreenchido" alt="" class="imgIcon preenchido">
          <span>Salvar</span>
        </RouterLink>
      </div>
      <div class="divLink" :class="{ 'ativo': route.path === '/chat' }">
        <RouterLink to="/chat">
          <img :src="chat" alt="" class="imgIcon linha">
          <img :src="chatPreenchido" alt="" class="imgIcon preenchido">
          <span>Chat</span>
        </RouterLink>
      </div>
      <div class="divLink" :class="{ 'ativo': route.path === '/explorar' }">
        <RouterLink to="/explorar">
          <img :src="explorar" alt="" class="imgIcon linha">
          <img :src="explorarPreenchido" alt="" class="imgIcon preenchido">
          <span>Explorar</span>
        </RouterLink>
      </div>
      <div class="divLink" :class="{ 'ativo': route.path === '/eventos' }">
        <RouterLink to="/eventos">
          <img :src="eventos" alt="" class="imgIcon linha">
          <img :src="eventosPreenchido" alt="" class="imgIcon preenchido">
          <span>Eventos</span>
        </RouterLink>
      </div>
    </nav>
    <nav class="navInferior">
      <div  v-if="meuId" class="divLink" :class="{ 'ativo': route.path.startsWith('/criar') }">
        <RouterLink :to="`/criar/${meuId}`">
          <img :src="criar" alt="" class="imgIcon linha">
          <img :src="criarPreenchido" alt="" class="imgIcon preenchido">
          <span>Criar</span>
        </RouterLink>
      </div>
      <div  v-if="meuId" class="divLink" :class="{ 'ativo': route.path.startsWith('/usuario') }">
        <RouterLink :to="`/usuario/${meuId}`">
          <img :src="user" alt="" class="imgIcon linha">
          <img :src="userPreenchido" alt="" class="imgIcon preenchido">
          <span>Perfil</span>
        </RouterLink>
      </div>
      <div class="divLink" :class="{ 'ativo': route.path === '/avisos' }">
        <RouterLink to="/avisos">
          <img :src="sino" alt="" class="imgIcon linha">
          <img :src="sinoPreenchido" alt="" class="imgIcon preenchido">
          <span>Avisos</span>
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
  width: 12vw;
  height: 100vh;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  position: fixed;
  background-color: #fff;
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
  background-color: #3CBC00;
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
  background-color: rgba(85, 255, 51, 0.14);
  transition: 0.3s;
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
  color: #333;
}
.imgIcon {
  width: 2.1vw;
  height: 2.1vw;
  object-fit: contain;
}
.imgIcon.linha {
  display: block;
}
.imgIcon.preenchido {
  display: none;
}
.divLink img {
  width: 2.5vw;
  height: auto;
}
.divLink.ativo {
  background-color: rgba(85, 255, 51, 0.14);
  border-left: 0.45vw solid #3CBC00;
  box-shadow: 0px 4px 2px rgba(0, 0, 0, 0.25);
}
.divLink.ativo span {
  color: #000;
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
</style>

