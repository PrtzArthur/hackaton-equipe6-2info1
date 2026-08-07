import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import path from 'path';
import usuarioRoutes from './routes/usuario.js';
import criarRoutes from './routes/criar.js';

dotenv.config();

process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve("./credenciais-google.json");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/imagens', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/usuario', usuarioRoutes);
app.use('/api/criar', criarRoutes);

app.get('/', (req, res) => {
  res.send('Servidor do IFchat está rodando e operacional!');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta ${PORT}`);
});