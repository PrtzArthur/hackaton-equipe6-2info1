import express from 'express';
import pool from '../database.js';
import crypto from 'crypto';

const router = express.Router();

router.post('/postagens/:id', async (req, res) => {
  const { id } = req.params;
  const { descricao, tipo } = req.body;
  try {
      const idPostagem = crypto.randomUUID();

      await pool.query(
      `INSERT INTO Postagem (id_postagem, tipo, conteudo, id_usuario)
       VALUES (?, ?, ?, ?)`,
       [idPostagem, tipo, descricao, id]
      );
      return res.status(201).json({ mensagem: 'Postagem criada com sucesso!' })
  } catch (error) {
      console.error('Não foi possível enviar a postagem', error);
      return res.status(500).json({ erro: 'Erro interno ao salvar a postagem no servidor.' });
  }
})

export default router;