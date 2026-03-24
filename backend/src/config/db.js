const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL (Supabase)');
});

pool.on('error', (err) => {
  console.error('❌ Erro no pool de conexão PostgreSQL:', err.message);
});

module.exports = pool;
