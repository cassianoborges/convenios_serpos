/**
 * Script para criar o primeiro administrador do sistema.
 * 
 * Uso:
 *   node seeds/create_admin.js
 * 
 * Ou com variáveis customizadas:
 *   ADMIN_EMAIL=meu@email.com ADMIN_SENHA=minhasenha ADMIN_NOME=Cassiano node seeds/create_admin.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

async function createAdmin() {
    const email = process.env.ADMIN_EMAIL || 'admin@serpos.com';
    const senha = process.env.ADMIN_SENHA || 'Serpos@2025';
    const nome = process.env.ADMIN_NOME || 'Administrador SERPOS';

    console.log(`\n🔧 Criando administrador...`);
    console.log(`   Email: ${email}`);
    console.log(`   Nome:  ${nome}`);

    try {
        const senhaHash = await bcrypt.hash(senha, 12);

        const { rows } = await pool.query(
            `INSERT INTO admins (email, senha_hash, nome)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET senha_hash = EXCLUDED.senha_hash, nome = EXCLUDED.nome
       RETURNING id, email, nome`,
            [email.toLowerCase().trim(), senhaHash, nome]
        );

        console.log(`\n✅ Administrador criado/atualizado com sucesso!`);
        console.log(`   ID:    ${rows[0].id}`);
        console.log(`   Email: ${rows[0].email}`);
        console.log(`   Nome:  ${rows[0].nome}`);
        console.log(`   Senha: ${senha}`);
        console.log(`\n⚠️  Guarde a senha em local seguro e altere após o primeiro login.\n`);
    } catch (err) {
        console.error('\n❌ Erro ao criar administrador:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

createAdmin();
