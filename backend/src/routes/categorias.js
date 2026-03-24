const router = require('express').Router();
const pool = require('../config/db');
const authMiddleware = require('../middlewares/auth');

/**
 * GET /api/categorias
 * Lista categorias ativas ordenadas por campo `ordem`
 * Público — usado no site e no formulário de convênios
 */
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, nome, icon, color, ordem FROM categorias WHERE ativo = true ORDER BY ordem ASC, nome ASC'
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro ao listar categorias:', err);
        res.status(500).json({ error: 'Erro ao listar categorias' });
    }
});

/**
 * POST /api/categorias (admin)
 * Body: { id, nome, icon, color, ordem }
 */
router.post('/', authMiddleware, async (req, res) => {
    const { id, nome, icon, color, ordem } = req.body;

    if (!id || !nome || !icon) {
        return res.status(400).json({ error: 'id, nome e icon são obrigatórios' });
    }

    // Valida slug: somente letras minúsculas e underscores
    if (!/^[a-z_]+$/.test(id)) {
        return res.status(400).json({ error: 'O id deve conter apenas letras minúsculas e underscores' });
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO categorias (id, nome, icon, color, ordem)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, nome, icon, color, ordem`,
            [id, nome.trim(), icon.trim(), color || 'bg-gray-100 text-gray-700 border-gray-200', ordem ?? 0]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Já existe uma categoria com este id' });
        }
        console.error('Erro ao criar categoria:', err);
        res.status(500).json({ error: 'Erro ao criar categoria' });
    }
});

/**
 * PUT /api/categorias/:id (admin)
 * Body: { nome, icon, color, ordem }
 */
router.put('/:id', authMiddleware, async (req, res) => {
    const { nome, icon, color, ordem } = req.body;

    try {
        const { rows } = await pool.query(
            `UPDATE categorias
             SET nome  = COALESCE($1, nome),
                 icon  = COALESCE($2, icon),
                 color = COALESCE($3, color),
                 ordem = COALESCE($4, ordem)
             WHERE id = $5
             RETURNING id, nome, icon, color, ordem`,
            [nome?.trim(), icon?.trim(), color, ordem ?? null, req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Categoria não encontrada' });
        res.json(rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar categoria:', err);
        res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }
});

/**
 * DELETE /api/categorias/:id (admin)
 * Soft-delete: seta ativo = false
 * Bloqueia se houver convênios ativos vinculados
 */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // Verifica se existem convênios ativos usando esta categoria
        const check = await pool.query(
            'SELECT COUNT(*) FROM convenios WHERE categoria = $1 AND ativo = true',
            [req.params.id]
        );
        if (parseInt(check.rows[0].count) > 0) {
            return res.status(409).json({
                error: `Não é possível remover: existem ${check.rows[0].count} convênio(s) ativo(s) nesta categoria`
            });
        }

        const { rows } = await pool.query(
            'UPDATE categorias SET ativo = false WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Categoria não encontrada' });
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao remover categoria:', err);
        res.status(500).json({ error: 'Erro ao remover categoria' });
    }
});

module.exports = router;
