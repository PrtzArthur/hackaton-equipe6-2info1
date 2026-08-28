import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import pool from './database.js';
import authRoutes from './routes/auth.js';
import usuarioRoutes from './routes/usuario.js';
import criarRoutes from './routes/criar.js';
import chatRoutes from './routes/chat.js';

const app = express();

app.use(cors({ 
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const dirUploads = path.resolve('./uploads');
if (!fs.existsSync(dirUploads)){
    fs.mkdirSync(dirUploads, { recursive: true });
    console.log('pasta uploads pronta e criada com sucesso no servidor Linux!');
}

app.use('/imagens', express.static(dirUploads));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

app.set('io', io);
const usuariosConectadosNoSocket = new Map();
const cronometrosDeQueda = new Map();

io.on('connection', (socket) => {
  console.log(`Usuário conectado ao WebSocket: ${socket.id}`);
  socket.on('entrar_no_chat', async (idUsuarioLogado) => {
    if (!idUsuarioLogado || idUsuarioLogado === 'undefined') return;

    socket.join(idUsuarioLogado);
    usuariosConectadosNoSocket.set(socket.id, idUsuarioLogado);

    try {
      await pool.query("UPDATE Usuario SET status_online = 1 WHERE id_usuario = ?", [idUsuarioLogado]);
      io.emit('usuario_status_mudou', { id_usuario: idUsuarioLogado, status_online: 1 });
      console.log(`Aluno ${idUsuarioLogado} está oficialmente ONLINE.`);
    } catch (err) {
      console.error(err.message);
    }
  });
  socket.on('ping_presenca', (idUsuarioLogado) => {
    if (!idUsuarioLogado) return;
    if (cronometrosDeQueda.has(idUsuarioLogado)) {
      clearTimeout(cronometrosDeQueda.get(idUsuarioLogado));
    }
    const timer = setTimeout(async () => {
      try {
        await pool.query("UPDATE Usuario SET status_online = 0 WHERE id_usuario = ?", [idUsuarioLogado]);
        io.emit('usuario_status_mudou', { id_usuario: idUsuarioLogado, status_online: 0 });
        console.log(`CRONÔMETRO: Aluno ${idUsuarioLogado} sumiu da rede. Status: OFFLINE.`);
        cronometrosDeQueda.delete(idUsuarioLogado);
      } catch (errTimer) {
        console.error(errTimer.message);
      }
    }, 8000);

    cronometrosDeQueda.set(idUsuarioLogado, timer);
  });
  socket.on('disconnect', async () => {
    const idUsuarioDesconectado = usuariosConectadosNoSocket.get(socket.id);
    if (idUsuarioDesconectado) {
      try {
        await pool.query("UPDATE Usuario SET status_online = 0 WHERE id_usuario = ?", [idUsuarioDesconectado]);
        io.emit('usuario_status_mudou', { id_usuario: idUsuarioDesconectado, status_online: 0 });
        
        if (cronometrosDeQueda.has(idUsuarioDesconectado)) {
          clearTimeout(cronometrosDeQueda.get(idUsuarioDesconectado));
          cronometrosDeQueda.delete(idUsuarioDesconectado);
        }
        usuariosConectadosNoSocket.delete(socket.id);
      } catch (e) { console.error(e.message); }
    }
  });
});

async function inicializarBancoDeDados() {
  try {
    console.log('Iniciando migração e criação das tabelas na Aiven...');

    const tabelas = [
      `CREATE TABLE IF NOT EXISTS Usuario (
        id_usuario VARCHAR(50) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        senha VARCHAR(100) NOT NULL,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        biografia TEXT,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        localizacao VARCHAR(150),
        status_online BOOLEAN DEFAULT FALSE,
        foto_profile VARCHAR(255),
        banner_fundo VARCHAR(255)
      );`,
      `CREATE TABLE IF NOT EXISTS Postagem (
        id_postagem VARCHAR(50) PRIMARY KEY,
        tipo VARCHAR(50) NOT NULL,
        conteudo TEXT,
        data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        id_usuario VARCHAR(50) NOT NULL,
        FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS Midia_Postagem (
        id_midia VARCHAR(50) PRIMARY KEY,
        imagem_anexada VARCHAR(255) NOT NULL,
        id_postagem VARCHAR(50) NOT NULL,
        FOREIGN KEY (id_postagem) REFERENCES Postagem(id_postagem) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS Notificacao (
        id_notificacao VARCHAR(50) PRIMARY KEY,
        lido BOOLEAN DEFAULT FALSE,
        tipo_notificacao VARCHAR(50) NOT NULL,
        texto_notificacao TEXT NOT NULL,
        data_notificacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        id_usuario VARCHAR(50) NOT NULL,
        FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS Comunidade (
        id_comunidade VARCHAR(50) PRIMARY KEY,
        nome_comunidade VARCHAR(100) NOT NULL,
        descricao TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS Evento (
        id_evento VARCHAR(50) PRIMARY KEY,
        data_hora_evento TIMESTAMP NOT NULL,
        titulo_evento VARCHAR(150) NOT NULL,
        desc_evento TEXT,
        id_comunidade VARCHAR(50) NOT NULL,
        FOREIGN KEY (id_comunidade) REFERENCES Comunidade(id_comunidade) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS Mensagem (
        id_mensagem VARCHAR(50) PRIMARY KEY,
        lido BOOLEAN DEFAULT FALSE,
        data_mensagem TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        conteudo_mensagem TEXT NOT NULL,
        id_remetente VARCHAR(50) NOT NULL,
        id_destinatario VARCHAR(50) NOT NULL,
        FOREIGN KEY (id_remetente) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY (id_destinatario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS Lista_salvos (
        id_lista VARCHAR(50) PRIMARY KEY,
        nome_lista VARCHAR(100) NOT NULL,
        id_usuario VARCHAR(50) NOT NULL,
        FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS Opcao_enquete (
        id_opcao VARCHAR(50) PRIMARY KEY,
        texto_opcao VARCHAR(255) NOT NULL,
        id_postagem VARCHAR(50) NOT NULL,
        FOREIGN KEY (id_postagem) REFERENCES Postagem(id_postagem) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS Voto (
        id_usuario VARCHAR(50),
        id_opcao VARCHAR(50),
        data_voto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_usuario, id_opcao),
        FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY (id_opcao) REFERENCES Opcao_enquete(id_opcao) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS seguidores (
        id_seguidor VARCHAR(50),
        id_seguido VARCHAR(50),
        PRIMARY KEY (id_seguidor, id_seguido),
        FOREIGN KEY (id_seguidor) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY (id_seguido) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS salvar_post (
        id_lista VARCHAR(50),
        id_postagem VARCHAR(50),
        PRIMARY KEY (id_lista, id_postagem),
        FOREIGN KEY (id_lista) REFERENCES Lista_salvos(id_lista) ON DELETE CASCADE,
        FOREIGN KEY (id_postagem) REFERENCES Postagem(id_postagem) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS Participacao (
        id_comunidade VARCHAR(50),
        id_usuario VARCHAR(50),
        PRIMARY KEY (id_comunidade, id_usuario),
        FOREIGN KEY (id_comunidade) REFERENCES Comunidade(id_comunidade) ON DELETE CASCADE,
        FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS Presenca_em_evento (
        id_evento VARCHAR(50),
        id_usuario VARCHAR(50),
        PRIMARY KEY (id_evento, id_usuario),
        FOREIGN KEY (id_evento) REFERENCES Evento(id_evento) ON DELETE CASCADE,
        FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS Tag ( 
        id_tag INT AUTO_INCREMENT PRIMARY KEY,
        nome_tag VARCHAR(50) NOT NULL UNIQUE
      );`,
      `CREATE TABLE IF NOT EXISTS Usuario_Tag (
        id_usuario VARCHAR(50), 
        id_tag INT, 
        PRIMARY KEY (id_usuario, id_tag),
        FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY (id_tag) REFERENCES Tag(id_tag) ON DELETE CASCADE 
      );`,
      `CREATE TABLE IF NOT EXISTS Curtida ( 
        id_usuario VARCHAR(50), 
        id_postagem VARCHAR(50), 
        data_curtida TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        tipo_voto ENUM('like', 'dislike') NOT NULL,
        PRIMARY KEY (id_usuario, id_postagem), 
        FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY (id_postagem) REFERENCES Postagem(id_postagem) ON DELETE CASCADE 
      );`,
      `CREATE TABLE IF NOT EXISTS Comentario ( 
        id_comentario VARCHAR(50) PRIMARY KEY, 
        conteudo_comentario TEXT NOT NULL, 
        data_comentario TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        id_usuario VARCHAR(50) NOT NULL, 
        id_postagem VARCHAR(50) NOT NULL, 
        FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY (id_postagem) REFERENCES Postagem(id_postagem) ON DELETE CASCADE 
      );`,
      `CREATE TABLE IF NOT EXISTS Interacao_Comentario (
        id_usuario VARCHAR(50),   
        id_comentario VARCHAR(50),
        tipo_interacao ENUM('like', 'dislike') NOT NULL,
        data_interacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_usuario, id_comentario),
        FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY (id_comentario) REFERENCES Comentario(id_comentario) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS Mural_Perfil (    
        id_comentario VARCHAR(50) PRIMARY KEY,
        conteudo_comentario TEXT NOT NULL,    
        data_comentario TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        id_usuario_autor VARCHAR(50) NOT NULL,  
        id_usuario_perfil VARCHAR(50) NOT NULL,
        FOREIGN KEY (id_usuario_autor) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY (id_usuario_perfil) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS postagem_tag (
        id_postagem VARCHAR(50),
        id_tag INT,
        PRIMARY KEY (id_postagem, id_tag),
        FOREIGN KEY (id_postagem) REFERENCES Postagem(id_postagem) ON DELETE CASCADE,
        FOREIGN KEY (id_tag) REFERENCES Tag(id_tag) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS usuario_bloqueado (
        id_usuario_bloqueador VARCHAR(50),
        id_usuario_bloqueado VARCHAR(50),
        PRIMARY KEY (id_usuario_bloqueador, id_usuario_bloqueado),
        FOREIGN KEY (id_usuario_bloqueador) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY (id_usuario_bloqueado) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS notificacao_ativada (
        id_usuario_seguidor VARCHAR(50),
        id_usuario_criador VARCHAR(50),
        PRIMARY KEY (id_usuario_seguidor, id_usuario_criador),
        FOREIGN KEY (id_usuario_seguidor) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY (id_usuario_criador) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
      );`
    ];
    for (const sql of tabelas) {
      await pool.query(sql);
    }

    console.log('MODELO FÍSICO DO IFCAT IMPLANTADO COM SUCESSO ABSOLUTO NA AIVEN!');
  } catch (error) {
    console.error('Erro crítico ao injetar modelo físico:', error);
  }
}

inicializarBancoDeDados();

app.use('/api/auth', authRoutes);
app.use('/api/usuario', usuarioRoutes);
app.use('/api/criar', criarRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.send('Servidor do IFchat está rodando e operacional!');
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Servidor do IFchat rodando com sucesso na porta ${PORT}`);
});