<script setup>
import { RouterView, useRoute } from 'vue-router';
import AppHeader from './components/AppHeader.vue';

const route = useRoute();
</script>

<template>
  <div class="containerSimples">
    <AppHeader v-if="!route.meta.ocultarHeader"/>
    <RouterView />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: Arial, Helvetica, sans-serif;
}
.containerSimples {
  width: 100%;
  min-height: 100vh;
}
:root {
  --fundo-site: rgba(85, 255, 51, 0.14);
  --fundo-card: #ffffff;
  --opcao-escolhida: #319e00;
  --fundo-opcao-enquete: rgba(60, 188, 0, 0.22);
  --fundo-card-va: #3CBC00;
  --fundo-card-va-hover: #37ad00;
  --texto-principal: #000000;
  --banner-default: #55ff3389;
  --checkbox-config: #55ff33;
  --texto-suave: #666666;
  --borda-padrao: 0.1px solid #000000;
  --borda-dashed: 0.1px dashed #000;
  --hover-botoes: #f9f9f9;
  --fundo-card-modal: #f9f9f9;
  --texto-principal-reverso: #fff;
  --borda-cinza-branca: 0.1vw solid #ccc;
  --texto-mais-suave: #666;
}
[data-theme="dark"] {
  --fundo-site: #020b1a;
  --fundo-card: #0c182b;
  --opcao-escolhida: #005bb7;
  --fundo-opcao-enquete: rgba(0, 92, 185, 0.22);
  --fundo-card-va: #005cb9;
  --fundo-card-va-hover: #001dad;
  --texto-principal: #ffffff;
  --banner-default: #33bdff89;
  --checkbox-config: #33bdff;
  --texto-suave: #ffffff;
  --borda-padrao: 0.1px solid #fff;
  --borda-dashed: 0.1px dashed #fff;
  --hover-botoes: #223b62;
  --fundo-card-modal: #1f2e45;
  --texto-principal-reverso: #000;
  --borda-cinza-branca: 0.1vw solid #fff;
  --texto-mais-suave: #bababa;
}
body {
  background-color: var(--fundo-site);
  color: var(--texto-principal);
  transition: background-color 0.3s ease, color 0.3s ease;
  margin: 0 !important;
  padding: 0 !important;
}
@media (max-width: 728px) {
  body {
    padding-top: 11vw !important;
    margin: 0;
    box-sizing: border-box;
  }
}
</style>
