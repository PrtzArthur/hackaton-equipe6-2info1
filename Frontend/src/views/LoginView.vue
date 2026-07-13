<script setup>

</script>

<template>
  <main>
    <div class="Card-Principal">
      <header><h1>IFchat</h1></header>
      <div class="Div-Central">
        <form @submit.prevent="">

        <div class="Agrupacao">
          <label for="email">Email</label>
          <input type="email" placeholder="exemplo@email.com" id="email">
        </div>

        <div class="Agrupacao">
          <label for="senha">Senha</label>
          <input type="text" placeholder="Senha" id="senha">
          <a href="#" class="LinkRecSenha">Esqueceu a senha?</a>
        </div>

        <button type="submit" class="BotaoEntrar">Entrar</button>

        </form>
      </div>

    </div>

  </main>
</template>

<style scoped>
main {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(85, 255, 51, 0.14);
  padding: 1rem;
  min-height: 100vh;
}
main a.LinkRecSenha {
  text-decoration: none;
  align-self: flex-end;
  font-size: 0.85rem;
}
main button.BotaoEntrar {
  background-color: #3CBC00;
  color: white;
  border: none;
  cursor: pointer;
  width: 100%;
  padding: 0.8rem 1rem;
  margin-top: 1rem;
  font-weight: bolder;
  font-size: 0.8rem;
  border-radius: 25px;
}
main div.Card-Principal {
  background-color: white;
  width: 100%;
  max-width: 440px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-family: sans-serif;
}
main div.Agrupacao {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
main div.Div-Central{
  padding: 1rem 1.5rem;

}
main header {
  color: white;
  background-color: #3CBC00;
  padding: 1.2rem;
  text-align: left;
}
main header h1 {
  color: #ffffff;
  margin: 0;
  font-size: 1.8rem;
  font-family: sans-serif;
  font-weight: bold;
  padding-left: 0.5rem;
}
main label {
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: bolder;
}

</style>
