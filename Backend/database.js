import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production' || process.env.DB_HOST?.includes('aivencloud');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'sua_senha_local_aqui',
  database: process.env.DB_NAME || 'ifchat_db',
  port: parseInt(process.env.DB_PORT, 10) || 3306, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: isProduction ? { rejectUnauthorized: false } : null
});

pool.getConnection()
  .then(() => {
    const localOuNuvem = isProduction ? 'ONLINE (Aiven)' : 'LOCAL (Localhost)';
    console.log(`Conectado ao banco MySQL ${localOuNuvem} com sucesso!`);
  })
  .catch(err => {
    console.error('Erro ao conectar no MySQL completo:');
    console.log(err);
  });

export default pool;
