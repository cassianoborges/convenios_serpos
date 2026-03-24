-- =============================================================================
-- SERPOS Convênios — Migrations
-- Execute este script no Supabase SQL Editor:
-- Supabase > SQL Editor > New query > Cole e Execute
-- =============================================================================

-- Tabela de Unidades do Grupo Serpos
CREATE TABLE IF NOT EXISTS unidades (
  id        SERIAL PRIMARY KEY,
  nome      VARCHAR(100) NOT NULL,
  cidade    VARCHAR(100),
  uf        CHAR(2),
  ativo     BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Convênios/Parceiros
CREATE TABLE IF NOT EXISTS convenios (
  id                   SERIAL PRIMARY KEY,
  nome                 VARCHAR(150) NOT NULL,
  categoria            VARCHAR(50)  NOT NULL,
  porcentagem_desconto INT          NOT NULL,
  logo_url             TEXT,
  endereco             TEXT,
  telefone             VARCHAR(30),
  whatsapp             VARCHAR(30),
  descricao            TEXT,
  regras               TEXT,
  cidade               VARCHAR(100),
  site                 TEXT,
  cnpj_cpf             VARCHAR(20),
  unidade_id           INT          REFERENCES unidades(id) ON DELETE SET NULL,
  ativo                BOOLEAN      NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Migration: Adicionar novos campos a bancos existentes
-- Execute se a tabela convenios já existir no seu banco
-- =============================================================================
ALTER TABLE convenios ADD COLUMN IF NOT EXISTS whatsapp  VARCHAR(30);
ALTER TABLE convenios ADD COLUMN IF NOT EXISTS site      TEXT;
ALTER TABLE convenios ADD COLUMN IF NOT EXISTS cnpj_cpf  VARCHAR(20);

-- Tabela de Administradores
CREATE TABLE IF NOT EXISTS admins (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(150) UNIQUE NOT NULL,
  senha_hash  TEXT         NOT NULL,
  nome        VARCHAR(100),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_convenios_categoria   ON convenios(categoria);
CREATE INDEX IF NOT EXISTS idx_convenios_unidade_id  ON convenios(unidade_id);
CREATE INDEX IF NOT EXISTS idx_convenios_ativo       ON convenios(ativo);
CREATE INDEX IF NOT EXISTS idx_unidades_ativo        ON unidades(ativo);

-- =============================================================================
-- Dados iniciais de Unidades (exemplos — ajuste conforme necessário)
-- =============================================================================
INSERT INTO unidades (nome, cidade, uf) VALUES
  ('Unidade Goiânia',  'Goiânia',   'GO'),
  ('Unidade Anápolis', 'Anápolis',  'GO'),
  ('Unidade Brasília', 'Brasília',  'DF'),
  ('Unidade Aparecida', 'Aparecida de Goiânia', 'GO')
ON CONFLICT DO NOTHING;
