import pool from './database.js';

async function limparTodasAsTabelas() {
  let conexao = null;
  try {
    console.log('Conectando à Aiven para iniciar a limpeza profunda...');
    conexao = await pool.getConnection();

    await conexao.query('SET FOREIGN_KEY_CHECKS = 0;');
    console.log('Trava de integridade referencial desativada.');

    const tabelas = [
      'Presenca_em_evento',
      'Evento',
      'comunidades_favoritas',
      'Participacao',
      'Comunidade',
      'salvar_post',
      'Lista_salvos',
      'Interacao_Comentario',
      'Mural_Perfil',
      'Comentario',
      'Curtida',
      'postagem_tag',
      'Usuario_Tag',
      'Tag',
      'Midia_Postagem',
      'Opcao_enquete',
      'Voto',
      'seguidores',
      'usuario_bloqueado',
      'notificacao_ativada',
      'Notificacao',
      'Mensagem',
      'Postagem',
      'Usuario'
    ];

    console.log('Removendo tabelas antigas...');
    for (const tabela of tabelas) {
      await conexao.query(`DROP TABLE IF EXISTS ${tabela};`);
      console.log(`Tabela [${tabela}] removida.`);
    }

    await conexao.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('Trava de integridade referencial reativada com sucesso!');
    
    console.log('SUCESSO ABSOLUTO: O banco de dados está 100% limpo e zerado!');
    process.exit(0);

  } catch (error) {
    console.error('Erro crítico ao limpar o banco na Aiven:', error.message);
    process.exit(1);
  } finally {
    if (conexao) conexao.release();
  }
}

limparTodasAsTabelas();
