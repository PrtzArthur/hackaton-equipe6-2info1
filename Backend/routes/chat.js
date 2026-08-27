import express from 'express';
import crypto from 'crypto';
import pool from '../database.js';
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

router.post('/upload-imagem', upload.single('imagemChat'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });
  }
  const protocolo = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const dominioAtual = `${protocolo}://${req.headers.host}`;
  const urlImagem = `${dominioAtual}/imagens/${req.file.filename}`;
  
  return res.json({ urlImagem });
});
router.get('/conversas', async (req, res) => {
  const meuId = req.query.meuId;

  if (!meuId) return res.status(400).json({ erro: 'ID do usuário obrigatório.' });

  try {
    const querySQL = `
      SELECT DISTINCT u.id_usuario, u.nome, u.username, u.foto_profile, u.status_online,
             (
               SELECT conteudo_mensagem 
               FROM Mensagem 
               WHERE (id_remetente = ? AND id_destinatario = u.id_usuario)
                  OR (id_remetente = u.id_usuario AND id_destinatario = ?)
               ORDER BY data_mensagem DESC 
               LIMIT 1
             ) AS ultima_mensagem
      FROM Usuario u
      WHERE u.id_usuario IN (
        SELECT id_destinatario FROM Mensagem WHERE id_remetente = ?
        UNION
        SELECT id_remetente FROM Mensagem WHERE id_destinatario = ?
      )
    `;
    const [conversas] = await pool.query(querySQL, [meuId, meuId, meuId, meuId]);
    return res.json(conversas || []);

  } catch (error) {
    console.error('erro no MySQL ao listar conversas com última msg:', error);
    return res.status(500).json({ erro: 'erro interno no servidor.' });
  }
});
router.get('/historico', async (req, res) => {
  const { meuId, amigoId } = req.query;

  if (!meuId || !amigoId) return res.status(400).json({ erro: 'Parâmetros insuficientes.' });

  try {
    const querySQL = `
      SELECT id_mensagem, conteudo_mensagem AS texto, id_remetente, id_destinatario, data_mensagem AS data
      FROM Mensagem
      WHERE (id_remetente = ? AND id_destinatario = ?)
         OR (id_remetente = ? AND id_destinatario = ?)
      ORDER BY data_mensagem ASC
    `;

    const [linhas] = await pool.query(querySQL, [meuId, amigoId, amigoId, meuId]);
    const listaMensagens = Array.isArray(linhas) ? linhas : (linhas ? [linhas] : []);
    
    return res.json(listaMensagens);

  } catch (error) {
    console.error('Erro no MySQL ao buscar histórico de chat:', error);
    return res.status(500).json({ erro: 'Erro ao processar mensagens.' });
  }
});
router.post('/iniciar', async (req, res) => {
  const { meuId, amigoId } = req.body;

  if (!meuId || !amigoId) {
    return res.status(400).json({ erro: 'IDs dos usuários são obrigatórios.' });
  }

  try {
    const [existente] = await pool.query(
      `SELECT id_mensagem FROM Mensagem 
       WHERE (id_remetente = ? AND id_destinatario = ?) 
          OR (id_remetente = ? AND id_destinatario = ?) 
       LIMIT 1`,
      [meuId, amigoId, amigoId, meuId]
    );
    
    const linhasExistente = existente || [];

    if (linhasExistente.length === 0) {
      const id_mensagem_sistema = crypto.randomUUID();
      
      await pool.query(
        `INSERT INTO Mensagem (id_mensagem, conteudo_mensagem, id_remetente, id_destinatario) 
         VALUES (?, ?, ?, ?)`,
        [id_mensagem_sistema, 'Conversa iniciada!', meuId, amigoId]
      );
    }

    return res.json({ sucesso: true, mensagem: 'Conversa pronta para streaming.' });

  } catch (error) {
    console.error('erro no MySQL ao iniciar conversa pelo perfil:', error);
    return res.status(500).json({ erro: 'Erro interno ao criar canal de chat.' });
  }
});
router.put('/mensagem/apagar/:idMensagem', async (req, res) => {
  const { idMensagem } = req.params;
  const { meuId } = req.body;

  try {
    const [resultado] = await pool.query(
      `UPDATE Mensagem 
       SET conteudo_mensagem = 'Mensagem apagada' 
       WHERE id_mensagem = ? AND id_remetente = ?`,
      [idMensagem, meuId]
    );

    const dadosResultado = resultado || {};

    if (dadosResultado.affectedRows === 0) {
      return res.status(403).json({ erro: 'Você não tem permissão para apagar esta mensagem.' });
    }

    return res.json({ sucesso: true, mensagem: 'Mensagem apagada no banco!' });

  } catch (error) {
    console.error('erro no mySQL ao apagar mensagem:', error);
    return res.status(500).json({ erro: 'Erro interno ao processar exclusão.' });
  }
});
router.get('/listas-completo/:idUsuario', async (req, res) => {
  const { idUsuario } = req.params;
  try {
    const querySQL = `
      SELECT l.id_lista, l.nome_lista, COUNT(s.id_postagem) AS qtd_posts
      FROM Lista_salvos l
      LEFT JOIN salvar_post s ON l.id_lista = s.id_lista
      WHERE l.id_usuario = ?
      GROUP BY l.id_lista, l.nome_lista
    `;
    const [listas] = await pool.query(querySQL, [idUsuario]);
    return res.json(listas || []);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao buscar listas.' });
  }
});
router.get('/posts-da-lista/:idLista', async (req, res) => {
  const { idLista } = req.params;
  const meuIdLogado = req.query.meuId || ''; 

  try {
    const querySQL = `
      SELECT p.id_postagem, p.tipo, p.conteudo, p.data_envio, 
             u.nome AS nome_usuario, u.foto_profile, p.id_usuario,
             (
               SELECT imagem_anexada FROM Midia_Postagem 
               WHERE id_postagem = p.id_postagem 
               LIMIT 1
             ) AS imagem_post,
             (SELECT COUNT(*) FROM Curtida WHERE id_postagem = p.id_postagem AND tipo_voto = 'like') AS total_likes,
             (SELECT COUNT(*) FROM Curtida WHERE id_postagem = p.id_postagem AND tipo_voto = 'dislike') AS total_dislikes,
             (SELECT tipo_voto FROM Curtida WHERE id_usuario = ? AND id_postagem = p.id_postagem LIMIT 1) AS meu_voto_post
      FROM salvar_post s
      JOIN Postagem p ON s.id_postagem = p.id_postagem
      JOIN Usuario u ON p.id_usuario = u.id_usuario
      WHERE s.id_lista = ?
      ORDER BY p.data_envio DESC
    `;
    const [postagensBanco] = await pool.query(querySQL, [meuIdLogado, idLista]);
    const postagensProcessadas = [];

    for (const post of (postagensBanco || [])) {
        let tagsFormatadas = [];
        let opcoesEnquete = [];
        let totalVotosGeral = 0;

      try {
        const [tagsBanco] = await pool.query(
          `SELECT t.nome_tag 
           FROM postagem_tag pt 
           JOIN Tag t ON pt.id_tag = t.id_tag 
           WHERE pt.id_postagem = ?`,
          [post.id_postagem]
        );
        tagsFormatadas = (tagsBanco || []).map(t => `#${t.nome_tag}`);
      } catch (e) { 
        console.error(e)
        tagsFormatadas = [];
      }
      
      try {
        if (post.tipo === 'postagemComEnquete' || post.tipo === 'enquete') {
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
          
          const linhasTotal = totalVotosBanco || [];
          totalVotosGeral = linhasTotal.length > 0 ? (linhasTotal.total || 0) : 0;

          for (const op of (opcoes || [])) {
            const [votosDaOpcao] = await pool.query(
              `SELECT COUNT(*) AS total FROM Voto WHERE id_opcao = ?`,
              [op.id_opcao]
            );
            const linhasVotosOp = votosDaOpcao || [];
            const totalVotosOpcao = linhasVotosOp.length > 0 ? (linhasVotosOp.total || 0) : 0;
            
            const porcentagemCalculada = totalVotosGeral > 0 
              ? Math.round((totalVotosOpcao / totalVotosGeral) * 100) 
              : 0;

            opcoesEnquete.push({
              id_opcao: op.id_opcao,
              texto_opcao: op.texto_opcao,
              porcentagem: porcentagemCalculada
            });
          }
        }
      } catch (e) {
        console.warn(`[Aviso] Falha na estrutura de enquete na aba Salvar para o post ${post.id_postagem}:`, e.message);
      }
      
      postagensProcessadas.push({
        id_postagem: post.id_postagem,
        conteudo: post.conteudo,
        imagem: post.imagem_post, 
        data_envio: post.data_envio,
        tipo: post.tipo,
        foto_profile: post.foto_profile,
        nome_usuario: post.nome_usuario,
        total_likes: post.total_likes,
        total_dislikes: post.total_dislikes,
        meu_voto_post: post.meu_voto_post,
        naoSalvo: false,
        opcoes: opcoesEnquete,
        tags: tagsFormatadas,
        totalVotosGeral: totalVotosGeral,
        id_usuario: post.id_usuario
      });
    }

    return res.json(postagensProcessadas);

  } catch (error) {
    console.error('erro massivo no mySQL ao carregar postagens completas da lista:', error);
    return res.status(500).json({ erro: 'Erro interno ao processar agregados do feed.' });
  }
});
router.delete('/remover-post-salvo', async (req, res) => {
  const { id_lista, id_postagem } = req.body;
  try {
    await pool.query(
      'DELETE FROM salvar_post WHERE id_lista = ? AND id_postagem = ?',
      [id_lista, id_postagem]
    );
    return res.json({ sucesso: true, mensagem: 'Postagem removida da lista!' });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao remover postagem.', error });
  }
});
router.get('/listas-usuario/:idUsuario', async (req, res) => {
  const { idUsuario } = req.params;
  try {
    const [listas] = await pool.query(
      'SELECT id_lista, nome_lista FROM Lista_salvos WHERE id_usuario = ?',
      [idUsuario]
    );
    return res.json(listas || []);
  } catch (error) {
    console.error('erro ao buscar pastas de salvos:', error);
    return res.status(500).json({ erro: 'erro interno do servidor.' });
  }
});
router.post('/salvar-post-na-lista', async (req, res) => {
  const { id_lista, id_postagem } = req.body;

  if (!id_lista || !id_postagem) {
    return res.status(400).json({ erro: 'Parâmetros insuficientes.' });
  }

  try {
    const [existe] = await pool.query(
      'SELECT * FROM salvar_post WHERE id_lista = ? AND id_postagem = ?',
      [id_lista, id_postagem]
    );

    const linhasExiste = existe || [];

    if (linhasExiste.length > 0) {
      return res.status(400).json({ erro: 'Este post já está salvo nesta lista!' });
    }
    
    await pool.query(
      'INSERT INTO salvar_post (id_lista, id_postagem) VALUES (?, ?)',
      [id_lista, id_postagem]
    );
    return res.json({ sucesso: true, mensagem: 'Post salvo com sucesso!' });

  } catch (error) {
    console.error('erro no MySQL ao salvar post na pasta:', error);
    return res.status(500).json({ erro: 'Erro ao salvar a postagem.' });
  }
});
router.post('/criar-lista-rapida', async (req, res) => {
  const { nome_lista, id_usuario } = req.body;
  
  if (!nome_lista || !nome_lista.trim() || !id_usuario) {
    return res.status(400).json({ erro: 'Nome da lista e ID do usuário são obrigatórios.' });
  }

  try {
    const id_lista = crypto.randomUUID();
    
    await pool.query(
      'INSERT INTO Lista_salvos (id_lista, nome_lista, id_usuario) VALUES (?, ?, ?)',
      [id_lista, nome_lista.trim(), id_usuario]
    );
    return res.json({ sucesso: true, id_lista, nome_lista: nome_lista.trim() });
  } catch (error) {
    console.error('Erro ao criar lista rápida:', error);
    return res.status(500).json({ erro: 'Erro ao criar lista.' });
  }
});


export default router;
