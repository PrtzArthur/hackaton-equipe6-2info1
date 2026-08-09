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
        }
      }
    }
    await conexao.commit();
    return res.status(201).json({ mensagem: 'Postagem completa publicada!' });

  } catch (error) { 
    if (conexao) {
      await conexao.rollback();
    }
    console.error('Erro ao processar postagem complexa:', error);
    return res.status(500).json({ erro: 'Erro interno ao salvar dados da postagem.' });
  } finally {
    if (conexao) {
      conexao.release();
    }
  }
});

export default router;

