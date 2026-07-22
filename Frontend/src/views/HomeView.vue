<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

const logout = () => {
  localStorage.removeItem('ifchat_token')
  alert('Você saiu da conta!')
  router.push('/')
}


</script>

<template>
  <main>
    <button @click="logout" class="logout">Logout</button>

  </main>
</template>

<style scoped>
.logout {
  background-color: orange;
  padding: 3vw;
  color: fff;
}


</style>

