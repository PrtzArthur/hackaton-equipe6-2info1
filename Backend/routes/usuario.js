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
    setTimeout(() => reject(new Error('Tempo limite do Google expirou')), 10500)
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

router.put('/perfil/:id/midias', upload.fields([{ name: 'foto', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), async (req, res) => {
  const { id } = req.params;
  
  try {
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
    if (fotoEnviada) {
      apagarArquivoLocalAntigo(urlFoto); 
      urlFoto = `http://localhost:3000/imagens/${fotoEnviada.filename}`;
    }

    if (bannerEnviado) {
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
  const { id } = req.params;
  try {
    const [linhas] = await pool.query(
      `SELECT nome, username, biografia, localizacao, status_online, foto_profile, banner_fundo, data_criacao 
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
router.put('/perfil/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { biografia, nome, localizacao } = req.body;
    const [resultado] = await pool.query(
      `UPDATE Usuario
       SET nome = ?, biografia = ?, localizacao = ?
       WHERE id_usuario = ?`,
      [nome, biografia, localizacao, id]
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    return res.json({ mensagem: 'Perfil updated com sucesso no MySQL!' });
  } catch(error) {
    console.error('Erro ao mudar os dados ao banco', error);
    return res.status(500).json({ erro: error.message});
  }
});

export default router;
