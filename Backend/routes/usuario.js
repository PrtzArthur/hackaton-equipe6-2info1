import express from 'express';
import pool from '../database.js';

const router = express.Router();
router.get('/perfil/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [linhas] = await pool.query(
      `SELECT nome, username, biografia, localizacao, status_online, foto_profile, banner_fundo 
       FROM Usuario WHERE id_usuario = ?`,
      [id]
    );

    if (linhas.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    return res.json(linhas[0]);
  } catch (error) {
    console.error('Erro ao buscar perfil no MySQL:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});
router.get('/postagens/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [postagens] = await pool.query(
      'SELECT * FROM Postagem WHERE id_usuario = ? ORDER BY data_envio DESC',
      [id]
    );
    return res.json(postagens);
  } catch (error) {
    console.error('Erro ao buscar postagens no MySQL:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

export default router;