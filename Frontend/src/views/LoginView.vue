<script setup>
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

const router = useRouter();

const emailOuHandle = ref('');
const senha = ref('');

const realizarLogin = async () => {
try {
    const resposta = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOuHandle: emailOuHandle.value.trim(),
        senha: senha.value
      })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      localStorage.setItem('ifchat_token', dados.token);
      alert('Login efetuado com sucesso!');
      router.push('/home');
    } else {
      alert(dados.erro || 'Falha ao autenticar.');
    }
  } catch (erro) {
    console.error('Erro de conexão com o servidor:', erro);
    alert('Erro de conexão: Garanta que a sua API Node está ligada no terminal.');
  }
};
</script>

<template>
  <main>
    <div class="Card-Principal">
      <header><h1>IFchat</h1></header>
      <div class="Div-Central">
        <form @submit.prevent="realizarLogin" autocomplete="off">
          <div class="Agrupacao">
            <label for="email" class="labels">Email ou Handle</label>
            <input v-model="emailOuHandle" type="text" placeholder="exemplo@email.com" id="email" required>
          </div>
          <div class="Agrupacao">
            <label for="senha" class="labels">Senha</label>
            <input v-model="senha" type="password" placeholder="Senha" id="senha" required>
            <RouterLink class="LinkRecSenha">Esqueceu a senha?</RouterLink>
          </div>
          <button type="submit" class="BotaoEntrar">Entrar</button>
          <p class="direcionarParaCadastro">Não tem uma conta? <RouterLink to="/cadastro">Crie uma</RouterLink></p>
        </form>
      </div>
    </div>
  </main>
</template>

<style scoped>
a:hover {
  color: blue;
}
button.BotaoEntrar:hover {
  background-color: #37ad00;
  transition: 0.2s;
}
main {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(85, 255, 51, 0.14);
  padding: 1vw;
  min-height: 100vh;
}
main a.LinkRecSenha {
  text-decoration: none;
  align-self: flex-end;
  font-size: 0.9vw;
}
main button.BotaoEntrar {
  background-color: #3CBC00;
  color: white;
  border: none;
  cursor: pointer;
  width: 100%;
  padding: 0.8vw 1vw;
  margin-top: 1vw;
  font-weight: bolder;
  font-size: 1vw;
  border-radius: 1.8vw;
}
main div.Card-Principal {
  background-color: white;
  width: 30vw;
  border-radius: 1.2vw;
  overflow: hidden;
  box-shadow: 0 0.2vw 0.2vw rgba(0, 0, 0, 0.3);
  font-family: sans-serif;
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
  background-color: #3CBC00;
  padding: 1.2vw;
  text-align: left;
}
main header h1 {
  color: #ffffff;
  margin: 0;
  font-size: 2vw;
  font-family: sans-serif;
  font-weight: bold;
  padding-left: 0.5vw;
}
main label {
  cursor: pointer;
  font-size: 1.2vw;
  font-weight: bolder;
}
main input {
  padding: 0.6vw;
  font-size: 1vw;
  border: 0.1vw solid #ccc;
  border-radius: 0.4vw;
  outline: none;
}
main p.direcionarParaCadastro a{
  text-decoration: none;
}
main p.direcionarParaCadastro {
  text-align: center;
  margin-bottom: 0.1vw;
  margin-top: 1.2vw;
  font-size: 1.2vw;
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
  main button.BotaoEntrar {
    font-size: 4.5vw;
    padding: 3vw;
    border-radius: 6vw;
    margin-top: 2vw;
  }
  main p.direcionarParaCadastro { font-size: 4vw; margin-top: 4vw; }
  div.Agrupacao a.LinkRecSenha {
    font-size: 4vw;
  }
}
</style>
