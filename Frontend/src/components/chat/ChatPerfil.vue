<script setup>
defineProps({
  conversaAtiva: Object
})

const emit = defineEmits(['navegar'])
</script>

<template>
  <div class="profile-container">
    <button class="back-icon-btn" @click="emit('navegar', 'chat')" title="Voltar">
      ↶
    </button>

    <div class="profile-card">
      <div class="profile-scroll">
        <div class="profile-banner"></div>

        <div class="profile-header">
          <div class="profile-avatar-wrapper">
            <div class="profile-avatar">👤</div>
          </div>

          <div class="profile-title-area">
            <h2>{{ conversaAtiva?.nome || 'Nome usuário' }}</h2>
            <div class="profile-status">
              <span :class="['status-dot', conversaAtiva?.online ? 'online' : 'offline']">●</span>
              <span>{{ conversaAtiva?.online ? 'Online' : 'Offline' }}</span>
            </div>
            <p class="profile-stats">
              {{ conversaAtiva?.seguidores || '45.659' }} seguidores | {{ conversaAtiva?.seguindoQtd || '12.234' }} seguindo
            </p>
          </div>
        </div>

        <div class="profile-actions-row">
          <button class="btn-grey">Seguindo</button>
          <button class="btn-circle-icon">🔔</button>
          <button class="btn-green-chat" @click="emit('navegar', 'chat')">Chat</button>
          <span class="heart-icon"></span>
        </div>

        <div class="profile-meta-info">
          <p><strong> Data de criação:</strong> {{ conversaAtiva?.dataCriacao || '00/00/0000' }}</p>
          <p><strong> Localização:</strong> {{ conversaAtiva?.localizacao || 'nenhuma localização foi adicionada.' }}</p>
        </div>

        <div class="profile-section">
          <h3>Biografia</h3>
          <div class="empty-box bio-box">
            <span class="empty-icon"></span>
            <p>{{ conversaAtiva?.biografia || 'Não há nada escrito ainda' }}</p>
          </div>
        </div>

        <div class="profile-section">
          <h3>Tags</h3>
          <div class="tags-row">
            <span v-for="(tag, index) in (conversaAtiva?.tags || ['#souIFC'])" :key="index" class="tag-badge">
              {{ tag }}
            </span>
          </div>
        </div>

        <div class="profile-section">
          <h3>Postagens</h3>
          <div class="empty-box posts-box">
            <span class="empty-icon"></span>
            <p>Ainda não há nenhuma postagem</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  width: 100%;
  max-width: 580px;
  height: 88vh;
  margin: 0 auto;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 16px;
}

.back-icon-btn {
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 6px;
  width: 38px;
  height: 38px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-card {
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 4px;
  flex: 1;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.profile-scroll {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-banner {
  background-color: #a0ff80;
  height: 120px;
  border-radius: 4px;
}

.profile-header {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  margin-top: -45px;
  padding-left: 10px;
}

.profile-avatar-wrapper {
  background: #ffffff;
  border-radius: 50%;
  padding: 4px;
}

.profile-avatar {
  width: 70px;
  height: 70px;
  border: 2px solid #000000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  background-color: #ffffff;
}

.profile-title-area h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: bold;
}

.profile-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #777777;
}

.status-dot {
  font-size: 0.65rem;
}

.status-dot.online {
  color: #33cc00;
}

.status-dot.offline {
  color: #aaaaaa;
}

.profile-stats {
  margin: 4px 0 0 0;
  font-size: 0.72rem;
  color: #888888;
}

.profile-actions-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 10px;
}

.btn-grey {
  background-color: #d9d9d9;
  border: none;
  border-radius: 16px;
  padding: 6px 20px;
  font-size: 0.82rem;
  font-weight: bold;
  color: #ffffff;
}

.btn-circle-icon {
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

.btn-green-chat {
  background-color: #33cc00;
  color: #ffffff;
  border: none;
  border-radius: 16px;
  padding: 6px 24px;
  font-size: 0.82rem;
  font-weight: bold;
  cursor: pointer;
}

.heart-icon {
  font-size: 1.4rem;
  margin-left: auto;
}

.profile-meta-info {
  font-size: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 10px;
  color: #333333;
}

.profile-meta-info p {
  margin: 0;
}

.profile-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 10px;
}

.profile-section h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: bold;
  color: #000000;
}

.empty-box {
  border: 1px solid #777777;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #888888;
  font-size: 0.82rem;
}

.bio-box {
  height: 100px;
}

.posts-box {
  height: 120px;
}

.empty-icon {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.tags-row {
  display: flex;
  gap: 8px;
}

.tag-badge {
  background-color: #eeeeee;
  border: 1px solid #cccccc;
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 0.72rem;
  font-weight: bold;
  color: #333333;
}

@media (max-width: 768px) {
  .profile-container {
    height: 90vh;
    flex-direction: column;
  }

  .back-icon-btn {
    align-self: flex-start;
  }

  .profile-actions-row {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>