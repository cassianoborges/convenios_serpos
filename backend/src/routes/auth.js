const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const authMiddleware = require('../middlewares/auth');
require('dotenv').config();

/**
 * POST /api/auth/login
 * Body: { email, senha }
 * Returns: { token, admin: { id, email, nome } }
 */
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    try {
        const { rows } = await pool.query(
            'SELECT * FROM admins WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const admin = rows[0];
        const senhaCorreta = await bcrypt.compare(senha, admin.senha_hash);

        if (!senhaCorreta) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { id: admin.id, email: admin.email, nome: admin.nome },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            admin: { id: admin.id, email: admin.email, nome: admin.nome },
        });
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ error: 'Erro ao autenticar' });
    }
});

/**
 * GET /api/auth/me
 * Verifica token e retorna dados do admin logado
 */
router.get('/me', authMiddleware, (req, res) => {
    res.json({ admin: req.admin });
});

/**
 * GET /api/auth/users
 * Lista todos os administradores (protegido)
 */
router.get('/users', authMiddleware, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, email, nome, created_at FROM admins ORDER BY created_at ASC'
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro ao listar usuários:', err);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});

/**
 * POST /api/auth/users
 * Cria um novo administrador (protegido)
 * Body: { nome, email, senha }
 */
router.post('/users', authMiddleware, async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }
    if (senha.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    try {
        const existing = await pool.query(
            'SELECT id FROM admins WHERE email = $1',
            [email.toLowerCase().trim()]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Já existe um usuário com este e-mail' });
        }

        const senha_hash = await bcrypt.hash(senha, 10);
        const { rows } = await pool.query(
            'INSERT INTO admins (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email, created_at',
            [nome.trim(), email.toLowerCase().trim(), senha_hash]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Erro ao criar usuário:', err);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

/**
 * DELETE /api/auth/users/:id
 * Remove um administrador (protegido, não permite remover a si mesmo)
 */
router.delete('/users/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    if (Number(id) === req.admin.id) {
        return res.status(400).json({ error: 'Você não pode remover sua própria conta' });
    }

    try {
        const result = await pool.query('DELETE FROM admins WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao remover usuário:', err);
        res.status(500).json({ error: 'Erro ao remover usuário' });
    }
});

module.exports = router;
