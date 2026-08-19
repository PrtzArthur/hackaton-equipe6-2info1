<script setup>
import { ref } from 'vue'
const notificacoes = ref([])
</script>

<template>
  <main>
    <section class="notifications-card">
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
    </section>
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
  background-color: #fff;
  position: fixed;
  width: 40%;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translate(-50%);
  margin-top: 4vw;
  margin-bottom: 3vw;
  border-radius: 9px;
  border: 1px solid #000;
  scrollbar-color: #ccc transparent;
  overflow-y: auto;
  scrollbar-width: thin;
  padding: 2px;
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
