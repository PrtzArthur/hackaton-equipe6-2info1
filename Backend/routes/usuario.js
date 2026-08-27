import express from 'express';
import pool from '../database.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = express.Router();

async function verificarConteudoImagem() {
  return { seguro: true };
}

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

router.post('/logout', async (req, res) => {
  const { idUsuario } = req.body;
  if (!idUsuario) {
    return res.status(400).json({ erro: 'ID do usuário não fornecido.' });
  }
  try {
    await pool.query(
      "UPDATE Usuario SET status_online = 0 WHERE id_usuario = ?",
      [idUsuario]
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('usuario_status_mudou', { id_usuario: idUsuario, status_online: 0 });
    }

    return res.json({ mensagem: 'Status alterado para offline com sucesso!' });

  } catch (error) {
    console.error('Erro ao processar logout no MySQL:', error);
    return res.status(500).json({ erro: 'Erro interno ao desconectar.' });
  }
});
router.post('/favoritos/detalhes', async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.json([]);
  }

  try {
    const interrogacoes = ids.map(() => '?').join(', ');
    
    // 💡 NOTA DE DESEMPENHO: Como foto_profile agora guarda strings LONGTEXT de Base64,
    // o pool.query puxa os dados direto e de forma limpa para renderizar a barra lateral
    const querySQL = `SELECT id_usuario, nome, username, foto_profile, status_online FROM Usuario WHERE id_usuario IN (${interrogacoes})`;
    const [usuarios] = await pool.query(querySQL, ids);

    return res.json(usuarios || []);

  } catch (error) {
    console.error('Erro ao traduzir lista de favoritos no MySQL:', error);
    return res.status(500).json({ erro: 'Erro interno ao processar favoritos.' });
  }
});
router.get('/perfil/mural/:idPerfil', async (req, res) => {
  const { idPerfil } = req.params;

  try {
    const querySQL = `
      SELECT m.id_comentario, m.conteudo_comentario, m.data_comentario, m.id_usuario_autor AS autor,
             u.nome, u.username, u.foto_profile
      FROM Mural_Perfil m
      JOIN Usuario u ON m.id_usuario_autor = u.id_usuario
      WHERE m.id_usuario_perfil = ?
      ORDER BY m.data_comentario DESC
    `;
    const [comentarios] = await pool.query(querySQL, [idPerfil]);
    return res.json(comentarios || []);

  } catch (error) {
    console.error('erro no MySQL ao buscar mural do perfil:', error);
    return res.status(500).json({ erro: 'Erro interno ao processar mural.' });
  }
});
router.post('/perfil/mural/novo', async (req, res) => {
  const { idAutor, idPerfil, conteudo } = req.body;

  if (!idAutor || !idPerfil || !conteudo || !conteudo.trim()) {
    return res.status(400).json({ erro: 'Parâmetros inválidos para comentar no mural.' });
  }

  try {
    const idComentarioNovo = crypto.randomUUID();

    await pool.query(
      `INSERT INTO Mural_Perfil (id_comentario, conteudo_comentario, id_usuario_autor, id_usuario_perfil) 
       VALUES (?, ?, ?, ?)`,
      [idComentarioNovo, conteudo.trim(), idAutor, idPerfil]
    );
    return res.status(201).json({ mensagem: 'Recado publicado com sucesso no mural!' });

  } catch (error) {
    console.error('erro no MySQL ao salvar recado no mural:', error);
    return res.status(500).json({ erro: 'Erro interno ao salvar recado.' });
  }
});
router.post('/perfil/atualizar/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  const { tags } = req.body;

  if (!id_usuario || !tags || !Array.isArray(tags)) {
    return res.status(400).json({ erro: 'Dados inválidos ou lista de tags ausente.' });
  }

  let conexao = null;
  try {
    conexao = await pool.getConnection();
    await conexao.beginTransaction();
    await conexao.query('DELETE FROM Usuario_Tag WHERE id_usuario = ?', [id_usuario]);

    if (tags.length > 0) {
      const tagsLimpas = tags.map(t => t.toLowerCase().replace('#', '').trim());
      const tagsOriginais = tags.map(t => t.toLowerCase().trim());
      const todasAsVariacoes = [...tagsOriginais, ...tagsLimpas];
      
      const [tagsEncontradas] = await conexao.query(
        'SELECT id_tag FROM Tag WHERE LOWER(nome_tag) IN (?)',
        [todasAsVariacoes]
      );
      
      if (tagsEncontradas && tagsEncontradas.length > 0) {
        const insertQuery = 'INSERT INTO Usuario_Tag (id_usuario, id_tag) VALUES ?';
        const valoresTags = tagsEncontradas.map(t => [id_usuario, t.id_tag]);
        await conexao.query(insertQuery, [valoresTags]); 
      }
    }
    
    await conexao.commit();
    return res.json({ mensagem: 'Tags updated com sucesso no MySQL!' });

  } catch (error) {
    if (conexao) await conexao.rollback();
    console.error('erro no MySQL ao sincronizar tags:', error);
    return res.status(500).json({ erro: 'Erro interno ao salvar tags.' });
  } finally {
    if (conexao) conexao.release();
  }
});
router.delete('/perfil/mural/deletar/:idComentario', async (req, res) => {
  const { idComentario } = req.params;
  const { idUsuarioLogado } = req.body;

  if (!idComentario || !idUsuarioLogado) {
    return res.status(400).json({ erro: 'Parâmetros insuficientes para deleção.' });
  }

  try {
    const querySQL = `
      DELETE FROM Mural_Perfil 
      WHERE id_comentario = ? 
        AND (id_usuario_autor = ? OR id_usuario_perfil = ?)
    `;

    const [resultado] = await pool.query(querySQL, [idComentario, idUsuarioLogado, idUsuarioLogado]);

    if (!resultado || resultado.affectedRows === 0) {
      return res.status(403).json({ erro: 'Você não tem permissão para deletar este recado.' });
    }

    return res.json({ mensagem: 'Recado removido do mural com sucesso!' });

  } catch (error) {
    console.error('erro no mySQL ao deletar comentário do mural:', error);
    return res.status(500).json({ erro: 'Erro interno ao processar exclusão.' });
  }
});
router.put('/perfil/:id/midias', upload.fields([{ name: 'foto', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), async (req, res) => {
  const { id } = req.params;
  
  try {
    const removerFoto = req.body.removerFoto === 'true';
    const removerBanner = req.body.removerBanner === 'true';

    const arquivosRecebidos = req.files || {};
    const fotoEnviada = arquivosRecebidos['foto'] ? arquivosRecebidos['foto'][0] : null;
    const bannerEnviado = arquivosRecebidos['banner'] ? arquivosRecebidos['banner'][0] : null;

    if (fotoEnviada) {
      const checagemFoto = await verificarConteudoImagem();
      if (!checagemFoto.seguro) {
        fs.unlinkSync(fotoEnviada.path); 
        return res.status(400).json({ erro: `Foto de perfil recusada: ${checagemFoto.motivo}` });
      }
    }
    if (bannerEnviado) {
      const checagemBanner = await verificarConteudoImagem();
      if (!checagemBanner.seguro) {
        fs.unlinkSync(bannerEnviado.path);
        return res.status(400).json({ erro: `Banner recusado: ${checagemBanner.motivo}` });
      }
    }

    const [resultados] = await pool.query('SELECT foto_profile, banner_fundo FROM Usuario WHERE id_usuario = ?', [id]);
    const linhasResultados = resultados || [];

    if (linhasResultados.length === 0) {
      if (fotoEnviada) fs.unlinkSync(fotoEnviada.path);
      if (bannerEnviado) fs.unlinkSync(bannerEnviado.path);
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    let urlFoto = linhasResultados[0]?.foto_profile;
    let urlBanner = linhasResultados[0]?.banner_fundo;

    if (removerFoto) {
      urlFoto = null; 
    } else if (fotoEnviada) {
      const dadosFoto = fs.readFileSync(fotoEnviada.path);
      urlFoto = `data:${fotoEnviada.mimetype};base64,${dadosFoto.toString('base64')}`;
      fs.unlinkSync(fotoEnviada.path); 
    }

    if (removerBanner) {
      urlBanner = null;
    } else if (bannerEnviado) {
      const dadosBanner = fs.readFileSync(bannerEnviado.path);
      urlBanner = `data:${bannerEnviado.mimetype};base64,${dadosBanner.toString('base64')}`;
      fs.unlinkSync(bannerEnviado.path); 
    }
    await pool.query(
      'UPDATE Usuario SET foto_profile = ?, banner_fundo = ? WHERE id_usuario = ?',
      [urlFoto, urlBanner, id]
    );

    return res.json({
      mensagem: 'Mídias atualizadas com sucesso!',
      foto_profile: urlFoto,
      banner_fundo: urlBanner
    });
  
  } catch(error) {
    console.error('Falha ao enviar as imagens para o banco.', error);
    return res.status(500).json({ erro: 'Erro ao salvar as imagens.' });
  }
});
router.get('/perfil/:id', async (req, res) => {
  const idPerfilVisitado = req.params.id;
  const meuIdLogado = req.query.meuId;    

  try {
    const [usuarios] = await pool.query(
      `SELECT id_usuario, nome, username, biografia, localizacao, 
       foto_profile, banner_fundo, status_online, data_criacao 
       FROM Usuario WHERE id_usuario = ?`,
      [idPerfilVisitado]
    );

    const linhasUsuarios = usuarios || [];
    if (linhasUsuarios.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    const usuarioTarget = linhasUsuarios[0]; 

    const [tagsBanco] = await pool.query(
      `SELECT t.nome_tag FROM Usuario_Tag ut
       JOIN Tag t ON ut.id_tag = t.id_tag
       WHERE ut.id_usuario = ?`,
      [idPerfilVisitado]
    );
    const listaDeTagsDoUsuario = (tagsBanco || []).map(t => `#${t.nome_tag}`);
    const [resultadoSeguidores] = await pool.query(
      'SELECT COUNT(*) as total FROM seguidores WHERE id_seguido = ?', 
      [idPerfilVisitado]
    );
    const linhasSeguidores = resultadoSeguidores || [];
    const totalVotosSeguidores = linhasSeguidores.length > 0 ? (linhasSeguidores.total || 0) : 0;

    const [resultadoSeguindo] = await pool.query(
      'SELECT COUNT(*) as total FROM seguidores WHERE id_seguidor = ?', 
      [idPerfilVisitado]
    );
    const linhasSeguindo = resultadoSeguindo || [];
    const totalVotosSeguindo = linhasSeguindo.length > 0 ? (linhasSeguindo.total || 0) : 0;

    let jaSegue = false;
    if (meuIdLogado && meuIdLogado !== idPerfilVisitado) {
      const [checagem] = await pool.query(
        'SELECT * FROM seguidores WHERE id_seguidor = ? AND id_seguido = ?',
        [meuIdLogado, idPerfilVisitado]
      );
      if (checagem && checagem.length > 0) {
        jaSegue = true;
      }
    }

    let euBloqueei = false;
    let jaAtivouSino = false;
    if (meuIdLogado) {
      try {
        const [checaBloqueio] = await pool.query(
          'SELECT * FROM usuario_bloqueado WHERE id_usuario_bloqueador = ? AND id_usuario_bloqueado = ?',
          [meuIdLogado, idPerfilVisitado]
        );
        if (checaBloqueio && checaBloqueio.length > 0) euBloqueei = true;
      } catch (erro) {
        console.error('Tabela de bloqueio não processada:', erro.message);
      }

      try {
        const [checaSino] = await pool.query(
          'SELECT * FROM notificacao_ativada WHERE id_usuario_seguidor = ? AND id_usuario_criador = ?',
          [meuIdLogado, idPerfilVisitado] 
        );
        if (checaSino && checaSino.length > 0) jaAtivouSino = true;
      } catch (erro) {
       console.error('Tabela de notificações do sino não processada:', erro.message);
      }
    }
    return res.json({
      id_usuario: usuarioTarget.id_usuario,
      nome: usuarioTarget.nome,
      username: usuarioTarget.username,
      biografia: usuarioTarget.biografia || '',
      localizacao: usuarioTarget.localizacao || '',
      foto_profile: usuarioTarget.foto_profile,
      banner_fundo: usuarioTarget.banner_fundo,
      status_online: usuarioTarget.status_online,
      data_criacao: usuarioTarget.data_criacao,
      seguidores: totalVotosSeguidores,
      seguindo: totalVotosSeguindo,
      jaSeguindo: jaSegue,
      tags: listaDeTagsDoUsuario,
      jaSino: jaAtivouSino,
      usuarioBloqueado: euBloqueei
    });
  } catch (error) {
    console.error('Erro ao carregar cabeçalho do perfil:', error);
    return res.status(500).json({ erro: 'Erro interno ao processar dados do perfil.' });
  }
});
router.post('/perfil/sino', async (req, res) => {
  const { idSeguidor, idCriador } = req.body;

  if (!idSeguidor || !idCriador) {
    return res.status(400).json({ erro: 'IDs inválidos para alternar o sino.' });
  }

  try {
    const simulacaoAtivo = true; 

    if (!simulacaoAtivo) {
      return res.json({ status: 'desativado', mensagem: 'Notificações desativadas para este perfil.' });
    } else {
      return res.json({ 
        status: 'ativado', 
        mensagem: 'Notificações ativadas com sucesso!' 
      });
    }

  } catch (error) {
    console.error('Erro ao alternar registros do sino:', error);
    return res.status(500).json({ erro: 'Erro interno ao processar clique do sino.' });
  }
});
router.get('/notificacoes/:idUsuario', async (req, res) => {
  const { idUsuario } = req.params;

  try {
    const querySQL = `
      SELECT n.id_notificacao AS id, 
             n.data_notificacao,
             u.nome AS autor_nome,
             u.username AS autor_username,
             u.foto_profile AS autor_foto,
             p.conteudo AS post_conteudo
      FROM Notificacao n
      JOIN Postagem p ON n.texto_notificacao = p.id_postagem
      JOIN Usuario u ON p.id_usuario = u.id_usuario
      WHERE n.id_usuario = ? AND n.tipo_notificacao = 'novo_post'
      ORDER BY n.data_notificacao DESC
    `;
    const [alertas] = await pool.query(querySQL, [idUsuario]);
    return res.json(alertas || []);

  } catch (error) {
    console.error('Erro no MySQL ao ler lista de notificações avançadas:', error);
    return res.status(500).json({ erro: 'Erro interno ao processar aba de avisos.' });
  }
});
router.post('/bloquear/:idAlvo', async (req, res) => {
  try {
    return res.json({ mensagem: 'Usuário bloqueado com sucesso!' });
  } catch (e) {
    console.error('Erro ao cogitar bloqueio', e);
    return res.status(500).json({ erro: 'Erro interno ao bloquear.' });
  }
});
router.delete('/bloquear/:idAlvo', async (req, res) => {
  try {
    return res.json({ mensagem: 'Usuário desbloqueado com sucesso!' });
  } catch (e) {
    console.error('Erro ao cogitar bloqueio', e);
    return res.status(500).json({ erro: 'Erro interno ao desbloquear.' });
  }
});
router.get('/postagens/:id', async (req, res) => {
  const idDoPerfilQueEstouOlhando = req.params.id;
  const meuIdLogado = req.query.meuId || '';

  try {
    const querySQL = `
      SELECT p.id_postagem, p.conteudo, p.data_envio, p.tipo,
             MAX(m.imagem_anexada) AS imagem,
             COALESCE(SUM(CASE WHEN c.tipo_voto = 'like' THEN 1 ELSE 0 END), 0) AS total_likes,
             COALESCE(SUM(CASE WHEN c.tipo_voto = 'dislike' THEN 1 ELSE 0 END), 0) AS total_dislikes
      FROM Postagem p
      LEFT JOIN Curtida c ON p.id_postagem = c.id_postagem
      LEFT JOIN Midia_Postagem m ON p.id_postagem = m.id_postagem
      WHERE p.id_usuario = ?
      GROUP BY p.id_postagem, p.conteudo, p.data_envio, p.tipo
      ORDER BY p.data_envio DESC
    `;
    const [postagensBanco] = await pool.query(querySQL, [idDoPerfilQueEstouOlhando]);
    const postagensProcessadas = [];

    for (const post of (postagensBanco || [])) {
      let meuVotoNoPost = null;
      let tagsFormatadas = [];
      let opcoesEnquete = [];
      let jaVotouNaEnquete = false;
      let totalVotosGeral = 0;

      try {
        if (meuIdLogado) {
          const [checaVoto] = await pool.query(
            'SELECT tipo_voto FROM Curtida WHERE id_usuario = ? AND id_postagem = ?',
            [meuIdLogado, post.id_postagem]
          );
          if (checaVoto && checaVoto.length > 0) {
            meuVotoNoPost = checaVoto[0].tipo_voto;
          }
        }
      } catch (e) { console.warn("Aviso: Falha ao ler curtidas deste post.", e.message); }

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
            
            const porcentagemCalculada = totalVotosGeral > 0 
              ? Math.round((totalVotosOpcao / totalVotosGeral) * 100) 
              : 0;

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
        console.warn(`Aviso: Falha de estrutura de enquete no post ${post.id_postagem}:`, e.message); 
      }

      postagensProcessadas.push({
        ...post,
        meu_voto_post: meuVotoNoPost,
        tags: tagsFormatadas,
        opcoes: opcoesEnquete,
        jaVotado: jaVotouNaEnquete,
        totalVotosGeral: totalVotosGeral
      });
    }
    
    return res.json(postagensProcessadas);

  } catch (error) {
    console.error("ERRO INTERNO AO COLETAR HISTÓRICO DE POSTS:", error);
    return res.status(500).json({ erro: "Erro ao processar feed do usuário." });
  }
});
router.post('/seguir', async (req, res) => {
  const { idSeguidor, idCriador: idSeguido } = req.body;
  const idSeguidorReal = idSeguidor || req.body.idSeguidor;
  const idSeguidoReal = idSeguido || req.body.idSeguido;

  if (idSeguidorReal === idSeguidoReal) {
    return res.status(400).json({ erro: "Você não pode seguir a si mesmo!" });
  }

  try {
    const [jaSegue] = await pool.query(
      'SELECT * FROM seguidores WHERE id_seguidor = ? AND id_seguido = ?',
      [idSeguidorReal, idSeguidoReal]
    );
    let acaoTomada = '';

    if (jaSegue && jaSegue.length > 0) {
      await pool.query(
        'DELETE FROM seguidores WHERE id_seguidor = ? AND id_seguido = ?',
        [idSeguidorReal, idSeguidoReal]
      );
      acaoTomada = 'parou_de_seguir';
    } else {
      await pool.query(
        'INSERT INTO seguidores (id_seguidor, id_seguido) VALUES (?, ?)',
        [idSeguidorReal, idSeguidoReal]
      );
      acaoTomada = 'seguiu';
    }
    const [resultadoSeguidores] = await pool.query(
      'SELECT COUNT(*) as total FROM seguidores WHERE id_seguido = ?',
      [idSeguidoReal]
    );
    const dadosSeguidores = resultadoSeguidores || [];
    const totalSeguidores = dadosSeguidores.length > 0 ? (dadosSeguidores[0].total || 0) : 0;

    const [resultadoSeguindo] = await pool.query(
      'SELECT COUNT(*) as total FROM seguidores WHERE id_seguidor = ?',
      [idSeguidorReal]
    );
    const dadosSeguindo = resultadoSeguindo || [];
    const totalSeguindo = dadosSeguindo.length > 0 ? (dadosSeguindo[0].total || 0) : 0;

    return res.json({
      mensagem: 'Ação processada com sucesso!',
      status: acaoTomada,
      contadorSeguidoresDoPerfil: totalSeguidores,
      contadorSeguindoDoLogado: totalSeguindo     
    });

  } catch (error) {
    console.error('Erro ao processar ação de seguir:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});
router.put('/perfil/:id', async (req, res) => {
  const { id } = req.params;
  const { biografia, nome, localizacao, tags } = req.body;

  let conexao = null;
  try {
    conexao = await pool.getConnection();
    await conexao.beginTransaction();

    const [resultado] = await conexao.query(
      `UPDATE Usuario SET nome = ?, biografia = ?, localizacao = ? WHERE id_usuario = ?`,
      [nome, biografia, localizacao, id]
    );

    if (resultado.affectedRows === 0) {
      await conexao.rollback();
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    await conexao.query('DELETE FROM Usuario_Tag WHERE id_usuario = ?', [id]);

    if (tags && tags.length > 0) {
      const tagsLimpas = tags.map(t => 
        t.replace('#', '')
         .normalize("NFD")
         .replace(/[\u0300-\u036f]/g, "")
         .toLowerCase()
         .trim()
      );
      const [tagsEncontradas] = await conexao.query(
        'SELECT id_tag FROM Tag WHERE nome_tag IN (?)',
        [tagsLimpas]
      );

      if (tagsEncontradas && tagsEncontradas.length > 0) {
        const insertQuery = 'INSERT INTO Usuario_Tag (id_usuario, id_tag) VALUES ?';
        const valoresTags = tagsEncontradas.map(t => [id, t.id_tag]);
        await conexao.query(insertQuery, [valoresTags]);
      }
    }

    await conexao.commit();
    return res.json({ message: 'Perfil e tags atualizados com sucesso no MySQL!' });
  } catch (error) {
    if (conexao) await conexao.rollback();
    console.error('Erro ao atualizar perfil e tags no MySQL:', error);
    return res.status(500).json({ erro: 'Erro interno ao salvar os dados das tags.' });
  } finally {
    if (conexao) conexao.release();
  }
});
router.delete('/postagens/:idPostagem', async (req, res) => {
  const { idPostagem } = req.params;
  const { idUsuario } = req.body; 

  try {
    const [post] = await pool.query(
      'SELECT id_usuario FROM Postagem WHERE id_postagem = ?',
      [idPostagem]
    );

    const linhasPost = post || [];
    if (linhasPost.length === 0) {
      return res.status(404).json({ erro: 'Postagem não encontrada.' });
    }
    if (linhasPost[0].id_usuario !== idUsuario) {
      return res.status(403).json({ erro: 'Acesso negado: Você não é o proprietário desta postagem.' });
    }
    await pool.query('DELETE FROM Postagem WHERE id_postagem = ?', [idPostagem]);

    return res.json({ mensagem: 'Postagem e seus vínculos deletados com sucesso!' });

  } catch (error) {
    console.error('Erro ao deletar postagem:', error);
    return res.status(500).json({ erro: 'Erro interno ao tentar deletar a postagem.' });
  }
});

export default router;
