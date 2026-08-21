<script setup>
defineProps({
  notificacoes: {
    type: Array,
    default: () => []
  }
})
</script>

<template>
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
</template>

<style scoped>
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