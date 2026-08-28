<script setup>
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';

const toast = useToast();
const router = useRouter();

const nome = ref('');
const handle = ref('');
const senha = ref('');
const confirmarSenha = ref('');
const aceitouTermos = ref('');
const email = ref('');

const realizarCadastro = async () => {
  if (senha.value !== confirmarSenha.value) {
    toast.warning('As senhas não coincidem!')
    return;
  }
  if (!aceitouTermos.value) {
    toast.warning('Você precisa aceitar os termos para prosseguir!')
    return;
  }

  try {
    const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: nome.value.trim(),
        username: handle.value.replace('@', '').trim(),
        email: email.value.trim(),
        senha: senha.value.trim()
      })
    });
    const dados = await resposta.json();

    if (resposta.ok) {

      localStorage.setItem('ifchat_token', dados.token);
      localStorage.setItem('ifchat_user_id', dados.id_usuario);
      toast.success('Sua conta foi criada com sucesso!');

      router.push('/home');
    } else {
      toast.error(dados.erro || 'Falha ao realizar o cadastro.');
    }
  } catch (erro) {
    console.error('Erro ao conectar com a API:', erro);
    toast.error('Erro de conexão: Verifique se o servidor do backend está ligado.');
  }
};

</script>

<template>
  <main>
    <div class="Card-Principal">
      <header><h1>IFChat</h1></header>
      <div class="Div-Central">
        <form @submit.prevent="realizarCadastro" autocomplete="off">
          <div class="Agrupacao">
            <label for="nome" class="labels">Nome</label>
            <input v-model="nome" type="text" maxlength="50" placeholder="Nome" id="nome" required>
          </div>
          <div class="Agrupacao">
            <label for="handle" class="labels">Handle</label>
            <input v-model="handle" type="text" minlength="8" maxlength="50" placeholder="@nome_de_exemplo" id="nome" required>
          </div>
          <div class="Agrupacao">
            <label for="email" class="labels">Email</label>
            <input v-model="email" type="email" maxlength="255" placeholder="exemplo@email.com" id="email" required>
          </div>
          <div class="Agrupacao">
            <label for="senha" class="labels">Senha</label>
            <input v-model="senha" minlength="8" maxlength="50" type="password" placeholder="Senha" id="senha" required>
          </div>
          <div class="Agrupacao">
            <label for="senha" class="labels">Confirmar senha</label>
            <input v-model="confirmarSenha" minlength="8" maxlength="50" type="password" placeholder="Senha" id="senha" required>
          </div>
          <div class="termos">
            <label for="checkBox" class="labelTermos">
            <input v-model="aceitouTermos" type="checkbox" class="checkbox" id="checkBox" required>
            <span class="texto-termo-label">
              Estou de acordo com os <RouterLink to="/termos-de-uso" @click.stop>Termos de Uso</RouterLink> e <RouterLink to="/politica-de-privacidade">Política de Privacidade</RouterLink>
            </span>
            </label>
          </div>
          <button type="submit" class="BotaoCriar">Criar</button>
          <p class="direcionarParaLogin">Já tem uma conta? <RouterLink to="/" @click.stop>Fazer login</RouterLink></p>
        </form>
      </div>
    </div>
  </main>
</template>

<style scoped>
a:hover {
  color: blue;
}
button.BotaoCriar:hover {
  background-color: var(--fundo-card-va-hover);
  transition: 0.2s;
  transform: scale(1.02);
}
button.BotaoCriar:active {
  transform: scale(0.98);
}
.texto-termo-label {
  align-items: flex-start;
  cursor: pointer;
  width: 100%;
  user-select: none;
  margin: 0 !important;
}
.checkbox ~ .texto-termo-label::before {
  content: "";
  display: inline-block;
  width: 1vw;
  height: 1vw;
  min-width: 16px;
  min-height: 16px;
  border: 0.15vw solid var(--fundo-card-va, #ccc);
  border-radius: 50%;
  background-color: var(--fundo-card);
  margin-right: 0.8vw;
  flex-shrink: 0;
  position: relative;
  top: 0.1vw;
  transition: all 0.2s ease-in-out;
}
.checkbox:checked ~ .texto-termo-label::before {
  background-color: var(--checkbox-config);
  border-color: var(--checkbox-config);
  width: 1vw;
  height: 1vw;
  box-shadow: none;
}
.checkbox:focus-visible ~ .texto-termo-label::before {
  box-shadow: 0 0 0 3px rgba(85, 255, 51, 0.4);
}
.checkbox {
  opacity: 0;
  position: absolute;
  width: 0;
  height: 0;
}
main {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1vw;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  position: fixed;
}
main button.BotaoCriar {
  background-color: var(--fundo-card-va);
  color: white;
  border: none;
  cursor: pointer;
  width: 100%;
  padding: 0.8vw 1vw;
  font-weight: bolder;
  font-size: 1vw;
  border-radius: 1.8vw;
}
main div.Card-Principal {
  background-color: var(--fundo-card);
  width: 30vw;
  border-radius: 1.2vw;
  overflow: hidden;
  box-shadow: 0 0.2vw 0.2vw rgba(0, 0, 0, 0.3);
}
main div.Agrupacao {
  display: flex;
  flex-direction: column;
  gap: 0.2vw;
  margin-bottom: 1vw;
}
main div.Div-Central {
  padding: 1vw 1.5vw;
}
main header {
  color: white;
  background-color: var(--fundo-card-va);
  padding: 1.2vw;
  text-align: left;
}
main header h1 {
  color: #ffffff;
  margin: 0;
  font-size: 2vw;
  font-weight: bold;
  padding-left: 0.5vw;
}
main label.labels {
  cursor: pointer;
  font-size: 1.2vw;
  font-weight: bolder;
}
main div.Agrupacao input {
  padding: 0.6vw;
  color: var(--texto-prinncipal);
  font-size: 1vw;
  border: 0.1vw solid #ccc;
  border-radius: 0.4vw;
  outline: none;
  background-color: var(--fundo-card);
}
main div.Agrupacao input::placeholder {
  color: var(--texto-mais-suave);
}
main p.direcionarParaLogin a{
  text-decoration: none;
}
main p.direcionarParaLogin {
  text-align: center;
  margin-bottom: 0.1vw;
  margin-top: 1.2vw;
  font-size: 1.2vw;
}
div.termos {
  display: flex;
  align-items: flex-start;
}
div.termos label {
  margin-top: 0;
  margin-bottom: 1vw;
  font-size: 1.2vw;
  cursor: pointer;
}
div.termos a {
  text-decoration: none;
}
@media (max-width:728px) {
  main {
    margin: 0;
    padding: 0;
    align-items: flex-end;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
  }
  main div.Card-Principal {
    width: 100%;
    position: fixed;
    border-radius: 4vw 4vw 0 0;
    box-shadow: none;
    bottom: 0;
    left: 0;
  }
  main header { padding: 4.5vw; }
  main header h1 { font-size: 6.5vw; padding-left: 1vw; }
  main div.Div-Central { padding: 5vw 4vw; }
  main div.Agrupacao { margin-bottom: 4vw; gap: 1vw; }
  main label.labels { font-size: 4vw; }
  main div.Agrupacao input {
    font-size: 4vw;
    padding: 2.8vw 3vw;
    border-radius: 2vw;
    border: 0.3vw solid #ccc;
  }
  div.termos { gap: 2vw; }
  div.termos label { font-size: 3.5vw; margin-bottom: 3vw; }
  .checkbox {
    transform: scale(1.6);
    margin-top: 0.5vw;
  }
  main button.BotaoCriar {
    font-size: 4.5vw;
    padding: 3vw;
    border-radius: 6vw;
    margin-top: 2vw;
  }
  main p.direcionarParaLogin { font-size: 4vw; margin-top: 4vw; }
}
</style>
