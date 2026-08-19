import express from 'express';
import pool from '../database.js';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';   

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    const sufixoUnico = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'post-' + sufixoUnico + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
router.get('/feed/global', async (req, res) => {
  const meuIdLogado = req.query.meuId || '';
  const pagina = parseInt(req.query.page, 10) || 1;
  const limiteItens = 6; 
  const deslocamentoOffset = parseInt((pagina - 1) * limiteItens, 10);

  let conexao = null;
  try {
    conexao = await pool.getConnection();

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
      GROUP BY p.id_postagem, p.conteudo, p.data_envio, p.tipo, p.id_usuario, u.nome, u.username, u.foto_profile, m.imagem_anexada
      ORDER BY p.data_envio DESC
      LIMIT ? OFFSET ?
    `;
    const [postagensBanco] = await conexao.query(querySQL, [limiteItens, deslocamentoOffset]);
    const postagensProcessadas = [];

    for (const post of postagensBanco) {
      let meuVotoNoPost = null;
      let tagsFormatadas = [];
      let opcoesEnquete = [];
      let jaVotouNaEnquete = false;
      let totalVotosGeral = 0;
      try {
        if (meuIdLogado) {
          const [checaVoto] = await conexao.query(
            'SELECT tipo_voto FROM Curtida WHERE id_usuario = ? AND id_postagem = ?',
            [meuIdLogado, post.id_postagem]
          );
          if (checaVoto && checaVoto.length > 0) {
            meuVotoNoPost = checaVoto[0].tipo_voto;
          }
        }
      } catch (e) { console.warn("Aviso: Falha ao ler curtidas do post na Home.", e.message); }

      try {
        const [tagsBanco] = await conexao.query(
          `SELECT t.nome_tag 
           FROM postagem_tag pt 
           JOIN Tag t ON pt.id_tag = t.id_tag 
           WHERE pt.id_postagem = ?`,
          [post.id_postagem]
        );
        tagsFormatadas = tagsBanco.map(t => `#${t.nome_tag}`);
      } catch (e) { console.warn("Aviso: Falha ao ler tags do post na Home.", e.message); }
      try {
        if (post.tipo === 'postagemComEnquete') {
          const [opcoes] = await conexao.query(
            `SELECT id_opcao, texto_opcao FROM Opcao_enquete WHERE id_postagem = ?`,
            [post.id_postagem]
          );
          const [totalVotosBanco] = await conexao.query(
            `SELECT COUNT(*) AS total 
             FROM Voto v
             JOIN Opcao_enquete oe ON v.id_opcao = oe.id_opcao
             WHERE oe.id_postagem = ?`,
            [post.id_postagem]
          );
          totalVotosGeral = totalVotosBanco[0]?.total || 0;
          if (meuIdLogado) {
            const [votoUsuarioEnquete] = await conexao.query(
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
          for (const op of opcoes) {
            const [votosDaOpcao] = await conexao.query(
              `SELECT COUNT(*) AS total FROM Voto WHERE id_opcao = ?`,
              [op.id_opcao]
            );
            const totalVotosOpcao = votosDaOpcao[0]?.total || 0;
            const porcentagemCalculada = totalVotosGeral > 0 ? Math.round((totalVotosOpcao / totalVotosGeral) * 100) : 0;

            let votadoPorMim = false;
            if (meuIdLogado) {
              const [checaOpcaoUnica] = await conexao.query(
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
  } finally {
    if (conexao) conexao.release();
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

        if (votoExistente && votoExistente.length > 0) {
          const idOpcaoAntiga = votoExistente[0].id_opcao;
          
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
        const [totalBanco] = await conexao.query(
          `SELECT COUNT(*) AS total FROM Voto v 
           JOIN Opcao_enquete oe ON v.id_opcao = oe.id_opcao WHERE oe.id_postagem = ?`,
          [idPostagem]
        );
        const novoTotalGeral = totalBanco[0]?.total || 0;

        const [opcoesBanco] = await conexao.query(
          `SELECT id_opcao, texto_opcao FROM Opcao_enquete WHERE id_postagem = ?`,
          [idPostagem]
        );

        const novasOpcoesProcessadas = [];
        for (const op of opcoesBanco) {
          const [votosOp] = await conexao.query(`SELECT COUNT(*) AS total FROM Voto WHERE id_opcao = ?`, [op.id_opcao]);
          const totalVotosOpcao = votosOp[0]?.total || 0;
          const novaPorcentagem = novoTotalGeral > 0 ? Math.round((totalVotosOpcao / novoTotalGeral) * 100) : 0;
          const [checaSeVotou] = await conexao.query(
            `SELECT * FROM Voto WHERE id_usuario = ? AND id_opcao = ?`, 
            [idUsuario, op.id_opcao]
          );

          novasOpcoesProcessadas.push({
            id_opcao: op.id_opcao,
            texto_opcao: op.texto_opcao,
            porcentagem: novaPorcentagem,
            votadoPorMim: checaSeVotou.length > 0
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
    if (req.file) {
      const idMidia = crypto.randomUUID();
      const urlImagemPost = `http://localhost:3000/imagens/${req.file.filename}`;
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
      for (const nomeTag of tags) {
        
        const tagLimpa = nomeTag.replace('#','').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

        const [linhasBanco] = await conexao.query(`SELECT id_tag FROM Tag WHERE nome_tag = ?`, [tagLimpa]);

        if (linhasBanco && linhasBanco.length > 0) {
            
            const idTagReal = linhasBanco[0].id_tag;

            await conexao.query(`INSERT INTO Postagem_Tag (id_postagem, id_tag) VALUES (?, ?)`, [idPostagem, idTagReal]);
        }else {
          console.warn(`Aviso: A tag "${tagLimpa}" não foi encontrada na tabela global Tag.`);
        }
      }
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

  let conexao = null;
  try {
    conexao = await pool.getConnection();
    const idComentario = crypto.randomUUID();
    await conexao.query(
      `INSERT INTO Comentario (id_comentario, conteudo_comentario, id_usuario, id_postagem) 
       VALUES (?, ?, ?, ?)`,
      [idComentario, conteudo.trim(), idUsuario, idPostagem]
    );
    const [autores] = await conexao.query(
      'SELECT nome, username, foto_profile FROM Usuario WHERE id_usuario = ?',
      [idUsuario]
    );
    if (!autores || autores.length === 0) {
      return res.status(404).json({ erro: 'Autor do comentário não encontrado.' });
    }
    const autorReal = autores[0]; 
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
  } finally {
    if (conexao) conexao.release();
  }
});
router.get('/postagens/:idPostagem/comentarios', async (req, res) => {
  const { idPostagem } = req.params;
  const meuIdLogado = req.query.meuId || '';
  const filtro = req.query.filtro || 'recente';

  let conexao = null;
  try {
    conexao = await pool.getConnection();
    let querySQL = `
      SELECT c.id_comentario, c.conteudo_comentario, c.data_comentario, c.id_usuario,
             u.nome, u.username, u.foto_profile,
             COALESCE(SUM(CASE WHEN ic.tipo_interacao = 'like' THEN 1 ELSE 0 END), 0) AS total_likes,
             COALESCE(SUM(CASE WHEN ic.tipo_interacao = 'dislike' THEN 1 ELSE 0 END), 0) AS total_dislikes
      FROM Comentario c
      JOIN Usuario u ON c.id_usuario = u.id_usuario
      LEFT JOIN Interacao_Comentario ic ON c.id_comentario = ic.id_comentario
      WHERE c.id_postagem = ?
      GROUP BY c.id_comentario, u.id_usuario
    `;
    if (filtro === 'relevante') {
      querySQL += ` ORDER BY (total_likes - total_dislikes) DESC, c.data_comentario DESC`;
    } else {
      querySQL += ` ORDER BY c.data_comentario DESC`;
    }

    const [comentarios] = await conexao.query(querySQL, [idPostagem]);
    const listaFinalComentarios = [];
    for (const c of comentarios) {
      let votoDoVisitante = null;

      if (meuIdLogado) {
        const [votos] = await conexao.query(
          'SELECT tipo_interacao FROM Interacao_Comentario WHERE id_usuario = ? AND id_comentario = ?',
          [meuIdLogado, c.id_comentario]
        );
        if (votos.length > 0) {
          votoDoVisitante = votos[0].tipo_interacao;
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
  } finally {
    if (conexao) conexao.release();
  }
});
router.post('/curtir/postagem', async (req, res) => {
  const { idDoUsuario, idDaPostagem, tipoVoto } = req.body;

  if (!idDoUsuario || !idDaPostagem || !['like', 'dislike'].includes(tipoVoto)) {
    return res.status(400).json({ erro: 'Dados inválidos ao curtir' });
  }

  let conexao = null;
try {
  conexao = await pool.getConnection();
  const [registros] = await conexao.query(
    `SELECT tipo_voto FROM Curtida WHERE id_usuario = ? AND id_postagem = ?`,
    [idDoUsuario, idDaPostagem]
  );

  if (registros.length > 0) {
    const votoAntigo = registros[0].tipo_voto; 

    if (votoAntigo === tipoVoto) {
      await conexao.query(
        'DELETE FROM Curtida WHERE id_usuario = ? AND id_postagem = ?',
        [idDoUsuario, idDaPostagem]
      );
      return res.json({ status: 'anulado', mensagem: 'Voto removido!', votoAtual: null });
    } else {
      await conexao.query(
        'UPDATE Curtida SET tipo_voto = ? WHERE id_usuario = ? AND id_postagem = ?',
        [tipoVoto, idDoUsuario, idDaPostagem]
      );
      return res.json({ status: 'invertido', mensagem: 'Voto atualizado!', votoAtual: tipoVoto });
    }
  } else {
    await conexao.query(
      'INSERT INTO Curtida (id_usuario, id_postagem, tipo_voto) VALUES (?, ?, ?)',
      [idDoUsuario, idDaPostagem, tipoVoto]
    );
    return res.json({ status: 'computado', mensagem: 'Curtida salva!', votoAtual: tipoVoto });
  }
}
 catch(erro) {
    console.error('Não foi possível curtir o post', erro);
    return res.status(500).json({ erro: 'Erro interno no banco.' });
  } finally {
    if (conexao) conexao.release();
  }
});
router.post('/postagens/comentarios/votar', async (req, res) => {
  const { idUsuario, idComentario, tipoVoto } = req.body;

  if (!idUsuario || !idComentario || !['like', 'dislike'].includes(tipoVoto)) {
    return res.status(400).json({ erro: 'Dados inválidos fornecidos para votação.' });
  }

  let conexao = null;
  try {
    conexao = await pool.getConnection();
    const [registros] = await conexao.query(
      'SELECT tipo_interacao FROM Interacao_Comentario WHERE id_usuario = ? AND id_comentario = ?',
      [idUsuario, idComentario]
    );

    if (registros.length > 0) {
      const votoSalvoAntigo = registros[0].tipo_interacao;

      if (votoSalvoAntigo === tipoVoto) {
        await conexao.query(
          'DELETE FROM Interacao_Comentario WHERE id_usuario = ? AND id_comentario = ?',
          [idUsuario, idComentario]
        );
        return res.json({ status: 'anulado', mensagem: 'Voto removido!', votoAtual: null });
      } else {
        await conexao.query(
          'UPDATE Interacao_Comentario SET tipo_interacao = ? WHERE id_usuario = ? AND id_comentario = ?',
          [tipoVoto, idUsuario, idComentario]
        );
        return res.json({ status: 'invertido', mensagem: 'Voto atualizado!', votoAtual: tipoVoto });
      }
    } else {
      await conexao.query(
        'INSERT INTO Interacao_Comentario (id_usuario, id_comentario, tipo_interacao) VALUES (?, ?, ?)',
        [idUsuario, idComentario, tipoVoto]
      );
      return res.json({ status: 'computado', mensagem: 'Voto computado com sucesso!', votoAtual: tipoVoto });
    }

  } catch (error) {
    console.error('Erro ao processar transação de voto em comentário:', error);
    return res.status(500).json({ erro: 'Erro interno ao salvar voto.' });
  } finally {
    if (conexao) conexao.release();
  }
});

export default router;


