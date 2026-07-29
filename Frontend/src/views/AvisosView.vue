<script setup>
import { ref } from 'vue'
const notificacoes = ref([]) // É um array bem temporario em improvisado pra armazenar notificação só pra tester, valeu Bruno!
</script>

<template>
  <main>
    <div class="notifications-card">
      <header class="notifications-header">
        <h2>Notificações</h2>
      </header>
      
      <div class="notifications-body">
        <p v-if="notificacoes.length === 0" class="empty-text">
          Nenhuma notificação por enquanto.
        </p>

        <ul v-else class="notifications-list">
          <li v-for="item in notificacoes" :key="item.id">
            {{ item.titulo }}
          </li>
        </ul>
      </div>
    </div>
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
  overflow-x: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.notifications-card {
  width: 100%;
  max-width: 600px;
  height: 700px;
  max-height: 100%;
  background-color: #ffffff;
  border: 1px solid #000000;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  border-radius: 8px;
}

.notifications-header {
  padding: 16px;
  border-bottom: 1px solid #000000;
}

.notifications-header h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: bold;
  color: #000000;
}

.notifications-body {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

.empty-text {
  color: #666666;
  font-size: 0.9rem;
}

.notifications-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>
