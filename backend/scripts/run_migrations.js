/**
 * Script que executa o migrations.sql diretamente no Supabase via pg
 * Uso: node scripts/run_migrations.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function runMigrations() {
    const sqlPath = path.join(__dirname, '..', 'database', 'migrations.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🔗 Conectando ao Supabase Postgres...');
    const client = await pool.connect();

    try {
        console.log('⚙️  Executando migrations...');
        await client.query(sql);
        console.log('✅ Migrations executadas com sucesso!');

        // Confirmar tabelas criadas
        const { rows } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('unidades', 'convenios', 'admins')
      ORDER BY table_name
    `);
        console.log('\n📋 Tabelas criadas:');
        rows.forEach(r => console.log(`   ✓ ${r.table_name}`));
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations().catch(err => {
    console.error('❌ Erro ao executar migrations:', err.message);
    process.exit(1);
});
