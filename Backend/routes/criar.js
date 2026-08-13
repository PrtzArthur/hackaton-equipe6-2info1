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
        const [linhasBanco] = await conexao.query('SELECT id_tag FROM Tag WHERE nome_tag = ?', [nomeTag]);
        
        if (linhasBanco && linhasBanco.length > 0) {
          const idTagReal = linhasBanco[0].id_tag; 
            await conexao.query(
            'INSERT INTO Postagem_Tag (id_postagem, id_tag) VALUES (?, ?)', 
            [idPostagem, idTagReal]
          );
        } else {
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

export default router;


