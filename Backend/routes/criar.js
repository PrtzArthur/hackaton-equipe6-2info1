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
  let conexao = null;
  const pagina = parseInt(req.query.page) || 1;
  const meuIdLogado = req.query.meuId;
  const limite = 6;
  const deslocamento = (pagina - 1) * limite;

  try {
    conexao = await pool.getConnection();
    const [postagens] = await conexao.query(
      `SELECT p.id_postagem, p.tipo, p.conteudo, p.data_envio, p.id_usuario,
              u.nome, u.username, u.foto_profile
       FROM Postagem p JOIN Usuario u ON p.id_usuario = u.id_usuario
       ORDER BY p.data_envio DESC LIMIT ? OFFSET ?`,
      [limite, deslocamento]
    );

    const feedCompleto = [];

    for (const post of postagens) {
      const [midias] = await conexao.query('SELECT imagem_anexada FROM Midia_Postagem WHERE id_postagem = ?', [post.id_postagem]);
      const [opcoesEnquete] = await conexao.query('SELECT id_opcao, texto_opcao FROM Opcao_enquete WHERE id_postagem = ?', [post.id_postagem]);

      const [resultadoTotalPost] = await conexao.query(
        `SELECT COUNT(*) AS total FROM Voto v JOIN Opcao_enquete o ON v.id_opcao = o.id_opcao WHERE o.id_postagem = ?`, 
        [post.id_postagem]
      );
      const totalVotosPost = resultadoTotalPost[0]?.total || 0;

      const opcoesComVotos = [];
      let usuarioJaVotouNestePost = false;

      for (const o of opcoesEnquete) {
        const [resultadoTotalOpcao] = await conexao.query('SELECT COUNT(*) AS total FROM Voto WHERE id_opcao = ?', [o.id_opcao]);
        const totalVotosOpcao = resultadoTotalOpcao[0]?.total || 0;

        let votoDoLogado = false;
        if (meuIdLogado) {
          const [checaVoto] = await conexao.query('SELECT * FROM Voto WHERE id_usuario = ? AND id_opcao = ?', [meuIdLogado, o.id_opcao]);
          if (checaVoto.length > 0) { votoDoLogado = true; usuarioJaVotouNestePost = true; }
        }

        opcoesComVotos.push({
          id_opcao: o.id_opcao,
          texto_opcao: o.texto_opcao,
          votos: totalVotosOpcao,
          porcentagem: totalVotosPost > 0 ? Math.round((totalVotosOpcao / totalVotosPost) * 100) : 0,
          votadoPorMim: votoDoLogado
        });
      }

      const [tagsBanco] = await conexao.query(
        `SELECT t.nome_tag FROM Postagem_Tag pt JOIN Tag t ON pt.id_tag = t.id_tag WHERE pt.id_postagem = ?`,
        [post.id_postagem]
      );
      const listaDeTagsDoPost = tagsBanco.map(t => `#${t.nome_tag}`);

      feedCompleto.push({
        id_postagem: post.id_postagem,
        tipo: post.tipo,
        conteudo: post.conteudo,
        data_envio: post.data_envio,
        autor: { id: post.id_usuario, nome: post.nome, username: post.username, foto: post.foto_profile },
        imagem: (midias && midias.length > 0) ? midias[0].imagem_anexada : null,
        opcoes: opcoesComVotos,
        jaVotado: usuarioJaVotouNestePost,
        totalVotosGeral: totalVotosPost,
        tags: listaDeTagsDoPost 
      });
    }
    return res.json(feedCompleto);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no feed.' });
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

        if (votoExistente && votoExistente.length > 0) {
          const idOpcaoAntiga = votoExistente[0].id_opcao;
          
          if (idOpcaoAntiga === idOpcao) {
            await conexao.query(
              'DELETE FROM Voto WHERE id_usuario = ? AND id_opcao = ?',
              [idUsuario, idOpcao]
            );
            await conexao.commit();
            return res.json({ mensagem: 'Voto removido com sucesso!', status: 'desmarcado' });
          }
          
          await conexao.query(
            'DELETE FROM Voto WHERE id_usuario = ? AND id_opcao = ?',
            [idUsuario, idOpcaoAntiga]
          );
        }
        
        await conexao.query(
          'INSERT INTO Voto (id_usuario, id_opcao) VALUES (?, ?)',
          [idUsuario, idOpcao]
        );
        
        await conexao.commit();
        return res.json({ mensagem: 'Voto atualizado com sucesso!', status: 'votado' });
        
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
      return res.json({ status: 'computado', mensagem: 'Curtida computada bem sucedida', votoAtual: tipoVoto });
    }
  } catch(erro) {
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


