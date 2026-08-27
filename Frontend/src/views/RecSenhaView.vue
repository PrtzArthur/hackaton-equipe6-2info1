<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const email = ref('');
const carregando = ref(false);
const linkEnviado = ref(false);
const mensagemErro = ref('');

async function enviarLinkDeRecuperacao() {
  mensagemErro.value = '';

  if (!email.value) {
    mensagemErro.value = 'Por favor, informe seu e-mail.';
    return;
  }

  carregando.value = true;

  try {
    const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/usuario/recuperar-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      linkEnviado.value = true;
    } else {
      mensagemErro.value = dados.erro || 'Não foi possível enviar o link de recuperação.';
    }
  } catch (erro) {
    console.error('Erro ao solicitar recuperação de senha:', erro);
    mensagemErro.value = 'Erro de comunicação com o servidor.';
  } finally {
    carregando.value = false;
  }
}

function voltarParaLogin() {
  router.push('/login');
}
</script>

<template>
  <main class="containerPrincipal">
    <div class="cartaoRecuperacao">
      <div class="cabecalhoRecuperacao">
        <h1>IFchat</h1>
      </div>

      <div class="corpoRecuperacao">
        <template v-if="!linkEnviado">
          <h2 class="tituloRecuperacao">Esqueceu a senha?</h2>
          <p class="textoRecuperacao">
            Digite o e-mail cadastrado na sua conta e enviaremos um link para você criar uma nova senha.
          </p>

          <form @submit.prevent="enviarLinkDeRecuperacao">
            <label for="emailRecuperacao">E-mail</label>
            <input
              type="email"
              id="emailRecuperacao"
              v-model="email"
              placeholder="exemplo@email.com"
              class="inputRecuperacao"
              autofocus
            >
            <p v-if="mensagemErro" class="paragrafoVermelho">{{ mensagemErro }}</p>

            <button type="submit" class="btnEnviarLink" :disabled="carregando">
              {{ carregando ? 'Enviando...' : 'Enviar link de recuperação' }}
            </button>
          </form>
        </template>

        <template v-else>
          <div class="iconeSucesso">✓</div>
          <h2 class="tituloRecuperacao">Verifique seu e-mail</h2>
          <p class="textoRecuperacao">
            Se houver uma conta associada a <strong>{{ email }}</strong>, enviamos um link para redefinir sua senha.
          </p>
        </template>

        <button type="button" class="btnVoltarLogin" @click="voltarParaLogin">
          Voltar para o login
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.containerPrincipal {
  background-color: rgba(85, 255, 51, 0.14);
  height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.cartaoRecuperacao {
  width: 26vw;
  min-width: 320px;
  background-color: #fff;
  border: 0.8px solid #000;
  border-radius: 10px;
  overflow: hidden;
}

.cabecalhoRecuperacao {
  background-color: #3CBC00;
  padding: 1.2vw;
}

.cabecalhoRecuperacao h1 {
  color: #fff;
  margin: 0;
  font-size: 1.8vw;
}

.corpoRecuperacao {
  padding: 1.5vw;
  display: flex;
  flex-direction: column;
  gap: 0.6vw;
}

.tituloRecuperacao {
  margin: 0;
  font-size: 1.3vw;
}

.textoRecuperacao {
  margin: 0 0 0.4vw;
  color: #555;
  font-size: 0.95vw;
  line-height: 1.4;
}

.corpoRecuperacao form {
  display: flex;
  flex-direction: column;
  gap: 0.4vw;
}

.corpoRecuperacao label {
  font-weight: bold;
  font-size: 0.95vw;
}

.inputRecuperacao {
  padding: 0.6vw;
  border: 0.8px solid #000;
  border-radius: 6px;
  font-size: 0.95vw;
}

.paragrafoVermelho {
  color: #cf0000;
  margin: 0;
  font-size: 0.85vw;
}

.btnEnviarLink {
  margin-top: 0.6vw;
  padding: 0.7vw;
  border: none;
  border-radius: 20px;
  background-color: #3CBC00;
  color: #fff;
  font-weight: bold;
  font-size: 1vw;
  cursor: pointer;
}

.btnEnviarLink:hover {
  background-color: #37ad00;
}

.btnEnviarLink:disabled {
  background-color: #9dd68a;
  cursor: not-allowed;
}

.btnVoltarLogin {
  margin-top: 0.8vw;
  padding: 0;
  border: none;
  background: none;
  color: #00d2ff;
  font-weight: bold;
  font-size: 0.9vw;
  text-align: left;
  cursor: pointer;
  width: fit-content;
}

.btnVoltarLogin:hover {
  text-decoration: underline;
}

.iconeSucesso {
  width: 2.5vw;
  height: 2.5vw;
  border-radius: 50%;
  background-color: #3CBC00;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4vw;
  font-weight: bold;
  margin-bottom: 0.3vw;
}
</style>
