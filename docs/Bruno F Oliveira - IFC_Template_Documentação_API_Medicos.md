**Modelo de documento técnico** 

**Projeto do Hackathon \| API e CRUD com JSON Server** 

Este modelo apresenta a documentação da entidade Médico. Cada equipe deverá adaptar a estrutura às entidades do seu projeto e repetir as seções para cada CRUD, identificando o integrante responsável. 

**1 Identificação** 

| Informação  | Preenchimento |
| :---- | :---- |
| Nome do projeto  | IFChat |
| Turma e equipe  | 2 info 1 / \[Equipe 6\] |
| Repositório  | https\://github.com/PrtzArthur/hackaton-equipe6-2info1 |
| Entidade documentada  | Mensagens |
| Integrante responsável  | Bruno Fuckner Oliveira |
| Versão e data  | v1.0 / 23/11/2026  |

**2 Finalidade da entidade** 

Representar as mensagens em contatos com  outros usuários. O CRUD permitirá enviar(criar), listar, atualizar e excluir seus registros. 

**3 Campos e regras** 

| Campo  | Tipo  | Obrigatório  | Descrição ou regra |
| ----- | :---- | :---- | :---- |
| id  | Texto  | Automático  | Identificador único gerado pela API no cadastro. |
| remetenteId  | Texto  | Sim  | ID do usuário que enviou a mensagem (deve existir em usuarios) . |
| destinatarioId  | Texto  | Sim  | ID do usuário que recebeu a mensagem (deve existir em usuários).  |
| conteudo\_mensagem  | Texto  | Sim  | Texto da mensagem; não aceitar vazio ou somente espaços.  |
| lido  | Booleano  | Não  | Indica se a mensagem foi lida (padrão ‘false’).  |
| data\_mensagem  | Texto  | sim | Data e hora do envio em formato ISO 8601\.  |

**Dados de exemplo:** utilizar registros fictícios, sem dados pessoais reais. As regras dos campos devem ser implementadas e verificadas pela aplicação; descrevê-las aqui não cria validações automáticas no JSON Server.

Desenvolvimento Web 2 \| Modelo de documentação de API 1   
**Endpoints e exemplos** 

**4 Endpoints da entidade Médico** 

**URL base de exemplo:** http\://localhost:3001

**Coleção no db.json:** mensagens 

O JSON Server disponibiliza os endpoints a partir da coleção. Substituir :id pelo identificador real, por exemplo /medicos/1. 

| Método  | Endpoint  | O que deverá ser feito  | Retorno de sucesso |
| :---- | :---- | :---- | ----- |
| GET  | /mensagens  | Listar conversas e histórico de mensagens trocadas .  | 200 OK |
| GET  | /mensagens/:id  | Consultar os dados de uma mensagem específica pelo ID.  | 200 OK |
| POST  | /mensagens  | Cadastrar/enviar uma nova mensagem no chat.  | 201 Created |
| PATCH  | /mensagens/:id  | Atualizar parcialmente apenas o campo conteudo\_mensagem.  |    200 OK |
| DELETE  | /mensagens/:id  | Excluir definitivamente a mensagem identificada pelo ID.  |    200 OK |
|  |  |  |  |

**Atualização:** cada integrante poderá implementar PUT ou PATCH, registrando a escolha e sua justificativa. Não é obrigatório implementar as duas alternativas. 

**5 Corpo das requisições** 

**POST /medicos** \- exemplo de dados enviados para cadastro. Usar o cabeçalho Content-Type: application/json. Não enviar um ID fixo para novos registros. 

{

  "remetenteId": "1",

  "destinatarioId": "2",

  "conteudo\_mensagem": "Oi\! Tudo certo para a apresentação?",

  "lido": false,

  "data\_mensagem": "2026-11-23T19:00:00.000Z"

}

**PATCH /medicos/1** \- exemplo de alteração de um campo: 

{

  "conteudo\_mensagem": "Oi\! Tudo certo para a apresentação de hoje?"

}

**PUT:** enviar os campos editáveis que deverão compor o registro completo. **GET e DELETE:** neste CRUD, não precisam de um corpo JSON. 

**6 Relacionamentos** 

Cada registro da coleção mensagens está vinculado a dois usuários da coleção usuarios por meio das chaves estrangeiras remetenteId (autor da mensagem) e destinatarioId (quem recebe a mensagem), correspondendo ao campo id de usuários existentes.  

**Regra proposta:** Só é permitido enviar mensagens após selecionar um destinatário válido na lista de conversas ou na busca de usuários, e apenas o remetente original pode editar ou excluir suas próprias mensagens.

Desenvolvimento Web 2 \| Modelo de documentação de API 2   
**Validações e verificação** 

**7 Telas e comportamento esperado** 

| Tela ou ação  | Responsabilidade do CRUD |
| :---- | :---- |
| Listagem  | Buscar usuários e mensagens ( get /mensagens); exibir indicador de carregamento, lista de conversas ativas ou aviso de falha . |
| Cadastro  | Validar se o texto não está vazio e se há destinatário selecionado; enviar POST /mensagens e atualizar o histórico na tela . |
| Detalhes  | Ao dar duplo clique na própria mensagem, consultar get /mensagens/:id antes de abrir a opção de edição/exclusão e tratar erro 404 |
| Edição  | Validar o novo texto digitado, enviar patch /mensagens/:id e atualizar o balão da mensagem na conversa . |
| Exclusão  | Solicitar confirmação (confirm), enviar DELETE /mensagens/:id e remover o balão da tela após resposta 200 OK. |

Após cadastrar, editar ou excluir, atualizar a listagem. Não apresentar sucesso antes de verificar a resposta da API. Cancelar uma exclusão não deve enviar DELETE. 

**8 Códigos de resposta** 

| Código  | Significado  | Aplicação no documento |
| :---- | :---- | :---- |
| 200  | Requisição concluída com sucesso.  | Exemplo: listagem ou consulta por ID. |
| 201  | Recurso criado.  | Exemplo: cadastro realizado por POST. |
| 400  | Requisição inválida.  | Registrar quando observado; não presumir validação dos campos na API. |
| 404  | Recurso não encontrado.  | Exemplo: consulta a um ID inexistente. |
| 500  | Erro interno do servidor.  | Tratar se ocorrer; não é necessário provocar. |

Esses códigos são referências de interpretação. Nos testes, registrar o código realmente retornado pela versão da API utilizada. Se uma operação retornar 204 No Content, não tentar ler seu corpo com resposta.json(). 

**9 Registro dos testes do integrante** 

| Operação  | Teste a realizar  | Código observado  | Resultado |
| :---- | :---- | :---- | :---- |
| Cadastrar  | Enviar dados válidos.  | 201  | Aprovado — mensagem criada e exibida no chat. |
| Listar  | Conferir o registro criado.  | 200 | Aprovado — histórico e última mensagem carregados. |
| Consultar ID  | Consultar o ID criado e um inexistente.  | 200/404 | Aprovado — retornou a mensagem existente e tratou ID inválido.  |
| Atualizar  | Alterar e consultar novamente.  | 200 | Aprovado — texto atualizado no db.json e na tela. |
| Excluir  | Excluir e confirmar ausência.  | 200 | Aprovado — mensagem removida após confirmação. |

**Responsável pelos testes:** Bruno F. Oliveira

**Data:** 21/11/2026 **Atualização escolhida:**  PATCH 

**10 Organização da entrega** 

Documentar no README ou em docs. Informar como iniciar a aplicação e a API, a versão do JSON Server e a divisão dos CRUDs. Cada integrante deverá realizar commits próprios e demonstrar seu fluxo completo. Não dividir apenas por método HTTP.

Desenvolvimento Web 2 \| Modelo de documentação de API 3 