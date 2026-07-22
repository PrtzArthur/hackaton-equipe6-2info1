import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './database.js';
import authRoutes from './routes/auth.js';
import usuarioRoutes from './routes/usuario.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/usuario', usuarioRoutes);

app.get('/', (req, res) => {
  res.send('Servidor do IFchat está rodando e operacional!');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta ${PORT}`);
});