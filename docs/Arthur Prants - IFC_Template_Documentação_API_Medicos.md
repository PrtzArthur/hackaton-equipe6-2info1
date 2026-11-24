**Modelo de documento técnico**
 
**Projeto do Hackathon | API e CRUD com JSON Server**
 
Este modelo apresenta a documentação da entidade Médico. Cada equipe deverá adaptar a estrutura às entidades do seu projeto e repetir as seções para cada CRUD, identificando o integrante responsável.
 
**1 Identificação**
 
| Informação | Preenchimento |
| :---- | :---- |
| Nome do projeto | IFChat |
| Turma e equipe | 2info1 / Arthur Prants, Bruno Fuckner, Pietro Gonçalves, Victor Hugo, Angelo Ferrari e Eduarda Gonçalves |
| Repositório | https://github.com/PrtzArthur/hackaton-equipe6-2info1 |
| Entidade documentada | Postagem |
| Integrante responsável | Arthur Prants |
| Versão e data | 1.0 / 20/11/2026 |
 
**2 Finalidade da entidade**
 
Representar as publicações do feed do IFChat, que podem ser postagens comuns (texto, imagem e tags) ou postagens com enquete. O CRUD permitirá cadastrar, listar, consultar, atualizar e excluir seus registros.
 
**3 Campos e regras**
 
| Campo | Tipo | Obrigatório | Descrição ou regra |
| ----- | :---- | :---- | :---- |
| `id` | Texto | Automático | Identificador único gerado pela API no cadastro. |
| `usuarioId` | Texto | Sim | id do autor na coleção usuários; deve ser de um usuário existente. |
| `tipo` | Texto | Sim | `postagemComum` ou `postagemComEnquete`. |
| `conteudo` | Texto | Sim | Texto da postagem; não aceitar somente espaços. |
| `imagem` | Texto | Não | Endereço da imagem anexada; vazio quando não há imagem. |
| `tags` | Lista de textos | Não | Tags sem o #, por exemplo souifc. |
| `opcoes` | Lista de objetos | Somente em enquete | Cada opção tem `id_opcao`, `texto_opcao` e `porcentagem`. Previsto: mínimo de 2 opções em enquete; vazia em postagem comum. |
| `totalVotosGeral` | Número | Não | Total de votos da enquete; começa em 0. |
| `total_likes` | Número | Não | Total de curtidas; começa em 0. |
| `total_dislikes` | Número | Não | Total de dislikes; começa em 0. |
| `data_envio` | Texto | Sim | Data e hora do envio: definida pela aplicação no cadastro. |
 
**Dados de exemplo:** utilizar registros fictícios, sem dados pessoais reais. As regras dos campos devem ser implementadas e verificadas pela aplicação; descrevê-las aqui não cria validações automáticas no JSON Server.
 
Desenvolvimento Web 2 | Modelo de documentação de API 1
 
**Endpoints e exemplos**
 
**4 Endpoints da entidade Postagem**
 
**URL base:** http://localhost:3001 (porta definida no script `api` do `Frontend/package.json`)
 
**Coleção no db.json:** `postagens`
 
O JSON Server disponibiliza os endpoints a partir da coleção. Substituir `:id` pelo identificador real, por exemplo `/postagens/1`.
 
| Método | Endpoint | O que deverá ser feito | Retorno de sucesso |
| :---- | :---- | :---- | ----- |
| GET | `/postagens` | Listar todas as postagens (feed). | 200 OK |
| GET | `/postagens?usuarioId=:id` | Listar as postagens de um usuário (perfil). | 200 OK |
| GET | `/postagens/:id` | Exibir os dados de uma postagem pelo ID. | 200 OK |
| POST | `/postagens` | Cadastrar uma nova postagem. | 201 Created |
| PATCH | `/postagens/:id` | Atualizar somente os campos enviados. | 200 OK |
| DELETE | `/postagens/:id` | Excluir a postagem identificada pelo ID. | 200 OK |
 
**Atualização escolhida:** PATCH. **Justificativa:** a edição altera apenas o conteúdo (e, em outros fluxos, contadores como curtidas), então enviar somente os campos modificados evita sobrescrever o restante do registro. O PUT não será implementado.
 
**5 Corpo das requisições**
 
**POST /postagens** - exemplo de dados enviados para cadastro de postagem comum. Usar o cabeçalho Content-Type: application/json. Não enviar um ID fixo para novos registros.
 
```json
{
  "usuarioId": "1",
  "tipo": "postagemComum",
  "conteudo": "Postagem de exemplo para testes.",
  "imagem": "",
  "tags": ["souifc", "ifchat"],
  "opcoes": [],
  "totalVotosGeral": 0,
  "total_likes": 0,
  "total_dislikes": 0,
  "data_envio": "2026-11-23T15:00:00.000Z"
}
```
 
**POST /postagens** - exemplo com enquete:
 
```json
{
  "usuarioId": "2",
  "tipo": "postagemComEnquete",
  "conteudo": "Qual linguagem vocês preferem?",
  "imagem": "",
  "tags": ["enquete"],
  "opcoes": [
    { "id_opcao": "op1", "texto_opcao": "JavaScript", "porcentagem": 0 },
    { "id_opcao": "op2", "texto_opcao": "Python", "porcentagem": 0 }
  ],
  "totalVotosGeral": 0,
  "total_likes": 0,
  "total_dislikes": 0,
  "data_envio": "2026-11-23T15:10:00.000Z"
}
```
 
**PATCH /postagens/1** - exemplo de alteração de um campo:
 
```json
{
  "conteudo": "Texto da postagem corrigido."
}
```
 
**GET e DELETE:** neste CRUD, não precisam de um corpo JSON.
 
**6 Relacionamentos**
 
* **Postagem pertence a um usuário:** cada postagem tem `usuarioId`, cujo valor corresponde ao `id` de um usuário existente em `usuarios`.
* **Postagem pode ter vários comentários:** a coleção `comentarios` tem o campo `postagemId`, que corresponde ao `id` de uma postagem.
* **Postagem pode ser salva em listas:** a coleção `listas` tem o campo `postagensIds`, com os `id` das postagens salvas.
Essas relações dependem das regras implementadas pela equipe.
 
**Regra proposta:** ao excluir uma postagem, remover o id dela de `postagensIds` nas listas e tratar os comentários vinculados, para não deixar referências quebradas. O JSON Server não deve ser tratado como responsável automático por essa regra.
 
Desenvolvimento Web 2 | Modelo de documentação de API 2
 
**Validações e verificação**
 
**7 Telas e comportamento esperado**
 
| Tela ou ação | Responsabilidade do CRUD |
| :---- | :---- |
| Listagem (feed da HomeView e postagens do perfil na UsuarioView) | Buscar registros; mostrar carregamento, lista vazia e falha. |
| Cadastro (CriarView) | Validar conteúdo (e opções, em enquete); enviar POST. |
| Detalhes | Consultar GET por ID e tratar registro não encontrado. |
| Edição (HomeView) | Carregar dados, validar e enviar PATCH. |
| Exclusão (HomeView e UsuarioView) | Solicitar confirmação, verificar vínculos e enviar DELETE. |
 
Após cadastrar, editar ou excluir, atualizar a listagem. Não apresentar sucesso antes de verificar a resposta da API. Cancelar uma exclusão não deve enviar DELETE.
 
**8 Códigos de resposta**
 
| Código | Significado | Aplicação no documento |
| :---- | :---- | :---- |
| 200 | Requisição concluída com sucesso. | Listagem ou consulta por ID. |
| 201 | Recurso criado. | Cadastro de postagem por POST. |
| 400 | Requisição inválida. | Registrar quando observado; não presumir validação dos campos na API. |
| 404 | Recurso não encontrado. | Consulta a um ID de postagem inexistente. |
| 500 | Erro interno do servidor. | Tratar se ocorrer; não é necessário provocar. |
 
Esses códigos são referências de interpretação. Nos testes, registrar o código realmente retornado pela versão da API utilizada (JSON Server 1.0.0-beta.15). Se uma operação retornar 204 No Content, não tentar ler seu corpo com `resposta.json()`.
 
**9 Registro dos testes do integrante**
 
| Operação | Teste a realizar | Código observado | Resultado |
| :---- | :---- | :---- | :---- |
| Cadastrar | Enviar dados válidos. | 201 | OK: postagem criada (comum, com enquete e com imagem). |
| Listar | Conferir o registro criado. | 200 | OK: registro exibido no feed. |
| Consultar ID | Consultar o ID criado e um inexistente. | 200 (ID existente) | OK para ID existente; consulta de ID inexistente (404) ainda não testada. |
| Atualizar | Alterar e consultar novamente. | 200 | OK |
| Excluir | Excluir e confirmar ausência. | 200 | OK |
 
**Responsável pelos testes:** Arthur Prants
 
**Data:** 23/11/2026 **Atualização escolhida:** PATCH
 
**10 Organização da entrega**
 
Documentar no README ou em docs. Informar como iniciar a aplicação e a API, a versão do JSON Server e a divisão dos CRUDs. Cada integrante deverá realizar commits próprios e demonstrar seu fluxo completo. Não dividir apenas por método HTTP.
 
Desenvolvimento Web 2 | Modelo de documentação de API 3
 