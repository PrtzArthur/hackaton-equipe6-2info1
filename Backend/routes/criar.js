import express from 'express';
import pool from '../database.js';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve('./uploads')); 
  },
  filename: (req, file, cb) => {
    const sufixoUnico = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + sufixoUnico + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
router.get('/feed/global', async (req, res) => {
  const meuIdLogado = req.query.meuId || '';
  const pagina = parseInt(req.query.page, 10) || 1;
  let termoBusca = '';
  
  if (req.query.busca) {
    try {
      termoBusca = decodeURIComponent(req.query.busca).trim();
    } catch (e) {
      console.error('Erro ao ler a busca', e);
      termoBusca = req.query.busca.trim();
    }
  }
  if (termoBusca === 'undefined' || termoBusca === 'null') {
    termoBusca = '';
  }

  const limiteItens = 6; 
  const deslocamentoOffset = parseInt((pagina - 1) * limiteItens, 10);
  
  try {
    let filtroSQL = '';
    const parametrosQuery = [];

    if (termoBusca.trim() !== '') {
      filtroSQL = ` AND LOWER(p.conteudo) LIKE CONCAT('%', LOWER(?), '%') `;
      parametrosQuery.push(termoBusca.trim().toLowerCase());
    }
    const querySQL = `
      SELECT p.id_postagem, p.conteudo, p.data_envio, p.tipo, p.id_usuario,
             u.nome, u.username, u.foto_profile,
             m.imagem_anexada AS imagem,
             COALESCE(SUM(CASE WHEN c.tipo_voto = 'like' THEN 1 ELSE 0 END), 0) AS total_likes,
             COALESCE(SUM(CASE WHEN c.tipo_voto = 'dislike' THEN 1 ELSE 0 END), 0) AS total_dislikes
      FROM Postagem p
      JOIN Usuario u ON p.id_usuario = u.id_usuario
      LEFT JOIN Curtida c ON p.id_postagem = c.id_postagem
      LEFT JOIN Midia_Postagem m ON p.id_postagem = m.id_postagem
      WHERE 1=1 ${filtroSQL}
      GROUP BY p.id_postagem, p.conteudo, p.data_envio, p.tipo, p.id_usuario, u.nome, u.username, u.foto_profile, m.imagem_anexada
      ORDER BY p.data_envio DESC
      LIMIT ${limiteItens} OFFSET ${deslocamentoOffset}
    `;
    const [postagensBanco] = await pool.query(querySQL, parametrosQuery);
    const postagensProcessadas = [];

    for (const post of (postagensBanco || [])) {
      let meuVotoNoPost = null;
      let tagsFormatadas = [];
      let opcoesEnquete = [];
      let jaVotouNaEnquete = false;
      let totalVotosGeral = 0;
      let naoSalvoStatus = true; 

      try {
        if (meuIdLogado) {
          const [checaVoto] = await pool.query(
            'SELECT tipo_voto FROM Curtida WHERE id_usuario = ? AND id_postagem = ?',
            [meuIdLogado, post.id_postagem]
          );
          if (checaVoto && checaVoto.length > 0 && checaVoto[0]) {
            meuVotoNoPost = checaVoto[0].tipo_voto;
          }

          const [checaSalvo] = await pool.query(
            `SELECT 1 FROM salvar_post sp
             JOIN Lista_salvos ls ON sp.id_lista = ls.id_lista
             WHERE sp.id_postagem = ? AND ls.id_usuario = ?
             LIMIT 1`,
            [post.id_postagem, meuIdLogado]
          );
          if (checaSalvo && checaSalvo.length > 0) {
            naoSalvoStatus = false;
          }
        }
      } catch (e) { 
        console.warn("Aviso: Falha ao ler curtidas ou salvamentos do post na Home.", e.message); 
      }

      try {
        const [linhasTags] = await pool.query(
          `SELECT t.nome_tag 
           FROM postagem_tag pt 
           JOIN Tag t ON pt.id_tag = t.id_tag 
           WHERE pt.id_postagem = ?`,
          [post.id_postagem]
        );
        const dadosTagsLimpos = Array.isArray(linhasTags) ? linhasTags : [linhasTags];
        
        tagsFormatadas = dadosTagsLimpos
          .filter(t => t && t.nome_tag)
          .map(t => `#${t.nome_tag}`);
          
      } catch (e) { 
        console.error("Falha fatal ao extrair mapeamento de tags no feed global:", e.message);
        tagsFormatadas = []; 
      }
      
      try {
        if (post.tipo === 'postagemComEnquete') {
          const [opcoes] = await pool.query(
            `SELECT id_opcao, texto_opcao FROM Opcao_enquete WHERE id_postagem = ?`,
            [post.id_postagem]
          );
          const [totalVotosBanco] = await pool.query(
            `SELECT COUNT(*) AS total 
             FROM Voto v
             JOIN Opcao_enquete oe ON v.id_opcao = oe.id_opcao
             WHERE oe.id_postagem = ?`,
            [post.id_postagem]
          );
          totalVotosGeral = totalVotosBanco && totalVotosBanco[0] ? totalVotosBanco[0].total : 0;

          if (meuIdLogado) {
            const [votoUsuarioEnquete] = await pool.query(
              `SELECT v.id_opcao 
               FROM Voto v
               JOIN Opcao_enquete oe ON v.id_opcao = oe.id_opcao
               WHERE v.id_usuario = ? AND oe.id_postagem = ?`,
              [meuIdLogado, post.id_postagem]
            );
            if (votoUsuarioEnquete && votoUsuarioEnquete.length > 0) {
              jaVotouNaEnquete = true;
            }
          }

          for (const op of (opcoes || [])) {
            const [votosDaOpcao] = await pool.query(
              `SELECT COUNT(*) AS total FROM Voto WHERE id_opcao = ?`,
              [op.id_opcao]
            );
            const totalVotosOpcao = votosDaOpcao && votosDaOpcao[0] ? votosDaOpcao[0].total : 0;
            const porcentagemCalculada = totalVotosGeral > 0 ? Math.round((totalVotosOpcao / totalVotosGeral) * 100) : 0;

            let votadoPorMim = false;
            if (meuIdLogado) {
              const [checaOpcaoUnica] = await pool.query(
                `SELECT * FROM Voto WHERE id_usuario = ? AND id_opcao = ?`,
                [meuIdLogado, op.id_opcao]
              );
              if (checaOpcaoUnica && checaOpcaoUnica.length > 0) votadoPorMim = true;
            }

            opcoesEnquete.push({
              id_opcao: op.id_opcao,
              texto_opcao: op.texto_opcao,
              porcentagem: porcentagemCalculada,
              votadoPorMim: votadoPorMim
            });
          }
        }
      } catch (e) { 
        console.warn(`Aviso: Falha na estrutura de enquete da Home no post ${post.id_postagem}:`, e.message); 
      }
      
      postagensProcessadas.push({
        id_postagem: post.id_postagem,
        conteudo: post.conteudo,
        data_envio: post.data_envio,
        tipo: post.tipo,
        imagem: post.imagem,
        meu_voto_post: meuVotoNoPost,
        total_likes: post.total_likes,
        total_dislikes: post.total_dislikes,
        naoSalvo: naoSalvoStatus, 
        autor: {
          id: post.id_usuario,
          nome: post.nome,
          username: post.username,
          foto: post.foto_profile
        },
        opcoes: opcoesEnquete,               
        tags: tagsFormatadas,                   
        jaVotado: jaVotouNaEnquete,
        totalVotosGeral: totalVotosGeral
      });
    }
    return res.json(postagensProcessadas);

  } catch (error) {
    console.error('Erro no MySQL ao renderizar feed paginado da Home:', error);
    return res.status(500).json({ erro: 'Erro interno ao processar timeline global.' });
  }
});
router.get('/sidebar/sugestoes', async (req, res) => {
  const meuId = req.query.meuId || '';

  if (!meuId || meuId === 'undefined') {
    return res.status(400).json({ erro: 'ID do usuário logado é obrigatório para filtrar sugestões.' });
  }

  try {
    const querySQL = `
      SELECT id_usuario, nome, username, foto_profile 
      FROM Usuario 
      WHERE id_usuario != ? 
        AND id_usuario NOT IN (
          SELECT id_seguido FROM seguidores WHERE id_seguidor = ?
        )
      ORDER BY RAND() 
      LIMIT 4
    `;
    const [sugestoes] = await pool.query(querySQL, [meuId, meuId]);
    return res.json(sugestoes || []);

  } catch (error) {
    console.error('Erro no MySQL ao processar sugestões inteligentes:', error);
    return res.status(500).json({ erro: 'Erro interno ao processar painel lateral.' });
  }
});
router.get('/sidebar/topicos', async (req, res) => {
  try {
    try {
      const querySQL = `
        SELECT t.nome_tag AS nome, COUNT(pt.id_postagem) AS total
        FROM Tag t
        LEFT JOIN postagem_tag pt ON t.id_tag = pt.id_tag
        GROUP BY t.id_tag, t.nome_tag
        ORDER BY total DESC, t.nome_tag ASC
        LIMIT 6
      `;
      const [topicos] = await pool.query(querySQL);
      return res.json(topicos || []);
    } catch (errTabela) {
      console.error(errTabela)
      const [tagsLimpas] = await pool.query('SELECT nome_tag AS nome, 0 AS total FROM Tag LIMIT 6');
      return res.json(tagsLimpas || []);
    }

  } catch (error) {
    console.error('Erro no MySQL ao buscar tópicos:', error);
    return res.status(500).json({ erro: 'Erro ao processar tópicos.' });
  }
});
router.post('/enquetes/votar/opcao', async (req, res) => {
    const { idUsuario, idOpcao, idPostagem } = req.body;

    let conexao = null;
    try {
        conexao = await pool.getConnection();
        await conexao.beginTransaction();
        
        const [votoExistente] = await conexao.query(
          `SELECT v.id_opcao FROM Voto v 
           JOIN Opcao_enquete o ON v.id_opcao = o.id_opcao 
           WHERE v.id_usuario = ? AND o.id_postagem = ?`,
          [idUsuario, idPostagem]
        );

        let statusFinal = 'votado';
        const linhasVoto = votoExistente || [];

        if (linhasVoto.length > 0) {
          const idOpcaoAntiga = linhasVoto[0].id_opcao;
          
          if (idOpcaoAntiga === idOpcao) {
            await conexao.query(
              'DELETE FROM Voto WHERE id_usuario = ? AND id_opcao = ?',
              [idUsuario, idOpcao]
            );
            statusFinal = 'desmarcado';
          } else {
            await conexao.query(
              'DELETE FROM Voto WHERE id_usuario = ? AND id_opcao = ?',
              [idUsuario, idOpcaoAntiga]
            );
            await conexao.query(
              'INSERT INTO Voto (id_usuario, id_opcao) VALUES (?, ?)',
              [idUsuario, idOpcao]
            );
            statusFinal = 'votado';
          }
        } else {
          await conexao.query(
            'INSERT INTO Voto (id_usuario, id_opcao) VALUES (?, ?)',
            [idUsuario, idOpcao]
          );
          statusFinal = 'votado';
        }
        
        await conexao.commit();
        conexao.release();
        conexao = null;
        const [totalBanco] = await pool.query(
          `SELECT COUNT(*) AS total FROM Voto v 
           JOIN Opcao_enquete oe ON v.id_opcao = oe.id_opcao WHERE oe.id_postagem = ?`,
          [idPostagem]
        );
        const linhasTotal = totalBanco || [];
        const novoTotalGeral = linhasTotal.length > 0 ? (linhasTotal[0].total || 0) : 0;

        const [opcoesBanco] = await pool.query(
          `SELECT id_opcao, texto_opcao FROM Opcao_enquete WHERE id_postagem = ?`,
          [idPostagem]
        );

        const novasOpcoesProcessadas = [];
        for (const op of (opcoesBanco || [])) {
          const [votosOp] = await pool.query(`SELECT COUNT(*) AS total FROM Voto WHERE id_opcao = ?`, [op.id_opcao]);
          const linhasVotosOp = votosOp || [];
          const totalVotosOpcao = linhasVotosOp.length > 0 ? (linhasVotosOp[0].total || 0) : 0;
          
          const novaPorcentagem = novoTotalGeral > 0 ? Math.round((totalVotosOpcao / novoTotalGeral) * 100) : 0;
          
          const [checaSeVotou] = await pool.query(
            `SELECT * FROM Voto WHERE id_usuario = ? AND id_opcao = ?`, 
            [idUsuario, op.id_opcao]
          );
          const linhasChecaVoto = checaSeVotou || [];

          novasOpcoesProcessadas.push({
            id_opcao: op.id_opcao,
            texto_opcao: op.texto_opcao,
            porcentagem: novaPorcentagem,
            votadoPorMim: (linhasChecaVoto.length > 0)
          });
        }

        return res.json({ 
          mensagem: 'Voto processado com sucesso!', 
          status: statusFinal,
          novasOpcoes: novasOpcoesProcessadas,
          totalVotosGeral: novoTotalGeral,
          jaVotado: statusFinal === 'desmarcado' ? novasOpcoesProcessadas.some(o => o.votadoPorMim) : true
        });
        
    } catch(erro) {
        if (conexao) await conexao.rollback();
        console.error('Não foi possível registrar o voto:', erro);
        return res.status(500).json({ erro: 'Erro interno ao processar transação de enquete.' });
    } finally {
        if (conexao) conexao.release();
    }
});
router.delete('/comentarios/deletar/:idComentario', async (req, res) => {
  const { idComentario } = req.params;
  const { idUsuarioLogado } = req.body;

  if (!idUsuarioLogado) {
    return res.status(400).json({ erro: 'Usuário não identificado.' });
  }

  try {
    const [comentario] = await pool.query(
      'SELECT id_usuario FROM Comentario WHERE id_comentario = ?',
      [idComentario]
    );
    const linhasComentario = comentario || [];

    if (linhasComentario.length === 0) {
      return res.status(404).json({ erro: 'Comentário não encontrado.' });
    }
    if (linhasComentario[0].id_usuario !== idUsuarioLogado) {
      return res.status(403).json({ erro: 'Você não tem permissão para apagar o comentário de outra pessoa!' });
    }
    
    await pool.query('DELETE FROM Comentario WHERE id_comentario = ?', [idComentario]);
    return res.json({ mensagem: 'Comentário excluído com sucesso!' });

  } catch (error) {
    console.error('erro no MySQL ao deletar comentário:', error);
    return res.status(500).json({ erro: 'Erro interno ao remover comentário.' });
  }
});
router.post('/postagens/:id', upload.single('imagem_post'), async (req, res) => {
  const { id } = req.params;
  let conexao = null;

  try {
    const { descricao, tipo } = req.body;

    conexao = await pool.getConnection();
    await conexao.beginTransaction();
    
    const opcoes = req.body.opcoes ? JSON.parse(req.body.opcoes) : [];
    const tags = req.body.tags ? JSON.parse(req.body.tags) : [];
    const idPostagem = crypto.randomUUID();

    await conexao.query(
      `INSERT INTO Postagem (id_postagem, tipo, conteudo, id_usuario) VALUES (?, ?, ?, ?)`,
      [idPostagem, tipo, descricao, id]
    );
    const arquivoEnviado = req.file;

    if (arquivoEnviado) {
      const idMidia = crypto.randomUUID();
      
      const protocolo = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const dominioAtual = `${protocolo}://${req.headers.host}`;
      const urlImagemPost = `${dominioAtual}/imagens/${arquivoEnviado.filename}`;

      await conexao.query(
        `INSERT INTO Midia_Postagem (id_midia, imagem_anexada, id_postagem) VALUES (?, ?, ?)`,
        [idMidia, urlImagemPost, idPostagem]
      );
    }

    if (tipo === 'postagemComEnquete' && opcoes.length >= 2) {
      for (const textoOpcao of opcoes) {
        const idOpcao = crypto.randomUUID();
        await conexao.query(
          `INSERT INTO Opcao_enquete (id_opcao, texto_opcao, id_postagem) VALUES (?, ?, ?)`,
          [idOpcao, textoOpcao, idPostagem]
        );
      }
    }

 if (tags && tags.length > 0) {
      const valoresParaInserirEmLote = [];
      const listaTagsReal = Array.isArray(tags) ? tags : JSON.parse(tags);

      for (const nomeTag of listaTagsReal) {
        if (nomeTag && String(nomeTag).trim() !== '') {
          const tagLimpa = String(nomeTag).replace('#', '').toLowerCase().trim();
          
          try {
            const [linhasBanco] = await conexao.query(`SELECT id_tag FROM Tag WHERE nome_tag = ?`, [tagLimpa]);
            const dadosTag = linhasBanco || [];

            let idTagReal = null;
            if (Array.isArray(dadosTag) && dadosTag.length > 0) {
              idTagReal = dadosTag[0].id_tag;
            } else if (dadosTag && dadosTag.id_tag) {
              idTagReal = dadosTag.id_tag;
            }
            if (idTagReal) {
              valoresParaInserirEmLote.push([idPostagem, idTagReal]);
              console.log(`Tag [${tagLimpa}] mapeada com ID: ${idTagReal}`);
            } else {
              console.warn(`[Aviso] A tag "${tagLimpa}" não foi encontrada na tabela global Tag.`);
            }
          } catch (errLoop) {
            console.error(`Erro ao buscar tag individual [${tagLimpa}]:`, errLoop.message);
          }
        }
      }
      if (valoresParaInserirEmLote.length > 0) {
        try {
          await conexao.query(
            `INSERT INTO postagem_tag (id_postagem, id_tag) VALUES ?`,
            [valoresParaInserirEmLote]
          );
          console.log(`SUCESSO COLETIVO: ${valoresParaInserirEmLote.length} tags cimentadas no MySQL!`);
        } catch (errTagBulk) {
          console.error("Erro crítico no Bulk Insert de tags no MySQL:", errTagBulk.message);
        }
      }
    }

    try {
      const [seguidoresComSino] = await conexao.query(
        'SELECT id_usuario_seguidor FROM notificacao_ativada WHERE id_usuario_criador = ?',
        [id]
      );
      const linhasSino = seguidoresComSino || [];

      if (linhasSino.length > 0) {
        for (const seguidor of linhasSino) {
          if (seguidor && seguidor.id_usuario_seguidor) {
            const idNotificacaoNova = crypto.randomUUID(); 
            const textoAlerta = idPostagem; 

            await conexao.query(
              `INSERT INTO Notificacao (id_notificacao, lido, tipo_notificacao, texto_notificacao, id_usuario) 
               VALUES (?, ?, ?, ?, ?)`,
              [idNotificacaoNova, false, 'novo_post', textoAlerta, seguidor.id_usuario_seguidor]
            );
          }
        }
      }
    } catch (erroSino) {
      console.error(erroSino);
    }

    await conexao.commit();
    return res.status(201).json({ mensagem: 'Postagem completa publicada com sucesso no IFchat!' });

  } catch (error) { 
    if (conexao) await conexao.rollback();
    console.error('Erro ao processar postagem complexa:', error);
    return res.status(500).json({ erro: 'Erro interno ao salvar dados da postagem.' });
  } finally {
    if (conexao) conexao.release(); 
  }
});
router.post('/comentarios/novo', async (req, res) => {
  const { idUsuario, idPostagem, conteudo } = req.body;

  if (!idUsuario || !idPostagem || !conteudo || conteudo.trim() === '') {
    return res.status(400).json({ erro: 'O conteúdo do comentário é obrigatório.' });
  }

  try {
    const idComentario = crypto.randomUUID();
    await pool.query(
      `INSERT INTO Comentario (id_comentario, conteudo_comentario, id_usuario, id_postagem) 
       VALUES (?, ?, ?, ?)`,
      [idComentario, conteudo.trim(), idUsuario, idPostagem]
    );

    const [autores] = await pool.query(
      'SELECT nome, username, foto_profile FROM Usuario WHERE id_usuario = ?',
      [idUsuario]
    );
    const linhasAutores = autores || [];

    if (linhasAutores.length === 0) {
      return res.status(404).json({ erro: 'Autor do comentário não encontrado.' });
    }
    const autorReal = linhasAutores[0]; 

    const novoComentarioObjeto = {
      id_comentario: idComentario,
      id_postagem: idPostagem,
      conteudo_comentario: conteudo.trim(),
      data_comentario: new Date(),
      nome: autorReal.nome,
      username: autorReal.username,
      foto_profile: autorReal.foto_profile,
      total_likes: 0,
      total_dislikes: 0,
      meu_voto: null
    };

    const io = req.app.get('io');
    if (io) {
      io.emit('novo_comentario_recebido', novoComentarioObjeto);
    }
    return res.status(201).json(novoComentarioObjeto);

  } catch (error) {
    console.error('ERRO CRÍTICO NO MYSQL AO SALVAR COMENTÁRIO:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao processar comentário.' });
  }
});
router.get('/postagens/:idPostagem/comentarios', async (req, res) => {
  const { idPostagem } = req.params;
  const meuIdLogado = req.query.meuId || '';
  const filtro = req.query.filtro || 'recente';

  try {
    // 💡 AJUSTE DE AGRUPAMENTO: Todos os campos selecionados incluídos no GROUP BY para blindar contra o modo ONLY_FULL_GROUP_BY da nuvem
    let querySQL = `
      SELECT c.id_comentario, c.conteudo_comentario, c.data_comentario, c.id_usuario,
             u.nome, u.username, u.foto_profile,
             COALESCE(SUM(CASE WHEN ic.tipo_interacao = 'like' THEN 1 ELSE 0 END), 0) AS total_likes,
             COALESCE(SUM(CASE WHEN ic.tipo_interacao = 'dislike' THEN 1 ELSE 0 END), 0) AS total_dislikes
      FROM Comentario c
      JOIN Usuario u ON c.id_usuario = u.id_usuario
      LEFT JOIN Interacao_Comentario ic ON c.id_comentario = ic.id_comentario
      WHERE c.id_postagem = ?
      GROUP BY c.id_comentario, c.conteudo_comentario, c.data_comentario, c.id_usuario, u.nome, u.username, u.foto_profile
    `;
    
    if (filtro === 'relevante') {
      querySQL += ` ORDER BY (total_likes - total_dislikes) DESC, c.data_comentario DESC`;
    } else {
      querySQL += ` ORDER BY c.data_comentario DESC`;
    }

    // 💡 ATALHO SEGURO: pool.query executa a busca e limpa o pool de conexões sozinho
    const [comentarios] = await pool.query(querySQL, [idPostagem]);
    const listaFinalComentarios = [];

    for (const c of (comentarios || [])) {
      let votoDoVisitante = null;

      if (meuIdLogado) {
        const [votos] = await pool.query(
          'SELECT tipo_interacao FROM Interacao_Comentario WHERE id_usuario = ? AND id_comentario = ?',
          [meuIdLogado, c.id_comentario]
        );
        const linhasVotos = votos || [];
        
        // 🛡️ BLINDAGEM: Acessa a primeira posição de forma segura contra undefined
        if (linhasVotos.length > 0 && linhasVotos[0]) {
          votoDoVisitante = linhasVotos[0].tipo_interacao;
        }
      }
      
      listaFinalComentarios.push({
        ...c,
        meu_voto: votoDoVisitante,
        autor: c.id_usuario
      });
    }

    return res.json(listaFinalComentarios);

  } catch (error) {
    console.error('Erro ao buscar lista de comentários filtrada:', error);
    return res.status(500).json({ erro: 'Erro interno ao carregar discussões.' });
  }
});
router.post('/curtir/postagem', async (req, res) => {
  const { idDoUsuario, idDaPostagem, tipoVoto } = req.body;

  if (!idDoUsuario || !idDaPostagem || !['like', 'dislike'].includes(tipoVoto)) {
    return res.status(400).json({ erro: 'Dados inválidos ao curtir' });
  }

  try {
    const [registros] = await pool.query(
      `SELECT tipo_voto FROM Curtida WHERE id_usuario = ? AND id_postagem = ?`,
      [idDoUsuario, idDaPostagem]
    );
    const linhasRegistros = registros || [];

    if (linhasRegistros.length > 0 && linhasRegistros[0]) {
      const votoAntigo = linhasRegistros[0].tipo_voto; 

      if (votoAntigo === tipoVoto) {
        await pool.query(
          'DELETE FROM Curtida WHERE id_usuario = ? AND id_postagem = ?',
          [idDoUsuario, idDaPostagem]
        );
        return res.json({ status: 'anulado', mensagem: 'Voto removido!', votoAtual: null });
      } else {
        await pool.query(
          'UPDATE Curtida SET tipo_voto = ? WHERE id_usuario = ? AND id_postagem = ?',
          [tipoVoto, idDoUsuario, idDaPostagem]
        );
        return res.json({ status: 'invertido', message: 'Voto atualizado!', votoAtual: tipoVoto });
      }
    } else {
      await pool.query(
        'INSERT INTO Curtida (id_usuario, id_postagem, tipo_voto) VALUES (?, ?, ?)',
        [idDoUsuario, idDaPostagem, tipoVoto]
      );
      return res.json({ status: 'computado', mensagem: 'Curtida salva!', votoAtual: tipoVoto });
    }
  } catch(erro) {
    console.error('Não foi possível curtir o post', erro);
    return res.status(500).json({ erro: 'Erro interno no banco.' });
  }
});
router.post('/postagens/comentarios/votar', async (req, res) => {
  const { idUsuario, idComentario, tipoVoto } = req.body;

  if (!idUsuario || !idComentario || !['like', 'dislike'].includes(tipoVoto)) {
    return res.status(400).json({ erro: 'Dados inválidos fornecidos para votação.' });
  }

  try {
    const [registros] = await pool.query(
      'SELECT tipo_interacao FROM Interacao_Comentario WHERE id_usuario = ? AND id_comentario = ?',
      [idUsuario, idComentario]
    );
    const linhasVotosComentario = registros || [];

    if (linhasVotosComentario.length > 0 && linhasVotosComentario[0]) {
      const votoSalvoAntigo = linhasVotosComentario[0].tipo_interacao;

      if (votoSalvoAntigo === tipoVoto) {
        await pool.query(
          'DELETE FROM Interacao_Comentario WHERE id_usuario = ? AND id_comentario = ?',
          [idUsuario, idComentario]
        );
        return res.json({ status: 'anulado', mensagem: 'Voto removido!', votoAtual: null });
      } else {
        await pool.query(
          'UPDATE Interacao_Comentario SET tipo_interacao = ? WHERE id_usuario = ? AND id_comentario = ?',
          [tipoVoto, idUsuario, idComentario]
        );
        return res.json({ status: 'invertido', mensagem: 'Voto atualizado!', votoAtual: tipoVoto });
      }
    } else {
      await pool.query(
        'INSERT INTO Interacao_Comentario (id_usuario, id_comentario, tipo_interacao) VALUES (?, ?, ?)',
        [idUsuario, idComentario, tipoVoto]
      );
      return res.json({ status: 'computado', mensagem: 'Voto computado com sucesso!', votoAtual: tipoVoto });
    }

  } catch (error) {
    console.error('Erro ao processar transação de voto em comentário:', error);
    return res.status(500).json({ erro: 'Erro interno ao salvar voto.' });
  }
});
router.get('/comunidades/listar', async (req, res) => {
  const meuIdLogado = req.query.meuId || '';

  try {
    const querySQL = `
      SELECT 
        c.id_comunidade, 
        c.nome_comunidade, 
        c.descricao,
        c.banner_url AS banner_url,
        (SELECT COUNT(*) FROM Participacao WHERE id_comunidade = c.id_comunidade) AS total_membros,
        u.nome AS nome_admin,
        u.username AS username_admin,
        u.foto_profile AS foto_admin,
        IF((SELECT COUNT(*) FROM comunidades_favoritas WHERE id_usuario = ? AND id_comunidade = c.id_comunidade) > 0, TRUE, FALSE) AS favoritadoPorMim
      FROM Comunidade c
      LEFT JOIN Participacao p ON c.id_comunidade = p.id_comunidade
      LEFT JOIN Usuario u ON p.id_usuario = u.id_usuario 
      GROUP BY c.id_comunidade
      ORDER BY c.nome_comunidade ASC
    `;

    const [linhas] = await pool.query(querySQL, [meuIdLogado]);
    return res.json(Array.isArray(linhas) ? linhas : (linhas ? [linhas] : []));

  } catch (error) {
    console.error('Erro no MySQL ao listar comunidades no feed global:', error);
    return res.status(500).json({ erro: 'Erro interno ao carregar canais de comunidades.' });
  }
});
router.post('/comunidades/nova/:idUsuarioCriador', async (req, res) => {
  const { idUsuarioCriador } = req.params;
  let conexao = null;

  try {
    const { nome, descricao } = req.body;

    if (!nome || !nome.trim() || !descricao || !descricao.trim()) {
      return res.status(400).json({ erro: 'O nome e a descrição da comunidade são obrigatórios.' });
    }

    conexao = await pool.getConnection();
    await conexao.beginTransaction();

    const idComunidade = crypto.randomUUID();
    await conexao.query(
      `INSERT INTO Comunidade (id_comunidade, nome_comunidade, descricao) 
       VALUES (?, ?, ?)`,
      [idComunidade, nome.trim(), descricao.trim()]
    );
    await conexao.query(
      `INSERT INTO Participacao (id_comunidade, id_usuario) VALUES (?, ?)`,
      [idComunidade, idUsuarioCriador]
    );

    await conexao.commit();
    return res.status(201).json({ 
      mensagem: 'Comunidade criada com sucesso no IFChat!', 
      idComunidade 
    });

  } catch (error) {
    if (conexao) await conexao.rollback();
    console.error('Erro no MySQL ao instanciar nova comunidade sem banner:', error);
    return res.status(500).json({ erro: 'Erro interno ao salvar dados da comunidade.' });
  } finally {
    if (conexao) conexao.release();
  }
});

export default router;


