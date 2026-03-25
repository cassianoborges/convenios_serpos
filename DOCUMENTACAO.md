# SERPOS Convenios — Documentação do Projeto

Sistema de convênios e benefícios exclusivos para associados do Grupo Serpos. Permite que os associados consultem parceiros com descontos, e que administradores gerenciem todo o catálogo via painel protegido.

---

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (React + TypeScript + Vite)                   │
│  Site público  ─────────  Painel Admin                  │
│  /             ─────────  /admin   /login               │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP / REST API (Axios)
                     │ JWT via Authorization: Bearer
┌────────────────────▼────────────────────────────────────┐
│  BACKEND (Node.js + Express)                            │
│  /api/auth  /api/convenios  /api/unidades               │
│  /api/categorias  /api/eventos  /api/upload             │
└────────────────────┬────────────────────────────────────┘
                     │ pg Pool
┌────────────────────▼────────────────────────────────────┐
│  BANCO DE DADOS (PostgreSQL — Supabase)                 │
│  admins | convenios | unidades | categorias | eventos   │
└─────────────────────────────────────────────────────────┘
```

**Stack principal:**
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Axios, Framer Motion
- Backend: Node.js, Express, bcryptjs, jsonwebtoken, multer
- Banco: PostgreSQL via Supabase (driver `pg`)
- Testes: Vitest + Testing Library

---

---

# Feature 1 — Site Publico (Catalogo de Convenios)

Pagina principal acessada pelos associados do Grupo Serpos. Exibe todos os parceiros com descontos, permite buscar e filtrar por categoria e unidade, e abre um modal com detalhes do parceiro selecionado.

## Como funciona

1. Ao acessar `/`, o componente `Index` monta e dispara `useUTM()` para capturar/persistir parametros UTM da URL no `sessionStorage`.
2. Um evento `page_view` e enviado para a API de analytics.
3. `usePartners()` faz GET `/api/convenios` com os filtros ativos (categoria, unidade, busca). O resultado e cacheado por 2 minutos via TanStack Query.
4. `useUnidades()` faz GET `/api/unidades` para popular os botoes de filtro por unidade (cache de 5 min).
5. O usuario pode filtrar por categoria (botoes dinamicos vindos da API), por unidade (botoes pills) ou buscar por texto (debounce de 1,5 s com rastreamento de evento `search`).
6. Clicar em um card dispara o evento `partner_click` e abre o `PartnerModal` com todas as informacoes do parceiro (descricao, regras, telefone, WhatsApp, site, endereco).
7. Um botao flutuante de WhatsApp fica fixo no canto inferior para contato rapido com a equipe Serpos.

## Arquivos principais

```
src/pages/Index.tsx                  — pagina raiz, orquestra todos os estados e eventos
src/components/Header.tsx            — cabecalho com logo e link para o admin
src/components/HeroSection.tsx       — banner com titulo, subtitulo, barra de busca e numeros estatisticos
src/components/SearchBar.tsx         — input de busca reutilizavel
src/components/CategoryFilters.tsx   — botoes de filtro por categoria (dados da API)
src/components/PartnerCard.tsx       — card de parceiro na grade
src/components/PartnerModal.tsx      — modal de detalhes do parceiro
src/components/WhatsAppButton.tsx    — botao flutuante de contato
src/components/Footer.tsx            — rodape do site
src/hooks/usePartners.ts             — query de convenios com filtros
src/hooks/useUnidades.ts             — query de unidades ativas
src/hooks/useCategorias.ts           — query de categorias dinamicas
src/types/partner.ts                 — interfaces Partner, Category, CategoryInfo
src/data/mockPartners.ts             — dados mock usados durante desenvolvimento sem backend
```

## Integracoes

- `usePartners` → GET `/api/convenios?categoria=&unidade_id=&busca=`
- `useUnidades` → GET `/api/unidades`
- `useCategorias` → GET `/api/categorias`
- `useTracking` → POST `/api/eventos` (fire-and-forget, nao bloqueia UX)
- `useUTM` → sessionStorage `serpos_utm`

## Configuracao

| Variavel | Descricao |
|---|---|
| `VITE_API_URL` | URL base da API (default: `http://localhost:3001/api`) |

## Observacoes importantes

- Se a API estiver fora do ar, a pagina exibe um estado de erro com mensagem orientando verificar o servidor em `localhost:3001`. Nao ha fallback automatico para os dados mock em producao.
- O debounce de busca (1,5 s) evita disparar requisicoes a cada tecla, mas o evento de analytics so e enviado apos parar de digitar.
- `mockPartners.ts` so e usado em testes ou desenvolvimento manual; em producao os dados vem exclusivamente da API.
- A filtragem por unidade e por categoria sao passadas diretamente como query params para o backend — nao ha filtragem no cliente.

---

---

# Feature 2 — Autenticacao de Administradores

Sistema de login JWT para o painel administrativo. Apenas administradores cadastrados no banco conseguem acessar as rotas protegidas do frontend e do backend.

## Como funciona

**Frontend:**
1. O usuario acessa `/login` e preenche email e senha.
2. `Login.tsx` chama `login(email, senha)` do `AuthContext`.
3. `AuthContext` faz POST `/api/auth/login` com as credenciais.
4. Em caso de sucesso, o token JWT e os dados do admin sao salvos no `localStorage` (`serpos_admin_token`, `serpos_admin_user`).
5. O estado global `isAuthenticated` vira `true` e o usuario e redirecionado para `/admin`.
6. Em toda requisicao subsequente, o interceptor do Axios injeta o header `Authorization: Bearer <token>` automaticamente.
7. Se o backend retornar `401`, o interceptor limpa o localStorage e redireciona para `/login`.

**Backend:**
1. `POST /api/auth/login` busca o admin pelo email no banco.
2. Compara a senha com o hash usando `bcrypt.compare`.
3. Gera um JWT com `{ id, email, nome }` assinado com `JWT_SECRET`, validade de 8 horas.
4. Rotas protegidas usam o middleware `authMiddleware` que verifica e decodifica o token antes de passar para o handler.

## Arquivos principais

```
src/pages/Login.tsx                   — formulario de login
src/context/AuthContext.tsx           — provider de autenticacao, estado global, funcoes login/logout
src/services/api.ts                   — instancia Axios com interceptors de token e 401
backend/src/routes/auth.js            — endpoints: POST /login, GET /me, GET /users, POST /users, DELETE /users/:id
backend/src/middlewares/auth.js       — middleware JWT para rotas protegidas
backend/seeds/create_admin.js         — script de seed para criar o primeiro administrador
```

## Integracoes

- `AuthContext` → POST `/api/auth/login`
- `authMiddleware` → todos os endpoints administrativos do backend
- Interceptor Axios → localStorage `serpos_admin_token`

## Configuracao

| Variavel | Descricao |
|---|---|
| `JWT_SECRET` | Chave secreta para assinar e verificar tokens JWT |
| `ADMIN_EMAIL` | Email do admin inicial (seed) |
| `ADMIN_SENHA` | Senha do admin inicial (seed) |
| `ADMIN_NOME` | Nome do admin inicial (seed) |

Para criar o primeiro admin: `node seeds/create_admin.js`

## Observacoes importantes

- O token expira em 8 horas. Apos expirar, o interceptor do Axios redireciona automaticamente para `/login`.
- A rota `DELETE /api/auth/users/:id` bloqueia a remocao do proprio usuario logado (previne auto-exclusao).
- Senhas sao armazenadas com `bcrypt` (salt rounds: 10 no login, 12 no seed).
- O seed usa `ON CONFLICT (email) DO UPDATE` — pode ser rodado multiplas vezes com seguranca para resetar a senha.

---

---

# Feature 3 — Painel Administrativo

Interface restrita para gerenciamento completo do sistema. Acessivel em `/admin` somente apos autenticacao. Organizado em 5 abas: Convenios, Unidades, Analytics, Usuarios e Categorias.

## Como funciona

1. `Admin.tsx` verifica `isAuthenticated` via `AuthContext`; caso negativo, a rota protegida redireciona para `/login` (via React Router).
2. A sidebar exibe as 5 abas de navegacao. Em mobile, as abas ficam no topo.
3. Uma barra de estatisticas exibe o total de convenios ativos e o numero de unidades.
4. Cada aba renderiza um componente especializado:
   - **ConvenioTable**: tabela de parceiros com busca, filtros, edicao inline e exclusao (soft delete). Abre `ConvenioForm` para criar/editar.
   - **UnidadeManager**: CRUD de unidades (nome, cidade, UF, ativo).
   - **Analytics**: dashboard com graficos de eventos rastreados (cliques, buscas, filtros por categoria, origens UTM, parceiros mais acessados).
   - **UserManager**: listagem e gerenciamento de contas de administradores.
   - **CategoriaManager**: CRUD de categorias dinamicas (slug, nome, icone, cor, ordem de exibicao).

## Arquivos principais

```
src/pages/Admin.tsx                          — layout principal do painel (sidebar, header, stats bar)
src/pages/Login.tsx                          — pagina de acesso ao painel
src/components/admin/ConvenioTable.tsx       — tabela com busca, filtros e acoes sobre convenios
src/components/admin/ConvenioForm.tsx        — formulario de criacao/edicao de convenio (com upload de logo)
src/components/admin/UnidadeManager.tsx      — CRUD de unidades
src/components/admin/Analytics.tsx          — dashboard de eventos/analytics
src/components/admin/UserManager.tsx         — gerenciamento de administradores
src/components/admin/CategoriaManager.tsx   — CRUD de categorias
src/hooks/useUnidades.ts                     — useUnidades, useCreateUnidade, useUpdateUnidade, useDeleteUnidade
src/hooks/useCategorias.ts                   — useCategorias
```

## Integracoes

- `ConvenioTable` / `ConvenioForm` → GET/POST/PUT/DELETE `/api/convenios`
- `ConvenioForm` → POST `/api/upload/logo` (upload de imagem do parceiro)
- `UnidadeManager` → GET/POST/PUT/DELETE `/api/unidades`
- `CategoriaManager` → GET/POST/PUT/DELETE `/api/categorias`
- `UserManager` → GET/POST/DELETE `/api/auth/users`
- `Analytics` → GET `/api/eventos/resumo?days=N`
- Todas as requisicoes passam pelo interceptor Axios com token JWT

## Configuracao

Nenhuma variavel adicional alem das do frontend (`VITE_API_URL`).

## Observacoes importantes

- Exclusoes de convenios e unidades sao **soft delete** (`ativo = false`), nunca deletam o registro fisicamente.
- Exclusao de categoria e bloqueada se houver convenios ativos vinculados a ela (validacao no backend).
- O painel exibe apenas convenios ativos por padrao; o admin pode ver inativos passando `?includeInactive=true` na query.
- A aba Analytics consome o endpoint `/api/eventos/resumo` que agrega dados do periodo selecionado (padrao: 30 dias).

---

---

# Feature 4 — Gerenciamento de Convenios (CRUD)

Nucleo do sistema. Permite criar, listar, editar e desativar parceiros com descontos. Cada convenio pertence a uma categoria e pode ser associado a uma ou mais unidades.

## Como funciona

**Listagem publica:**
- GET `/api/convenios` aceita query params `categoria`, `unidade_id`, `busca`, `page`, `limit`.
- Retorna paginado: `{ data, total, page, limit }`.
- Faz JOIN com `unidades` para incluir `unidade_nome` nos resultados.

**CRUD admin:**
- POST cria um convenio com os campos obrigatorios `nome`, `categoria`, `porcentagem_desconto`.
- PUT usa `COALESCE` para atualizar apenas os campos enviados (patch parcial).
- DELETE e soft delete: seta `ativo = false` e `updated_at = NOW()`.

**Campos de um convenio:**

| Campo | Tipo | Obrigatorio |
|---|---|---|
| nome | string | sim |
| categoria | string (slug) | sim |
| porcentagem_desconto | number | sim |
| logo_url | string (URL) | nao |
| endereco | string | nao |
| telefone | string | nao |
| whatsapp | string | nao |
| site | string (URL) | nao |
| cnpj_cpf | string | nao |
| descricao | text | nao |
| regras | text | nao |
| cidade | string | nao |
| unidade_id | number (FK) | nao |
| ativo | boolean | nao (default true) |

## Arquivos principais

```
backend/src/routes/convenios.js       — endpoints REST do recurso convenios
src/hooks/usePartners.ts              — hook de leitura para o site publico
src/components/admin/ConvenioTable.tsx — tabela admin com busca e acoes
src/components/admin/ConvenioForm.tsx  — formulario admin de criacao/edicao
src/types/partner.ts                   — interface Partner (TypeScript)
```

## Integracoes

- Depende da tabela `unidades` (FK `unidade_id`)
- Depende da tabela `categorias` (campo `categoria` como slug)
- Upload de logo usa `/api/upload/logo` (Feature 6)
- Listagem publica e consumida por `usePartners` no `Index.tsx`

## Configuracao

Sem variaveis especificas. Herda `DATABASE_URL` do backend.

## Observacoes importantes

- A busca no backend usa `ILIKE` nos campos `nome`, `descricao` e `categoria` simultaneamente.
- `unidade_id` e opcional — um convenio pode ser "global" (visivel em todas as unidades) se nao tiver unidade vinculada.
- O campo `categoria` e um slug texto livre no convenio, mas e validado dinamicamente pela tabela `categorias` no frontend.

---

---

# Feature 5 — Gerenciamento de Unidades

Gerencia as unidades fisicas/regionais do Grupo Serpos. Cada unidade pode ter convenios exclusivos vinculados a ela.

## Como funciona

- GET `/api/unidades` retorna todas as unidades ativas com contagem de convenios ativos vinculados (via LEFT JOIN + COUNT).
- POST/PUT/DELETE sao protegidos por `authMiddleware`.
- DELETE e soft delete (`ativo = false`).
- O site publico usa `useUnidades()` para exibir os botoes de filtro por unidade.

## Arquivos principais

```
backend/src/routes/unidades.js        — endpoints REST do recurso unidades
src/hooks/useUnidades.ts              — useUnidades (query) + useCreateUnidade, useUpdateUnidade, useDeleteUnidade (mutations)
src/components/admin/UnidadeManager.tsx — interface admin CRUD
src/pages/Index.tsx                   — consome useUnidades para exibir filtros
```

## Integracoes

- Tabela `convenios` referencia `unidades.id` via FK `unidade_id`
- Invalidacao automatica do cache TanStack Query apos qualquer mutacao

## Configuracao

Sem variaveis especificas.

## Observacoes importantes

- A listagem publica inclui `total_convenios` por unidade — util para exibir badges de quantidade no filtro.
- Nao ha validacao que impeca desativar uma unidade com convenios ativos; os convenios continuam existindo mas ficam sem unidade visivel nos filtros.

---

---

# Feature 6 — Upload de Logos de Parceiros

Permite que administradores facade upload de imagens para usar como logo dos parceiros. Os arquivos sao servidos estaticamente pelo proprio backend.

## Como funciona

1. O `ConvenioForm` envia um `multipart/form-data` com o campo `logo` para `POST /api/upload/logo`.
2. O backend valida o tipo MIME (somente `jpeg`, `png`, `webp`, `gif`, `svg+xml`) e o tamanho (maximo 5 MB).
3. O arquivo e salvo em disco na pasta `backend/uploads/` com nome unico: `{timestamp}-{random}.{ext}`.
4. O backend retorna `{ url, filename }` onde `url` e o caminho publico completo.
5. A URL retornada e salva no campo `logo_url` do convenio.
6. O Express serve a pasta `/uploads` como estatico via `app.use('/uploads', express.static(...))`.

## Arquivos principais

```
backend/src/routes/upload.js   — endpoint POST /api/upload/logo
backend/uploads/               — pasta de armazenamento dos arquivos (criada automaticamente)
```

## Integracoes

- Consumido por `ConvenioForm.tsx` no momento de criar/editar um convenio
- Protegido por `authMiddleware`

## Configuracao

| Variavel | Descricao |
|---|---|
| `UPLOAD_DIR` | Caminho da pasta de uploads (default: `uploads/`) |
| `BASE_URL` | URL base do backend para montar a URL publica da imagem (default: `http://localhost:{PORT}`) |

## Observacoes importantes

- Os arquivos ficam em disco no proprio servidor — nao ha integracao com storage externo (S3, Supabase Storage etc.) por padrao.
- Em deploy em VPS, `BASE_URL` deve ser configurada com o dominio real (ex: `https://api.convenios.serpos.com.br`) para que as URLs das logos funcionem corretamente.
- O diretorio `uploads/` e criado automaticamente na inicializacao se nao existir.

---

---

# Feature 7 — Analytics e Rastreamento de Eventos

Sistema proprio de tracking de interacoes dos usuarios. Registra visualizacoes de pagina, cliques em parceiros, buscas, filtros aplicados e origem de trafego (UTM). Dados consultaveis no painel admin.

## Como funciona

**Captura de UTM:**
1. `useUTM()` e chamado na montagem de `Index.tsx`.
2. Le os parametros `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` da URL atual.
3. Se presentes, persiste no `sessionStorage` (chave `serpos_utm`) junto com o `document.referrer`.
4. Nas visitas seguintes sem UTM na URL, recupera os UTMs salvos da sessao atual.

**Envio de eventos:**
1. `useTracking()` expoe a funcao `track(event_name, payload)`.
2. Ao chamar `track`, os UTMs da sessao sao automaticamente incluidos no payload.
3. A API POST `/api/eventos` recebe e persiste o evento — erros sao silenciosos (nao afetam o usuario).

**Eventos rastreados:**

| event_name | Quando e disparado |
|---|---|
| `page_view` | Ao carregar a pagina publica |
| `partner_click` | Ao clicar em um card de parceiro |
| `category_filter` | Ao selecionar uma categoria |
| `unidade_filter` | Ao selecionar uma unidade |
| `search` | Apos parar de digitar na busca (debounce 1,5s) |
| `contact_click` | Ao clicar em botao de contato dentro do modal |

**Dashboard:**
- GET `/api/eventos/resumo?days=N` retorna em paralelo: totais por tipo de evento, top 10 parceiros clicados, top 10 origens UTM, eventos agrupados por dia, top categorias filtradas.

## Arquivos principais

```
src/hooks/useUTM.ts              — captura e persistencia de UTMs no sessionStorage
src/hooks/useTracking.ts         — hook track() para disparar eventos
backend/src/routes/eventos.js    — POST /api/eventos, GET /api/eventos, GET /api/eventos/resumo
src/components/admin/Analytics.tsx — dashboard visual dos dados de eventos
```

## Integracoes

- `useTracking` → POST `/api/eventos` (publico, sem autenticacao)
- `Analytics.tsx` → GET `/api/eventos/resumo` (requer JWT)
- `useUTM` → `sessionStorage` (nao depende de API)

## Configuracao

Sem variaveis especificas. Os eventos sao persistidos no banco via `DATABASE_URL`.

## Observacoes importantes

- O endpoint POST `/api/eventos` e **publico** (sem JWT) intencionalmente — o frontend nao tem token disponivel na visita publica.
- Erros no tracking nunca devem bloquear o usuario: o backend retorna `201` mesmo em caso de erro de banco, e o frontend faz fire-and-forget com `.catch(() => {})`.
- O campo `valor` e genericamente usado para armazenar dados extras (nome da busca, slug da categoria, id da unidade em string).
- Nao ha deduplicacao — cada chamada a `track` gera um novo registro na tabela `eventos`.

---

---

# Feature 8 — Gerenciamento de Categorias

Categorias sao dinamicas e gerenciadas pelo admin. Cada categoria tem um slug (id), nome, icone emoji, cor CSS e ordem de exibicao. Sao usadas tanto no site publico (filtros) quanto no formulario de convenios.

## Como funciona

- GET `/api/categorias` lista categorias ativas ordenadas pelo campo `ordem` (publico).
- POST cria uma nova categoria; o `id` deve ser um slug em letras minusculas e underscores.
- PUT atualiza campos da categoria (patch parcial via `COALESCE`).
- DELETE faz soft delete, mas bloqueia se houver convenios ativos usando a categoria.
- `useCategorias()` cacheia a lista por 5 minutos no frontend.
- `getCategoryInfo(id, categories)` retorna os dados da categoria pelo slug, com fallback generco se nao encontrar.

## Arquivos principais

```
backend/src/routes/categorias.js       — endpoints REST do recurso categorias
src/hooks/useCategorias.ts             — useCategorias (query) + getCategoryInfo (helper)
src/components/admin/CategoriaManager.tsx — interface admin CRUD
src/components/CategoryFilters.tsx     — botoes de filtro no site publico
```

## Integracoes

- Consumida por `CategoryFilters.tsx` (site publico) e `ConvenioForm.tsx` (select de categoria no admin)
- Campo `categoria` dos convenios referencia o `id` (slug) da tabela `categorias`

## Configuracao

Sem variaveis especificas.

## Observacoes importantes

- O `id` da categoria e um slug texto (ex: `saude`, `educacao`, `lazer`) — nao e numerico. Imutavel apos criacao.
- A validacao do slug (`/^[a-z_]+$/.test(id)`) garante compatibilidade com query params e uso como classe CSS.
- Remover uma categoria com convenios ativos retorna `409 Conflict` com a contagem de convenios bloqueadores.

---

---

# Feature 9 — Camada de API (Frontend)

Configuracao centralizada do cliente HTTP Axios com injecao automatica de token JWT e tratamento global de erros de autenticacao.

## Como funciona

- `api` e uma instancia Axios com `baseURL` configurada via `VITE_API_URL`.
- **Interceptor de request:** a cada requisicao, le `serpos_admin_token` do `localStorage` e injeta no header `Authorization: Bearer`.
- **Interceptor de response:** se a resposta for `401`, limpa os dados de autenticacao do localStorage e redireciona para `/login` (exceto se ja estiver na pagina de login).

## Arquivos principais

```
src/services/api.ts   — configuracao do Axios, interceptors de token e 401
```

## Integracoes

- Importado por todos os hooks (`usePartners`, `useUnidades`, `useCategorias`, `useTracking`) e por `AuthContext`

## Configuracao

| Variavel | Descricao |
|---|---|
| `VITE_API_URL` | URL base da API REST (default: `http://localhost:3004/api`) |

## Observacoes importantes

- O redirecionamento automatico em `401` e feito via `window.location.href` (hard redirect), nao via React Router — garante limpeza total de estado.
- O interceptor de request funciona tanto para requisicoes publicas (sem token) quanto para requisicoes autenticadas; se nao houver token no localStorage, o header nao e adicionado.

---

---

# Feature 10 — Backend Express (Servidor)

Servidor HTTP central que registra todas as rotas, middlewares globais e serve os arquivos estaticos de upload.

## Como funciona

- `app.js` cria a instancia Express, configura CORS (`origin: '*'`), body parsers JSON e urlencoded, e registra todas as rotas sob o prefixo `/api`.
- `server.js` le a porta da variavel de ambiente e inicia o listener.
- A pasta `/uploads` e servida como estatica.
- Um endpoint de health check em `/api/health` retorna `{ status: "ok", timestamp }`.

## Arquivos principais

```
backend/src/app.js            — configuracao do Express, middlewares e registro de rotas
backend/src/server.js         — ponto de entrada, listen na porta configurada
backend/src/config/db.js      — pool de conexao PostgreSQL (Supabase) via DATABASE_URL
backend/src/middlewares/auth.js  — middleware JWT reutilizavel
backend/.env.example          — template de variaveis de ambiente do backend
```

## Integracoes

- Todos os arquivos de rota em `backend/src/routes/`
- Banco de dados via `pool` exportado por `db.js`
- Arquivos estaticos em `backend/uploads/`

## Configuracao

| Variavel | Descricao |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL (ex: Supabase URI) |
| `JWT_SECRET` | Chave secreta para assinar/verificar tokens JWT |
| `PORT` | Porta do servidor (default: `3001`) |
| `UPLOAD_DIR` | Diretorio de uploads (default: `uploads/`) |
| `BASE_URL` | URL publica do backend para gerar URLs de arquivos |
| `NODE_ENV` | Ambiente (`development`, `production`) |

## Observacoes importantes

- CORS esta configurado como `origin: '*'` — em producao considerar restringir para o dominio do frontend.
- O pool PostgreSQL usa `ssl: { rejectUnauthorized: false }` para compatibilidade com Supabase.
- O backend nao tem sistema de migrations automaticas — o schema do banco deve ser criado manualmente ou via script separado.

---

---

# Estrutura de Diretorios

```
serpos-conveniences-main/
├── backend/                        # Servidor Node.js/Express
│   ├── src/
│   │   ├── app.js                  # Configuracao Express
│   │   ├── server.js               # Entry point
│   │   ├── config/
│   │   │   └── db.js               # Pool PostgreSQL
│   │   ├── middlewares/
│   │   │   └── auth.js             # Middleware JWT
│   │   └── routes/
│   │       ├── auth.js             # Autenticacao e usuarios admin
│   │       ├── convenios.js        # CRUD de convenios
│   │       ├── unidades.js         # CRUD de unidades
│   │       ├── categorias.js       # CRUD de categorias
│   │       ├── eventos.js          # Tracking de eventos / analytics
│   │       └── upload.js           # Upload de logos
│   ├── seeds/
│   │   └── create_admin.js         # Script de seed do primeiro admin
│   ├── uploads/                    # Logos dos parceiros (gerado em runtime)
│   └── .env.example                # Template de variaveis de ambiente
│
├── src/                            # Frontend React/TypeScript
│   ├── pages/
│   │   ├── Index.tsx               # Pagina publica do catalogo
│   │   ├── Admin.tsx               # Painel administrativo
│   │   ├── Login.tsx               # Pagina de login
│   │   └── NotFound.tsx            # Pagina 404
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── HeroSection.tsx
│   │   ├── SearchBar.tsx
│   │   ├── CategoryFilters.tsx
│   │   ├── PartnerCard.tsx
│   │   ├── PartnerModal.tsx
│   │   ├── WhatsAppButton.tsx
│   │   ├── Footer.tsx
│   │   ├── admin/                  # Componentes exclusivos do painel admin
│   │   │   ├── ConvenioTable.tsx
│   │   │   ├── ConvenioForm.tsx
│   │   │   ├── UnidadeManager.tsx
│   │   │   ├── CategoriaManager.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── UserManager.tsx
│   │   └── ui/                     # Componentes shadcn/ui (botoes, inputs, dialogs etc.)
│   ├── context/
│   │   └── AuthContext.tsx         # Estado global de autenticacao
│   ├── hooks/
│   │   ├── usePartners.ts          # Query de convenios
│   │   ├── useUnidades.ts          # Query + mutations de unidades
│   │   ├── useCategorias.ts        # Query de categorias
│   │   ├── useTracking.ts          # Disparo de eventos de analytics
│   │   ├── useUTM.ts               # Captura e persistencia de UTMs
│   │   └── use-mobile.tsx          # Deteccao de viewport mobile
│   ├── services/
│   │   └── api.ts                  # Cliente Axios centralizado
│   ├── types/
│   │   └── partner.ts              # Interfaces TypeScript do dominio
│   ├── data/
│   │   └── mockPartners.ts         # Dados de exemplo para desenvolvimento
│   ├── lib/
│   │   └── utils.ts                # Utilitario cn() para classes Tailwind
│   ├── main.tsx                    # Entry point React
│   └── index.css                   # Estilos globais e variaveis CSS
│
├── public/                         # Assets publicos estaticos
├── arquitetura.md                  # Template de documentacao de features
├── DOCUMENTACAO.md                 # Este arquivo
├── package.json                    # Dependencias do frontend
└── vite.config.ts / tailwind.config.ts / tsconfig.json
```

---

---

# Tabelas do Banco de Dados

## admins
| Coluna | Tipo | Descricao |
|---|---|---|
| id | serial PK | |
| email | text UNIQUE | Email de acesso |
| senha_hash | text | Hash bcrypt da senha |
| nome | text | Nome de exibicao |
| created_at | timestamp | Data de criacao |

## convenios
| Coluna | Tipo | Descricao |
|---|---|---|
| id | serial PK | |
| nome | text | Nome do parceiro |
| categoria | text | Slug da categoria (FK logica para categorias.id) |
| porcentagem_desconto | numeric | Percentual de desconto |
| logo_url | text | URL da imagem do logo |
| endereco | text | Endereco fisico |
| telefone | text | Telefone de contato |
| whatsapp | text | Numero WhatsApp |
| site | text | URL do site |
| cnpj_cpf | text | Documento do parceiro |
| descricao | text | Descricao do parceiro |
| regras | text | Regras e restricoes do desconto |
| cidade | text | Cidade |
| unidade_id | int FK | Referencia para unidades.id (nullable) |
| ativo | boolean | Soft delete flag (default true) |
| created_at | timestamp | |
| updated_at | timestamp | |

## unidades
| Coluna | Tipo | Descricao |
|---|---|---|
| id | serial PK | |
| nome | text | Nome da unidade |
| cidade | text | Cidade |
| uf | text | Estado (sigla) |
| ativo | boolean | Soft delete flag |

## categorias
| Coluna | Tipo | Descricao |
|---|---|---|
| id | text PK | Slug unico (ex: `saude`, `educacao`) |
| nome | text | Nome de exibicao |
| icon | text | Emoji ou icone |
| color | text | Classes CSS Tailwind para cor |
| ordem | int | Ordem de exibicao nos filtros |
| ativo | boolean | Soft delete flag |

## eventos
| Coluna | Tipo | Descricao |
|---|---|---|
| id | serial PK | |
| event_name | text | Tipo do evento (page_view, partner_click etc.) |
| partner_id | int | ID do parceiro envolvido (nullable) |
| partner_nome | text | Nome do parceiro (desnormalizado) |
| categoria | text | Categoria envolvida |
| unidade_id | int | Unidade envolvida |
| valor | text | Valor generico extra (busca, categoria slug etc.) |
| utm_source | text | Origem UTM |
| utm_medium | text | Midia UTM |
| utm_campaign | text | Campanha UTM |
| utm_term | text | Termo UTM |
| utm_content | text | Conteudo UTM |
| referrer | text | URL de referencia |
| created_at | timestamp | Data/hora do evento |

---

---

# Fluxo de Dados Completo — Visita Publica

```
Usuario acessa convenios.serpos.com.br
        |
        v
  Index.tsx monta
        |
        +-- useUTM() → le UTM da URL → salva no sessionStorage
        |
        +-- track('page_view') → POST /api/eventos [fire-and-forget]
        |
        +-- useUnidades() → GET /api/unidades → botoes de filtro
        |
        +-- useCategorias() → GET /api/categorias → botoes de categoria
        |
        +-- usePartners({ categoria, unidade_id, busca })
                |
                v
          GET /api/convenios?...
                |
                v
          PostgreSQL → SELECT convenios + unidades
                |
                v
          Grade de PartnerCards renderizada
                |
                v
  Usuario clica em um card
        |
        +-- track('partner_click', { partner_id, partner_nome, ... })
        |
        v
  PartnerModal abre com todos os dados do parceiro
```

---

---

# Fluxo de Dados Completo — Painel Admin

```
Admin acessa /admin
        |
        v
  AuthContext verifica localStorage
        |
        +-- sem token → redireciona para /login
        |
        +-- com token → renderiza Admin.tsx
                |
                v
  Admin.tsx carrega stats (total convenios, total unidades)
        |
        v
  Admin navega para aba "Convenios"
        |
        v
  ConvenioTable → GET /api/convenios?includeInactive=true
        |
        v
  Admin clica "Novo Convenio" → ConvenioForm abre
        |
        +-- faz upload de logo → POST /api/upload/logo → recebe URL
        |
        +-- preenche formulario → POST /api/convenios (com JWT)
                |
                v
          Backend valida token → insere no banco
                |
                v
          TanStack Query invalida cache ['partners'] e ['admin-stats']
                |
                v
          Tabela atualiza automaticamente
```
