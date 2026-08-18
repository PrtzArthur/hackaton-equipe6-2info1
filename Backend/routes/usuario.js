import express from 'express';
import pool from '../database.js';
import multer from 'multer';
import path from 'path';
import vision from '@google-cloud/vision';
import fs from 'fs';

const router = express.Router();

const clienteVision = new vision.ImageAnnotatorClient({
  keyFilename: './credenciais-google.json'
});

async function verificarConteudoImagem(caminhoDaImagem) {
  const timeoutGoogle = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Tempo limite do Google expirou')), 2500)
  );
  try {
    const [resultado] = await Promise.race([
      clienteVision.safeSearchDetection(caminhoDaImagem),
      timeoutGoogle
    ]);
    const deteccao = resultado.safeSearchAnnotation;

    const criteriosBloqueados = ['LIKELY', 'VERY_LIKELY'];

    if (
      criteriosBloqueados.includes(deteccao.adult) || 
      criteriosBloqueados.includes(deteccao.violence)
    ) {
      return { seguro: false, motivo: 'Imagem bloqueada por conter material impróprio ou violento.' };
    }

    return { seguro: true };
  } catch (erro) {
    console.error('Aviso de Segurança: Cloud Vision demorou para responder ou falhou. Liberando imagem por padrão.');
    console.error('Motivo técnico:', erro.message);
    return { seguro: true };
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const sufixoUnico = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + sufixoUnico + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const apagarArquivoLocalAntigo = (urlPublica) => {
  if (!urlPublica || !urlPublica.includes('/imagens/')) return;
  try {
    const nomeArquivo = urlPublica.split('/imagens/')[1];
    const caminhoFisico = path.join('uploads', nomeArquivo);
    if (fs.existsSync(caminhoFisico)) {
      fs.unlinkSync(caminhoFisico);
    }
  } catch (err) {
    console.error('Erro ao limpar arquivo antigo:', err.message);
  }
};
router.post('/logout', async (req, res) => {
  const { idUsuario } = req.body;
  if (!idUsuario) {
    return res.status(400).json({ erro: 'ID do usuário não fornecido.' });
  }
  let conexao = null;
  try {
    conexao = await pool.getConnection();
    await conexao.query(
      "UPDATE Usuario SET status_online = 0 WHERE id_usuario = ?",
      [idUsuario]
    );

    const io = req.app.get('io');
    io.emit('usuario_status_mudou', { id_usuario: idUsuario, status_online: 0 });

    return res.json({ mensagem: 'Status alterado para offline com sucesso!' });

  } catch (error) {
    console.error('Erro ao processar logout no MySQL:', error);
    return res.status(500).json({ erro: 'Erro interno ao desconectar.' });
  } finally {
    if (conexao) conexao.release();
  }
});
router.post('/favoritos/detalhes', async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.json([]);
  }

  let conexao = null;
  try {
    conexao = await pool.getConnection();
    const interrogacoes = ids.map(() => '?').join(', ');
    const querySQL = `SELECT id_usuario, nome, username, foto_profile, status_online FROM Usuario WHERE id_usuario IN (${interrogacoes})`;
    const [usuarios] = await conexao.query(querySQL, ids);

    return res.json(usuarios);

  } catch (error) {
    console.error('Erro ao traduzir lista de favoritos no MySQL:', error);
    return res.status(500).json({ erro: 'Erro interno ao processar favoritos.' });
  } finally {
    if (conexao) conexao.release();
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
      const checagemFoto = await verificarConteudoImagem(fotoEnviada.path);
      if (!checagemFoto.seguro) {
        fs.unlinkSync(fotoEnviada.path); 
        return res.status(400).json({ erro: `Foto de perfil recusada: ${checagemFoto.motivo}` });
      }
    }
    if (bannerEnviado) {
      const checagemBanner = await verificarConteudoImagem(bannerEnviado.path);
      if (!checagemBanner.seguro) {
        fs.unlinkSync(bannerEnviado.path);
        return res.status(400).json({ erro: `Banner recusado: ${checagemBanner.motivo}` });
      }
    }

    const [resultados] = await pool.query('SELECT foto_profile, banner_fundo FROM Usuario WHERE id_usuario = ?', [id]);

    if (resultados.length === 0) {
      if (fotoEnviada) fs.unlinkSync(fotoEnviada.path);
      if (bannerEnviado) fs.unlinkSync(bannerEnviado.path);
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    let urlFoto = resultados[0]?.foto_profile;
    let urlBanner = resultados[0]?.banner_fundo;

    if (removerFoto) {
      apagarArquivoLocalAntigo(urlFoto);
      urlFoto = null; 
    } else if (fotoEnviada) {
      apagarArquivoLocalAntigo(urlFoto); 
      urlFoto = `http://localhost:3000/imagens/${fotoEnviada.filename}`;
    }
    if (removerBanner) {
      apagarArquivoLocalAntigo(urlBanner);
      urlBanner = null;
    } else if (bannerEnviado) {
      apagarArquivoLocalAntigo(urlBanner);
      urlBanner = `http://localhost:3000/imagens/${bannerEnviado.filename}`;
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

  let conexao = null;
  try {
    conexao = await pool.getConnection();
    const [usuarios] = await conexao.query(
      `SELECT id_usuario, nome, username, biografia, localizacao, 
       foto_profile, banner_fundo, status_online, data_criacao 
       FROM Usuario WHERE id_usuario = ?`,
      [idPerfilVisitado]
    );

    if (!usuarios || usuarios.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    const usuarioTarget = usuarios[0]; 
    const [tagsBanco] = await conexao.query(
      `SELECT t.nome_tag FROM Usuario_Tag ut
       JOIN Tag t ON ut.id_tag = t.id_tag
       WHERE ut.id_usuario = ?`,
      [idPerfilVisitado]
    );
    const listaDeTagsDoUsuario = tagsBanco.map(t => `#${t.nome_tag}`);

    const [resultadoSeguidores] = await conexao.query(
      'SELECT COUNT(*) as total FROM seguidores WHERE id_seguido = ?', 
      [idPerfilVisitado]
    );
    const totalVotosSeguidores = resultadoSeguidores[0]?.total || 0;
    const [resultadoSeguindo] = await conexao.query(
      'SELECT COUNT(*) as total FROM seguidores WHERE id_seguidor = ?', 
      [idPerfilVisitado]
    );
    const totalVotosSeguindo = resultadoSeguindo[0]?.total || 0;
    let jaSegue = false;
    if (meuIdLogado && meuIdLogado !== idPerfilVisitado) {
      const [checagem] = await conexao.query(
        'SELECT * FROM seguidores WHERE id_seguidor = ? AND id_seguido = ?',
        [meuIdLogado, idPerfilVisitado]
      );
      if (checagem.length > 0) {
        jaSegue = true;
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
      tags: listaDeTagsDoUsuario
    });

  } catch (error) {
    console.error('Erro ao carregar cabeçalho do perfil:', error);
    return res.status(500).json({ erro: 'Erro interno ao processar dados do perfil.' });
  } finally {
    if (conexao) conexao.release();
  }
});
router.get('/postagens/:id', async (req, res) => {
  const { id } = req.params;
  const meuIdLogado = req.query.meuId;
  let conexao = null;

  try {
    conexao = await pool.getConnection();
    const [postagens] = await conexao.query(
      'SELECT id_postagem, tipo, conteudo, data_envio FROM Postagem WHERE id_usuario = ? ORDER BY data_envio DESC',
      [id]
    );

    const postagensCompletas = [];

    for (const post of postagens) {
      const [midias] = await conexao.query('SELECT imagem_anexada FROM Midia_Postagem WHERE id_postagem = ?', [post.id_postagem]);
      const [opcoesEnquete] = await conexao.query('SELECT id_opcao, texto_opcao FROM Opcao_enquete WHERE id_postagem = ?', [post.id_postagem]);

      const [resultadoTotalPost] = await conexao.query(
        `SELECT COUNT(*) as total FROM Voto v JOIN Opcao_enquete o ON v.id_opcao = o.id_opcao WHERE o.id_postagem = ?`, 
        [post.id_postagem]
      );
      const totalVotosPost = resultadoTotalPost[0]?.total || 0;

      const opcoesComVotos = [];
      let usuarioJaVotouNestePost = false;

      for (const o of opcoesEnquete) {
        const [resultadoTotalOpcao] = await conexao.query('SELECT COUNT(*) as total FROM Voto WHERE id_opcao = ?', [o.id_opcao]);
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

      postagensCompletas.push({
        id_postagem: post.id_postagem,
        tipo: post.tipo,
        conteudo: post.conteudo,
        data_envio: post.data_envio,
        imagem: (midias && midias.length > 0) ? midias[0].imagem_anexada : null, 
        opcoes: opcoesComVotos,               
        jaVotado: usuarioJaVotouNestePost,  
        totalVotosGeral: totalVotosPost,
        tags: listaDeTagsDoPost
      });
    }
    return res.json(postagensCompletas);
  } catch (error) {
    console.error('Erro ao buscar postagens completas no MySQL:', error);
    return res.status(500).json({ erro: 'Erro interno ao carregar a lista de postagens.' });
  } finally {
    if (conexao) conexao.release();
  }
});
router.post('/seguir', async (req, res) => {
  const { idSeguidor, idSeguido } = req.body;
  if (idSeguidor === idSeguido) {
    return res.status(400).json({ erro: "Você não pode seguir a si mesmo!" });
  }

  let conexao = null;
  try {
    conexao = await pool.getConnection();
    await conexao.beginTransaction();

    const [jaSegue] = await conexao.query(
      'SELECT * FROM seguidores WHERE id_seguidor = ? AND id_seguido = ?',
      [idSeguidor, idSeguido]
    );
    let acaoTomada = '';

    if (jaSegue.length > 0) {
      await conexao.query(
        'DELETE FROM seguidores WHERE id_seguidor = ? AND id_seguido = ?',
        [idSeguidor, idSeguido]
      );
      acaoTomada = 'parou_de_seguir';
    } else {
      await conexao.query(
        'INSERT INTO seguidores (id_seguidor, id_seguido) VALUES (?, ?)',
        [idSeguidor, idSeguido]
      );
      acaoTomada = 'seguiu';
    }
    const [[{ seguidores }]] = await conexao.query(
      'SELECT COUNT(*) as seguidores FROM seguidores WHERE id_seguido = ?',
      [idSeguido]
    );
    const [[{ seguindo }]] = await conexao.query(
      'SELECT COUNT(*) as seguindo FROM seguidores WHERE id_seguidor = ?',
      [idSeguidor]
    );

    await conexao.commit();

    return res.json({
      mensagem: 'Ação processada com sucesso!',
      status: acaoTomada,
      contadorSeguidoresDoPerfil: seguidores,
      contadorSeguindoDoLogado: seguindo     
    });

  } catch (error) {
    if (conexao) await conexao.rollback();
    console.error('Erro ao processar ação de seguir:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  } finally {
    if (conexao) conexao.release();
  }
});
router.put('/perfil/:id', async (req, res) => {
  const { id } = req.params;
  let conexao = null;

  try {
    const { biografia, nome, localizacao, tags } = req.body;

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
      for (const nomeTag of tags) {
        const tagLimpa = nomeTag
          .replace('#', '')
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();

        const [resultadoTag] = await conexao.query('SELECT id_tag FROM Tag WHERE nome_tag = ?', [tagLimpa]);
        
        if (resultadoTag && resultadoTag.length > 0) {
          const idTagReal = resultadoTag[0].id_tag; 
          
          await conexao.query(
            'INSERT INTO Usuario_Tag (id_usuario, id_tag) VALUES (?, ?)',
            [id, idTagReal]
          );
        } else {
          console.warn(`aviso: A tag "${tagLimpa}" não existe cadastrada na tabela global Tag.`);
        }
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

  let conexao = null;

  try {
    conexao = await pool.getConnection();
    await conexao.beginTransaction();
    const [post] = await conexao.query(
      'SELECT id_usuario FROM Postagem WHERE id_postagem = ?',
      [idPostagem]
    );

    if (post.length === 0) {
      await conexao.rollback();
      return res.status(404).json({ erro: 'Postagem não encontrada.' });
    }
    if (post[0].id_usuario !== idUsuario) {
      await conexao.rollback();
      return res.status(403).json({ erro: 'Acesso negado: Você não é o proprietário desta postagem.' });
    }
    const [midias] = await conexao.query(
      'SELECT imagem_anexada FROM Midia_Postagem WHERE id_postagem = ?',
      [idPostagem]
    );
    
    if (midias.length > 0 && midias[0].imagem_anexada) {
      const urlPublica = midias[0].imagem_anexada;
      if (urlPublica.includes('/imagens/')) {
        const nomeArquivo = urlPublica.split('/imagens/')[1];
        const caminhoFisico = path.join('uploads', nomeArquivo);
        if (fs.existsSync(caminhoFisico)) {
          fs.unlinkSync(caminhoFisico); 
        }
      }
    }
    await conexao.query('DELETE FROM Postagem WHERE id_postagem = ?', [idPostagem]);

    await conexao.commit();
    return res.json({ mensagem: 'Postagem e seus vínculos deletados com sucesso!' });

  } catch (error) {
    if (conexao) await conexao.rollback();
    console.error('Erro ao deletar postagem:', error);
    return res.status(500).json({ erro: 'Erro interno ao tentar deletar a postagem.' });
  } finally {
    if (conexao) conexao.release();
  }
});
export default router;
