/**
 * Roda o migration_eventos.sql no Supabase
 * Uso: node scripts/run_eventos_migration.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'migration_eventos.sql'), 'utf8');
    const client = await pool.connect();
    try {
        console.log('⚙️  Criando tabela eventos...');
        await client.query(sql);
        console.log('✅ Tabela eventos criada com sucesso!');
    } finally {
        client.release();
        await pool.end();
    }
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
