<script setup>
import { RouterView, useRoute } from 'vue-router';
import AppHeader from './components/AppHeader.vue';

const route = useRoute();
</script>

<template>
  <AppHeader v-if="!route.meta.ocultarHeader"/>
  <RouterView />
</template>

<style>
body {
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box;
}
</style>
