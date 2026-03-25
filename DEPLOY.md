# Guia de Implantação — SERPOS Convênios (VPS + PM2)

Sem proxy reverso. O backend roda direto na porta 3004 e o frontend é servido como arquivos estáticos na porta 80 via `serve` + PM2.

---

## Pré-requisitos na VPS

```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 globalmente
sudo npm install -g pm2

# serve (para servir o frontend estático)
sudo npm install -g serve

# Git
sudo apt-get install -y git
```

---

## 1. Clonar o repositório

```bash
cd /var/www
sudo git clone https://github.com/cassianoborges/convenios_serpos.git
cd convenios_serpos
```

---

## 2. Configurar o Backend

```bash
cd /var/www/convenios_serpos/backend

# Instalar dependências
npm install --omit=dev

# Criar o arquivo .env
nano .env
```

Conteúdo do `.env`:

```env
DATABASE_URL=postgresql://postgres.vnafcrxycamueyxejhaf:SUA_SENHA@aws-1-us-east-1.pooler.supabase.com:6543/postgres
JWT_SECRET=troque_por_uma_chave_forte_aqui
PORT=3004
UPLOAD_DIR=uploads/
BASE_URL=http://IP_DA_SUA_VPS:3004
NODE_ENV=production
```

> Substitua `IP_DA_SUA_VPS` pelo IP público da VPS (ex: `http://45.67.89.10:3004`).
> Se tiver domínio apontando para a VPS, use o domínio (ex: `http://api.serpos.com.br:3004`).

Criar a pasta de uploads:

```bash
mkdir -p /var/www/convenios_serpos/backend/uploads
```

---

## 3. Build do Frontend

```bash
cd /var/www/convenios_serpos

# Instalar dependências do frontend
npm install

# Criar o .env do frontend apontando para o backend
echo "VITE_API_URL=http://IP_DA_SUA_VPS:3004/api" > .env.production
```

> Substitua `IP_DA_SUA_VPS` pelo mesmo valor usado no backend.

```bash
# Gerar o build de produção
npm run build
```

O build fica em `/var/www/convenios_serpos/dist`.

---

## 4. Configurar o PM2

Crie o arquivo de configuração do PM2 na raiz do projeto:

```bash
nano /var/www/convenios_serpos/ecosystem.config.js
```

Conteúdo:

```js
module.exports = {
  apps: [
    {
      name: 'serpos-backend',
      script: './backend/src/server.js',
      cwd: '/var/www/convenios_serpos',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'serpos-frontend',
      script: 'serve',
      interpreter: 'none',
      args: '-s dist -l 80',
      cwd: '/var/www/convenios_serpos',
      instances: 1,
      autorestart: true,
      watch: false,
    },
  ],
};
```

> O frontend sobe na porta **80** e o backend na porta **3004**.

---

## 5. Iniciar com PM2

```bash
cd /var/www/convenios_serpos

# Iniciar os dois processos
pm2 start ecosystem.config.js

# Salvar para reiniciar automaticamente após reboot da VPS
pm2 save
pm2 startup
# Execute o comando que o PM2 exibir após pm2 startup
```

---

## 6. Verificar se está rodando

```bash
pm2 status
```

Saída esperada:

```
┌─────────────────────┬────┬─────────┬───────┬─────────┐
│ name                │ id │ status  │ cpu   │ memory  │
├─────────────────────┼────┼─────────┼───────┼─────────┤
│ serpos-backend      │ 0  │ online  │ 0%    │ 60mb    │
│ serpos-frontend     │ 1  │ online  │ 0%    │ 30mb    │
└─────────────────────┴────┴─────────┴───────┴─────────┘
```

Testar o backend:

```bash
curl http://localhost:3004/api/health
# Deve retornar: {"status":"ok","timestamp":"..."}
```

---

## 7. Criar o primeiro administrador

```bash
cd /var/www/convenios_serpos/backend
node seeds/create_admin.js
```

Ou com credenciais customizadas:

```bash
ADMIN_EMAIL=seu@email.com ADMIN_SENHA=SuaSenha123 ADMIN_NOME="Seu Nome" node seeds/create_admin.js
```

---

## Comandos PM2 úteis

```bash
pm2 status                        # ver status de todos os processos
pm2 logs serpos-backend           # logs do backend em tempo real
pm2 logs serpos-frontend          # logs do frontend
pm2 restart serpos-backend        # reiniciar só o backend
pm2 restart serpos-frontend       # reiniciar só o frontend
pm2 restart all                   # reiniciar tudo
pm2 stop all                      # parar tudo
pm2 delete all                    # remover todos os processos do PM2
```

---

## Atualizar o sistema (deploy de nova versão)

```bash
cd /var/www/convenios_serpos

# Baixar as alterações do GitHub
git pull origin main

# Atualizar dependências do backend (se houver mudanças)
cd backend && npm install --omit=dev && cd ..

# Rebuildar o frontend
npm install
npm run build

# Reiniciar os processos
pm2 restart all
```

---

## Estrutura de portas

| Serviço          | Porta | Acesso                        |
|------------------|-------|-------------------------------|
| Frontend (serve) | 80    | http://IP_DA_VPS              |
| Backend (API)    | 3004  | http://IP_DA_VPS:3004/api     |
| Admin            | 80    | http://IP_DA_VPS/admin        |
| Login            | 80    | http://IP_DA_VPS/login        |

---

## Observações importantes

- **Firewall:** libere as portas 80 e 3004 na VPS.
  ```bash
  sudo ufw allow 80
  sudo ufw allow 3004
  sudo ufw enable
  ```
- **Uploads:** a pasta `backend/uploads/` deve ter permissão de escrita.
  ```bash
  chmod 755 /var/www/convenios_serpos/backend/uploads
  ```
- **BASE_URL no .env do backend** deve ser a URL pública para que as logos dos parceiros sejam acessíveis pelo navegador dos usuários.
- O arquivo `backend/.env` **nunca deve ser commitado** no Git — ele já está no `.gitignore`.
