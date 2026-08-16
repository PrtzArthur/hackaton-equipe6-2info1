import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import path from 'path';
import usuarioRoutes from './routes/usuario.js';
import criarRoutes from './routes/criar.js';

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
  
  socket.on('disconnect', () => {
    console.log('Usuário desconectou do WebSocket');
  });
});

app.use('/imagens', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/usuario', usuarioRoutes);
app.use('/api/criar', criarRoutes);

app.get('/', (req, res) => {
  res.send('Servidor do IFchat está rodando e operacional!');
});

httpServer.listen(3000, () => {
  console.log('Servidor Full Stack do IFchat rodando na porta 3000');
});