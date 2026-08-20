<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  novosUsuarios: Array
})

const emit = defineEmits(['navegar', 'alternar-seguir'])

const buscaNovosUsuarios = ref('')
const ordenacao = ref('mais-recente')

const novosUsuariosFiltrados = computed(() => {
  let lista = props.novosUsuarios.filter(u => 
    u.nome.toLowerCase().includes(buscaNovosUsuarios.value.toLowerCase())
  )

  if (ordenacao.value === 'mais-seguido') {
    return lista.sort((a, b) => b.seguidores.localeCompare(a.seguidores))
  } else if (ordenacao.value === 'mais-postagens') {
    return lista.sort((a, b) => b.postagensQtd - a.postagensQtd)
  } else {
    return lista.sort((a, b) => a.dataRegistro - b.dataRegistro)
  }
})
</script>

<template>
  <div class="find-container">
    <div class="top-search-area">
      <button class="back-btn" @click="emit('navegar', 'chat')" title="Voltar ao Chat">← Voltar</button>
      <div class="search-box large-search">
        <input type="text" v-model="buscaNovosUsuarios" placeholder="Procurar por usuário" />
        <span class="search-icon">🔍︎</span>
      </div>
    </div>

    <div class="find-main-content">
      <div class="users-card-container">
        <div class="users-scroll">
          <div 
            v-for="user in novosUsuariosFiltrados" 
            :key="user.id" 
            class="user-row-card"
          >
            <div class="user-row-left">
              <div class="avatar-icon">👤</div>
              <div class="user-details">
                <strong>{{ user.nome }}</strong>
                <span class="user-status-text">● {{ user.status }}</span>
                <span class="followers-count">{{ user.seguidores }} seguidores</span>
              </div>
            </div>

            <button 
              :class="['follow-btn', { following: user.seguindo }]" 
              @click="emit('alternar-seguir', user)"
            >
              {{ user.seguindo ? 'Seguindo' : 'Seguir' }}
            </button>
          </div>
        </div>
      </div>

      <div class="order-by-box">
        <select v-model="ordenacao">
          <option value="mais-recente">Mais recente</option>
          <option value="mais-seguido">Mais seguido</option>
          <option value="mais-postagens">Com mais postagens</option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped>
.find-container {
  width: 100%;
  max-width: 950px;
  height: 88vh;
  margin: 0 auto;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.top-search-area {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
}

.back-btn {
  position: absolute;
  left: 0;
  background: #ffffff;
  border: 1px solid #000000;
  border-radius: 16px;
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
}

.large-search {
  width: 380px;
}

.search-box {
  display: flex;
  align-items: center;
  border: 1px solid #000000;
  border-radius: 20px;
  padding: 6px 14px;
  background: #ffffff;
}

.search-box input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 0.82rem;
  color: #555555;
}

.search-icon {
  font-size: 0.85rem;
  color: #000000;
}

.find-main-content {
  display: flex;
  justify-content: center;
  gap: 30px;
  height: calc(100% - 60px);
  position: relative;
}

.users-card-container {
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 4px;
  width: 420px;
  height: 100%;
  box-sizing: border-box;
  padding: 16px;
}

.users-scroll {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
}

.user-row-card {
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-row-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-icon {
  font-size: 1.8rem;
  line-height: 1;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.user-details strong {
  font-size: 0.9rem;
  color: #000000;
}

.user-status-text {
  font-size: 0.68rem;
  color: #aaaaaa;
}

.followers-count {
  font-size: 0.68rem;
  color: #999999;
}

.follow-btn {
  background-color: #33cc00;
  color: #ffffff;
  border: 1px solid #000000;
  border-radius: 20px;
  padding: 6px 22px;
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
}

.follow-btn.following {
  background-color: #e0e0e0;
  color: #333333;
}

.order-by-box {
  position: absolute;
  right: 20px;
  top: 0;
}

.order-by-box select {
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.88rem;
  font-weight: bold;
  cursor: pointer;
  outline: none;
}

@media (max-width: 768px) {
  .find-container {
    height: 90vh;
  }

  .top-search-area {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .back-btn {
    position: static;
    align-self: flex-start;
  }

  .large-search {
    width: 100%;
  }

  .find-main-content {
    flex-direction: column;
    height: calc(100% - 100px);
  }

  .users-card-container {
    width: 100%;
    flex: 1;
  }

  .order-by-box {
    position: static;
    display: flex;
    justify-content: flex-end;
  }

  .order-by-box select {
    width: 100%;
  }
}
</style>