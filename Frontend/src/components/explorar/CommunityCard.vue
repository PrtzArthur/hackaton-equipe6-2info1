<script setup>
defineProps({
  nome: String,
  membros: String
})
</script>

<template>
  <div class="community-card">
    <div class="card-banner"></div>
    <div class="card-info">
      <strong>{{ nome }}</strong>
      <span>{{ membros }} membros</span>
    </div>
  </div>
</template>

<style scoped>
.community-card {
  border: 1px solid #000000;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  width: 100%;
  box-sizing: border-box;
}

.card-banner {
  background-color: #a3ff99;
  height: 90px;
  width: 100%;
  border-bottom: 1px solid #000000;
}

.card-info {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-info strong {
  font-size: 0.82rem;
  color: #000000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-info span {
  font-size: 0.72rem;
  color: #666666;
}
</style>