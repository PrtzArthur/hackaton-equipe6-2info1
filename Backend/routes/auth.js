import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../database.js';

const router = express.Router();

router.post('/cadastro', async (req, res) => {
  const { nome, username, email, senha } = req.body;

  try {
    const [usuariosExistentes] = await pool.query(
      'SELECT email, username FROM Usuario WHERE email = ? OR username = ?',
      [email, username]
    );

    if (usuariosExistentes.length > 0) {
      const jaExisteEmail = usuariosExistentes.some(u => u.email === email);
      if (jaExisteEmail) return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
      return res.status(400).json({ erro: 'Este Handle (@) já está em uso.' });
    }

    const id_usuario = crypto.randomUUID();
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    await pool.query(
      `INSERT INTO Usuario (id_usuario, username, nome, email, senha, status_online) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_usuario, username.replace('@', ''), nome, email, senhaCriptografada, true]
    );

    const token = jwt.sign({ id: id_usuario }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ sucesso: true, token, mensagem: 'Conta criada com sucesso!' });

  } catch (error) {
    console.error('Erro no cadastro do MySQL:', error);
    res.status(500).json({ erro: 'Erro interno no servidor ao salvar os dados.' });
  }
});

export default router;