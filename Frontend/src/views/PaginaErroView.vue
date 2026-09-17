<script>
export default {
  name: 'NotFound',
}
</script>

<template>
  <div class="not-found">
    <span class="brand">IFChat</span>
    <h1>404</h1>
    <p>Ops... Página não encontrada!</p>
    <router-link to="/">Voltar para a Home</router-link>
  </div>
</template>

<style scoped>
.not-found {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: #ffffff;
  color: var(--texto-principal);
}

.brand {
  position: absolute;
  top: 0;
  left: 0;
  padding: 1.2rem 5.1rem;
  color: #ffffff;
  background: var(--fundo-card-va);
  font-size: 2.15rem;
  font-weight: bold;
}

.not-found h1 {
  color: var(--fundo-card-va);
  font-size: clamp(6rem, 16vw, 10rem);
  line-height: 0.9;
  margin: 0;
}

.not-found p {
  margin: 1.25rem 0 2rem;
  font-size: 1.25rem;
  text-align: center;
}

.not-found a {
  border-radius: 5px;
  padding: 0.85rem 1.4rem;
  text-decoration: none;
  color: var(--texto-principal-reverso);
  background: var(--fundo-card-va);
  font-weight: 700;
  transition:
    background-color 0.3s ease,
    transform 0.3s ease;
}

.not-found a:hover {
  background: var(--fundo-card-va-hover);
  transform: translateY(-2px);
}

@media (max-width: 728px) and (orientation: portrait) {
  .not-found {
    min-height: calc(100vh - 11vw);
    padding: 1rem;
  }

  .brand {
    padding: 0.8rem 1.25rem;
    font-size: 1.4rem;
  }

  .not-found h1 {
    font-size: clamp(5rem, 24vw, 7rem);
  }

  .not-found p {
    max-width: 90vw;
    margin: 1rem 0 1.5rem;
    font-size: 1.1rem;
  }

  .not-found a {
    max-width: 90vw;
    padding: 0.8rem 1.1rem;
    text-align: center;
  }
}
</style>
