<script setup>
defineProps({
  evento: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])
</script>

<template>
  <div class="event-item" @click="emit('click')">
    <div class="event-info">
      <strong>{{ evento.titulo }}</strong>
      <span class="event-date">{{ evento.data }}</span>
      <span class="event-attendees">{{ evento.membros }}</span>
    </div>
    <div :class="['status-badge', evento.confirmado ? 'confirmed' : 'pending']">
      {{ evento.confirmado ? '✔' : '✓' }}
    </div>
  </div>
</template>

<style scoped>
.event-item {
  border: 1px solid #000000;
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  background-color: #ffffff;
  cursor: pointer;
  box-sizing: border-box;
}

.event-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.event-info strong {
  font-size: 0.95rem;
  color: #000000;
}

.event-date {
  font-size: 0.75rem;
  color: #888888;
}

.event-attendees {
  font-size: 0.75rem;
  color: #888888;
  text-decoration: underline;
}

.status-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.status-badge.confirmed {
  background-color: #28a745;
  color: #ffffff;
}

.status-badge.pending {
  border: 1px solid #666666;
  color: #666666;
}
</style>