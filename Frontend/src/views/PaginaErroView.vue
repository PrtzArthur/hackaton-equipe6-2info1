<script>
export default {
  name: "NotFound"
}
</script>

<template>
  <div class="not-found">
    <h1>404</h1>
    <p>Ops... Página não encontrada!</p>
    <router-link to="/">Voltar para a Home</router-link>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #f8e9a1, #f8e9a1);
  color: #333;
  font-family: 'Arial', sans-serif;
}

.not-found h1 {
  font-size: 8rem;
  margin: 0;
}

.not-found p {
  font-size: 1.5rem;
  margin: 1rem 0;
}

.not-found a {
  text-decoration: none;
  color: #fff;
  background: #3CBC00;
  padding: 0.8rem 1.2rem;
  border-radius: 5px;
  transition: background 0.3s;
}

.not-found a:hover {
  background: #555;
}
</style>
