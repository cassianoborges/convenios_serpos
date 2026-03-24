const router = require('express').Router();
const pool = require('../config/db');
const authMiddleware = require('../middlewares/auth');

// ── POST /api/eventos  (público — sem auth) ───────────────────────────────────
// Registra um evento de clique / interação
router.post('/', async (req, res) => {
    const {
        event_name, partner_id, partner_nome, categoria,
        unidade_id, valor,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        referrer,
    } = req.body;

    if (!event_name) return res.status(400).json({ error: 'event_name obrigatório' });

    try {
        await pool.query(
            `INSERT INTO eventos
        (event_name, partner_id, partner_nome, categoria, unidade_id, valor,
         utm_source, utm_medium, utm_campaign, utm_term, utm_content, referrer)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [
                event_name,
                partner_id || null,
                partner_nome || null,
                categoria || null,
                unidade_id || null,
                valor || null,
                utm_source || null,
                utm_medium || null,
                utm_campaign || null,
                utm_term || null,
                utm_content || null,
                referrer || null,
            ]
        );
        res.status(201).json({ ok: true });
    } catch (err) {
        console.error('Erro ao registrar evento:', err.message);
        // Não bloqueia o usuário por erro de analytics
        res.status(201).json({ ok: true });
    }
});

// ── GET /api/eventos  (admin) ─────────────────────────────────────────────────
// Query params: ?days=30&event_name=partner_click&utm_source=instagram
router.get('/', authMiddleware, async (req, res) => {
    const { days = 30, event_name, utm_source, limit = 500 } = req.query;

    let conditions = [`created_at >= NOW() - INTERVAL '${parseInt(days)} days'`];
    const params = [];
    let idx = 1;

    if (event_name) { conditions.push(`event_name = $${idx++}`); params.push(event_name); }
    if (utm_source) { conditions.push(`utm_source = $${idx++}`); params.push(utm_source); }

    const where = `WHERE ${conditions.join(' AND ')}`;

    try {
        const { rows } = await pool.query(
            `SELECT * FROM eventos ${where} ORDER BY created_at DESC LIMIT $${idx}`,
            [...params, parseInt(limit)]
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro ao listar eventos:', err.message);
        res.status(500).json({ error: 'Erro ao buscar eventos' });
    }
});

// ── GET /api/eventos/resumo  (admin) ──────────────────────────────────────────
// Retorna métricas agregadas para o dashboard
router.get('/resumo', authMiddleware, async (req, res) => {
    const { days = 30 } = req.query;
    const interval = `INTERVAL '${parseInt(days)} days'`;

    try {
        const [totais, topParceiros, topUtmSource, porDia, topCategorias] = await Promise.all([
            // Total por tipo de evento
            pool.query(`
        SELECT event_name, COUNT(*) as total
        FROM eventos WHERE created_at >= NOW() - ${interval}
        GROUP BY event_name ORDER BY total DESC`),

            // Top parceiros mais clicados
            pool.query(`
        SELECT partner_nome, COUNT(*) as cliques
        FROM eventos
        WHERE event_name = 'partner_click' AND created_at >= NOW() - ${interval}
          AND partner_nome IS NOT NULL
        GROUP BY partner_nome ORDER BY cliques DESC LIMIT 10`),

            // Top origens (utm_source)
            pool.query(`
        SELECT COALESCE(utm_source, 'direto') as fonte, COUNT(*) as total
        FROM eventos WHERE created_at >= NOW() - ${interval}
        GROUP BY utm_source ORDER BY total DESC LIMIT 10`),

            // Eventos por dia (últimos N dias)
            pool.query(`
        SELECT DATE(created_at) as dia, COUNT(*) as total
        FROM eventos WHERE created_at >= NOW() - ${interval}
        GROUP BY dia ORDER BY dia ASC`),

            // Top categorias filtradas
            pool.query(`
        SELECT valor as categoria, COUNT(*) as total
        FROM eventos
        WHERE event_name = 'category_filter' AND created_at >= NOW() - ${interval}
          AND valor IS NOT NULL
        GROUP BY valor ORDER BY total DESC`),
        ]);

        res.json({
            totais: totais.rows,
            topParceiros: topParceiros.rows,
            topUtmSource: topUtmSource.rows,
            porDia: porDia.rows,
            topCategorias: topCategorias.rows,
        });
    } catch (err) {
        console.error('Erro no resumo:', err.message);
        res.status(500).json({ error: 'Erro ao buscar resumo' });
    }
});

module.exports = router;
