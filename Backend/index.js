import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import authRoutes from './routes/auth.js';
import usuarioRoutes from './routes/usuario.js';
import criarRoutes from './routes/criar.js';
import chatRoutes from './routes/chat.js';
import pool from './database.js';

dotenv.config();

process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve("./credenciais-google.json");

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Usuário conectado ao WebSocket: ${socket.id}`);
  socket.on('entrar_no_chat', (meuId) => {
    if (meuId) {
      socket.join(meuId);
      console.log(`Usuário [${meuId}] foi mapeado na sala Realtime com sucesso.`);
    }
  });

  socket.on('enviar_mensagem_privada', async (dados) => {
    const { id_remetente, id_destinatario, texto } = dados;
    const id_mensagem = crypto.randomUUID();

    let conexao = null;
    try {
      conexao = await pool.getConnection();
      
      await conexao.query(
        `INSERT INTO Mensagem (id_mensagem, conteudo_mensagem, id_remetente, id_destinatario) 
         VALUES (?, ?, ?, ?)`,
        [id_mensagem, texto.trim(), id_remetente, id_destinatario]
      );
      const pacoteMensagem = { 
        id_mensagem, 
        texto: texto.trim(), 
        id_remetente, 
        id_destinatario, 
        data: new Date() 
      };
      io.to(id_destinatario).emit('receber_mensagem_privada', pacoteMensagem);
      io.to(id_remetente).emit('receber_mensagem_privada', pacoteMensagem);

    } catch (erro) {
      console.error("Erro grave no Socket.io ao gravar/transmitir mensagem:", erro);
    } finally { 
      if (conexao) conexao.release(); 
    }
  });

    socket.on('aluno_digitando', (dados) => {
    const { id_remetente, id_destinatario } = dados;
    io.to(id_destinatario).emit('aluno_esta_digitando', { id_remetente });
  });

    socket.on('aluno_parou_digitando', (dados) => {
    const { id_remetente, id_destinatario } = dados;
    io.to(id_destinatario).emit('aluno_parou_de_digitando', { id_remetente });
  });

    socket.on('disconnect', () => {
    console.log(`Usuário desconectou do WebSocket: ${socket.id}`);
  });

  socket.on('apagar_mensagem_realtime', (dados) => {
  const { id_mensagem, id_destinatario, id_remetente } = dados;
  
  io.to(id_destinatario).emit('mensagem_foi_apagada', { id_mensagem });
  io.to(id_remetente).emit('mensagem_foi_apagada', { id_mensagem });
});
});

app.use('/imagens', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/usuario', usuarioRoutes);
app.use('/api/criar', criarRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.send('Servidor do IFchat está rodando e operacional!');
});

httpServer.listen(3000, () => {
  console.log('Servidor do IFchat rodando na porta 3000');
});