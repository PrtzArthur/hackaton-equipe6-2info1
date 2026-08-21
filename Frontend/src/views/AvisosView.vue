<script setup>
import { ref } from 'vue'
import NotificationCard from '@/components/notifications/NotificationCard.vue'

// Array temporário pra testes, thanks Bruno
const notificacoes = ref([]) 

</script>

<template>
  <main>
    <NotificationCard :notificacoes="notificacoes" />
  </main>
</template>

<style scoped>
main {
  background-color: rgba(85, 255, 51, 0.14);
  height: 100vh;
  flex-grow: 1;
  padding: 1.5vw;
  margin-left: 12vw;
  width: calc(100% - 12vw);
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

@media (max-width: 768px) {
  main {
    margin-left: 0;
    width: 100%;
    padding: 16px;
  }
}
</style>