#!/bin/bash
# ============================================================
# deploy.sh — Script de deploy para VPS
# Domínio: convenios.serpos.com.br | IP: 77.42.69.91
# Nginx e proxy reverso configurados manualmente na VPS.
# ============================================================
set -e

APP_DIR="/var/www/convenios"

echo "==> Atualizando código..."
cd $APP_DIR
git pull origin main

echo "==> Build do frontend..."
npm install
npm run build  # lê .env.production → gera ./dist

echo "==> Dependências do backend..."
cd $APP_DIR/backend
npm install --production

echo "==> Reiniciando backend com PM2..."
pm2 restart serpos-backend || pm2 start src/index.js --name serpos-backend --cwd $APP_DIR/backend

echo ""
echo "✅ Deploy concluído! https://convenios.serpos.com.br"
