<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const nomeUsuario = ref('Carregando...');
const statusOnline = ref(false);
const biografia = ref('');
const localizacao = ref('');
const postagens = ref([]);

const idUsuarioDaURL = route.params.id;

const carregarDadosDoPerfil = async () => {
  try {
    const respostaPerfil = await fetch(`http://localhost:3000/api/usuarios/${idUsuarioDaURL}`);
    const dadosPerfil = await respostaPerfil.json();

    if (respostaPerfil.ok) {
      nomeUsuario.value = dadosPerfil.nome;
      statusOnline.value = dadosPerfil.status_online;
      biografia.value = dadosPerfil.biografia;
      localizacao.value = dadosPerfil.localizacao;
    }

    const respostaPosts = await fetch(`http://localhost:3000/api/postagens/usuario/${idUsuarioDaURL}`);
    postagens.value = await respostaPosts.json();

  } catch (erro) {
    console.error("Erro ao buscar dados do perfil:", erro);
  }
};
onMounted(() => {
  carregarDadosDoPerfil();
});
</script>

<template>
  <main>

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
</style>

