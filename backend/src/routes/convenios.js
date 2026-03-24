const router = require('express').Router();
const pool = require('../config/db');
const authMiddleware = require('../middlewares/auth');

// ── GET /api/convenios ────────────────────────────────────────────────────────
// Query params: ?categoria=saude&unidade_id=1&busca=clinica&page=1&limit=20
router.get('/', async (req, res) => {
    const { categoria, unidade_id, busca, page = 1, limit = 50, includeInactive } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Admin pode passar ?includeInactive=true para ver todos (ativos + inativos)
    let conditions = includeInactive === 'true' ? [] : ['c.ativo = true'];
    const params = [];
    let paramIdx = 1;

    if (categoria) {
        conditions.push(`c.categoria = $${paramIdx++}`);
        params.push(categoria);
    }
    if (unidade_id) {
        conditions.push(`c.unidade_id = $${paramIdx++}`);
        params.push(parseInt(unidade_id));
    }
    if (busca) {
        conditions.push(
            `(c.nome ILIKE $${paramIdx} OR c.descricao ILIKE $${paramIdx} OR c.categoria ILIKE $${paramIdx})`
        );
        params.push(`%${busca}%`);
        paramIdx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
        const { rows } = await pool.query(
            `SELECT c.*, u.nome AS unidade_nome
       FROM convenios c
       LEFT JOIN unidades u ON c.unidade_id = u.id
       ${where}
       ORDER BY c.nome ASC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
            [...params, parseInt(limit), offset]
        );

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM convenios c ${where}`,
            params
        );

        res.json({
            data: rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit),
        });
    } catch (err) {
        console.error('Erro ao listar convênios:', err);
        res.status(500).json({ error: 'Erro ao buscar convênios' });
    }
});

// ── GET /api/convenios/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT c.*, u.nome AS unidade_nome
       FROM convenios c
       LEFT JOIN unidades u ON c.unidade_id = u.id
       WHERE c.id = $1 AND c.ativo = true`,
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Convênio não encontrado' });
        res.json(rows[0]);
    } catch (err) {
        console.error('Erro ao buscar convênio:', err);
        res.status(500).json({ error: 'Erro ao buscar convênio' });
    }
});

// ── POST /api/convenios (admin) ───────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
    const {
        nome, categoria, porcentagem_desconto, logo_url,
        endereco, telefone, whatsapp, site, cnpj_cpf,
        descricao, regras, cidade, unidade_id,
    } = req.body;

    if (!nome || !categoria || porcentagem_desconto === undefined) {
        return res.status(400).json({ error: 'nome, categoria e porcentagem_desconto são obrigatórios' });
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO convenios
        (nome, categoria, porcentagem_desconto, logo_url, endereco, telefone, whatsapp, site, cnpj_cpf, descricao, regras, cidade, unidade_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
            [nome, categoria, porcentagem_desconto, logo_url, endereco, telefone, whatsapp || null, site || null, cnpj_cpf || null, descricao, regras, cidade, unidade_id || null]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Erro ao criar convênio:', err);
        res.status(500).json({ error: 'Erro ao criar convênio' });
    }
});

// ── PUT /api/convenios/:id (admin) ────────────────────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
    const {
        nome, categoria, porcentagem_desconto, logo_url,
        endereco, telefone, whatsapp, site, cnpj_cpf,
        descricao, regras, cidade, unidade_id, ativo,
    } = req.body;

    try {
        const { rows } = await pool.query(
            `UPDATE convenios SET
        nome = COALESCE($1, nome),
        categoria = COALESCE($2, categoria),
        porcentagem_desconto = COALESCE($3, porcentagem_desconto),
        logo_url = COALESCE($4, logo_url),
        endereco = COALESCE($5, endereco),
        telefone = COALESCE($6, telefone),
        whatsapp = $7,
        site = $8,
        cnpj_cpf = $9,
        descricao = COALESCE($10, descricao),
        regras = COALESCE($11, regras),
        cidade = COALESCE($12, cidade),
        unidade_id = COALESCE($13, unidade_id),
        ativo = COALESCE($14, ativo),
        updated_at = NOW()
       WHERE id = $15
       RETURNING *`,
            [nome, categoria, porcentagem_desconto, logo_url, endereco, telefone, whatsapp ?? null, site ?? null, cnpj_cpf ?? null, descricao, regras, cidade, unidade_id, ativo, req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Convênio não encontrado' });
        res.json(rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar convênio:', err);
        res.status(500).json({ error: 'Erro ao atualizar convênio' });
    }
});

// ── DELETE /api/convenios/:id (admin) — soft delete ───────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `UPDATE convenios SET ativo = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Convênio não encontrado' });
        res.json({ message: 'Convênio removido com sucesso', id: rows[0].id });
    } catch (err) {
        console.error('Erro ao deletar convênio:', err);
        res.status(500).json({ error: 'Erro ao deletar convênio' });
    }
});

module.exports = router;
