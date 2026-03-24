const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const conveniosRoutes = require('./routes/convenios');
const unidadesRoutes = require('./routes/unidades');
const uploadRoutes = require('./routes/upload');
const eventosRoutes = require('./routes/eventos');
const categoriasRoutes = require('./routes/categorias');


const app = express();

// ── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve arquivos de upload (logos dos parceiros)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Rotas ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/convenios', conveniosRoutes);
app.use('/api/unidades', unidadesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/categorias', categoriasRoutes);


// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// ── Error handler ────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('Erro interno:', err);
    res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
});

module.exports = app;
