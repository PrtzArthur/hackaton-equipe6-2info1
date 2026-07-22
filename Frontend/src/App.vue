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
body {
  margin: 0 !important;
  padding: 0 !important;
}
.containerSimples {
  width: 100%;
  min-height: 100vh;
}
</style>
