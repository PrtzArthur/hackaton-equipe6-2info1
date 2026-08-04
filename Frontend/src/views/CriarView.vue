<script setup>
import { ref } from 'vue';

const mostrarTelaDeCriacao = ref(true);
const mostrarPostTela = ref(false);
const mostrarComunidadeTela = ref(false);

function mostrarTelaPost() {
  mostrarTelaDeCriacao.value = !mostrarTelaDeCriacao.value;
  mostrarPostTela.value = !mostrarPostTela.value
}
function mostrarTelaComunidade() {
  mostrarTelaDeCriacao.value = !mostrarTelaDeCriacao.value;
  mostrarComunidadeTela.value = !mostrarComunidadeTela.value
}

</script>

<template>
  <main>
    <section v-if="mostrarTelaDeCriacao" class="telaDeCriacao">
      <h2 class="tituloPrincipal">Painel de criação</h2>
      <div class="opcoesDeCriar">
        <button @click="mostrarTelaPost" class="btnTDC">Criar Postagem</button>
        <button @click="mostrarTelaComunidade" class="btnTDC">Criar Comunidade</button>
      </div>
    </section>
    <section v-if="mostrarPostTela" class="criarPost">
      <h2 class="tituloPrincipal">Painel de criação</h2>
      <form @submit.prevent=""></form>
    </section>
    <section v-if="mostrarComunidadeTela" class="criarComunidade">
      <h2 class="tituloPrincipal">Painel de criação</h2>
      <form @submit.prevent="">
        <label for="nomeComunidade">Nome da Comunidade</label>
        <input type="text" maxlength="50" id="nomeComunidade">

        <label for=""></label>
        <input type="text">
      </form>
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
}
.opcoesDeCriar {
  display: flex;
  flex-direction: column;
  margin-top: 1vw;
  gap: 0.5vw;
  margin-left: 0.5vw;
  margin-right: 0.5vw;
}
.btnTDC {
  background-color: #3CBC00;
  border-radius: 10px;
  padding: 1.5vw;
  color: #fff;
  font-weight: bolder;
  font-size: 1vw;
  border: none;
}
.btnTDC:hover {
  background-color: #37ad00;
  transition: 0.3s;
  cursor: pointer;
}
.tituloPrincipal {
  border-bottom: 1px solid #000;
  margin: -2px;
  padding: 1vw;
  font-size: 1.7vw;
}
section.telaDeCriacao {
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
.criarPost {
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
.criarComunidade {
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
</style>
