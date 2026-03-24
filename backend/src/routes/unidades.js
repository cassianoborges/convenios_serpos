const router = require('express').Router();
const pool = require('../config/db');
const authMiddleware = require('../middlewares/auth');

// ── GET /api/unidades ─────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT u.*, COUNT(c.id) AS total_convenios
       FROM unidades u
       LEFT JOIN convenios c ON c.unidade_id = u.id AND c.ativo = true
       WHERE u.ativo = true
       GROUP BY u.id
       ORDER BY u.nome ASC`
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro ao listar unidades:', err);
        res.status(500).json({ error: 'Erro ao buscar unidades' });
    }
});

// ── GET /api/unidades/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM unidades WHERE id = $1 AND ativo = true',
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Unidade não encontrada' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar unidade' });
    }
});

// ── POST /api/unidades (admin) ────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
    const { nome, cidade, uf } = req.body;
    if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });

    try {
        const { rows } = await pool.query(
            'INSERT INTO unidades (nome, cidade, uf) VALUES ($1, $2, $3) RETURNING *',
            [nome, cidade, uf]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Erro ao criar unidade:', err);
        res.status(500).json({ error: 'Erro ao criar unidade' });
    }
});

// ── PUT /api/unidades/:id (admin) ─────────────────────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
    const { nome, cidade, uf, ativo } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE unidades SET
        nome = COALESCE($1, nome),
        cidade = COALESCE($2, cidade),
        uf = COALESCE($3, uf),
        ativo = COALESCE($4, ativo)
       WHERE id = $5
       RETURNING *`,
            [nome, cidade, uf, ativo, req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Unidade não encontrada' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar unidade' });
    }
});

// ── DELETE /api/unidades/:id (admin) — soft delete ──────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'UPDATE unidades SET ativo = false WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Unidade não encontrada' });
        res.json({ message: 'Unidade removida com sucesso', id: rows[0].id });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao deletar unidade' });
    }
});

module.exports = router;
