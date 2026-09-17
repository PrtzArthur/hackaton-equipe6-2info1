import express from 'express';
import pool from '../database.js';
import crypto from 'crypto';

const router = express.Router();

router.get('/listar', async (req, res) => {
  const meuIdLogado = req.query.meuId || '';

  try {
    const querySQL = `
      SELECT 
        e.id_evento, e.titulo_evento, e.desc_evento, e.data_hora_evento,
        e.data_fim_evento, e.criador_handle,
        (SELECT COUNT(*) FROM Presenca_em_evento WHERE id_evento = e.id_evento) AS total_presencas,
        IF((SELECT COUNT(*) FROM Presenca_em_evento WHERE id_usuario = ? AND id_evento = e.id_evento) > 0, TRUE, FALSE) AS confirmadoPorMim
      FROM Evento e
      ORDER BY e.data_hora_evento ASC
    `;
    const [linhas] = await pool.query(querySQL, [meuIdLogado]);
    return res.json(Array.isArray(linhas) ? linhas : []);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno ao carregar feed.' });
  }
});
router.post('/novo', async (req, res) => {
  const { titulo, descricao, dataInicio, dataFim, criadorHandle, idComunidade } = req.body;

  if (!titulo || !titulo.trim() || !dataInicio) {
    return res.status(400).json({ erro: 'Título e data de início são obrigatórios.' });
  }

  try {
    const idEvento = crypto.randomUUID();
    
    await pool.query(`ALTER TABLE Evento ADD COLUMN IF NOT EXISTS data_fim_evento TIMESTAMP NULL;`).catch(() => {});
    await pool.query(`ALTER TABLE Evento ADD COLUMN IF NOT EXISTS criador_handle VARCHAR(50) NULL;`).catch(() => {});

    await pool.query(
      `INSERT INTO Evento (id_evento, titulo_evento, desc_evento, data_hora_evento, data_fim_evento, criador_handle, id_comunidade) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [idEvento, titulo.trim(), descricao || null, dataInicio, dataFim || null, criadorHandle || null, idComunidade || 'comunidade-geral']
    );

    return res.status(201).json({ mensagem: 'Evento criado!', idEvento });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao salvar o evento.' });
  }
});
router.post('/presenca', async (req, res) => {
  const { idUsuario, idEventos } = req.body;

  if (!idUsuario || !idEventos) {
    return res.status(400).json({ erro: 'Parâmetros inválidos para confirmar presença.' });
  }

  let conexao = null;
  try {
    conexao = await pool.getConnection();
    await conexao.beginTransaction();

    const [userCheck] = await conexao.query('SELECT id_usuario FROM Usuario WHERE id_usuario = ?', [idUsuario]);
    if (userCheck.length === 0) {
      await conexao.rollback();
      return res.status(404).json({ erro: 'Usuário não cadastrado no sistema.' });
    }
    const [presencaExistente] = await conexao.query(
      `SELECT * FROM Presenca_em_evento WHERE id_usuario = ? AND id_evento = ?`,
      [idUsuario, idEventos]
    );

    let statusConfirmado = false;

    if (presencaExistente.length > 0) {
      await conexao.query(
        `DELETE FROM Presenca_em_evento WHERE id_usuario = ? AND id_evento = ?`,
        [idUsuario, idEventos]
      );
      statusConfirmado = false;
    } else {
      await conexao.query(
        `INSERT INTO Presenca_em_evento (id_evento, id_usuario) VALUES (?, ?)`,
        [idEventos, idUsuario]
      );
      statusConfirmado = true;
    }

    await conexao.commit();
    return res.json({ confirmado: statusConfirmado });

  } catch (error) {
    if (conexao) await conexao.rollback();
    console.error('erro no duto do MySQL ao processar presenca:', error.message);
    return res.status(500).json({ erro: 'Erro interno ao processar sua presença.' });
  } finally {
    if (conexao) conexao.release();
  }
});
router.post('/novo', async (req, res) => {
  const { titulo, descricao, dataHora, idComunidade } = req.body;

  if (!titulo || !titulo.trim() || !dataHora || !idComunidade) {
    return res.status(400).json({ erro: 'Título, data/hora e comunidade de origem são obrigatórios.' });
  }

  try {
    const idEvento = crypto.randomUUID();

    await pool.query(
      `INSERT INTO Evento (id_evento, titulo_evento, desc_evento, data_hora_evento, id_comunidade) 
       VALUES (?, ?, ?, ?, ?)`,
      [idEvento, titulo.trim(), descricao ? descricao.trim() : null, dataHora, idComunidade]
    );

    console.log(`[MySQL] Novo evento "${titulo.trim()}" postado com sucesso!`);
    return res.status(201).json({ mensagem: 'Evento cadastrado com sucesso!', idEvento });

  } catch (error) {
    console.error('erro ao criar novo evento no MySQL:', error.message);
    return res.status(500).json({ erro: 'Erro interno ao salvar novo evento.' });
  }
});

export default router;